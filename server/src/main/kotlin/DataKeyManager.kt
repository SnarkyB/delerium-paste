import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.PosixFilePermission
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode

data class DataKey(
    val id: String,
    val createdAt: Long,
    val keyB64: String
)

data class DataKeyring(
    val activeKeyId: String,
    val keys: List<DataKey>
)

data class EncryptedField(
    val keyId: String,
    val payload: String
)

class DataKeyManager(
    private val keyringPath: Path,
    private val rotationDays: Long,
    seedKeys: String? = null
) {
    private val mapper = ObjectMapper()
    private val random = SecureRandom()
    @Volatile private var keyring: DataKeyring = loadOrCreate(seedKeys)

    fun activeKeyId(): String = keyring.activeKeyId

    fun encryptField(plaintext: String): EncryptedField {
        val activeId = keyring.activeKeyId
        val payload = encryptFieldWithKeyId(activeId, plaintext)
        return EncryptedField(activeId, payload)
    }

    fun decryptField(payload: String, keyId: String): String {
        val key = requireKey(keyId)
        return decryptPayload(payload, decodeKey(key.keyB64))
    }

    fun encryptFieldWithKeyId(keyId: String, plaintext: String): String {
        val key = requireKey(keyId)
        return encryptPayload(plaintext, decodeKey(key.keyB64))
    }

    fun rotateIfDue(nowEpochSeconds: Long = Instant.now().epochSecond): Boolean {
        if (rotationDays <= 0) return false
        val active = requireKey(keyring.activeKeyId)
        val dueSeconds = rotationDays * 24 * 60 * 60
        if (nowEpochSeconds - active.createdAt < dueSeconds) return false
        rotate()
        return true
    }

    fun rotate(): DataKey {
        val newKey = newKey()
        val nextKeys = keyring.keys + newKey
        keyring = DataKeyring(activeKeyId = newKey.id, keys = nextKeys)
        writeKeyring(keyring)
        return newKey
    }

    private fun requireKey(id: String): DataKey {
        return keyring.keys.firstOrNull { it.id == id }
            ?: throw IllegalStateException("Missing data encryption key: $id")
    }

    private fun loadOrCreate(seedKeys: String?): DataKeyring {
        val existing = readKeyring()
        if (existing != null) return existing

        val keys = parseSeedKeys(seedKeys)
        val initial = if (keys.isNotEmpty()) {
            DataKeyring(activeKeyId = keys.first().id, keys = keys)
        } else {
            val key = newKey()
            DataKeyring(activeKeyId = key.id, keys = listOf(key))
        }
        writeKeyring(initial)
        return initial
    }

    private fun parseSeedKeys(seedKeys: String?): List<DataKey> {
        if (seedKeys.isNullOrBlank()) return emptyList()
        val now = Instant.now().epochSecond
        return seedKeys.split(",")
            .mapNotNull { entry ->
                val parts = entry.trim().split(":", limit = 2)
                if (parts.size != 2) return@mapNotNull null
                val id = parts[0].trim()
                val keyB64 = parts[1].trim()
                if (id.isBlank() || keyB64.isBlank()) return@mapNotNull null
                DataKey(id = id, createdAt = now, keyB64 = keyB64)
            }
    }

    private fun readKeyring(): DataKeyring? {
        if (!Files.exists(keyringPath)) return null
        val root = mapper.readTree(keyringPath.toFile())
        val activeKeyId = root.get("activeKeyId")?.asText() ?: return null
        val keysNode = root.get("keys") as? ArrayNode ?: return null
        val keys = keysNode.mapNotNull { node ->
            val id = node.get("id")?.asText()
            val createdAt = node.get("createdAt")?.asLong()
            val keyB64 = node.get("keyB64")?.asText()
            if (id.isNullOrBlank() || createdAt == null || keyB64.isNullOrBlank()) null
            else DataKey(id = id, createdAt = createdAt, keyB64 = keyB64)
        }
        if (keys.isEmpty()) return null
        return DataKeyring(activeKeyId = activeKeyId, keys = keys)
    }

    private fun writeKeyring(ring: DataKeyring) {
        Files.createDirectories(keyringPath.parent)
        val root = mapper.createObjectNode()
        root.put("activeKeyId", ring.activeKeyId)
        val keysNode = root.putArray("keys")
        ring.keys.forEach { key ->
            val node = keysNode.addObject()
            node.put("id", key.id)
            node.put("createdAt", key.createdAt)
            node.put("keyB64", key.keyB64)
        }
        val tmpPath = keyringPath.resolveSibling("${keyringPath.fileName}.tmp")
        mapper.writerWithDefaultPrettyPrinter().writeValue(tmpPath.toFile(), root)
        Files.move(tmpPath, keyringPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
        setOwnerOnlyPermissions(keyringPath)
    }

    private fun setOwnerOnlyPermissions(path: Path) {
        try {
            val perms = setOf(
                PosixFilePermission.OWNER_READ,
                PosixFilePermission.OWNER_WRITE
            )
            Files.setPosixFilePermissions(path, perms)
        } catch (_: Exception) {
            // Ignore on non-POSIX filesystems
        }
    }

    private fun newKey(): DataKey {
        val keyBytes = ByteArray(32)
        random.nextBytes(keyBytes)
        val keyB64 = base64UrlEncode(keyBytes)
        val id = "k_${Ids.randomId(16)}"
        return DataKey(id = id, createdAt = Instant.now().epochSecond, keyB64 = keyB64)
    }

    private fun encryptPayload(plaintext: String, keyBytes: ByteArray): String {
        val iv = ByteArray(12)
        random.nextBytes(iv)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(
            Cipher.ENCRYPT_MODE,
            SecretKeySpec(keyBytes, "AES"),
            GCMParameterSpec(128, iv)
        )
        val ciphertext = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))
        return "v1:${base64UrlEncode(iv)}:${base64UrlEncode(ciphertext)}"
    }

    private fun decryptPayload(payload: String, keyBytes: ByteArray): String {
        val parts = payload.split(":", limit = 3)
        if (parts.size != 3 || parts[0] != "v1") {
            throw IllegalArgumentException("Invalid encrypted payload format")
        }
        val iv = base64UrlDecode(parts[1])
        val ciphertext = base64UrlDecode(parts[2])
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(
            Cipher.DECRYPT_MODE,
            SecretKeySpec(keyBytes, "AES"),
            GCMParameterSpec(128, iv)
        )
        val plaintext = cipher.doFinal(ciphertext)
        return String(plaintext, StandardCharsets.UTF_8)
    }

    private fun decodeKey(keyB64: String): ByteArray {
        val keyBytes = base64UrlDecode(keyB64)
        if (keyBytes.size != 32) {
            throw IllegalArgumentException("Invalid data encryption key length")
        }
        return keyBytes
    }

    private fun base64UrlEncode(bytes: ByteArray): String {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun base64UrlDecode(s: String): ByteArray {
        return Base64.getUrlDecoder().decode(s)
    }
}
