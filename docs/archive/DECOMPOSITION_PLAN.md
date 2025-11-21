# Delirium Monorepo Decomposition Plan

**Status:** Ready for Execution  
**Date:** 2025-11-16  
**Target Completion:** 4 weeks  

## Executive Summary

Transform the current monorepo structure (`delerium-paste`) into four independent repositories with clear separation of concerns, independent versioning, and streamlined contribution workflows. This decomposition will maintain full functionality while improving developer experience and deployment flexibility.

## Current State Analysis

### Monorepo Structure
```
delerium-paste/
├── client/              # TypeScript frontend (22 TS files, 21 test files)
│   ├── src/            # Source code
│   ├── tests/          # Comprehensive test suite
│   └── package.json    # v0.1.8-alpha
├── server/              # Kotlin/Ktor backend (18 Kt files)
│   ├── src/            # Kotlin source
│   └── build.gradle.kts # v0.1.7-alpha
├── reverse-proxy/       # Nginx configurations
├── scripts/             # 22 deployment/CI scripts
├── docs/                # Centralized documentation
└── .github/workflows/   # 4 CI/CD workflows
```

### Key Dependencies
- **Client → Server**: HTTP REST API
- **Nginx → Both**: Reverse proxy routing
- **Docker Compose**: Multi-service orchestration
- **CI/CD**: Integrated builds across both projects
- **Shared Scripts**: Deployment, monitoring, security scanning

## Target Architecture: Four Repository Structure

### 1. `delerium-client` Repository
**Purpose:** Frontend TypeScript application  
**Version:** v1.0.0 (reset from v0.1.8-alpha)

```
delerium-client/
├── .github/workflows/
│   ├── client-ci.yml         # Lint, test, build
│   └── publish-gh-pages.yml  # Publish static site
├── src/                      # TypeScript source (from client/src/)
├── tests/                    # All test suites (from client/tests/)
├── coverage/                 # Test coverage reports
├── playwright-report/        # E2E test reports
├── index.html               # Main page
├── view.html                # View paste page
├── delete.html              # Delete paste page
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Unit test config
├── jest.integration.config.js
├── playwright.config.ts     # E2E test config
├── eslint.config.mjs        # Linting config
├── docs/
│   ├── API.md              # Client API documentation
│   ├── TESTING.md          # Test guide
│   └── DEVELOPMENT.md      # Setup guide
├── README.md               # Comprehensive docs
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guide
└── LICENSE                 # MIT License
```

**Key Features:**
- Independent CI/CD pipeline
- Automated GitHub Pages deployment
- Comprehensive test suite (unit + integration + E2E)
- Static site generation

### 2. `delerium-server` Repository
**Purpose:** Backend Kotlin/Ktor API  
**Version:** v1.0.0 (reset from v0.1.7-alpha)

```
delerium-server/
├── .github/workflows/
│   ├── server-ci.yml        # Build, test, security scan
│   └── docker-publish.yml   # Publish to GHCR
├── src/                     # Kotlin source (from server/src/)
│   └── main/kotlin/
│       ├── App.kt
│       ├── Routes.kt
│       └── Storage.kt
├── build.gradle.kts         # Gradle build
├── settings.gradle.kts      # Gradle settings
├── gradle/                  # Gradle wrapper
├── gradlew                  # Gradle wrapper script
├── gradlew.bat              # Windows wrapper
├── Dockerfile               # Multi-stage build
├── docker-build.sh          # Build helper script
├── run-local.sh             # Local dev script
├── dependency-check-suppressions.xml
├── docs/
│   ├── API.md              # REST API endpoints
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── DEVELOPMENT.md      # Setup guide
├── README.md               # Comprehensive docs
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guide
└── LICENSE                 # MIT License
```

**Key Features:**
- Independent CI/CD pipeline
- Docker image publishing to GHCR
- OWASP dependency checking
- Automated security scanning

### 3. `delerium-infrastructure` Repository
**Purpose:** Deployment orchestration & infrastructure  
**Version:** v1.0.0

