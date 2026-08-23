#!/bin/bash
# scripts/restore.sh
# Restores a logical backup to the Neon PostgreSQL database using psql.

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file.sql>"
    exit 1
fi

BACKUP_FILE=$1

# Use DIRECT_URL for psql (bypasses pgBouncer connection pooling)
if [ -z "$DIRECT_URL" ]; then
    if [ -f .env ]; then
        source .env
    fi
fi

if [ -z "$DIRECT_URL" ]; then
    echo "Error: DIRECT_URL is not set in the environment or .env file."
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

echo "WARNING: This will overwrite the current database."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo "Starting database restore from ${BACKUP_FILE}..."
psql "$DIRECT_URL" -f "$BACKUP_FILE"

echo "Restore completed successfully!"
