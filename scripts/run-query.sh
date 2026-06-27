#!/bin/bash
# =============================================================
# run-query.sh — RUN SQL QUERY DIRECTLY ON PRODUCTION DB
#
# Usage:
#   Interactive shell:
#     bash scripts/run-query.sh
#
#   Single query:
#     bash scripts/run-query.sh "SELECT COUNT(*) FROM users;"
#
#   SQL file:
#     bash scripts/run-query.sh ./path/to/query.sql
# =============================================================

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

if [ ! -f ".env.production" ]; then
  echo "❌  .env.production not found. Run from the project root."
  exit 1
fi
source <(grep -E '^(DB_ROOT_PASSWORD|DB_NAME)=' .env.production)

echo ""
echo "⚠️   Connected to PRODUCTION database: ${DB_NAME}"
echo "     Be careful — changes here are LIVE and IMMEDIATE."
echo ""

if [ -z "$1" ]; then
  # No argument — open interactive MySQL shell
  echo "Opening interactive MySQL shell. Type 'exit' to quit."
  echo "------------------------------------------------------"
  $COMPOSE exec mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}"

elif [ -f "$1" ]; then
  # Argument is a file — run SQL file
  echo "Running SQL file: $1"
  $COMPOSE exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}" < "$1"
  echo "✅  Done."

else
  # Argument is a query string — run it directly
  echo "Running query: $1"
  echo ""
  $COMPOSE exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME}" -e "$1"
  echo ""
  echo "✅  Done."
fi
