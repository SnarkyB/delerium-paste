# Anonymous Chat Feature

## Overview

The Anonymous Chat feature allows users viewing the same paste to exchange encrypted messages without revealing their identities. All messages are encrypted client-side using the same password as the paste, maintaining the zero-knowledge architecture.

## Architecture

### Zero-Knowledge Design

- **Client-Side Encryption**: All messages are encrypted in the browser before transmission
- **Shared Password**: Uses the same PBKDF2-derived key as the paste
- **No Plaintext on Server**: Server only stores encrypted ciphertext + IV
- **Privacy-First**: Manual polling requires password re-entry each time

### Security Flow

```
User Types Message
     ↓
Client derives key from paste password + salt (PBKDF2, 100k iterations)
     ↓
Client encrypts message with AES-256-GCM
     ↓
POST encrypted message to server (ct + iv only)
     ↓
Server stores encrypted message (never sees plaintext)
     ↓
Other users manually refresh (enter password)
     ↓
Client fetches encrypted messages
     ↓
Client decrypts with password + paste salt
     ↓
Display plaintext messages
```

## API Endpoints

### POST /api/pastes/:id/messages

Post an encrypted chat message to a paste.

**Request Body:**
```json
{
  "ct": "base64url-encoded-ciphertext",
  "iv": "base64url-encoded-initialization-vector"
}
```

**Response (201 Created):**
```json
{
  "count": 5
}
```

**Error Responses:**
- `404 Not Found` - Paste doesn't exist or has expired
- `400 Bad Request` - Invalid JSON or message size exceeded (10KB max)
- `429 Too Many Requests` - Rate limit exceeded

**Features:**
- Rate limiting: Uses separate rate limit key (`POST_MSG:$ip`)
- Size validation: 10KB maximum per encrypted message
- Paste validation: Verifies paste exists and hasn't expired
- Auto-cleanup: Maintains 50-message limit (FIFO deletion)

### GET /api/pastes/:id/messages

Retrieve all encrypted chat messages for a paste.

**Response (200 OK):**
```json
{
  "messages": [
    {
      "ct": "encrypted-message-1",
      "iv": "iv-1",
      "timestamp": 1701619200
    },
    {
      "ct": "encrypted-message-2",
      "iv": "iv-2",
      "timestamp": 1701619260
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Paste doesn't exist or has expired
- `500 Internal Server Error` - Database error

**Features:**
- Returns messages ordered by timestamp (oldest first)
- Messages remain encrypted during transmission
- Empty array if no messages exist
- No decryption on server

## Database Schema

### ChatMessages Table

```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paste_id VARCHAR(32) REFERENCES pastes(id) ON DELETE CASCADE,
    ct TEXT NOT NULL,
    iv TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);
```

**Key Features:**
- `ON DELETE CASCADE`: Messages auto-deleted when paste is deleted
- Encrypted storage: `ct` and `iv` are base64url-encoded encrypted data
- Timestamp: Unix timestamp (seconds since epoch)

## Client Implementation

### Encryption Process

```typescript
// 1. Get paste salt from URL fragment
const salt = new Uint8Array(decodeBase64Url(urlFragment.split(':')[0]));

// 2. Prompt for password
const password = prompt('Enter password:');

// 3. Derive key from password + salt
const key = await deriveKeyFromPassword(password, salt);

// 4. Generate random IV
const iv = new Uint8Array(12);
crypto.getRandomValues(iv);

// 5. Encrypt message
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  new TextEncoder().encode(message)
);

