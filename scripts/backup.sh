#!/usr/bin/env bash
# ============================================================
# Laundry OMS — Daily PostgreSQL Backup Script
# Scheduled via cron:  0 3 * * * /path/to/scripts/backup.sh
# Produces encrypted compressed dumps with 30-day retention.
# ============================================================
set -euo pipefail

# ─── Configuration (override via environment) ─────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-laundry_oms}"
DB_USER="${DB_USER:-laundry}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
GPG_RECIPIENT="${GPG_RECIPIENT:-}"   # optional GPG encryption key

# ─── Prerequisites ────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# ─── Dump ─────────────────────────────────────────────────
export PGPASSWORD="$DB_PASSWORD"
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --dbname="$DB_NAME" \
    --username="$DB_USER" \
    --no-owner \
    --no-acl \
    --format=c \
    --compress=9 \
    --file="${FILENAME}.dump"

echo "✓ Backup created: ${FILENAME}.dump  ($(du -h "${FILENAME}.dump" | cut -f1))"

# ─── Optional GPG encryption ──────────────────────────────
if [ -n "$GPG_RECIPIENT" ]; then
    gpg --batch --yes --recipient "$GPG_RECIPIENT" --encrypt "${FILENAME}.dump"
    rm "${FILENAME}.dump"
    echo "✓ Backup encrypted for $GPG_RECIPIENT"
fi

# ─── Retention: purge backups older than N days ──────────
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -type f -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "${DB_NAME}_*.gpg"  -type f -mtime +"$RETENTION_DAYS" -delete
echo "✓ Purged backups older than ${RETENTION_DAYS} days"

# ─── Healthcheck / monitoring ping (optional) ────────────
# curl -fsS -m 10 --retry 3 -o /dev/null \
#   "https://hc-ping.com/YOUR_UUID_HERE"

echo "✓ Backup complete: $(date)"
