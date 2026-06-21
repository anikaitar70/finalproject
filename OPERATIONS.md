# Operations Guide — Cred Rank Net

## Log Format

All structured logs are JSON lines:

```json
{"ts":"2026-06-20T12:00:00.000Z","level":"info","event":"health.check","service":"credranknet","status":"healthy"}
```

## Key Events

| Event | Level | Meaning |
|-------|-------|---------|
| `application.startup` | info | Node process started |
| `startup.validation.passed` | info | Required env vars present |
| `startup.validation.failed` | fatal | Missing env — container exits |
| `container.entrypoint.start` | info | Docker entrypoint began |
| `database.migrate.start` | info | Prisma migrate running |
| `health.check` | info | Health endpoint result |
| `health.database.failed` | warn | SQLite unreachable |
| `health.redis.failed` | warn | Upstash unreachable |
| `http.request` | info | API request (path + request ID) |
| `process.uncaughtException` | fatal | Unhandled exception |
| `process.unhandledRejection` | fatal | Unhandled promise rejection |

## View Logs

```bash
# Container stdout (JSON)
docker logs credranknet --tail 100 -f

# Persisted log volume
docker run --rm -v credranknet_logs:/logs alpine ls -la /logs
```

## Health Monitoring

```bash
# From VPS
curl -s http://127.0.0.1:3010/api/health | jq

# Through Nginx (after SSL)
curl -s https://credranknet.yourdomain.com/api/health | jq
```

| Response | Action |
|----------|--------|
| `"status":"healthy"` | Normal |
| `"status":"degraded"` | Check `checks.redis` / `checks.database` |
| HTTP 503 | Database failure — inspect logs + volume |

Docker health status:

```bash
docker inspect --format='{{.State.Health.Status}}' credranknet
```

## Request Tracing

Every response includes `x-request-id`. Correlate Nginx access logs:

```
grep '<request-id>' /var/log/nginx/credranknet.access.log
docker logs credranknet 2>&1 | grep '<request-id>'
```

## Common Operations

```bash
# Restart app only
docker compose -f docker-compose.prod.yml restart credranknet

# Rebuild after code update
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations manually
docker exec credranknet npx prisma migrate deploy

# Open shell (debug)
docker exec -it credranknet sh
```

## Resource Expectations

| Resource | Typical usage |
|----------|---------------|
| RAM | 256–512 MB idle, ~1 GB under load |
| CPU | 0.1–0.5 cores idle |
| Disk (SQLite) | Grows with posts/users |
| Network | Outbound to Upstash, UploadThing, GitHub OAuth |

## Alerting Suggestions

- Monitor `/api/health` every 60s (healthy required)
- Alert on Docker `unhealthy` state
- Alert on repeated `health.database.failed`
- Disk usage on `credranknet_data` volume > 80%

## Security Operations

- Rotate `NEXTAUTH_SECRET` quarterly (forces re-login)
- Rotate Upstash and UploadThing tokens on compromise
- Keep `CREDRANKNET_PORT` bound to `127.0.0.1` only
- Never expose Docker port publicly — Nginx terminates TLS