// 6. POST to server
await fetch(`/api/pastes/${pasteId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ct: encodeBase64Url(encrypted),
    iv: encodeBase64Url(iv)
  })
});
```

### Decryption Process

```typescript
// 1. GET encrypted messages
const response = await fetch(`/api/pastes/${pasteId}/messages`);
const { messages } = await response.json();

// 2. Prompt for password
const password = prompt('Enter password:');

// 3. Derive key
const key = await deriveKeyFromPassword(password, salt);

// 4. Decrypt each message
for (const msg of messages) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64Url(msg.iv) },
    key,
    decodeBase64Url(msg.ct)
  );
  const text = new TextDecoder().decode(decrypted);
  displayMessage(text, msg.timestamp);
}
```

## UI Components

### Chat Section (view.html)

Located below the paste content, visible only after successful paste decryption.

**Elements:**
- **Header**: "Anonymous Chat" with "50 message limit" indicator
- **Refresh Button**: Manually poll for new messages (prompts for password)
- **Message Container**: Scrollable area (200-400px) showing decrypted messages
- **Input Field**: Text input (1000 char max)
- **Send Button**: Encrypts and posts message (prompts for password)
- **Privacy Notice**: Explains encryption and manual refresh

**Styling:**
- Responsive design (mobile-friendly)
- Dark mode support
- Accessible with keyboard navigation
- XSS protection (HTML escaping)

### Message Display Format

```
┌─────────────────────────────┐
│ 2:30 PM                     │
│ Hello! How are you?         │
└─────────────────────────────┘
```

- Timestamp: Formatted as HH:MM (local time)
- Message: Word-wrapped, HTML-escaped
- Auto-scroll: Scrolls to bottom on new messages

## Security Features

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations, SHA-256
- **Salt**: Shared with paste (16 bytes, from URL fragment)
- **IV**: Random 12 bytes per message (unique)

### Privacy Protections

- **No Auto-Polling**: User must manually click refresh
- **Password Required**: Every send/refresh prompts for password (unless key caching enabled)
- **Opt-In Key Caching**: Creator can enable session-based key caching for convenience
- **No Stored Credentials**: Password never stored in memory long-term (unless caching enabled)
- **Zero-Knowledge**: Server never sees plaintext messages or passwords

### Anti-Spam Measures

- **Rate Limiting**: Token bucket (30 requests/minute per IP)
- **Size Limit**: 10KB max encrypted message size (~7.5KB plaintext)
- **Message Limit**: 50 messages per paste (oldest deleted when exceeded)
- **Expiration**: Messages deleted when paste expires or is deleted

### Input Validation

**Server-Side:**
- Paste existence and expiration check
- JSON structure validation
- Base64url format validation
- Size limit enforcement (10KB)
- IV size validation (12-64 bytes)

**Client-Side:**
- Message length limit (1000 characters)
- Non-empty message check
- XSS prevention (HTML escaping)
- Password strength awareness (prompts user)

## Usage

### For End Users

Anonymous chat is **always enabled** for every paste; there is no option to turn it off.

1. **Create a password-protected paste** at `/index.html`
2. **Share the view URL** with other users
3. **Decrypt the paste** by entering the password
4. **Scroll down** to see the chat section
5. **Click "Refresh Messages"** and enter password to load chat
6. **Type a message** and click "Send" (enter password again)
7. **Refresh periodically** to see new messages from others

### Privacy Tips

- Use a strong, unique password for sensitive chats
- Messages expire when paste expires
- No chat history after paste deletion
- Anyone with the password can delete the paste (and all messages) at any time
- Use short expiration times for ephemeral chats

## Performance Considerations

### Client

- **Encryption Speed**: ~1-5ms per message (native Web Crypto API)
- **Decryption Speed**: ~1-5ms per message
- **PBKDF2 Derivation**: ~50-100ms (intentionally slow for security)
- **UI Responsiveness**: No blocking (async operations)

### Server

- **Message Storage**: SQLite with indexes on `paste_id`
- **Query Performance**: O(n) for fetching n messages
- **Cleanup**: Automatic cascade delete when paste removed
- **Rate Limiting**: O(1) token bucket check

## Testing

### Unit Tests

Located in `client/tests/unit/features/paste-chat.test.ts`:

- ✅ Message encryption/decryption
- ✅ Same salt produces same key
- ✅ Different passwords produce different keys
- ✅ Unicode character support
- ✅ Long message handling (1000 chars)
- ✅ IV uniqueness verification
- ✅ Base64url encoding/decoding
- ✅ XSS prevention
- ✅ Password security

**Run tests:**
```bash
npm test -- tests/unit/features/paste-chat.test.ts
```

### Integration Tests

Located in `client/tests/integration/chat-api.test.ts`:

- Documents API contract for chat endpoints
- Mock-based tests for client code
- Skipped tests for live server (documented behavior)

### Manual Testing

```bash
# 1. Start services
docker-compose up

# 2. Create password-protected paste
#    Visit http://localhost:8080
#    Enter content + password
#    Copy view URL

# 3. Open in two browser tabs
#    Tab 1: Decrypt paste
#    Tab 2: Decrypt paste (same password)

# 4. Test chat
#    Tab 1: Send message → Enter password
#    Tab 2: Refresh messages → Enter password
#    Verify message appears in Tab 2

# 5. Test features
#    - Wrong password (should show decryption failed)
#    - Long message (1000 chars)
#    - 50+ messages (oldest auto-deleted)
#    - Paste expiration (messages deleted too)
```

## Limitations

### By Design

- **Manual Refresh**: No real-time updates (privacy feature)
- **Password Required**: Every interaction prompts for password (unless key caching is enabled)
- **50 Message Limit**: Prevents database bloat
- **No Message Editing**: Messages immutable after sending
- **Paste-Level Deletion Only**: Anyone with the password can delete the paste (and all messages)

### Technical

- **10KB Message Size**: Encrypted size limit
- **No File Attachments**: Text only
- **No Read Receipts**: Can't tell if others have seen messages
- **No User Identification**: All users are anonymous
- **No Offline Support**: Requires network connection

## Future Enhancements

Potential improvements (not currently planned):

- [ ] Optional WebSocket support for real-time updates
- [ ] Message reactions (encrypted)
- [ ] Per-message timestamps (sender's local time)
- [ ] Typing indicators (ephemeral, not logged)
- [ ] Export chat history (encrypted)
- [ ] Message search (client-side only)
- [ ] Configurable message limit (10, 50, 100)
- [ ] Markdown support in messages
- [ ] Code syntax highlighting

## Troubleshooting

### "Paste not found" error

- Paste may have expired
- Paste may have been deleted
- Check paste ID in URL is correct

### "Decryption failed" error

- Wrong password entered
- Different password than paste password
- Message corrupted (rare)

### Messages not appearing

- Click "Refresh Messages" to poll
- Enter correct password
- Check browser console for errors

### Rate limit errors

- Wait 1 minute before sending more messages
- Multiple users share IP rate limit (proxy/NAT)

## Related Documentation

- [Security Architecture](../architecture/C4-DIAGRAMS.md)
- [API Endpoints](../api/ENDPOINTS.md)
- [Password Encryption](../security/ENCRYPTION.md)
- [Zero-Knowledge Principle](../../CLAUDE.md#core-architecture-principle-zero-knowledge)
