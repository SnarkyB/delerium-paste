## Summary

This PR updates repository name references throughout the codebase from `delerium-paste-server` to `delerium-paste` for consistency and clarity. Additionally, it reorganizes documentation by moving historical migration artifacts to the `docs/archive/` directory.

## Changes

### Repository Name Updates
- Updated Docker image names from `delerium-paste-server` to `delerium-paste` in:
  - GitHub Actions workflows (`.github/workflows/`)
  - Dockerfiles and build scripts
  - Server source code (Kotlin files)
  - Documentation and README files
  - Deployment scripts

### Documentation Reorganization
- Moved historical migration documentation to `docs/archive/`:
  - Migration guides and artifacts
  - Old changelogs and summaries
  - Decomposition plans and migration notices

### Files Modified
- **Workflows**: `.github/workflows/docker-publish.yml`, `.github/workflows/docker-hub-server.yml`, `.github/workflows/server-ci.yml`
- **Server**: Dockerfiles, Gradle config, Kotlin source files
- **Scripts**: Deployment and build scripts
- **Documentation**: README files and deployment guides
- **Infrastructure**: Nginx configuration updates

## Impact

- ✅ **No breaking changes** - This is a naming consistency update
- ✅ **Docker images** will be published with the new naming convention
- ✅ **Documentation** is better organized with historical docs archived
- ⚠️ **Note**: Existing Docker images using the old name (`delerium-paste-server`) will need to be updated to use the new name (`delerium-paste`)

## Testing

- [x] Verified Docker image names are consistent across all workflows
- [x] Confirmed build scripts reference correct image names
- [x] Checked that documentation links are still valid after reorganization
