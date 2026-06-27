#!/bin/bash
# =============================================================
# restore-db.sh — RESTORE DATABASE FROM BACKUP
# Usage: bash scripts/restore-db.sh ./backups/db_backup_20260627_020000.sql.gz
#
# ⚠️  WARNING: This OVERWRITES the current database.
#     Take a fresh backup first if you're unsure.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌  Usage: bash scripts/restore-db.sh <backup-file.sql.gz>"
  echo "   Example: bash scripts/restore-db.sh ./backups/db_backup_20260627_020000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌  File not found: $BACKUP_FILE"
  exit 1
fi

if [ ! -f ".env.production" ]; then
  echo "❌  .env.production not found. Run from the project root."
  exit 1
fi
source <(grep -E '^(DB_ROOT_PASSWORD|DB_NAME)=' .env.production)

echo ""
echo "======================================================"
echo "  ⚠️  WARNING: DATABASE RESTORE"
echo "======================================================"
echo "  This will OVERWRITE the current database: ${DB_NAME}"
echo "  Backup file: $BACKUP_FILE"
echo "======================================================"
echo ""
read -p "  Are you sure? Type YES to continue: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "  Aborted."
  exit 0
fi

echo ""
echo "🔄  Restoring database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | $COMPOSE exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}"

echo ""
echo "✅  Database restored successfully."
echo ""
