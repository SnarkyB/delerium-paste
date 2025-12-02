# Repository Guidelines

## Project Structure & Module Organization
- `client/` hosts the TypeScript SPA (`src/` for UI/features modules, `tests/{unit,integration,e2e}` for Jest/Playwright suites, build output in `js/`).
- `server/` holds the Kotlin Ktor API (`src/main/kotlin` routes and storage plus `BUILD.bazel` + Dockerfile). Uses Bazel for builds.
- `reverse-proxy/` contains the Nginx config that serves static assets and proxies `/api`.
- `docs/`, `scripts/`, and the `docker-compose*.yml` variants capture deployment notes and automation—update both dev and prod files when you add services.

## Build, Test, and Development Commands
- `make quick-start` handles the full local bootstrap (install, build, compose up).
- `make dev` pairs Dockerized backend services with the client watch mode for hot reload at `http://localhost:8080`.
- `make test` targets the TypeScript suites; run `bazel test //server:all_tests` on Kotlin changes.
- `make ci-check` runs full CI verification locally (parallel execution).
- `make ci-quick` runs quick CI checks (lint, type, tests).
- `./scripts/ci-verify-all.sh` (or the frontend/backend variants) reproduces the GitHub Actions pipeline.
- `make start | stop | logs | clean` wrap Docker Compose for routine use.

## Coding Style & Naming Conventions
- TypeScript follows the ESLint profile in `eslint.config.mjs` (2-space indent, camelCase symbols, kebab-case filenames). Avoid `any`, prefer typed helpers under `client/src/features` or `client/src/utils`, and keep crypto logic isolated for reuse.
- Kotlin sticks to JetBrains defaults (4-space indent, UpperCamelCase classes). Routes live in `Routes.kt`, persistence code in `Storage.kt`, and DTOs in their own packages.
- Run `npm run lint` and the CI typecheck scripts before requesting review. Backend uses Bazel for builds and tests.

## Testing Guidelines
- Run `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` (Playwright) to cover the pyramid; shared setup is in `client/tests/setup.ts`.
- Maintain ≥85% coverage, especially around encryption, PoW, and routing flows, since CI enforces the threshold.
- Backend work requires `bazel test //server:all_tests`; place suites under `server/src/test/kotlin`.

## Commit & Pull Request Guidelines
- Follow `<type>: <description>` (feat, fix, docs, test, refactor, chore, perf, style) and keep commits scoped to one concern.
- Fill out `PR_DESCRIPTION.md` when opening a PR: summary, highlighted changes, risks, and checked tests; attach screenshots for UI tweaks.
- Aim for ~100–300 line diffs so reviewers can map them to the modularization plan in `docs/prs/`.

## Security & Configuration Tips
- Secrets such as `DELETION_TOKEN_PEPPER` stay in untracked `.env` files consumed by Docker; rotate them whenever PoW or deletion logic changes.
- Use `make start-secure` with `docker-compose.secure.yml` and the steps in `SECURITY_CHECKLIST.md` for hardened runs, and call out crypto/privacy changes in your PR with links to `docs/architecture/`.
