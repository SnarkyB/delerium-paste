#!/bin/bash
# Backup script for Delirium data

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/delirium-backup-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: $BACKUP_FILE"

# Backup server data
docker run --rm \
  -v delirium_server-data:/data \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/server-data-$TIMESTAMP.tar.gz" /data

# Backup configuration
tar czf "$BACKUP_FILE" \
  .env \
  docker-compose*.yml \
  reverse-proxy/ \
  logs/ \
  --exclude=node_modules \
  --exclude=.git

echo "✅ Backup created: $BACKUP_FILE"

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "delirium-backup-*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "server-data-*.tar.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned"
