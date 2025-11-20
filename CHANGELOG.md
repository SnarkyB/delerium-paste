# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Multi-architecture Docker support** - Server images now support linux/amd64 and linux/arm64 architectures
- **Docker health checks** - Built-in container health monitoring via `/api/pow` endpoint
- **Comprehensive server API documentation** - Added detailed REST API documentation (`server/docs/API.md`)
- **Container publishing guide** - Added guide for publishing Docker images to registries (`server/docs/CONTAINER_PUBLISHING.md`)
- **Dedicated server CI/CD workflow** - New `server-ci.yml` workflow with comprehensive testing, security scanning, and multi-arch builds
- **Docker Hub publishing workflow** - New `docker-hub-server.yml` workflow for manual/automated Docker Hub publishing
- **CODEOWNERS file** - Added code ownership configuration for automated PR review requests

### Changed
- **Dockerfile security enhancements** - Server container now runs as non-root user `delirium:delirium` (uid/gid 999)
- **Upgraded Gradle and JDK** - Updated builder to Gradle 8.11.1 with JDK 21 (from 8.10.2/JDK 17)
- **Enhanced Docker image metadata** - Added OCI-compliant labels for better tooling support
- **Improved CI/CD path filtering** - Workflows now only trigger on relevant code changes
- **Multi-arch build support** - Updated `docker-publish.yml` to build images for multiple architectures

### Security
- **Non-root container user** - Server container runs as dedicated `delirium` user instead of root
- **OWASP dependency scanning** - Regular security scanning in CI pipeline  
- **Minimal runtime image** - JRE-only runtime reduces attack surface

## [0.1.6-alpha] - 2025-11-09

