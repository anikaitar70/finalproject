# Deployment Ready — Cred Rank Net

Final Phase 4 validation report for OVH VPS deployment.

## Validation Results

| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npm test` | **PASS** — 20 tests |
| Typecheck | `npm run typecheck` | **PASS** |
| Production build | `npm run build` | **PASS** — standalone output generated |
| Docker image build | `docker compose -f docker-compose.prod.yml build` | **Pending on VPS** — Docker not available in CI/dev Windows host; Dockerfile validated structurally |
| Health endpoint | `GET /api/health` | **Implemented** — returns `healthy` / `degraded` |
| Startup validation | `node scripts/validate-env.mjs` | **Implemented** — exits 1 if required vars missing |

Validated: 2026-06-20

---

## Deployment Steps (OVH VPS)

### 1. Clone / upload project

```bash
cd /opt
git clone <repo-url> credranknet
cd credranknet
git checkout production-stabilization
```

### 2. Configure environment

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Required values:

- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `https://credranknet.yourdomain.com`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `UPLOADTHING_TOKEN`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_EMAILS`

### 3. Build and start Docker (isolated)

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker ps --filter name=credranknet
curl -s http://127.0.0.1:3010/api/health
```

### 4. Configure Nginx (new site only)

```bash
sudo cp deploy/nginx/credranknet-limit.conf /etc/nginx/conf.d/credranknet-limit.conf
sudo cp deploy/nginx/credranknet.conf /etc/nginx/sites-available/credranknet.conf
# Edit server_name in credranknet.conf
sudo ln -s /etc/nginx/sites-available/credranknet.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Enable SSL

Follow `SSL_SETUP.md`:

```bash
sudo certbot --nginx -d credranknet.yourdomain.com
```

### 6. Verify

```bash
curl -s https://credranknet.yourdomain.com/api/health | jq
docker inspect --format='{{.State.Health.Status}}' credranknet
```

Test manually:

- [ ] GitHub OAuth login
- [ ] Create post with image upload
- [ ] Vote on post (credibility updates)
- [ ] Admin dashboard (if `ADMIN_EMAILS` set)

---

## Rollback Steps

```bash
docker compose -f docker-compose.prod.yml down
sudo rm -f /etc/nginx/sites-enabled/credranknet.conf
sudo rm -f /etc/nginx/conf.d/credranknet-limit.conf
sudo nginx -t && sudo systemctl reload nginx
```

Volumes persist until explicitly removed. See `BACKUP_RECOVERY.md`.

---

## Environment Variables (Production)

| Variable | Example |
|----------|---------|
| `NEXTAUTH_SECRET` | `<random-32b-base64>` |
| `DATABASE_URL` | `file:/data/db.sqlite` |
| `NEXTAUTH_URL` | `https://credranknet.yourdomain.com` |
| `GITHUB_CLIENT_ID` | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | `...` |
| `UPLOADTHING_TOKEN` | `...` |
| `UPSTASH_REDIS_REST_URL` | `https://....upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `...` |
| `ADMIN_EMAILS` | `admin@yourdomain.com` |
| `CREDRANKNET_PORT` | `3010` |

---

## Exposed Ports

| Port | Interface | Service |
|------|-----------|---------|
| 3010 | 127.0.0.1 | Cred Rank Net (Docker) |
| 443 | 0.0.0.0 | Nginx HTTPS (public) |
| 80 | 0.0.0.0 | Nginx HTTP → redirect |

Docker port **not** exposed to public internet.

---

## Expected Resource Usage

| Resource | Estimate |
|----------|----------|
| RAM | 400–800 MB |
| CPU | 0.2–0.5 cores average |
| Disk (image) | ~200 MB |
| Disk (data) | 50 MB+ (grows with usage) |
| Network egress | Moderate (Redis/UploadThing/OAuth API calls) |

---

## Known Limitations

- SQLite — single container writer; no multi-instance scaling without DB migration
- UploadThing — images stored externally; VPS backup does not include CDN files
- Redis — external Upstash required; degraded mode if unavailable
- ESLint — legacy config; does not block deployment
- Turbopack — not used; webpack build required (`npm run build`)
- Comment votes — no credibility impact (by design)
- Health `degraded` — app still serves traffic if Redis down but DB up

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT_AUDIT.md` | Readiness audit |
| `DEPLOYMENT_READY.md` | This file |
| `SSL_SETUP.md` | Isolated Certbot setup |
| `BACKUP_RECOVERY.md` | Backup/restore/rollback |
| `OPERATIONS.md` | Logs, monitoring, ops |
| `.env.production.example` | Env template |
| `docker-compose.prod.yml` | Production stack |
| `deploy/nginx/credranknet.conf` | Nginx site block |

---

## Success Criteria Checklist

- [x] Ready for OVH VPS deployment
- [x] Safe alongside existing websites
- [x] Dockerized (multi-stage, non-root)
- [x] SSL-ready (Certbot instructions)
- [x] Persistent storage (named volumes)
- [x] Health monitored (`/api/health` + Docker healthcheck)
- [x] Recoverable after failure (`BACKUP_RECOVERY.md`)
- [x] No changes required to existing sites
