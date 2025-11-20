#!/bin/bash
# scripts/sync-to-standalone.sh
# Syncs changes from monorepo to standalone repositories (git subtree/push)

set -e

echo "Syncing to standalone repositories..."

# Configuration
ORG="your-org"
CLIENT_REPO="delerium-client"
SERVER_REPO="delerium-server"
INFRA_REPO="delerium-infrastructure"
DOCS_REPO="delerium"

# Sync Client
echo "Syncing Client..."
# git subtree push --prefix client git@github.com:$ORG/$CLIENT_REPO.git main

# Sync Server
echo "Syncing Server..."
# git subtree push --prefix server git@github.com:$ORG/$SERVER_REPO.git main

# Sync Infra
echo "Syncing Infra..."
# Logic to sync infra files

# Sync Docs
echo "Syncing Docs..."
# Logic to sync docs

echo "Sync complete."
