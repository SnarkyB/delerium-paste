# Post-Merge Plan

This document outlines the steps to be taken after the monorepo decomposition migration is merged and executed.

## 1. Verification

- [ ] **Check Standalone Repositories**: Ensure `delerium-client`, `delerium-server`, `delerium-infrastructure`, and `delerium` are correctly populated.
- [ ] **Verify CI/CD**: Trigger pipelines in each new repository to ensure they pass.
- [ ] **Test Deployments**: specific environments (dev/stage) should be deployed from the new repositories.

## 2. Cleanup

- [ ] **Archive Old Monorepo**: Once verification is complete, archive `delerium-paste-mono` (or rename it) to prevent accidental usage.
- [ ] **Update Registry Links**: Update Docker Hub, npm registry, etc., to point to the new repository locations.
- [ ] **Remove Temporary Artifacts**: Delete `migration-artifacts/` directory from local machines.

## 3. Communication

- [ ] **Announce Completion**: Notify the team and community that the migration is complete.
- [ ] **Update Internal Docs**: Update onboarding guides to reference the new repositories.

## 4. Maintenance

- [ ] **Monitor Sync Scripts**: Ensure `scripts/sync-to-standalone.sh` (if used during transition) is working or decommissioned.
- [ ] **Feedback Loop**: Address any issues reported by developers switching to the new workflow.
