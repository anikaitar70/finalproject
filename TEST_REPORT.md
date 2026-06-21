# Test Report

Branch: `production-stabilization`  
Date: 2026-06-20

## Automated Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | **PASS** | `tsc --noEmit` exits 0 |
| `npm run build` | **PASS** | Uses `next build --webpack` (see below) |
| `npm run lint` | **FAIL** | Pre-existing ESLint 9 + `.eslintrc.cjs` circular config error |
| `npm run format:check` | **FAIL** | 132 files need Prettier formatting (pre-existing; not part of this pass) |
| `npx prisma migrate deploy` | **PASS** | All 4 migrations applied on fresh SQLite DB |

### Build Notes

- `next build` (Turbopack default in Next.js 16) fails on `@uploadthing/*` package resolution.
- `package.json` updated to `"build": "next build --webpack"` — **production build succeeds**.
- `typescript.ignoreBuildErrors` set to `false`; build-time TypeScript check passes.

### Lint Notes

- `next lint` is broken in Next.js 16 CLI (`Invalid project directory: .../lint`).
- Direct `eslint -c .eslintrc.cjs src` fails with ESLint 9 flat-config migration issue.
- **Recommendation:** migrate to `eslint.config.js` in a follow-up pass.

---

## Manual Verification Checklist

### Runtime Blockers

- [ ] **Post creation** — Create a post in a subscribed community; confirm no Prisma error about `citationCount` / `lastConsensusUpdate`
- [ ] **Profile page** — Visit `/u/[username]`; confirm expertise tags render without `.map is not a function`
- [ ] **Post detail** — Visit `/r/[slug]/post/[postId]` with empty Redis cache; page loads from Prisma
- [ ] **Post detail (Redis down)** — Temporarily set invalid `UPSTASH_REDIS_*` vars; confirm post page still loads

### Security

- [ ] **`/api/link`** — Unauthenticated request returns 401
- [ ] **`/api/link`** — `?url=http://127.0.0.1` returns 400
- [ ] **`/api/link`** — `?url=http://169.254.169.254` returns 400
- [ ] **`/api/posts`** — Response author objects do not include `email` or `emailVerified`
- [ ] **`/api/dev/credibility-events`** — Non-admin returns 403
- [ ] **`/dev/credibility`** — Non-admin redirected to `/`
- [ ] **`/admin`** — Non-admin redirected to `/`
- [ ] **Admin bootstrap** — Set `ADMIN_EMAILS`, sign in, confirm admin nav link appears

### Rate Limiting

- [ ] **Vote spam** — Rapid votes return 429 after first vote within 5s window
- [ ] **Comment spam** — Rapid comments return 429
- [ ] **Post spam** — Rapid posts return 429

### Validation

- [ ] **Pagination** — `/api/posts?limit=999999` returns 400
- [ ] **Comments** — Empty comment text returns 400
- [ ] **Subreddit name** — Creating community with spaces/special chars returns 400
- [ ] **Username** — Re-submitting current username succeeds (no 409)

### Admin

- [ ] **Role migration** — Existing users have `role = USER` by default
- [ ] **Admin promotion** — Email in `ADMIN_EMAILS` gets `ADMIN` role on sign-in

---

## Schema Verification

Current `Post` model fields used by application code:

- `id`, `title`, `content`, `createdAt`, `updatedAt`, `credibilityScore`, `authorId`, `subredditId`, `researchDomain`

Removed fields **not referenced** in application code:

- `citationCount`, `lastConsensusUpdate`

Current `User.expertise`: `String` (comma-separated in DB, `string[]` in API responses).

---

## Commands to Reproduce

```bash
git checkout production-stabilization
cp .env.example .env
# Fill in required env vars
npm install
npx prisma migrate deploy
npm run typecheck
npm run build
```
