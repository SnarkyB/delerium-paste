# Repository Guidelines

## CI/CD & Quality Gates

**Consolidated Workflow Architecture:** This project uses 4 streamlined GitHub Actions workflows (previously 7):

| Workflow | Purpose | Trigger | Local Script |
|----------|---------|---------|--------------|
| **pr-checks.yml** (MASTER) | Single PR quality gate: frontend (ESLint, TypeScript, unit tests, coverage, security audit) + backend (build, tests) + docker validation | Every PR and push to main/parity | `./scripts/ci-verify-all.sh` |
| **security-scan.yml** | Independent security scans (npm audit, OWASP dependency check). Runs scheduled (daily 2 AM UTC), on tags, and manual trigger. NOT triggered by PRs | Schedule + tags + manual dispatch | (runs independently) |
| **docker-publish.yml** | Multi-arch Docker image builds (amd64, arm64) to GHCR and Docker Hub. Consolidates the old docker-hub-server.yml | push main + tags + workflow_dispatch | (runs on publish) |
| **auto-release.yml** | Auto-creates Git tags from package.json version | push main | (runs on release) |

**Why Consolidated?** Merging client-ci.yml and server-ci.yml into pr-checks.yml gives:
- 🚀 **Faster PR feedback** (~30% reduction in runner minutes per PR)
- 🎯 **Single source of truth** for quality gates
- 🔍 **Parallel execution** of frontend/backend checks
- ✨ **Easier maintenance** (fewer workflows to update)

**Deprecated Workflows** (archived in `docs/archive/workflows/`):
- ~~client-ci.yml~~ → Merged into pr-checks.yml
- ~~server-ci.yml~~ → Merged into pr-checks.yml
- ~~docker-hub-server.yml~~ → Merged into docker-publish.yml

### Local Pre-PR Validation

Run these scripts locally **before pushing** to catch issues early:

```bash
# Full validation (mirrors pr-checks.yml exactly)
./scripts/ci-verify-all.sh

# Fast iteration (just lint + typecheck + unit tests, ~2 min)
./scripts/ci-verify-quick.sh

# Individual components
./scripts/ci-verify-frontend.sh     # Frontend only
./scripts/ci-verify-backend.sh      # Backend only
```

**Why run locally?**
- ⚡ Instant feedback (no GitHub Actions wait time)
- 💰 Saves runner minutes
- 🔄 Fast iteration during development
- 🛡️ Catch issues before GitHub Actions reports them

**Note:** These local scripts mirror GitHub Actions but are NOT replacements. GitHub Actions (pr-checks.yml) is the authoritative quality gate that blocks PRs.

---

## Project Structure & Module Organization
- `client/` hosts the TypeScript SPA (`src/` for UI/features modules, `tests/{unit,integration,e2e}` for Jest/Playwright suites, build output in `js/`).
- `server/` holds the Kotlin Ktor API (`src/main/kotlin` routes and storage plus `build.gradle.kts` + Dockerfile).
- `reverse-proxy/` contains the Nginx config that serves static assets and proxies `/api`.
- `docs/`, `scripts/`, and the `docker-compose*.yml` variants capture deployment notes and automation—update both dev and prod files when you add services.

## Build, Test, and Development Commands
- `make quick-start` handles the full local bootstrap (install, build, compose up).
- `make dev` pairs Dockerized backend services with the client watch mode for hot reload at `http://localhost:8080`.
- `make test` targets the TypeScript suites; run `cd server && ./gradlew test` on Kotlin changes.
- `./scripts/ci-verify-all.sh` (or the frontend/backend variants) reproduces the GitHub Actions pipeline.
- `make start | stop | logs | clean` wrap Docker Compose for routine use.

## Coding Style & Naming Conventions
- TypeScript follows the ESLint profile in `eslint.config.mjs` (2-space indent, camelCase symbols, kebab-case filenames). Avoid `any`, prefer typed helpers under `client/src/features` or `client/src/utils`, and keep crypto logic isolated for reuse.
- Kotlin sticks to JetBrains defaults (4-space indent, UpperCamelCase classes). Routes live in `Routes.kt`, persistence code in `Storage.kt`, and DTOs in their own packages.
- Run `npm run lint` and the CI typecheck scripts plus `./gradlew ktlint` (or detekt) before requesting review.

## Testing Guidelines
- Run `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` (Playwright) to cover the pyramid; shared setup is in `client/tests/setup.ts`.
- Maintain ≥85% coverage, especially around encryption, PoW, and routing flows, since CI enforces the threshold.
- Backend work requires `./gradlew test`; place suites under `server/src/test/kotlin`.

## Commit & Pull Request Guidelines
- Follow `<type>: <description>` (feat, fix, docs, test, refactor, chore, perf, style) and keep commits scoped to one concern.
- Fill out `PR_DESCRIPTION.md` when opening a PR: summary, highlighted changes, risks, and checked tests; attach screenshots for UI tweaks.
- Aim for ~100–300 line diffs so reviewers can map them to the modularization plan in `docs/prs/`.

## Security & Configuration Tips
- Secrets such as `DELETION_TOKEN_PEPPER` stay in untracked `.env` files consumed by Docker; rotate them whenever PoW or deletion logic changes.
- Use `make start-secure` with `docker-compose.secure.yml` and the steps in `SECURITY_CHECKLIST.md` for hardened runs, and call out crypto/privacy changes in your PR with links to `docs/architecture/`.
