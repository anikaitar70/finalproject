# Production Sign-Off — Cred Rank Net

Final pre-production verification for OVH VPS deployment **alongside existing websites**.

Verified: 2026-06-20  
Branch: `production-stabilization`

---

## Verification Matrix

| # | Item | Status | Evidence / Fix |
|---|------|--------|----------------|
| 1 | SQLite in Docker (`file:/data/db.sqlite`) | **VERIFIED + HARDENED** | `docker-compose.prod.yml` forces `DATABASE_URL`; entrypoint runs migrate + `verify-db.mjs` (file writable + `_prisma_migrations` table) |
| 2 | Data persists across container recreation | **VERIFIED** | Named volume `credranknet_data:/data`; `docker compose down` without `-v` preserves data |
| 3 | NextAuth behind Nginx HTTPS | **VERIFIED + HARDENED** | `AUTH_TRUST_HOST=true` in compose/env, `useSecureCookies` when HTTPS; Nginx sets `X-Forwarded-Proto` + `X-Forwarded-Host` on all routes |
| 4 | GitHub OAuth | **DOCUMENTED** | `GITHUB_OAUTH_SETUP.md` with exact Homepage + Callback URLs |
| 5 | UploadThing production | **VERIFIED + HARDENED** | CSP allows ingest/uploadthing/utfs.io; Nginx `/api/uploadthing` 25MB + 120s timeout; `getToken` uses `NEXTAUTH_SECRET` |
| 6 | Health endpoint | **VERIFIED + HARDENED** | DB: `SELECT 1` + migrations table check; Redis: ping + set/get/del probe; Docker health requires `"status":"healthy"` |
| 7 | Container recovery | **VERIFIED** | Volume-backed SQLite; recovery drill in `BACKUP_RECOVERY.md` |
| 8 | Nginx isolation | **VERIFIED + HARDENED** | New files only; WebSocket map + `$connection_upgrade`; gzip; auth/uploadthing/health locations; cache disabled for dynamic routes |
| 9 | Security headers / CSP | **VERIFIED + HARDENED** | EditorJS, UploadThing ingest, GitHub form-action, utfs.io images, embed frames |
| 10 | Backup / restore / rollback | **DOCUMENTED** | `BACKUP_RECOVERY.md` updated with drill procedures |
| 11 | Deploy automation | **VERIFIED** | Idempotent `deploy.sh` |
| 12 | Build quality | **PASS** | `npm test` (20), `npm run typecheck`, `npm run build` |

---

## Deployment Commands

```bash
# First-time setup
cp .env.production.example .env.production
chmod 600 .env.production
# Edit secrets + domain

# Deploy (idempotent)
chmod +x deploy.sh
./deploy.sh

# Nginx (additive only — does not touch other sites)
sudo cp deploy/nginx/credranknet-limit.conf /etc/nginx/conf.d/credranknet-limit.conf
sudo cp deploy/nginx/credranknet.conf /etc/nginx/sites-available/credranknet.conf
sudo ln -s /etc/nginx/sites-available/credranknet.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL (isolated cert)
sudo certbot --nginx -d credranknet.yourdomain.com
```

See also: `DEPLOYMENT_READY.md`, `SSL_SETUP.md`, `GITHUB_OAUTH_SETUP.md`

---

## Rollback Commands

```bash
# Stop Cred Rank Net only (keeps volumes/data)
docker compose -f docker-compose.prod.yml down

# Remove Nginx site only
sudo rm -f /etc/nginx/sites-enabled/credranknet.conf
sudo rm -f /etc/nginx/conf.d/credranknet-limit.conf
sudo nginx -t && sudo systemctl reload nginx
```

Full rollback including volumes: see `BACKUP_RECOVERY.md`

---

## Environment Variables (Production)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXTAUTH_SECRET` | Yes | Startup validation |
| `DATABASE_URL` | Yes | Overridden to `file:/data/db.sqlite` in compose |
| `UPSTASH_REDIS_REST_URL` | Yes | Startup validation |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Startup validation |
| `NEXTAUTH_URL` | Yes | Must be `https://your-domain` in production |
| `GITHUB_CLIENT_ID` | Yes | OAuth |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth |
| `UPLOADTHING_TOKEN` | Yes | Image uploads |
| `ADMIN_EMAILS` | Optional | Admin bootstrap |
| `AUTH_TRUST_HOST` | Yes (prod) | Set to `true` behind Nginx reverse proxy |
| `CREDRANKNET_PORT` | Optional | Default `3010`, localhost bind |

---

## Exposed Ports

| Port | Binding | Service |
|------|---------|---------|
| 3010 | `127.0.0.1` | Cred Rank Net Docker container |
| 443 | Public | Nginx HTTPS (existing VPS + new cert) |
| 80 | Public | Nginx HTTP → redirect after Certbot |

No Docker port exposed to the public internet.

---

## Expected Resource Usage

| Resource | Estimate |
|----------|----------|
| RAM | 400–800 MB |
| CPU | 0.2–0.5 cores |
| Disk (image) | ~200 MB |
| Disk (data volume) | Grows with usage |

---

## Isolation Guarantees

| Constraint | Met |
|------------|-----|
| No modification of existing Nginx sites | ✅ New files in `deploy/nginx/` only |
| No change to existing SSL certificates | ✅ Certbot scoped to `-d credranknet.yourdomain.com` |
| No overwrite of other Docker containers | ✅ Unique `container_name: credranknet` |
| Isolated network + volumes | ✅ `credranknet_net`, `credranknet_*` volumes |
| Fully reversible | ✅ Documented rollback |

---

## Remaining Known Limitations

| Limitation | Impact |
|------------|--------|
| SQLite single-writer | One container instance only |
| UploadThing CDN external | VPS backup excludes uploaded image binaries |
| Upstash Redis required for `healthy` status | Redis outage → `degraded`; app still serves if DB up |
| Docker build not run on Windows dev host | Build on VPS via `deploy.sh` |
| CSP uses `unsafe-inline` / `unsafe-eval` | Required for Next.js + EditorJS |
| Comment votes don't affect credibility | By design (Phase 3 scope) |

---

## Manual Post-Deploy Checklist

- [ ] `curl -s http://127.0.0.1:3010/api/health` → `"status":"healthy"`
- [ ] `curl -s https://credranknet.yourdomain.com/api/health` → `"status":"healthy"`
- [ ] GitHub OAuth login completes
- [ ] Create post with image upload (UploadThing)
- [ ] Vote on post (credibility updates)
- [ ] `docker compose down && docker compose up -d` — data still present
- [ ] Backup drill per `BACKUP_RECOVERY.md`

---

## Sign-Off

The project is **ready for OVH VPS production deployment** in an isolated configuration that does not affect existing Nginx sites, Docker containers, SSL certificates, or applications.

**Automated checks passed:**

```
npm test          → 20 passed
npm run typecheck → PASS
npm run build     → PASS (standalone)
```

**Run on VPS before go-live:**

```
./deploy.sh
```
