#!/bin/sh
set -eu

log() {
  printf '%s\n' "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"event\":\"$1\",\"service\":\"credranknet\"}"
}

log_fatal() {
  printf '%s\n' "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"fatal\",\"event\":\"$1\",\"service\":\"credranknet\"}"
  exit 1
}

log "container.entrypoint.start"

node /app/scripts/validate-env.mjs

mkdir -p /data /data/uploads /app/logs
chown -R nextjs:nodejs /data /app/logs 2>/dev/null || true

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:/data/db.sqlite"
fi

log "database.migrate.start"
su-exec nextjs:nodejs npx prisma migrate deploy --schema /app/prisma/schema.prisma \
  || log_fatal "database.migrate.failed"
log "database.migrate.complete"

log "database.verify.start"
su-exec nextjs:nodejs node /app/scripts/verify-db.mjs \
  || log_fatal "database.verify.failed"
log "database.verify.complete"

log "application.start"
exec su-exec nextjs:nodejs node /app/server.js
