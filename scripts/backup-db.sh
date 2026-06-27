#!/bin/bash
# =============================================================
# backup-db.sh — BACKUP PRODUCTION DATABASE
# Creates a compressed SQL dump in ./backups/
# Usage: bash scripts/backup-db.sh
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Load DB credentials from .env.production
if [ ! -f ".env.production" ]; then
  echo "❌  .env.production not found. Run from the project root."
  exit 1
fi
source <(grep -E '^(DB_ROOT_PASSWORD|DB_NAME)=' .env.production)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo ""
echo "💾  Starting database backup..."
echo "    File: $BACKUP_FILE"
echo ""

$COMPOSE exec -T mysql \
  mysqldump -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}" \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅  Backup complete!"
echo "    File : $BACKUP_FILE"
echo "    Size : $SIZE"
echo ""
echo "💡  Tip: Copy this file off-server:"
echo "    scp user@your-vps:$(pwd)/$BACKUP_FILE ./local-backups/"
echo ""
