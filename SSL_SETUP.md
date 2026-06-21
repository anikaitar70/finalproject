# SSL Setup — Cred Rank Net (Isolated)

This guide adds HTTPS for **Cred Rank Net only**. It does not modify certificates or server blocks for other sites on the VPS.

## Prerequisites

- DNS `A` record: `credranknet.yourdomain.com` → VPS IP
- Nginx site enabled per `deploy/nginx/credranknet.conf`
- Docker container running on `127.0.0.1:3010`
- Port 80 reachable for HTTP-01 challenge

## Step 1 — Install Certbot (if not present)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Step 2 — Obtain certificate (dedicated server block only)

Certbot will create/modify **only** the `credranknet.conf` server block when invoked with `-d`:

```bash
sudo certbot --nginx -d credranknet.yourdomain.com
```

When prompted:

- Choose **redirect HTTP to HTTPS** (recommended)
- Do **not** select other existing domains

Certbot creates:

- `/etc/letsencrypt/live/credranknet.yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/credranknet.yourdomain.com/privkey.pem`

## Step 3 — Verify Nginx config

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4 — Update application env

In `.env.production`:

```env
NEXTAUTH_URL=https://credranknet.yourdomain.com
```

Restart container:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Step 5 — Update GitHub OAuth callback

GitHub OAuth App callback URL:

```
https://credranknet.yourdomain.com/api/auth/callback/github
```

## Renewal

Certbot installs a systemd timer. Verify:

```bash
sudo certbot renew --dry-run
```

## Rollback SSL (reversible)

```bash
sudo rm /etc/nginx/sites-enabled/credranknet.conf
sudo nginx -t && sudo systemctl reload nginx
# Optional: sudo certbot delete --cert-name credranknet.yourdomain.com
```

Other site certificates remain untouched.

## HSTS

The application sets `Strict-Transport-Security` in production via middleware when `NODE_ENV=production`.

After SSL is active, verify:

```bash
curl -I https://credranknet.yourdomain.com/api/health
```