### Added
- **UI/UX improvements** (#86)
  - Moved delete link from paste creation success message to decrypted paste viewing page
  - Added "Destroy Paste" button on view page that appears when delete token is available
  - Added "View Paste" button in success output that opens paste in new tab
  - Delete token now stored in localStorage for seamless deletion from view page
  - Improved responsive styling for mobile devices
- **Contributor documentation** (#87)
  - Added comprehensive CONTRIBUTING.md with contributor guidelines
  - Includes fork workflow, development setup, PR process, and code standards
- **Commit signing guide** (#88)
  - Added detailed guide for setting up GPG commit signing (docs/development/COMMIT_SIGNING.md)
  - Enables verified commits on GitHub
  - Includes step-by-step instructions and troubleshooting

### Changed
- **Workflow performance optimizations** (#89)
  - Split PR checks workflow into parallel jobs (frontend, backend, docker)
  - Split client CI workflow into parallel jobs (lint, typecheck, test, coverage)
  - Enhanced security scan workflow with improved caching
  - Optimized local CI scripts for parallel execution
  - Updated Makefile deploy-full to run builds/tests in parallel
  - Added comprehensive caching for node_modules, Jest, TypeScript, ESLint, Gradle
  - **Performance improvements**: 40-50% faster PR checks (10-15min → 5-8min), 40% faster client CI (5-8min → 3-5min)
- **UI cleanup** (#86)
  - Removed BB Chat links from index.html and view.html footers
  - Removed View Paste and New Paste links from footers
  - Cleaner, more focused UI on paste creation page
- Version bump to v0.1.6-alpha

### Fixed
- **Test improvements** (#90)
  - Fixed PoW load tests: made success rate expectations more lenient for load scenarios
  - Tests now properly handle high-concurrency scenarios without false failures

## [0.1.5-alpha] - 2025-11-08

### Added
- **Complete automated security scanning infrastructure**
  - OWASP Dependency Check plugin integrated into Gradle build
  - `make security-scan` command for local vulnerability scanning
  - Enhanced PR checks workflow with comprehensive security scanning
  - Dedicated security-scan.yml workflow (runs on PRs, daily, and releases)
  - Local security scanning script (`scripts/security-scan.sh`)
  - Complete security scanning documentation (`docs/security/SCANNING.md`)
- **Security scanning features**
  - npm audit with JSON reporting and result checking
  - OWASP Dependency Check with CVSS >= 7.0 threshold
  - Blocks PRs on Critical/High severity vulnerabilities
  - Automated daily scans at 2 AM UTC
  - Manual trigger support via GitHub Actions UI

### Fixed
- Fixed dependencyCheck typo in build.gradle.kts (was 'eck')
- Completed security scanning setup from PR #82

### Changed
- Enhanced PR checks workflow with improved security scanning
- Updated .gitignore to exclude generated security scan reports

### Notes
This release completes the automated security scanning infrastructure. Security scans now run automatically on every PR, daily, and on new releases. The setup includes both frontend (npm audit) and backend (OWASP Dependency Check) vulnerability scanning.

## [0.1.4-alpha] - 2025-10-31

### Fixed
- **Critical**: Fixed invalid group error in SSL certificate setup scripts
  - Replaced `$USER:$USER` with `$(id -un):$(id -gn)` in chown commands
  - Ensures proper file permissions across all Unix-like systems
  - Affects `scripts/vps-deploy.sh` and `scripts/setup-ssl.sh`

### Changed
- Improved SSL certificate permission handling for cross-platform compatibility
- Enhanced cron job configuration for certificate auto-renewal

### Notes
This is a patch release that fixes a critical deployment issue where SSL certificate setup would fail with "invalid group" errors on systems where the user's group name doesn't match their username.

## [0.1.3-alpha] - 2025-10-31

### Added
- **Password-based encryption** - Optional password protection for pastes
  - Client-side password hashing with PBKDF2 (100,000 iterations)
  - Password-derived encryption keys for enhanced security
  - Backward compatible with existing passwordless pastes
- **Headless Ubuntu installer** - Non-root, SSH-safe installation script
  - Docker-only deployment option
  - UFW firewall configuration
  - SSH-safe port management
- **Enhanced security features**
  - Improved deletion token security
  - Enhanced CORS configuration
  - Better rate limiting implementation
- **VPS deployment automation**
  - Automated deployment scripts for production VPS
  - SSL/TLS certificate automation with Let's Encrypt
  - Production-ready Docker Compose configuration
  - Interactive deployment wizard

### Changed
- Updated CI/CD pipeline configuration
- Improved AI collaboration guidelines
- Enhanced contextual commit rules
- Better error handling for edge cases

### Fixed
- Security headers configuration
- CORS policy refinements
- Rate limiting edge cases

### Notes
This release adds optional password protection while maintaining zero-knowledge architecture. Successfully deployed to production at https://example.com with full HTTPS support.

## [0.1.2-alpha] - 2025-10-19

### Added
- **Production HTTPS support** with Let's Encrypt
  - Automated SSL setup script (`scripts/setup-ssl.sh`)
  - Comprehensive SSL deployment guide (`docs/deployment/SSL_SETUP.md`)
  - Production-ready nginx SSL configuration (`reverse-proxy/nginx-ssl.conf`)
  - Support for Cloudflare and Webdock WAF compatibility
- Clear textarea after successful paste creation (UX improvement)

### Changed
- Updated README with production HTTPS deployment instructions
- Improved deployment documentation for production environments

### Fixed
- Resolved Web Crypto API issues by ensuring HTTPS in production
- Fixed SSL certificate permissions handling

### Notes
This release enables full production deployment with HTTPS. The Web Crypto API now functions correctly on public domains with proper SSL/TLS encryption. Successfully deployed and tested at https://example.com

## [0.1.1-alpha] - 2025-10-19

### Fixed
- **CRITICAL**: Fixed JavaScript module loading error that prevented the application from running in browsers
  - Changed TypeScript compiler module output from "none" to "ES2020"
  - Added `type="module"` attribute to script tags in index.html and view.html
  - Resolved "Uncaught ReferenceError: exports is not defined" error
  - Application now properly loads and executes in all modern browsers

### Technical Details
The v0.1.0-alpha release had a critical bug where TypeScript's module compilation was misconfigured, causing the browser to encounter CommonJS-style `exports` that it couldn't understand. This release fixes the module system to use proper ES6 modules that work natively in browsers.

## [0.1.0-alpha] - 2025-10-19

### Added
- Initial alpha release of delerium pastebin
- End-to-end encrypted paste sharing
- Proof-of-Work spam prevention
- Single-view paste option
- Time-based paste expiration (1 hour, 1 day, 1 week, 1 month)
- Secure paste deletion with token-based authentication
- Client-side encryption using Web Crypto API
- Kotlin/Ktor backend server
- TypeScript/Vanilla JS frontend
- Docker Compose deployment setup
- Production deployment guide
- CI/CD pipeline with GitHub Actions
- Automated testing (unit, integration, E2E)
- Nginx reverse proxy with rate limiting
- Security headers and CORS configuration

### Infrastructure
- GitHub Actions CI workflow with caching
- Playwright browser caching for E2E tests
- Gradle dependency caching
- Docker build and health checks
- Local CI verification scripts
- VSCode tasks for development

### Security
- Client-side encryption (AES-GCM)
- PBKDF2 key derivation
- Deletion token pepper for server-side security
- Rate limiting (10 req/minute per IP)
- CORS restrictions
- Input validation and sanitization

### Documentation
- Comprehensive README
- API documentation
- Deployment guide
- Local development setup
- Contributing guidelines
- Alpha release checklist

### Known Issues
- Webkit E2E tests have timing issues (tracked in #19)
- Integration tests disabled pending supertest v7 compatibility
- Proof-of-Work difficulty may need tuning based on production usage

### Notes
This is an alpha release intended for testing and feedback. Not recommended for production use with sensitive data.

[Unreleased]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.6-alpha...HEAD
[0.1.6-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.5-alpha...v0.1.6-alpha
[0.1.5-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.4-alpha...v0.1.5-alpha
[0.1.4-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.3-alpha...v0.1.4-alpha
[0.1.3-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.2-alpha...v0.1.3-alpha
[0.1.2-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.1-alpha...v0.1.2-alpha
[0.1.1-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.0-alpha...v0.1.1-alpha
[0.1.0-alpha]: https://github.com/SnarkyB/delerium-paste/releases/tag/v0.1.0-alpha
