#!/bin/bash
# scripts/backup.sh
# Performs a logical backup of the Neon PostgreSQL database using pg_dump.

set -e

# Use DIRECT_URL for pg_dump (bypasses pgBouncer connection pooling)
if [ -z "$DIRECT_URL" ]; then
    if [ -f .env ]; then
        source .env
    fi
fi

if [ -z "$DIRECT_URL" ]; then
    echo "Error: DIRECT_URL is not set in the environment or .env file."
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "Starting database backup to ${BACKUP_FILE}..."
pg_dump "$DIRECT_URL" -F p -f "$BACKUP_FILE" --clean --if-exists

echo "Backup completed successfully!"