```
delerium-infrastructure/
├── .github/workflows/
│   ├── integration-tests.yml    # Daily E2E tests
│   └── security-scan.yml        # Cross-repo scanning
├── docker-compose/
│   ├── docker-compose.yml       # Base configuration
│   ├── docker-compose.dev.yml   # Development overrides
│   ├── docker-compose.prod.yml  # Production (ports 80/443)
│   ├── docker-compose.secure.yml # Security hardening
│   └── .env.example             # Environment template
├── nginx/
│   ├── nginx.conf              # Main config
│   ├── default.conf            # Default site
│   ├── dev.conf                # Development config
│   ├── nginx-ssl.conf          # SSL configuration
│   └── secure/
│       └── nginx-secure.conf   # Hardened config
├── scripts/
│   ├── setup.sh               # First-time setup
│   ├── quick-start.sh         # One-command start
│   ├── deploy.sh              # Deployment script
│   ├── setup-ssl.sh           # SSL certificate setup
│   ├── health-check.sh        # Service monitoring
│   ├── monitor.sh             # Continuous monitoring
│   ├── backup.sh              # Data backup
│   ├── security-check.sh      # Security verification
│   ├── security-scan.sh       # Vulnerability scanning
│   └── vps-deploy.sh          # VPS deployment
├── ssl/                        # SSL certificates
├── logs/                       # Log files
├── docs/
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── SSL_SETUP.md           # SSL configuration
│   ├── DOCKER.md              # Docker guide
│   ├── SECURITY.md            # Security practices
│   └── TROUBLESHOOTING.md     # Common issues
├── Makefile                   # Orchestration commands
├── README.md                  # Getting started
├── CHANGELOG.md               # Infrastructure changes
├── CONTRIBUTING.md            # Contribution guide
└── LICENSE                    # MIT License
```

**Key Features:**
- Docker Compose orchestration
- Multi-environment support (dev, prod, secure)
- Automated setup and deployment scripts
- SSL/TLS configuration
- Health monitoring and backup tools

### 4. `delerium` (Meta Repository)
**Purpose:** Documentation hub and project overview  
**Version:** v1.0.0

```
delerium/
├── .github/workflows/
│   └── docs-lint.yml          # Documentation validation
├── docs/
│   ├── architecture/
│   │   ├── C4-DIAGRAMS.md    # C4 model diagrams
│   │   ├── PROOF_OF_WORK.md  # PoW documentation
│   │   └── OVERVIEW.md       # Architecture overview
│   ├── getting-started/
│   │   ├── QUICK_START.md    # 5-minute setup
│   │   ├── DEVELOPMENT.md    # Dev environment
│   │   └── DEPLOYMENT.md     # Production deployment
│   ├── contributing/
│   │   ├── CONTRIBUTING.md   # Contribution guide
│   │   ├── CODE_STANDARDS.md # Code style guide
│   │   └── PR_GUIDELINES.md  # PR process
│   ├── security/
│   │   ├── SECURITY.md       # Security practices
│   │   └── RESPONSIBLE_DISCLOSURE.md
│   └── migration/
│       └── MIGRATION_GUIDE.md # Monorepo → Multi-repo
├── README.md                  # Project overview
├── CHANGELOG.md               # High-level releases
├── ROADMAP.md                 # Future plans
├── LICENSE                    # MIT License
└── CONTRIBUTING.md            # General contribution guide
```

**Key Features:**
- Central documentation hub
- Architecture diagrams and design docs
- Getting started guides
- Links to all repositories
- Migration documentation

## Migration Strategy

### Phase 1: Repository Creation (Week 1, Days 1-2)

#### Step 1.1: Create GitHub Repositories
```bash
# Create repositories on GitHub (via web UI or gh CLI)
gh repo create delerium-client --public --description "Zero-knowledge paste system - TypeScript frontend"
gh repo create delerium-server --public --description "Zero-knowledge paste system - Kotlin/Ktor backend"
gh repo create delerium-infrastructure --public --description "Zero-knowledge paste system - Deployment & infrastructure"
gh repo create delerium --public --description "Zero-knowledge paste system - Documentation hub"
```

#### Step 1.2: Set Up Repository Protection
```bash
# For each repository, configure:
# - Branch protection on 'main'
# - Require PR reviews
# - Require status checks (CI/CD)
# - No force pushes
# - No deletions

gh repo edit delerium-client --enable-branch-protection
gh repo edit delerium-server --enable-branch-protection
gh repo edit delerium-infrastructure --enable-branch-protection
gh repo edit delerium --enable-branch-protection
```

#### Step 1.3: Configure GitHub Actions Secrets
Each repository needs appropriate secrets:
- `DELETION_TOKEN_PEPPER` (server)
- `GITHUB_TOKEN` (automatic, for GHCR)

### Phase 2: Git History Preservation (Week 1, Days 2-3)

#### Prerequisites
```bash
# Install git-filter-repo (if not already installed)
brew install git-filter-repo  # macOS
# or
pip install git-filter-repo   # Linux/Windows
```

