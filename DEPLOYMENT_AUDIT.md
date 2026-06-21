# Deployment Readiness Audit — Cred Rank Net

Phase 4A audit for OVH Cloud VPS deployment alongside existing production sites.

## Application Overview

| Item | Value |
|------|-------|
| Framework | Next.js 16 (App Router, webpack build) |
| Runtime | Node.js 20 LTS |
| Language | TypeScript |
| Package manager | npm (package-lock.json) |
| Output mode | `standalone` (Docker-optimized) |

---

## Runtime Requirements

| Requirement | Version / Notes |
|-------------|-----------------|
| Node.js | 20.x LTS (Alpine in Docker) |
| OpenSSL | Required by Prisma |
| Memory | Minimum 512 MB, recommended 1 GB |
| CPU | 1 vCPU minimum |
| Disk | 2 GB image + data volume growth |

External services (not containerized):

- **GitHub OAuth** — authentication
- **Upstash Redis** — rate limiting, cache, debug events
- **UploadThing** — image uploads (CDN-hosted files)

---

## Environment Variables

### Required at startup (fail-fast)

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | JWT/session signing |
| `DATABASE_URL` | SQLite path (`file:/data/db.sqlite` in Docker) |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |

### Required for full functionality

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_URL` | Public URL (OAuth callbacks) |
| `GITHUB_CLIENT_ID` | OAuth provider |
| `GITHUB_CLIENT_SECRET` | OAuth provider |
| `UPLOADTHING_TOKEN` | Image uploads |

### Optional

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAILS` | Comma-separated admin bootstrap emails |
| `CREDRANKNET_PORT` | Host port binding (default `3010`) |

Validated by:

- `scripts/validate-env.mjs` (container entrypoint)
- `src/env.js` (T3 env schema at runtime)

Template: `.env.production.example`

---

## Ports

| Context | Port | Exposure |
|---------|------|----------|
| Container internal | 3000 | Docker network only |
| Host binding | 3010 (default) | `127.0.0.1` only |
| Public HTTPS | 443 | Nginx (existing VPS) |
| Public HTTP | 80 | Nginx → Certbot redirect |

**No host networking.** No public Docker port exposure.

---

## Storage Requirements

| Data | Storage | Persistence |
|------|---------|-------------|
| SQLite DB | `/data/db.sqlite` | Volume `credranknet_data` |
| Local uploads cache | `/data/uploads` | Volume `credranknet_uploads` |
| App logs | `/app/logs` | Volume `credranknet_logs` |
| User images | UploadThing CDN | External (utfs.io) |

Container recreation does **not** destroy named volumes.

---

## Upload Requirements

- **Provider:** UploadThing v7 (`UPLOADTHING_TOKEN`)
- **Max size:** 1 MB per image (configured in `uploadthing/core.ts`)
- **Storage:** Remote CDN — not on VPS disk
- **Nginx:** `client_max_body_size 25m` for EditorJS payloads

---

## Redis Requirements

- **Provider:** Upstash Redis REST API
- **Used for:** Rate limiting, post cache, credibility debug events
- **Failure mode:** Rate limiter fails open; cache falls back to Prisma; health reports `degraded`

Not bundled in Docker Compose — external managed service by design (isolated from other VPS Redis instances).

---

## Prisma Requirements

| Item | Detail |
|------|--------|
| Provider | SQLite |
| Migrations | `prisma/migrations/` (4 migrations) |
| Deploy command | `prisma migrate deploy` (entrypoint) |
| Generate | At Docker build time |

Production `DATABASE_URL`:

```
file:/data/db.sqlite
```

---

## SQLite Persistence Requirements

- Must use **absolute path** in Docker: `file:/data/db.sqlite`
- Volume mount: `credranknet_data:/data`
- WAL mode: SQLite default; backup while container stopped or use `.backup` command
- Single-writer: one container instance only (no horizontal scaling without migration)

---

## Production Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| SQLite single-node limit | Medium | Documented; acceptable for current scale |
| External Redis dependency | Medium | Health `degraded` mode; fail-open rate limits |
| UploadThing outage | Medium | Posts work without images |
| GitHub OAuth misconfiguration | High | Verify callback URL after SSL |
| Missing env at startup | High | `validate-env.mjs` fail-fast |
| CSP breaks EditorJS embeds | Low | Tested allowlist for YouTube/Vimeo |
| Docker port exposed publicly | High | Bind `127.0.0.1:3010` only |
| Conflicting Nginx configs | High | Dedicated site file only; no edits to existing sites |
| Secret leakage in logs | Medium | Structured logs exclude secrets |
| No automated backups | High | `BACKUP_RECOVERY.md` procedures |

---

## Deployment Artifacts (Phase 4)

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage production image |
| `.dockerignore` | Build context filtering |
| `docker-compose.prod.yml` | Isolated stack |
| `docker/entrypoint.sh` | Migrate + start |
| `scripts/validate-env.mjs` | Startup validation |
| `deploy/nginx/credranknet.conf` | Reverse proxy (new site only) |
| `deploy/nginx/credranknet-limit.conf` | Rate limit zone (new file only) |
| `.env.production.example` | Production env template |
| `src/app/api/health/route.ts` | Health monitoring |

---

## Isolation Guarantees

| Constraint | Status |
|------------|--------|
| No modification of existing Nginx sites | ✅ New files in `deploy/nginx/` only |
| No change to existing SSL certs | ✅ Certbot `-d credranknet.yourdomain.com` only |
| No overwrite of other containers | ✅ Unique `container_name: credranknet` |
| Isolated Docker network | ✅ `credranknet_net` |
| Named volumes (no host path conflicts) | ✅ `credranknet_*` prefix |
| Fully reversible | ✅ `docker compose down` + remove nginx symlinks |
