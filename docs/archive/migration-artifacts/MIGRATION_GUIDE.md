# Migration Guide: Monorepo to Multi-Repo

**Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Applies to:** Delirium v0.1.x → v1.0.0

This guide helps existing users, contributors, and operators migrate from the monorepo structure to the new multi-repository architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [For End Users](#for-end-users)
3. [For Contributors](#for-contributors)
4. [For Operators](#for-operators)
5. [Repository Mapping](#repository-mapping)
6. [Breaking Changes](#breaking-changes)
7. [Rollback Plan](#rollback-plan)
8. [FAQ](#faq)

---

## Overview

### Why the Change?

The Delirium project has migrated from a monorepo to a multi-repo structure for the following benefits:

✅ **Faster CI/CD** - Only build and test what changed  
✅ **Clearer Ownership** - Focused repositories with clear maintainers  
✅ **Independent Releases** - Deploy client and server separately  
✅ **Easier Onboarding** - Clone only what you need  
✅ **Better PRs** - Smaller, more focused contributions  
✅ **Simplified Versioning** - Independent version numbers per component  

### What Changed?

**Before (Monorepo):**
```
delerium-paste/
├── client/     # Frontend
├── server/     # Backend
├── reverse-proxy/
├── scripts/
└── docs/
```

**After (Multi-Repo):**
- `delerium-client` - Frontend TypeScript application
- `delerium-server` - Backend Kotlin/Ktor API
- `delerium-infrastructure` - Deployment & orchestration
- `delerium` - Documentation hub

---

## For End Users

### Quick Migration (Recommended)

If you've been running Delirium from the monorepo, here's how to migrate:

#### Option 1: Fresh Installation (Easiest)

```bash
# 1. Stop your current deployment
cd /path/to/old/delerium-paste
docker compose down

# 2. Backup your data (IMPORTANT!)
cp -r server/data /path/to/backup/

# 3. Clone new infrastructure repo
cd /path/to/projects
git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git
cd delerium-infrastructure

# 4. Restore your data
mkdir -p data/server
cp -r /path/to/backup/* data/server/

# 5. Copy your environment configuration
# If you had custom .env settings, recreate them
cp docker-compose/.env.example .env
# Edit .env with your DELETION_TOKEN_PEPPER and other settings

# 6. Run setup
./scripts/setup.sh

# 7. Verify everything works
curl http://localhost:8080/api/health
```

✅ **Done!** Your pastes and data are preserved.

#### Option 2: In-Place Migration

If you want to keep your current directory structure:

```bash
# 1. Create backup
cd /path/to/delerium-paste
cp -r . ../delerium-paste-backup

# 2. Stop services
docker compose down

# 3. Clone infrastructure repo into parent directory
cd ..
git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git

# 4. Copy data
cp -r delerium-paste/server/data delerium-infrastructure/data/server

# 5. Copy environment config
cp delerium-paste/.env delerium-infrastructure/.env

# 6. Start from infrastructure repo
cd delerium-infrastructure
./scripts/setup.sh
```

### What Stays the Same

- ✅ **Same API endpoints** - No changes to API structure
- ✅ **Same encryption** - All existing pastes remain readable
- ✅ **Same database format** - SQLite database is compatible
- ✅ **Same ports** - Default port 8080 unchanged
- ✅ **Same features** - All functionality preserved

### What's Different

- ⚠️ **New repository URL** - Update your git remotes
- ⚠️ **New setup command** - Use `./scripts/setup.sh` instead of `make quick-start`
- ⚠️ **Docker Compose location** - Config files moved to `docker-compose/` directory

---

## For Contributors

### Choosing the Right Repository

| I want to work on... | Clone this repository |
|----------------------|----------------------|
| Frontend UI/UX | [`delerium-client`](https://github.com/YOUR-USERNAME/delerium-client) |
| TypeScript crypto logic | [`delerium-client`](https://github.com/YOUR-USERNAME/delerium-client) |
| Client tests | [`delerium-client`](https://github.com/YOUR-USERNAME/delerium-client) |
| Backend API | [`delerium-server`](https://github.com/YOUR-USERNAME/delerium-server) |
| Kotlin/Ktor code | [`delerium-server`](https://github.com/YOUR-USERNAME/delerium-server) |
| Server tests | [`delerium-server`](https://github.com/YOUR-USERNAME/delerium-server) |
| Docker setup | [`delerium-infrastructure`](https://github.com/YOUR-USERNAME/delerium-infrastructure) |
| Nginx config | [`delerium-infrastructure`](https://github.com/YOUR-USERNAME/delerium-infrastructure) |
| Deployment scripts | [`delerium-infrastructure`](https://github.com/YOUR-USERNAME/delerium-infrastructure) |
| Documentation | [`delerium`](https://github.com/YOUR-USERNAME/delerium) |
| Architecture diagrams | [`delerium`](https://github.com/YOUR-USERNAME/delerium) |

### Development Setup

#### Frontend Development

```bash
# Clone client repository
git clone https://github.com/YOUR-USERNAME/delerium-client.git
cd delerium-client

# Install dependencies
npm install

# Start development
npm run watch    # Auto-compile TypeScript

# Run tests
npm run test:all

# Run linter
npm run lint
```

#### Backend Development

```bash
# Clone server repository
git clone https://github.com/YOUR-USERNAME/delerium-server.git
cd delerium-server

# Build and run
./gradlew run

# Run tests
./gradlew test

# Run with Docker
docker build -t delerium-server:dev .
docker run -p 8080:8080 delerium-server:dev
```

#### Full Stack Development

```bash
# Create workspace
mkdir delerium-dev && cd delerium-dev

# Clone all repositories
git clone https://github.com/YOUR-USERNAME/delerium-client.git
git clone https://github.com/YOUR-USERNAME/delerium-server.git
git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git

# Start infrastructure with local builds
cd delerium-infrastructure
./scripts/setup.sh --dev
```

### CI/CD Changes

#### Before (Monorepo)
- Single `.github/workflows/pr-checks.yml`
- Tests all components on every PR
- Long CI run times (5-10 minutes)

#### After (Multi-Repo)
- **Client CI**: `.github/workflows/client-ci.yml` (3-5 minutes)
- **Server CI**: `.github/workflows/server-ci.yml` (3-5 minutes)
- **Infrastructure CI**: `.github/workflows/integration-tests.yml` (daily)

**Result:** PRs complete 2x faster! 🚀

### Pull Request Workflow

#### Before
```bash
cd delerium-paste
git checkout -b feature/my-feature
# Make changes to client/ or server/
git commit -am "Add feature"
git push
# Create PR → Triggers full test suite
```

#### After
```bash
# For client changes
cd delerium-client
git checkout -b feature/my-client-feature
# Make changes
git commit -am "Add client feature"
git push
# Create PR → Only client tests run

# For server changes
cd delerium-server
git checkout -b feature/my-server-feature
# Make changes
git commit -am "Add server feature"
git push
# Create PR → Only server tests run
```

---

## For Operators

### Production Migration

If you're running Delirium in production, follow these steps carefully:

#### 1. Pre-Migration Checklist

- [ ] **Backup all data**
  ```bash
  # Backup database
  docker compose exec server tar czf /tmp/backup.tar.gz /data
  docker cp delirium-server:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
  
  # Backup configuration
  cp .env .env.backup
  ```

- [ ] **Document current configuration**
  ```bash
  # Save current environment
  docker compose config > current-config.yml
  
  # Save container versions
  docker compose images > current-versions.txt
  ```

- [ ] **Notify users** of planned maintenance window

- [ ] **Schedule downtime** (estimated: 15-30 minutes)

#### 2. Migration Steps

```bash
# Step 1: Stop current deployment
docker compose down

# Step 2: Clone infrastructure repository
git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git /opt/delirium
cd /opt/delirium

# Step 3: Configure environment
cp docker-compose/.env.example .env
# Copy values from old .env file
vim .env

# Step 4: Restore data
mkdir -p data/server
tar xzf /path/to/backup-YYYYMMDD.tar.gz -C data/server

# Step 5: Start with production config
docker compose -f docker-compose/docker-compose.yml \
               -f docker-compose/docker-compose.prod.yml up -d

# Step 6: Verify health
curl https://your-domain.com/api/health

# Step 7: Test functionality
# Create test paste, verify retrieval and deletion
```

#### 3. Post-Migration Verification

```bash
# Check service status
docker compose ps

# Check logs for errors
docker compose logs -f --tail=100

# Monitor resource usage
docker stats

# Verify database
docker compose exec server ls -lh /data/

# Test API endpoints
curl https://your-domain.com/api/pow
curl https://your-domain.com/
```

### Version Pinning

In production, always pin specific versions:

```yaml
# docker-compose/.env
SERVER_VERSION=v1.0.0  # Not 'latest'
CLIENT_VERSION=v1.0.0
```

This ensures:
- ✅ Reproducible deployments
- ✅ Controlled updates
- ✅ Easier rollbacks

### Monitoring & Alerting

Update your monitoring to track the new structure:

```bash
# Infrastructure provides health check script
./scripts/health-check.sh

# Set up cron job for monitoring
crontab -e
# Add: */5 * * * * /opt/delirium/scripts/health-check.sh
```

---

## Repository Mapping

### File Location Changes

| Old Location (Monorepo) | New Location (Multi-Repo) |
|-------------------------|---------------------------|
| `client/src/` | `delerium-client/src/` |
| `client/tests/` | `delerium-client/tests/` |
| `client/package.json` | `delerium-client/package.json` |
| `server/src/` | `delerium-server/src/` |
| `server/build.gradle.kts` | `delerium-server/build.gradle.kts` |
| `server/Dockerfile` | `delerium-server/Dockerfile` |
| `reverse-proxy/` | `delerium-infrastructure/nginx/` |
| `scripts/` | `delerium-infrastructure/scripts/` |
| `docker-compose.yml` | `delerium-infrastructure/docker-compose/docker-compose.yml` |
| `Makefile` | `delerium-infrastructure/Makefile` |
| `docs/` | `delerium/docs/` |
| `.github/workflows/` | Split across all repos |

### Git History Preservation

✅ **All git history has been preserved!**

Each repository maintains the commit history for its respective files:

```bash
# In delerium-client
git log src/app.ts
# Shows all commits that touched client/src/app.ts in monorepo

# In delerium-server  
git log src/main/kotlin/App.kt
# Shows all commits that touched server/src/main/kotlin/App.kt
```

---

## Breaking Changes

### Removed Features

None! All features are preserved in the migration.

### Changed Defaults

1. **Docker Compose Files Location**
   - Old: `./docker-compose.yml`
   - New: `./docker-compose/docker-compose.yml`

2. **Data Directory Location**
   - Old: `./server/data`
   - New: `./data/server`

3. **Log Directory Location**
   - Old: `./logs` (optional)
   - New: `./logs/` (standardized)

### Environment Variables

No changes to environment variables. All existing `.env` configurations work as-is.

---

## Rollback Plan

If you encounter issues with the multi-repo setup, you can roll back:

### Rollback to Monorepo

```bash
# 1. Stop new infrastructure
cd /path/to/delerium-infrastructure
docker compose down

# 2. Return to old monorepo
cd /path/to/delerium-paste-backup
docker compose up -d

# 3. Restore data if needed
docker compose exec server rm -rf /data/*
docker cp backup-YYYYMMDD.tar.gz delirium-server:/tmp/
docker compose exec server tar xzf /tmp/backup-YYYYMMDD.tar.gz -C /
```

### Grace Period

The old monorepo will remain available (archived, read-only) for **30 days** after the migration announcement.

---

## FAQ

### Q: Will my existing pastes still work?

**A:** Yes! The database format and encryption are unchanged. All existing pastes remain accessible.

### Q: Do I need to change my bookmarks/URLs?

**A:** No. If you're self-hosting, your domain/IP stays the same. If using the public instance, the URL is unchanged.

### Q: What happens to my fork of the monorepo?

**A:** Your fork remains as-is. You can:
1. Keep it and sync with the archived version
2. Fork the new repositories instead
3. Migrate your changes to the new structure

### Q: How do I contribute a feature that spans client and server?

**A:** 
1. Create separate PRs in each repository
2. Reference the related PR in your description
3. Coordinate with maintainers on merge order

### Q: Can I still use the Makefile?

**A:** Yes! The Makefile has been moved to `delerium-infrastructure` and works the same way:

```bash
cd delerium-infrastructure
make start
make dev
make logs
```

### Q: How do I update to new versions?

**A:** With multi-repo, you have more control:

```bash
# Update infrastructure only
cd delerium-infrastructure
git pull
./scripts/deploy.sh

# Update server only
# Edit .env: SERVER_VERSION=v1.1.0
docker compose pull server
docker compose up -d server

# Update client only
# Client is pulled from GitHub releases automatically
```

### Q: What about the CI/CD pipeline?

**A:** Each repository has its own CI/CD:
- Faster feedback (only test what changed)
- Independent deployments
- Better GitHub Actions caching

### Q: Where do I report bugs now?

**A:** Report bugs in the appropriate repository:
- UI bugs → `delerium-client` issues
- API bugs → `delerium-server` issues
- Deployment bugs → `delerium-infrastructure` issues
- Documentation issues → `delerium` issues

### Q: Is the migration complete?

**A:** Yes! All code, history, and functionality has been successfully migrated. The old monorepo is archived for reference.

---

## Getting Help

- 📖 **Documentation**: https://github.com/YOUR-USERNAME/delerium
- 💬 **Discussions**: GitHub Discussions in each repository
- 🐛 **Bug Reports**: Issues in the appropriate repository
- 📧 **Email**: [Your contact email]

---

## Timeline

- **2025-11-16**: Migration plan announced
- **2025-11-23**: Multi-repo repositories created
- **2025-11-30**: Migration executed
- **2025-12-30**: Old monorepo archived (read-only)

---

**Thank you for being part of the Delirium community! 🚀**

This migration sets us up for better growth, faster development, and improved contributor experience.

---

*Last updated: 2025-11-16*  
*Questions? Open an issue or discussion in any repository.*
