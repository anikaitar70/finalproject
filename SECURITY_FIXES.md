# Security Fixes

Production stabilization pass for Cred Rank Net (Phase 1 + Phase 2).

## Vulnerabilities Fixed

### Critical

| Issue | Fix |
|-------|-----|
| **SSRF in `/api/link`** | Requires authentication; only `http`/`https`; blocks localhost, private IPs, link-local, and metadata hostnames via DNS resolution checks; 5s timeout; 512KB response cap; no redirect following |
| **Email PII in `/api/posts`** | Removed `email` and `emailVerified` from public author selects; shared `publicUserSelect` helper |
| **Unauthenticated dev telemetry leak** | `/api/dev/credibility-events` requires admin session; `/dev/*` routes protected in middleware |

### High

| Issue | Fix |
|-------|-----|
| **Hardcoded admin email** | Replaced with `User.role` + `ADMIN_EMAILS` env bootstrap; centralized `src/server/admin.ts` |
| **Raceable rate limiting** | Replaced GET-then-SET with atomic Redis `SET NX EX` |
| **Missing rate limits** | Applied to voting, posting, commenting, subreddit creation, username changes, comment votes |
| **Unbounded pagination** | `limit` max 50, `page` max 1000 via Zod |
| **Weak post/comment validation** | EditorJS structure + 100KB cap; comments 1–10,000 chars; subreddit names alphanumeric |
| **Username self-conflict (409)** | Excludes current user ID from uniqueness check |
| **Comment integrity** | Validates post exists; `replyToId` must belong to same post |
| **Subscription FK errors** | Subscribe/unsubscribe verify subreddit exists before mutation |

### Medium

| Issue | Fix |
|-------|-----|
| **Redis cache false-hit** | Empty `{}` from `hgetall` no longer skips Prisma; sentinel check on `id` field |
| **Redis outage crashes** | Cache reads wrapped in try/catch; rate limiter fails open |
| **Verbose Zod errors** | API returns generic `"Invalid request"` for validation failures |
| **Optional `NEXTAUTH_SECRET` in dev** | Now required in all environments |
| **Search enumeration** | Query length capped at 100 characters |

---

## Remaining Risks

These were **not** in Phase 1/2 scope and remain for a follow-up pass:

| Risk | Severity | Notes |
|------|----------|-------|
| **Vote flip credibility math** | Medium | Changing UP→DOWN does not reverse prior score delta; consensus uses stale vote set |
| **Self-voting** | Medium | Authors can still vote on own posts |
| **Random vote weights** | Low | `computeVoteWeight()` still uses `Math.random()` |
| **Stored XSS via EditorJS embeds** | Medium | No server-side HTML sanitization or CSP headers |
| **CSRF on cookie-authenticated mutations** | Medium | No CSRF tokens on API routes |
| **Credibility rank never updated** | Low | Rank displayed but not recalculated after votes |
| **`credibilityRank` leaderboard exposure** | Low | `/api/credibility` exposes scores to any authenticated user (may be intentional) |
| **ESLint 9 + legacy config** | DevEx | `npm run lint` fails due to ESLint 9 / `.eslintrc.cjs` incompatibility (pre-existing) |
| **Turbopack build** | DevEx | Default `next build` fails on UploadThing packages; use `npm run build` (`--webpack`) |
| **Middleware deprecation** | Info | Next.js 16 warns middleware convention is deprecated |

---

## Required Environment Variables

```env
NEXTAUTH_SECRET=...
ADMIN_EMAILS=admin@yourdomain.com
UPLOADTHING_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

See `.env.example` for the full list.

---

## Deployment Checklist

1. Run `npx prisma migrate deploy`
2. Set `ADMIN_EMAILS` for initial admin bootstrap
3. Verify Redis credentials (app degrades gracefully if unavailable)
4. Build with `npm run build` (webpack mode)
5. Confirm `/api/link` returns 401 when unauthenticated
6. Confirm `/api/dev/credibility-events` returns 403 for non-admin users
