# Quick Reference: Using Optimized Workflows

## 🚀 Quick Start

### Before Committing Code

Run local checks to catch issues before pushing:

```bash
# Run all checks in parallel (fastest)
./scripts/ci-verify-all.sh

# Or run individually
./scripts/ci-verify-frontend.sh
./scripts/ci-verify-backend.sh
```

### Before Deploying

Run the full deployment pipeline:

```bash
make deploy-full
```

This will:
1. Clean everything
2. Build client and server **in parallel** ⚡
3. Run client and server tests **in parallel** ⚡
4. Deploy to Docker

## 📋 Detailed Usage

### Local Development Scripts

#### Full CI Verification (Recommended)
```bash
./scripts/ci-verify-all.sh
```
**What it does:**
- Runs frontend checks (lint, typecheck, tests, coverage, security audit)
- Runs backend checks (build, test, dependency check)
- Runs both **in parallel** for faster execution
- Validates Docker configuration
- Shows clear output from both processes

**When to use:** Before pushing code, before creating a PR

#### Frontend Checks Only
```bash
./scripts/ci-verify-frontend.sh
```
**What it does:**
- Installs dependencies (uses cache if available)
- Lints TypeScript code
- Type checks
- Runs unit tests
- Runs E2E tests (Playwright)
- Generates coverage report
- Runs security audit

**When to use:** When working on frontend code only

#### Backend Checks Only
```bash
./scripts/ci-verify-backend.sh
```
**What it does:**
- Builds Kotlin/Ktor backend
- Runs tests
- Runs OWASP dependency check

**When to use:** When working on backend code only

### Makefile Commands

#### Full Deployment Pipeline
```bash
make deploy-full
```
**What it does:**
1. Cleans everything
2. Builds client and server **in parallel** ⚡
3. Runs client and server tests **in parallel** ⚡
4. Deploys to Docker

**When to use:** Before deploying to production/staging

#### Other Useful Commands
```bash
make start          # Start services (builds client first)
make stop           # Stop all containers
make restart        # Restart services
make logs           # View logs
make test           # Run all tests
make build-client   # Build TypeScript client only
make health-check   # Check if services are running
```

### GitHub Actions (Automatic)

#### PR Checks Workflow
**Triggers:** Automatically on every pull request

**What it does:**
- Runs frontend checks (parallel job)
- Runs backend checks (parallel job)
- Runs Docker checks (parallel job)
- Shows summary of all checks

**How to view:**
1. Open your PR on GitHub
2. Scroll to "Checks" section
3. Click on "PR Parallel Quality Gates" to see details
4. Each job shows its status (✅ success, ❌ failure)

#### Client CI Workflow
**Triggers:** Automatically when files in `client/` change

**What it does:**
- Runs lint (parallel job)
- Runs typecheck (parallel job)
- Runs tests (parallel job)
- Generates coverage (parallel job)
- Shows summary

**How to view:**
1. Go to Actions tab in GitHub
2. Find "Client CI" workflow run
3. Click to see individual job results

#### Security Scan Workflow
**Triggers:**
- Automatically on push to `main`
- Automatically on PRs that change dependencies
- Daily at 2 AM UTC (scheduled)
- Manually via Actions → Security Scan → Run workflow

**What it does:**
- Scans frontend dependencies (npm audit)
- Scans backend dependencies (OWASP Dependency Check)
- Both run **in parallel**
- Shows vulnerability summary

**How to view:**
1. Go to Actions tab
2. Find "Security Scan" workflow
3. Check the summary for vulnerability counts

## 🎯 Common Workflows

### Daily Development Workflow

```bash
# 1. Make your changes
# ... edit code ...

# 2. Run checks before committing
./scripts/ci-verify-all.sh

# 3. If all pass, commit and push
git add .
git commit -m "Your commit message"
git push

# 4. GitHub Actions will automatically run on PR
```

### Pre-Deployment Workflow

```bash
# 1. Run full deployment pipeline
make deploy-full

# 2. If successful, services are running
# 3. Check health
make health-check

# 4. View logs if needed
make logs
```

### Frontend-Only Changes

```bash
# Quick check
./scripts/ci-verify-frontend.sh

# Or use npm scripts directly
cd client
npm run lint
npm run typecheck
npm run test:unit
```

### Backend-Only Changes

```bash
# Quick check
./scripts/ci-verify-backend.sh

# Or use Gradle directly
cd server
./gradlew test
```

## 🔍 Understanding Output

### Local Scripts Output

When running `ci-verify-all.sh`, you'll see:
```
🚀 Running Full CI Verification (Parallel)
🚀 Starting frontend checks in background...
🚀 Starting backend checks in background...
⏳ Waiting for frontend and backend checks to complete...

==========================================
FRONTEND CHECKS OUTPUT
==========================================
[... frontend output ...]

==========================================
BACKEND CHECKS OUTPUT
==========================================
[... backend output ...]

✅ ALL CI CHECKS PASSED!
```

### GitHub Actions Output

In GitHub, you'll see:
- **Green checkmark** ✅ = Job passed
- **Red X** ❌ = Job failed
- **Yellow circle** ⏳ = Job running
- **Summary section** = Aggregated results from all jobs

### Cache Indicators

Look for these in logs:
- `Cache restored from key: ...` = Cache hit (faster!)
- `Cache not found for input keys: ...` = Cache miss (will create new cache)

## ⚡ Performance Tips

1. **Use local scripts first**: Catch issues locally before pushing (faster feedback)
2. **Let caches build**: First run will be slower, subsequent runs use cache
3. **Check cache hits**: More cache hits = faster execution
4. **Run specific checks**: Use frontend/backend-only scripts when working on one area

## 🐛 Troubleshooting

### Scripts fail locally

```bash
# Check if scripts are executable
ls -l scripts/ci-verify-*.sh

# If not, make them executable
chmod +x scripts/ci-verify-*.sh

# Check for errors
./scripts/ci-verify-all.sh 2>&1 | tee ci-output.log
```

### GitHub Actions failing

1. Check the specific job that failed
2. Review the logs for that job
3. Look at the summary job for aggregated results
4. Common issues:
   - Dependency installation failures → Check package-lock.json
   - Test failures → Run tests locally first
   - Docker issues → Test with `docker compose config`

### Cache not working

- Caches are keyed by file hashes
- If dependencies change, cache will rebuild
- First run after dependency change will be slower
- Subsequent runs will use the new cache

## 📚 More Information

- See `docs/development/workflow-optimization.md` for detailed technical documentation
- See `docs/development/` for other development guides
