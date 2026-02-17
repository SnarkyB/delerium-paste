# Cleanup Unused Code and Docs

## Summary

- Remove unused security helpers and unused headers/constants.
- Deduplicate server at-rest decrypt/migrate logic without changing behavior.
- Relocate change docs to `docs/prs/` and fix broken references.

## Risk Assessment (High-Risk Change Protocol)

- [x] **What system is being changed and why**
  - `client/src/security.ts`: remove unused `safeDisplayFormatted`, unused CSP/header constants, and the unused window export.
  - `server/src/main/kotlin/Storage.kt`: refactor duplicate decrypt/migrate logic into a shared helper.
  - Docs: move change docs into `docs/prs/` and fix broken links.
- [x] **What could go wrong**
  - Removing unused helpers could break a hidden dependency or future usage.
  - Storage refactor could accidentally alter legacy migration behavior.
  - Doc moves could leave stale links if references are missed.
- [x] **What data could leak if implementation is flawed**
  - No change to crypto algorithms, key derivation, or transport; no new logging added.
  - Risk is limited to accidental UI rendering changes (still uses safe `textContent`).
- [x] **How existing users are protected (backward compatibility)**
  - Safe display uses existing `safeDisplayContent` unchanged.
  - At-rest migration behavior preserved for legacy rows with `enc_key_id = null`.
  - No schema or API contract changes.
- [x] **Rollback plan**
  - Revert this PR to restore previous helpers and docs.
  - No database migrations or data transformations required.

## Edge Cases Considered

- `safeDisplayContent` with empty content, newlines, HTML/script tags, and unicode.
- Legacy rows with `enc_key_id = null` (paste and chat) still migrate lazily.
- Existing encrypted rows with non-null `enc_key_id` still decrypt without changes.
- No changes to encryption/decryption, delete auth derivation, or network payloads.

## Test Plan

- Update `client/tests/unit/security.test.ts` to reflect removed helper.
- Run server storage tests to ensure legacy migration behavior is unchanged.