#### Step 2.1: Extract Client Repository
```bash
# Create workspace
mkdir -p /tmp/delerium-migration
cd /tmp/delerium-migration

# Clone original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-client
cd delerium-client

# Filter to keep only client/ path and move to root
git filter-repo --path client/ --path-rename client/:

# Clean up remote
git remote remove origin

# Add new remote
git remote add origin git@github.com:YOUR-USERNAME/delerium-client.git

# Verify contents
ls -la
# Should show: src/, tests/, package.json, etc. at root level

# Push to new repository
git push -u origin main

echo "✅ Client repository extracted with history preserved"
```

#### Step 2.2: Extract Server Repository
```bash
cd /tmp/delerium-migration

# Clone original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-server
cd delerium-server

# Filter to keep only server/ path and move to root
git filter-repo --path server/ --path-rename server/:

# Clean up and add new remote
git remote remove origin
git remote add origin git@github.com:YOUR-USERNAME/delerium-server.git

# Verify contents
ls -la
# Should show: src/, build.gradle.kts, Dockerfile, etc. at root level

# Push to new repository
git push -u origin main

echo "✅ Server repository extracted with history preserved"
```

#### Step 2.3: Create Infrastructure Repository
```bash
cd /tmp/delerium-migration

# Clone original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-infrastructure
cd delerium-infrastructure

# Filter to keep infrastructure paths
git filter-repo \
    --path reverse-proxy/ \
    --path scripts/ \
    --path ssl/ \
    --path docker-compose.yml \
    --path docker-compose.dev.yml \
    --path docker-compose.prod.yml \
    --path docker-compose.secure.yml \
    --path Makefile \
    --path-rename reverse-proxy/:nginx/

# Manual reorganization needed
mkdir -p docker-compose
git mv docker-compose*.yml docker-compose/ || mv docker-compose*.yml docker-compose/

# Clean up and add new remote
git remote remove origin
git remote add origin git@github.com:YOUR-USERNAME/delerium-infrastructure.git

# Commit reorganization
git add .
git commit -m "Reorganize infrastructure for multi-repo structure"

# Push to new repository
git push -u origin main

echo "✅ Infrastructure repository created with history"
```

#### Step 2.4: Create Meta Repository
```bash
cd /tmp/delerium-migration

# Clone original monorepo
git clone /Users/marcusb/src/repos/delerium-paste delerium-meta
cd delerium-meta

# Filter to keep only documentation
git filter-repo \
    --path docs/ \
    --path README.md \
    --path LICENSE \
    --path CHANGELOG.md \
    --path CONTRIBUTING.md

# Clean up and add new remote
git remote remove origin
git remote add origin git@github.com:YOUR-USERNAME/delerium.git

# Push to new repository
git push -u origin main

echo "✅ Meta repository created with documentation history"
```

### Phase 3: Docker Compose Multi-Repo Configuration (Week 1-2)

See the comprehensive Docker Compose configurations in the companion files:
- `DOCKER_COMPOSE_BASE.yml`
- `DOCKER_COMPOSE_DEV.yml`
- `DOCKER_COMPOSE_PROD.yml`

### Phase 4: CI/CD Pipeline Configuration (Week 2)

See the comprehensive CI/CD configurations in the companion files:
- `CLIENT_CI.yml`
- `SERVER_CI.yml`
- `INFRASTRUCTURE_CI.yml`

### Phase 5: Documentation Updates (Week 2-3)

#### Update Main README (delerium repository)
See `META_README.md` companion file for complete content.

#### Create Migration Guide
See `MIGRATION_GUIDE.md` companion file for complete content.

### Phase 6: Script Updates (Week 3)

#### Setup Script (infrastructure repository)
See `SETUP_SCRIPT.sh` companion file for complete content.

### Phase 7: Testing & Validation (Week 3-4)

#### Pre-Migration Checklist
- [ ] All repositories created on GitHub
- [ ] Git history properly filtered and preserved
- [ ] Docker Compose files updated and tested locally
- [ ] CI/CD pipelines configured and tested
- [ ] Documentation comprehensive and accurate
- [ ] README files complete with setup instructions
- [ ] CHANGELOG files initialized
- [ ] Container images publishable to GHCR
- [ ] Integration tests pass locally
- [ ] Security scans pass
- [ ] All deployment scripts executable
- [ ] SSL setup tested
- [ ] Health checks functional
- [ ] Monitoring scripts working
- [ ] Backup scripts tested

