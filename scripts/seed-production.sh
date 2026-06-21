#!/usr/bin/env bash
# Seed demo content into the production Docker volume (run on VPS as root).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[seed] Seeding Cred Rank Net demo data into production database..."

docker run --rm \
  -v credranknet_data:/data \
  -v "$ROOT_DIR:/src" \
  -w /src \
  -e DATABASE_URL=file:/data/db.sqlite \
  node:20-alpine sh -c "
    apk add --no-cache openssl libc6-compat &&
    npm ci --ignore-scripts &&
    npx tsx prisma/seed-full.ts
  "

echo "[seed] Done. Restart app if needed:"
echo "  docker compose -f docker-compose.prod.yml up -d"
