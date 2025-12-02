workspace(name = "delerium_paste")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Kotlin rules for Bazel
http_archive(
    name = "rules_kotlin",
    sha256 = "3b772976fec7bdcda1d84b9d39b176589424c047eb2175bed09aac630e50af43",
    urls = [
        "https://github.com/bazelbuild/rules_kotlin/releases/download/v1.9.6/rules_kotlin-v1.9.6.tar.gz",
    ],
)

load("@rules_kotlin//kotlin:repositories.bzl", "kotlin_repositories")

kotlin_repositories()

register_toolchains("@rules_kotlin//kotlin/internal:default_toolchain")

# Maven dependency resolution
http_archive(
    name = "rules_jvm_external",
    sha256 = "f86fd42a809e1871ca0aabe89db0d440451219c3ce46c58da240c7dcdc00125f",
    strip_prefix = "rules_jvm_external-5.2",
    url = "https://github.com/bazelbuild/rules_jvm_external/releases/download/5.2/rules_jvm_external-5.2.tar.gz",
)

load("@rules_jvm_external//:defs.bzl", "maven_install")

# Maven dependencies from build.gradle.kts
maven_install(
    artifacts = [
        # Ktor dependencies
        "io.ktor:ktor-server-core-jvm:3.0.2",
        "io.ktor:ktor-server-netty-jvm:3.0.2",
        "io.ktor:ktor-server-content-negotiation-jvm:3.0.2",
        "io.ktor:ktor-serialization-jackson-jvm:3.0.2",
        "io.ktor:ktor-server-cors-jvm:3.0.2",
        "io.ktor:ktor-server-compression-jvm:3.0.2",
        "io.ktor:ktor-server-call-logging-jvm:3.0.2",
        "io.ktor:ktor-server-rate-limit-jvm:3.0.2",
        # Logging
        "org.apache.logging.log4j:log4j-core:2.24.0",
        "org.apache.logging.log4j:log4j-slf4j2-impl:2.24.0",
        # Database
        "org.jetbrains.exposed:exposed-core:0.54.0",
        "org.jetbrains.exposed:exposed-dao:0.54.0",
        "org.jetbrains.exposed:exposed-jdbc:0.54.0",
        "com.zaxxer:HikariCP:5.1.0",
        "org.xerial:sqlite-jdbc:3.49.1.0",
        # Crypto
        "org.bouncycastle:bcprov-jdk18on:1.80",
        # Test dependencies
        "com.fasterxml.jackson.module:jackson-module-kotlin:2.18.1",
        "junit:junit:4.13.2",
        "org.jetbrains.kotlin:kotlin-test-junit:2.0.21",
        "io.ktor:ktor-server-test-host-jvm:3.0.2",
    ],
    fetch_sources = True,
    repositories = [
        "https://repo1.maven.org/maven2",
    ],
)
