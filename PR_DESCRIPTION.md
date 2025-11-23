## Summary

This PR improves the local development experience by fixing the `make dev` command, resolving browser console warnings, and streamlining the configuration for easier launching.

## Changes

### 🔧 Development Environment
- Updated `scripts/dev.sh` to launch both the backend server and the web proxy (nginx) when running `make dev`.
- Updated `docker-compose.dev.yml` to use a development-specific Nginx configuration (`nginx-dev.conf`) which serves on port 8080 without requiring SSL certificates.
- Updated `README.md` to reflect the improved local development workflow.

### 🐛 Bug Fixes
- Implemented a patch for `addEventListener` in `client/src/utils/passive-events.ts` to force `passive: true` for scroll-blocking events (touchstart, wheel), resolving browser violation warnings.
- Fixed `server/Dockerfile` source label URL.

### 📝 Documentation & Security
- Added `SECURITY_CHECKLIST.md` for headless environment deployments.
- Minor adjustments to `docker-compose.secure.yml` and `security.conf` for compatibility.

## Impact
- Developers can now run `make dev` and immediately have a working full-stack environment at `http://localhost:8080`.
- Browser console is cleaner without scroll performance warnings.

## Testing
- [x] Verified `make dev` starts all services.
- [x] Verified access to `http://localhost:8080`.
- [x] Verified console warnings are gone.
- [x] Built and tested client and server components.
