# Install Cred Rank Net Nginx Site (Isolated)

These files are **additive only**. They do not modify existing Nginx sites or SSL certificates.

## Files

| File | Nginx context | Purpose |
|------|---------------|---------|
| `credranknet-limit.conf` | `http` | Rate limit zones (namespaced) |
| `credranknet.conf` | `server` | Reverse proxy to Docker |

## Installation

```bash
# 1. Copy rate limit zones (http context)
sudo cp deploy/nginx/credranknet-limit.conf /etc/nginx/conf.d/credranknet-limit.conf

# 2. Copy server block
sudo cp deploy/nginx/credranknet.conf /etc/nginx/sites-available/credranknet.conf

# 3. Edit domain and upstream port if needed
sudo nano /etc/nginx/sites-available/credranknet.conf
#   server_name credranknet.yourdomain.com;
#   upstream port 3010 must match CREDRANKNET_PORT in .env.production

# 4. Enable site (symlink only — no other sites touched)
sudo ln -s /etc/nginx/sites-available/credranknet.conf /etc/nginx/sites-enabled/credranknet.conf

# 5. Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## SSL

See `SSL_SETUP.md` for `certbot --nginx -d credranknet.yourdomain.com`.

## Rollback

```bash
sudo rm -f /etc/nginx/sites-enabled/credranknet.conf
sudo rm -f /etc/nginx/conf.d/credranknet-limit.conf
sudo nginx -t && sudo systemctl reload nginx
```

## Features

- WebSocket support (`Upgrade` headers)
- Large uploads (`client_max_body_size 25m`)
- Security headers (also set by Next.js middleware)
- Gzip (uncomment in server block after SSL)
- Real client IP (`X-Forwarded-For`)
- Rate limiting (namespaced zones)
- Health check passthrough at `/api/health`
