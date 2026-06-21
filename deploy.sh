#!/usr/bin/env bash
# Cred Rank Net — idempotent production deploy script
# Safe alongside other Docker/Nginx workloads on the same VPS.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Optional:
#   CREDRANKNET_PORT=3010 ./deploy.sh
#   SKIP_GIT_PULL=1 ./deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
SERVICE="credranknet"
HEALTH_URL="http://127.0.0.1:${CREDRANKNET_PORT:-3010}/api/health"
MAX_ATTEMPTS=30
SLEEP_SECONDS=2

log() {
  printf '[deploy] %s\n' "$1"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$1" >&2
  exit 1
}

if [ ! -f ".env.production" ]; then
  fail ".env.production missing. Copy from .env.production.example and configure."
fi

if [ "${SKIP_GIT_PULL:-0}" != "1" ] && [ -d ".git" ]; then
  log "Pulling latest code..."
  git pull --ff-only
fi

log "Validating environment..."
node scripts/validate-env.mjs

log "Building Docker image..."
docker compose -f "$COMPOSE_FILE" build

log "Starting container (migrations run in entrypoint)..."
docker compose -f "$COMPOSE_FILE" up -d

log "Waiting for healthy status..."
attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if response="$(curl -fsS "$HEALTH_URL" 2>/dev/null)"; then
    if echo "$response" | grep -q '"status":"healthy"'; then
      log "Health check passed."
      echo "$response"
      break
    fi
    log "Attempt $attempt/$MAX_ATTEMPTS: status not healthy yet..."
  else
    log "Attempt $attempt/$MAX_ATTEMPTS: health endpoint not ready..."
  fi

  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    log "Last health response:"
    curl -sS "$HEALTH_URL" || true
    docker logs "$SERVICE" --tail 80 || true
    fail "Health check did not pass within timeout."
  fi

  attempt=$((attempt + 1))
  sleep "$SLEEP_SECONDS"
done

log "Deploy complete."
docker ps --filter "name=$SERVICE"
