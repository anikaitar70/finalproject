# Production Stabilization Changelog

Branch: `production-stabilization`

## Migration Required

Run after pulling:

```bash
npx prisma migrate deploy
npx prisma generate
```

New migration: `20251104000000_add_user_role` adds `User.role` (`USER` | `ADMIN`).

Set `ADMIN_EMAILS` in `.env` (comma-separated) to bootstrap admin users on sign-in.

---

## Modified Files

### Database & Schema

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | Added `UserRole` enum and `User.role` field |
| `prisma/migrations/20251104000000_add_user_role/migration.sql` | Migration for admin role column |
| `prisma/seed-credibility.ts` | Removed deleted post fields; store expertise as comma-separated string |
| `prisma/schema.prisma.bak` | **Deleted** — stale backup with removed fields |

### Configuration

| File | Reason |
|------|--------|
| `.env.example` | Synced with `env.js` (`UPLOADTHING_TOKEN`, `NEXTAUTH_SECRET`, `ADMIN_EMAILS`) |
| `next.config.js` | Set `typescript.ignoreBuildErrors = false` |
| `package.json` | Build uses `--webpack` (Turbopack/uploadthing incompatibility); lint script updated |
| `tsconfig.json` | Excluded seed/scripts from app typecheck; fixed scope |

### New Shared Utilities

| File | Reason |
|------|--------|
| `src/lib/expertise.ts` | Parse/serialize expertise (DB string → API/UI array) |
| `src/lib/ssrf-guard.ts` | SSRF protection for link preview fetches |
| `src/lib/redis-cache.ts` | Safe Redis post cache reads with DB fallback |
| `src/lib/api-response.ts` | Generic validation error responses |
| `src/lib/public-user-select.ts` | Shared public user field selection |
| `src/lib/validators/pagination.ts` | Bounded pagination schema |
| `src/server/admin.ts` | Centralized admin authorization helper |

### Updated Core Libraries

| File | Reason |
|------|--------|
| `src/lib/rate-limiter.ts` | Atomic `SET NX EX` rate limiting; fail-open on Redis errors |
| `src/lib/validators/post.ts` | EditorJS structure validation and size cap |
| `src/lib/validators/comment.ts` | Min/max length on comment text |
| `src/lib/validators/subreddit.ts` | Alphanumeric + underscore name rules |
| `src/types/credibility.ts` | Removed deleted fields; unified `CachedPost` type |
| `src/types/redis.d.ts` | **Deleted** — duplicate type removed |

### Auth & Middleware

| File | Reason |
|------|--------|
| `src/server/auth.ts` | JWT includes `role`; admin bootstrap via `ADMIN_EMAILS`; lookup by user ID |
| `src/middleware.ts` | Role-based admin/dev protection; explicit `NextResponse.next()` |

### API Routes

| File | Reason |
|------|--------|
| `src/app/api/link/route.ts` | SSRF hardening, auth required, timeout/size limits |
| `src/app/api/posts/route.ts` | Removed email from responses; bounded pagination |
| `src/app/api/profile/route.ts` | Returns parsed `expertise` array |
| `src/app/api/credibility/route.ts` | Returns parsed `expertise` array |
| `src/app/api/dev/credibility-events/route.ts` | Admin-only access |
| `src/app/api/subreddit/post/create/route.ts` | Removed deleted fields; rate limit; validation |
| `src/app/api/subreddit/post/comment/route.ts` | Post/reply validation; rate limit |
| `src/app/api/subreddit/post/comment/vote/route.ts` | Rate limit; generic errors |
| `src/app/api/subreddit/post/vote/route.ts` | Atomic rate limit; safe Redis cache writes |
| `src/app/api/subreddit/route.ts` | Rate limit; validation |
| `src/app/api/subreddit/subscribe/route.ts` | Subreddit existence check |
| `src/app/api/subreddit/unsubscribe/route.ts` | Subreddit existence check |
| `src/app/api/username/route.ts` | Own-username fix; rate limit |
| `src/app/api/search/route.ts` | Query length bounds; error handling |

### Pages & Components

| File | Reason |
|------|--------|
| `src/app/r/[slug]/post/[postId]/page.tsx` | Fixed Redis cache false-hit; try/catch fallback; Next.js 16 async params |
| `src/app/r/[slug]/layout.tsx` | Next.js 16 async params |
| `src/app/r/[slug]/page.tsx` | Next.js 16 async params |
| `src/app/r/[slug]/submit/page.tsx` | Next.js 16 async params |
| `src/app/u/[username]/page.tsx` | Removed invalid import; `useParams`; removed `citationCount` |
| `src/app/admin/page.tsx` | Uses centralized `getAdminSession()` |
| `src/components/user-account-nav.tsx` | Admin link gated by `role`, not hardcoded email |
| `src/components/credibility/post-credibility.tsx` | Removed citation UI |
| `src/components/credibility/user-credibility.tsx` | Safe empty expertise display |
| `src/components/post/post-form.tsx` | Client/server validation split for EditorJS content |
| `src/components/post-vote/post-vote-server.tsx` | Relaxed `getData` typing |
| `src/components/ui/separator.tsx` | **Added** — shadcn-style separator component |
| `src/components/username-form.tsx` | TanStack Query v5 `isPending` |
| `src/components/join-leave-toggle.tsx` | TanStack Query v5 `isPending` |
| `src/components/comments/*.tsx` | TanStack Query v5 `isPending` |
| `src/app/r/create/page.tsx` | TanStack Query v5 `isPending` |
| `src/hooks/use-on-click-outside.ts` | Accept nullable refs |

### Scripts

| File | Reason |
|------|--------|
| `scripts/init-credibility.ts` | Expertise stored as comma-separated string |
| `scripts/show-top-users.ts` | Format expertise string for display |

### Deleted

| File | Reason |
|------|--------|
| `src/lib/vote-server.ts` | Replaced by atomic `src/lib/rate-limiter.ts` |

---

## Expertise Standardization

- **Database:** `User.expertise` remains `String` (comma-separated domains, e.g. `"Physics,Mathematics"`)
- **API/UI:** `string[]` via `parseExpertise()` / `serializeExpertise()` in `src/lib/expertise.ts`

---

## Admin Standardization

- **Database:** `User.role` enum (`USER` | `ADMIN`)
- **Bootstrap:** set `ADMIN_EMAILS=you@example.com` in `.env`
- **Checks:** `getAdminSession()` / `assertAdminApi()` in `src/server/admin.ts`
