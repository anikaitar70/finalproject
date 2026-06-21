# Backup & Recovery — Cred Rank Net

Isolated backup procedures. Does not affect other sites or containers on the VPS.

## What to Back Up

| Asset | Location | Method |
|-------|----------|--------|
| SQLite database | Docker volume `credranknet_data` → `/data/db.sqlite` | Volume tarball |
| SQLite WAL/SHM | Same volume (`db.sqlite-wal`, `db.sqlite-shm`) | Included in volume tarball |
| Upload cache (local) | Docker volume `credranknet_uploads` | Volume tarball |
| Application logs | Docker volume `credranknet_logs` | Volume tarball |
| Environment secrets | Host `.env.production` | Encrypted off-site copy |

**Note:** User-uploaded images are stored on **UploadThing** (utfs.io), not on the VPS. Back up `UPLOADTHING_TOKEN` and UploadThing dashboard access separately.

---

## Quick Backup (recommended daily)

```bash
BACKUP_DIR=/var/backups/credranknet/$(date +%Y%m%d-%H%M%S)
sudo mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v credranknet_data:/data:ro \
  -v credranknet_uploads:/uploads:ro \
  -v credranknet_logs:/logs:ro \
  -v "$BACKUP_DIR":/backup \
  alpine sh -c 'tar czf /backup/credranknet-volumes.tar.gz /data /uploads /logs'

sudo cp /opt/credranknet/.env.production "$BACKUP_DIR/.env.production"
sudo cp /etc/nginx/sites-available/credranknet.conf "$BACKUP_DIR/credranknet.conf" 2>/dev/null || true

# Verify backup contains database
tar tzf "$BACKUP_DIR/credranknet-volumes.tar.gz" | grep db.sqlite
ls -lh "$BACKUP_DIR"
```

---

## Restore Drill (verify before go-live)

### 1. Record baseline data

```bash
curl -s http://127.0.0.1:3010/api/health | jq
docker exec credranknet ls -la /data/
```

### 2. Create backup

Run **Quick Backup** above → note `$BACKUP_DIR`

### 3. Simulate container loss (data preserved)

```bash
cd /opt/credranknet
docker compose -f docker-compose.prod.yml down
# Do NOT use -v — volumes must persist
docker compose -f docker-compose.prod.yml up -d
sleep 15
curl -s http://127.0.0.1:3010/api/health | jq
```

**Expected:** `"status":"healthy"`, users/posts/comments/credibility unchanged.

### 4. Full volume restore drill (staging only)

```bash
docker compose -f docker-compose.prod.yml stop credranknet

docker run --rm \
  -v credranknet_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine sh -c 'rm -rf /data/* && cd / && tar xzf /backup/credranknet-volumes.tar.gz'

docker compose -f docker-compose.prod.yml up -d
curl -s http://127.0.0.1:3010/api/health | jq
```

**Expected:** Restored data intact, migrations idempotent on startup.

---

## Restore SQLite Database

```bash
docker compose -f docker-compose.prod.yml stop credranknet

docker run --rm \
  -v credranknet_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine sh -c 'cd / && tar xzf /backup/credranknet-volumes.tar.gz'

docker compose -f docker-compose.prod.yml up -d
curl -s http://127.0.0.1:3010/api/health | jq
```

---

## Rollback Deployment (reversible)

```bash
cd /opt/credranknet

# Stop container only — volumes preserved
docker compose -f docker-compose.prod.yml down

# Remove Nginx site only — other sites untouched
sudo rm -f /etc/nginx/sites-enabled/credranknet.conf
sudo rm -f /etc/nginx/conf.d/credranknet-limit.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## Full Teardown (destructive — optional)

```bash
docker compose -f docker-compose.prod.yml down
docker volume rm credranknet_data credranknet_uploads credranknet_logs
docker network rm credranknet_net
docker rmi credranknet:latest
```

Other websites and containers remain running.

---

## Disaster Recovery Checklist

1. Restore `.env.production` from backup
2. Restore Docker volumes from tarball
3. `./deploy.sh` or `docker compose -f docker-compose.prod.yml up -d --build`
4. Re-enable Nginx site + SSL (`SSL_SETUP.md`)
5. Verify `/api/health` returns `"status":"healthy"`
6. Test GitHub OAuth login (`GITHUB_OAUTH_SETUP.md`)

---

## Container Recovery Test Matrix

| Action | Users/Posts/Comments | Credibility scores |
|--------|----------------------|--------------------|
| `docker compose restart` | Preserved | Preserved |
| `docker compose down` + `up -d` (no `-v`) | Preserved | Preserved |
| `docker compose up -d --build` | Preserved | Preserved |
| `docker volume rm credranknet_data` | **LOST** | **LOST** |

---

## Retention Policy (suggested)

| Backup type | Retention |
|-------------|-----------|
| Daily volume tarball | 14 days |
| Weekly off-site copy | 90 days |
| `.env.production` | Every change (encrypted) |
