# Deployment Fixes Summary

This document summarizes the fixes applied to resolve deployment and runtime issues.

## Issues Fixed

### 1. 403 Forbidden Error During Paste Creation

**Symptom**: Requests with an `Origin` header (browser requests) returned `403 Forbidden` with 0 bytes, while requests without an `Origin` header returned the expected `400 Bad Request` with `{"error":"pow_required"}`.

**Root Causes**:

1. **Ktor CORS Plugin Conflict**: The Ktor CORS plugin with `anyHost()` and `allowCredentials = false` was rejecting requests with Origin headers despite being configured to allow all hosts.
2. **Cross-Origin Security Headers**: The backend was setting `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, and `Cross-Origin-Resource-Policy` headers that are incompatible with CORS-enabled API endpoints.
3. **Nginx Default Config**: The nginx Docker image includes a default `/etc/nginx/conf.d/default.conf` file that was conflicting with our custom configuration.

**Solutions**:

1. **Removed Ktor CORS Plugin**: Disabled Ktor's built-in CORS plugin since CORS is better handled at the reverse proxy level for this architecture.
2. **Nginx CORS Handling**: Configured Nginx to handle CORS headers including:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`
   - Proper handling of OPTIONS preflight requests
3. **Removed Incompatible Security Headers**: Commented out `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, and `Cross-Origin-Resource-Policy` from the backend as these headers conflict with CORS requirements for API endpoints.
4. **Fixed Nginx Config Loading**: Added a command to remove the default nginx config file in docker-compose.yml: `sh -c "rm -f /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"`

### 2. Missing HTML Form Attributes

**Symptom**: Browser warning about form fields missing `name` attributes for autofill.

**Solution**: Added `name` attributes to all form input fields in `client/index.html`:

- `<textarea id="paste" name="paste">`
- `<input type="number" id="mins" name="mins">`
- `<input type="checkbox" id="single" name="single">`
- `<input type="password" id="pass" name="pass" autocomplete="new-password">`
- `<input type="text" id="deltoken" name="deltoken">`

### 3. Removed Unnecessary Components

**Files Removed**:

- `docs/archive/` - Old migration artifacts and outdated documentation
- `scripts/sync-to-standalone.sh` - Contained only commented-out code
- `reverse-proxy/default.conf` - Empty file that was being mounted unnecessarily

**Docker Compose Cleanup**:

- Removed unnecessary volume mount for `default.conf` from `docker-compose.prod.yml`

## Files Modified

### Backend

- `server/src/main/kotlin/App.kt`
  - Disabled CORS plugin
  - Commented out incompatible Cross-Origin security headers

### Frontend

- `client/index.html` - Added `name` attributes to form fields
- `client/src/infrastructure/api/http-client.ts` - Improved error message extraction
- `client/src/security.ts` - Enhanced error handling for PoW and 403 errors
- `client/src/features/paste-creator.ts` - Better PoW error propagation

### Infrastructure

- `docker-compose.yml` - Added command to remove default nginx config
- `docker-compose.prod.yml` - Removed empty default.conf volume mount
- `reverse-proxy/nginx-dev.conf` - Simplified and added CORS handling
- `docs/deployment/AUTO_DEPLOYMENT.md` - Updated script reference

## Testing

After applying these fixes:

- ✅ API requests with Origin header return proper error messages
- ✅ Browser can successfully create pastes (after providing valid PoW)
- ✅ Form fields have proper accessibility attributes
- ✅ CORS preflight OPTIONS requests are handled correctly

## Architecture Decision: CORS at Nginx Level

**Decision**: Handle CORS at the Nginx reverse proxy level instead of in the Ktor backend.

**Rationale**:

- Simpler to configure and debug at one layer
- Avoids potential conflicts between multiple CORS implementations
- Common pattern for microservice architectures
- Nginx is already the entry point for all client requests
- Allows backend to focus on business logic rather than cross-cutting concerns

**Trade-offs**:

- Backend cannot independently control CORS policies
- Production deployment must ensure Nginx config is properly restrictive (not using `*` for origins)

## Next Steps for Production

Before deploying to production, consider:

1. Replace `Access-Control-Allow-Origin: *` with specific allowed origins
2. Review and tighten all security headers for production environment
3. Re-enable or configure appropriate Cross-Origin headers for production
4. Test with the actual production domain and SSL certificates
