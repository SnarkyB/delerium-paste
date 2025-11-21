# Git Repository Extraction Commands
# File: GIT_EXTRACTION_GUIDE.md
# Version: 1.0.0
#
# This guide provides step-by-step commands for extracting each repository
# from the monorepo while preserving git history.

## Prerequisites

### Install git-filter-repo

```bash
# macOS with Homebrew
brew install git-filter-repo

# Ubuntu/Debian
sudo apt-get install git-filter-repo

# Or install via pip
pip3 install git-filter-repo

# Verify installation
git-filter-repo --version
```

### Prepare Workspace

```bash
# Create a temporary workspace for extraction
mkdir -p /tmp/delerium-migration
cd /tmp/delerium-migration
```

---

## Repository 1: delerium-client (Frontend)

### Extract Client Repository

```bash
# Clone the original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-client
cd delerium-client

# Backup before filtering (optional)
git bundle create ../backup-client.bundle --all

# Filter to keep only client/ directory and move to root
git filter-repo --path client/ --path-rename client/: --force

# Verify the result
ls -la
# Should see: src/, tests/, package.json, etc. at root level

# Check git history is preserved
git log --oneline | head -n 10

# Remove old remote
git remote remove origin

# Add new remote (replace YOUR-USERNAME)
git remote add origin git@github.com:YOUR-USERNAME/delerium-client.git

# Verify remote
git remote -v

# Push to new repository
git push -u origin main

# Create initial tag
git tag -a v1.0.0 -m "Initial multi-repo release"
git push origin v1.0.0

echo "✅ Client repository extraction complete!"
```

### Post-Extraction Updates

After pushing, create these files in the GitHub web interface or locally:

1. **Update README.md** - Replace with client-specific README
2. **Update CHANGELOG.md** - Start fresh from v1.0.0
3. **Add CONTRIBUTING.md** - Client-specific contribution guidelines

---

## Repository 2: delerium-server (Backend)

### Extract Server Repository

```bash
cd /tmp/delerium-migration

# Clone the original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-server
cd delerium-server

# Backup before filtering (optional)
git bundle create ../backup-server.bundle --all

# Filter to keep only server/ directory and move to root
git filter-repo --path server/ --path-rename server/: --force

# Verify the result
ls -la
# Should see: src/, build.gradle.kts, Dockerfile, etc. at root level

# Check git history is preserved
git log --oneline | head -n 10

# Remove old remote
git remote remove origin

# Add new remote (replace YOUR-USERNAME)
git remote add origin git@github.com:YOUR-USERNAME/delerium-server.git

# Verify remote
git remote -v

# Push to new repository
git push -u origin main

# Create initial tag
git tag -a v1.0.0 -m "Initial multi-repo release"
git push origin v1.0.0

echo "✅ Server repository extraction complete!"
```

### Post-Extraction Updates

1. **Update README.md** - Replace with server-specific README
2. **Update CHANGELOG.md** - Start fresh from v1.0.0
3. **Add CONTRIBUTING.md** - Server-specific contribution guidelines

---

## Repository 3: delerium-infrastructure (Deployment)

### Extract Infrastructure Repository

```bash
cd /tmp/delerium-migration

# Clone the original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-infrastructure
cd delerium-infrastructure

# Backup before filtering (optional)
git bundle create ../backup-infrastructure.bundle --all

# Filter to keep infrastructure-related paths
git filter-repo \
    --path reverse-proxy/ \
    --path scripts/ \
    --path ssl/ \
    --path docker-compose.yml \
    --path docker-compose.dev.yml \
    --path docker-compose.prod.yml \
    --path docker-compose.secure.yml \
    --path Makefile \
    --path .env.example \
    --force

# Reorganize directory structure
mkdir -p docker-compose nginx

# Move docker-compose files
git mv docker-compose*.yml docker-compose/ 2>/dev/null || mv docker-compose*.yml docker-compose/

# Move reverse-proxy to nginx
git mv reverse-proxy/* nginx/ 2>/dev/null || mv reverse-proxy/* nginx/
rmdir reverse-proxy 2>/dev/null || true

# Move .env.example
git mv .env.example docker-compose/.env.example 2>/dev/null || \
    mv .env.example docker-compose/.env.example

# Commit reorganization
git add .
git commit -m "Reorganize infrastructure for multi-repo structure

- Move Docker Compose files to docker-compose/ directory
- Rename reverse-proxy/ to nginx/
- Move .env.example to docker-compose/ directory
- Clean up directory structure for better organization"

# Check git history is preserved
git log --oneline | head -n 10

# Remove old remote
git remote remove origin

# Add new remote (replace YOUR-USERNAME)
git remote add origin git@github.com:YOUR-USERNAME/delerium-infrastructure.git

# Verify remote
git remote -v

# Push to new repository
git push -u origin main

# Create initial tag
git tag -a v1.0.0 -m "Initial multi-repo release"
git push origin v1.0.0

echo "✅ Infrastructure repository extraction complete!"
```

### Post-Extraction Updates

