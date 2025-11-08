# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5-alpha] - 2025-11-08

### Added
- **Comprehensive E2E tests** for delete page functionality (#81)
  - Full test coverage for delete page workflows
  - Error handling and edge case testing
- **Proof-of-Work re-enablement** with production-ready configuration (#75-79)
  - PoW enabled with difficulty=10 for spam protection
  - Comprehensive PoW documentation (`docs/PROOF_OF_WORK.md`)
  - PoW verification guide for testing and monitoring (`docs/POW_VERIFICATION_GUIDE.md`)
- Full pipeline run configuration (`make deploy-full`)
  - VS Code tasks configuration for clean, build, test, and deploy workflow
  - Makefile target for command-line execution
  - Complete pipeline: clean → build → test → deploy

### Fixed
- **Critical**: Fixed PR workflows hanging indefinitely
  - Coverage check now uses `awk` instead of `bc` (which may not be installed)
  - Fixed coverage extraction regex to use standard grep instead of Perl regex
  - Added timeout to curl health check to prevent hanging
  - Workflows now complete successfully instead of hanging
- **Deployment**: Fixed `push-to-vps.sh` not using `deploy.sh` script
  - Now properly calls `scripts/deploy.sh production` instead of duplicating docker compose commands
  - Added `.env` file validation before deployment
  - Leverages centralized deployment script with proper error handling and health checks
- **Security**: Updated dependencies and tightened security headers (#72)
  - Enhanced CORS configuration
  - Improved security headers in nginx configuration

### Removed
- **Documentation Cleanup**: Removed outdated historical documentation files
  - Removed root-level historical summaries: `DEPLOYMENT_SUMMARY.md`, `SETUP_WIZARD_SUMMARY.md`, `DEPLOY_TO_VPS.md`, `START_HERE.md`, `UPSTREAM_CHANGES_SUMMARY.md`
  - Removed PR-specific historical docs: `docs/development/prs/PR-001-*.md`, `START-HERE-PR1.md`, `READY-TO-PUSH.md`, `FINAL-SUMMARY.md`
  - Removed historical tracking docs: `docs/CONSOLIDATION_SUMMARY.md`, `docs/BRANCH_PROTECTION_FIX.md`, `docs/development/MIGRATION_COMPLETE.md`
  - Removed redundant script: `QUICK_DEPLOY.sh` (replaced by `scripts/setup-vps-from-local.sh`)
  - Updated all references to point to consolidated documentation in `docs/getting-started/SETUP.md` and `docs/deployment/DEPLOYMENT.md`

### Notes
This release focuses on stability improvements, comprehensive testing, and production-ready Proof-of-Work implementation. The codebase has been cleaned up with improved documentation and better CI/CD workflows.

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
  - Comprehensive SSL deployment guide (`docs/SSL_SETUP_GUIDE.md`)
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

[Unreleased]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.5-alpha...HEAD
[0.1.5-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.4-alpha...v0.1.5-alpha
[0.1.4-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.3-alpha...v0.1.4-alpha
[0.1.3-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.2-alpha...v0.1.3-alpha
[0.1.2-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.1-alpha...v0.1.2-alpha
[0.1.1-alpha]: https://github.com/SnarkyB/delerium-paste/compare/v0.1.0-alpha...v0.1.1-alpha
[0.1.0-alpha]: https://github.com/SnarkyB/delerium-paste/releases/tag/v0.1.0-alpha
