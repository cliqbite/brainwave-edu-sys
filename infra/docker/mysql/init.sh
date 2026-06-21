#!/bin/bash
set -e

# ============================================================
# Brainwave EduSys - MySQL Initialization Script
# Runs on first container startup
# ============================================================

# Ensure proper character set for full Unicode support
# and grant the app user global privileges so Prisma can
# create shadow databases for migrations.
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
    ALTER DATABASE \`$MYSQL_DATABASE\` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON *.* TO '$MYSQL_USER'@'%';
    FLUSH PRIVILEGES;
EOSQL