1. **Add README.md** - Infrastructure-specific getting started guide
2. **Add CHANGELOG.md** - Start from v1.0.0
3. **Copy setup.sh** - From migration artifacts
4. **Add docs/** - Deployment documentation

---

## Repository 4: delerium (Meta/Documentation)

### Extract Documentation Repository

```bash
cd /tmp/delerium-migration

# Clone the original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-meta
cd delerium-meta

# Backup before filtering (optional)
git bundle create ../backup-meta.bundle --all

# Filter to keep only documentation and meta files
git filter-repo \
    --path docs/ \
    --path README.md \
    --path LICENSE \
    --path CHANGELOG.md \
    --path CONTRIBUTING.md \
    --path ROADMAP.md \
    --force

# Check git history is preserved
git log --oneline | head -n 10

# Remove old remote
git remote remove origin

# Add new remote (replace YOUR-USERNAME)
git remote add origin git@github.com:YOUR-USERNAME/delerium.git

# Verify remote
git remote -v

# Push to new repository
git push -u origin main

# Create initial tag
git tag -a v1.0.0 -m "Initial multi-repo release"
git push origin v1.0.0

echo "✅ Meta repository extraction complete!"
```

### Post-Extraction Updates

1. **Update README.md** - Replace with meta repository README (from META_README.md)
2. **Update CHANGELOG.md** - High-level multi-repo changelog
3. **Add MIGRATION.md** - Copy from MIGRATION_GUIDE.md
4. **Create ROADMAP.md** - Future plans

---

## Verification Steps

After extracting all repositories, verify everything:

### 1. Check Repository Contents

```bash
# Client
cd /tmp/delerium-migration/delerium-client
ls -la
# Should have: src/, tests/, package.json, etc.

# Server
cd /tmp/delerium-migration/delerium-server
ls -la
# Should have: src/, build.gradle.kts, Dockerfile, etc.

# Infrastructure
cd /tmp/delerium-migration/delerium-infrastructure
ls -la
# Should have: docker-compose/, nginx/, scripts/, Makefile

# Meta
cd /tmp/delerium-migration/delerium-meta
ls -la
# Should have: docs/, README.md, LICENSE, etc.
```

### 2. Check Git History

```bash
# Each repository should have relevant history
cd /tmp/delerium-migration/delerium-client
git log --oneline | wc -l  # Should show commit count

cd /tmp/delerium-migration/delerium-server
git log --oneline | wc -l

cd /tmp/delerium-migration/delerium-infrastructure
git log --oneline | wc -l

cd /tmp/delerium-migration/delerium-meta
git log --oneline | wc -l
```

### 3. Check Remote Configuration

```bash
# Verify all remotes are correct
for repo in delerium-client delerium-server delerium-infrastructure delerium-meta; do
    echo "=== $repo ==="
    cd /tmp/delerium-migration/$repo
    git remote -v
    echo ""
done
```

### 4. Test Local Builds

```bash
# Client
cd /tmp/delerium-migration/delerium-client
npm install
npm run build
npm test

# Server
cd /tmp/delerium-migration/delerium-server
./gradlew clean build test

# Infrastructure
cd /tmp/delerium-migration/delerium-infrastructure
docker compose -f docker-compose/docker-compose.yml config
```

---

## Troubleshooting

### Issue: "Cannot run git-filter-repo in a dirty repository"

**Solution:**
```bash
git status
git stash  # Save any uncommitted changes
# Run filter-repo again
git stash pop  # Restore changes (if needed)
```

### Issue: "Remote 'origin' already exists"

**Solution:**
```bash
git remote remove origin
git remote add origin [NEW_URL]
```

### Issue: "Path not found" during filter-repo

**Solution:**
```bash
# List all files to find correct path
git ls-files

# Use correct path in filter-repo command
git filter-repo --path [CORRECT_PATH]/
```

### Issue: Lost commits or history

**Solution:**
```bash
# Restore from backup bundle
git clone /tmp/delerium-migration/backup-client.bundle restored-repo
cd restored-repo
# Try filter-repo command again with correct paths
```

### Issue: Large repository size after extraction

**Solution:**
```bash
# Run aggressive garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## Cleanup

After successful extraction and verification:

```bash
# Remove temporary workspace
cd /tmp
rm -rf delerium-migration

# Keep backup bundles in safe location
mkdir -p ~/delirium-backups
mv /tmp/backup-*.bundle ~/delirium-backups/
```

---

## Notes

1. **Preserve .git directory** - Don't delete until verification complete
2. **Test locally first** - Verify builds work before pushing
3. **Branch protection** - Set up on GitHub before pushing
4. **Backup bundles** - Keep for at least 30 days
5. **Tag releases** - Use semantic versioning (v1.0.0)

---

## Alternative: Manual Split (Without git-filter-repo)

If git-filter-repo is not available, you can do a manual split:

```bash
# Clone monorepo
git clone [MONOREPO_URL] delerium-client
cd delerium-client

# Remove all files except client/
find . -mindepth 1 -maxdepth 1 ! -name 'client' ! -name '.git' -exec rm -rf {} +

# Move client contents to root
mv client/* client/.[^.]* .
rmdir client

# Commit changes
git add .
git commit -m "Extract client from monorepo"

# Add new remote and push
git remote set-url origin [NEW_CLIENT_REPO_URL]
git push -u origin main
```

⚠️ **Warning:** This method does NOT preserve filtered history properly. Use git-filter-repo when possible.

---

**End of Guide**

For questions or issues, open a GitHub issue in the appropriate repository.
