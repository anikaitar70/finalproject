# GitHub OAuth Setup — Cred Rank Net

Configure a **GitHub OAuth App** for production HTTPS deployment behind Nginx.

Replace `credranknet.yourdomain.com` with your actual domain before creating the app.

---

## GitHub OAuth App Settings

Create at: **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**

| Field | Value |
|-------|-------|
| **Application name** | Cred Rank Net (Production) |
| **Homepage URL** | `https://credranknet.yourdomain.com` |
| **Authorization callback URL** | `https://credranknet.yourdomain.com/api/auth/callback/github` |

### Exact URLs (copy/paste)

```
Homepage URL:
https://credranknet.yourdomain.com

Authorization callback URL:
https://credranknet.yourdomain.com/api/auth/callback/github
```

> Use **exactly** `https` and **no trailing slash** on the callback URL.

---

## Environment Variables

After creating the OAuth App, set in `.env.production`:

```env
NEXTAUTH_URL=https://credranknet.yourdomain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
GITHUB_CLIENT_ID=<from GitHub OAuth App>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App>
```

Restart the container:

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Nginx Requirements (already in `deploy/nginx/credranknet.conf`)

These headers must reach the app for secure cookies and correct callback URLs:

| Header | Purpose |
|--------|---------|
| `X-Forwarded-Proto: https` | Secure session cookies |
| `X-Forwarded-Host: credranknet.yourdomain.com` | Correct OAuth redirect base |
| `Host: credranknet.yourdomain.com` | NextAuth host validation |

Dedicated location: `/api/auth/` (no rate limiting, cache disabled)

---

## Application Settings (already configured)

In `src/server/auth.ts`:

- `useSecureCookies: true` when `NEXTAUTH_URL` starts with `https://`

In `.env.production` / `docker-compose.prod.yml`:

- `AUTH_TRUST_HOST=true` — trust Nginx forwarded headers (NextAuth v4 env var)

---

## Verification Checklist

After SSL is active (`SSL_SETUP.md`):

```bash
# 1. Health
curl -s https://credranknet.yourdomain.com/api/health | jq

# 2. OAuth sign-in redirect (should 302 to github.com)
curl -I "https://credranknet.yourdomain.com/api/auth/signin/github"

# 3. Manual browser test
# - Visit https://credranknet.yourdomain.com/login
# - Click Sign in with GitHub
# - Authorize → redirect back to app logged in
```

---

## Common Failures

| Symptom | Fix |
|---------|-----|
| Redirect URI mismatch | Callback URL must exactly match GitHub OAuth App setting |
| Cookie not set | Verify `NEXTAUTH_URL` uses `https://`; check `X-Forwarded-Proto` in Nginx |
| Redirect to `http://` | Certbot SSL active; Nginx sends `X-Forwarded-Proto https` |
| 401 on upload after login | Ensure `NEXTAUTH_SECRET` is set and consistent across restarts |

---

## Local Development (different app recommended)

Use a **separate** GitHub OAuth App for local dev:

| Field | Value |
|-------|-------|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Do not reuse production OAuth credentials locally.