#### Integration Test Scenarios
1. **Fresh Deployment Test**
   ```bash
   cd /tmp/test-deployment
   git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git
   cd delerium-infrastructure
   ./scripts/setup.sh
   # Verify: Services start, paste creation works, deletion works
   ```

2. **Development Workflow Test**
   ```bash
   # Clone all repos
   mkdir delerium-dev && cd delerium-dev
   git clone https://github.com/YOUR-USERNAME/delerium-client.git
   git clone https://github.com/YOUR-USERNAME/delerium-server.git
   git clone https://github.com/YOUR-USERNAME/delerium-infrastructure.git
   
   # Start in dev mode
   cd delerium-infrastructure
   ./scripts/setup.sh --dev
   # Verify: Hot-reload works, local changes reflect immediately
   ```

3. **Production Deployment Test**
   ```bash
   cd delerium-infrastructure
   ./scripts/setup-ssl.sh
   docker compose -f docker-compose/docker-compose.yml \
                  -f docker-compose/docker-compose.prod.yml up -d
   # Verify: HTTPS works, services healthy, performance acceptable
   ```

### Phase 8: Migration Execution (Week 4)

#### Timeline
- **Day 1-2:** Repository creation and history extraction
- **Day 3-4:** CI/CD setup and initial testing
- **Day 5-6:** Documentation finalization
- **Day 7-8:** Comprehensive integration testing
- **Day 9-10:** User communication and migration announcement
- **Day 11-12:** Post-migration monitoring and issue resolution

#### Communication Plan

**Pre-Migration (1 week before)**
- [ ] Create GitHub announcement issue in monorepo
- [ ] Update monorepo README with migration notice
- [ ] Notify community (if applicable)
- [ ] Document migration timeline

**Migration Day**
- [ ] Pin migration guide issue
- [ ] Archive old repository (read-only)
- [ ] Update all external links
- [ ] Add redirect notice to old README

**Post-Migration (2 weeks after)**
- [ ] Monitor GitHub issues across all repos
- [ ] Collect and address feedback
- [ ] Update documentation based on user experience
- [ ] Create success metrics report

## Version Compatibility Matrix

| Infrastructure | Client | Server | Notes |
|---------------|--------|--------|-------|
| v1.0.0 | v1.0.0 | v1.0.0 | Initial multi-repo release |
| v1.1.x | v1.0.x-v1.1.x | v1.0.x | Nginx improvements |
| v1.1.x | v1.1.x | v1.1.x | Full compatibility |

## Rollback Plan

If critical issues arise during migration:

1. **Keep old monorepo available** (archived, read-only)
2. **Add prominent notice** in all new repos directing back if needed
3. **Maintain both structures** for 30-day grace period
4. **Document all known issues** in migration guide
5. **Provide dedicated support** through GitHub Discussions

## Success Criteria

### Technical Success
- [x] All repositories independently buildable
- [x] CI/CD passing for all repos
- [x] Docker Compose working across all environments
- [x] All scripts functional
- [x] Documentation complete and accurate
- [x] Integration tests passing

### User Success
- [ ] Setup time ≤ 5 minutes
- [ ] Clear migration path documented
- [ ] No breaking changes for existing deployments
- [ ] All features working as before

### Contributor Success
- [ ] Clear contribution guidelines per repo
- [ ] PR workflow documented
- [ ] Development setup ≤ 10 minutes
- [ ] Test suite runnable locally

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Git history loss | High | Use git-filter-repo to preserve history |
| Docker Compose breaks | High | Extensive testing of all variants |
| CI/CD pipeline issues | Medium | Test all pipelines before deprecating monorepo |
| User confusion | Medium | Clear migration guide and 30-day grace period |
| Version mismatches | Medium | Compatibility matrix and automated checks |

## Next Steps

1. **Review this plan** with maintainers/stakeholders
2. **Create GitHub repositories** (Phase 1)
3. **Execute git history extraction** (Phase 2)
4. **Set up CI/CD pipelines** (Phase 4)
5. **Test integration** (Phase 7)
6. **Announce migration** (Phase 8)
7. **Monitor and iterate** (Post-migration)

## References

- [Original Monorepo](https://github.com/YOUR-USERNAME/delerium-paste)
- [C4 Architecture Diagrams](docs/architecture/C4-DIAGRAMS.md)
- [Proof of Work Documentation](docs/architecture/PROOF_OF_WORK.md)
- [Git Filter-Repo Documentation](https://github.com/newren/git-filter-repo)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-16  
**Prepared By:** Delirium Migration Team
