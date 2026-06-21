# CHANGELOG — Phase 3: Credibility Integrity

## Overview

Makes the credibility system mathematically correct, deterministic, and resistant to self-vote manipulation. No application redesign.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/credibility-ranks.ts` | O(N log N) rank recalculation via SQL window function |
| `src/lib/self-vote.ts` | Shared self-vote detection helper |
| `src/lib/credibility.test.ts` | 19 unit tests for credibility math |
| `src/lib/credibility-ranks.test.ts` | Rank helper test |
| `vitest.config.ts` | Test runner + 80% coverage thresholds |
| `CREDIBILITY_ANALYSIS.md` | Pre/post algorithm documentation |
| `CREDIBILITY_INTEGRITY_REPORT.md` | Mathematical verification report |
| `CHANGELOG_PHASE3.md` | This file |

---

## Modified Files

| File | Change |
|------|--------|
| `src/lib/credibility.ts` | Removed `Math.random()`; added `VoteMutation`, `resolveVoteMutation`, `computePostScoreAfterVoteMutation`, `reverseVoteDirection`, `clampCredibility` |
| `src/app/api/subreddit/post/vote/route.ts` | Self-vote block; correct flip/remove/create score math; fresh consensus; rank recalc |
| `src/app/api/subreddit/post/comment/vote/route.ts` | Self-vote block; comment existence check |
| `package.json` | Added `vitest`, `@vitest/coverage-v8`, `test`, `test:coverage` scripts |
| `tsconfig.json` | Excluded `coverage/` from typecheck |

---

## Behavioral Changes

### Vote flips

UP→DOWN and DOWN→UP now reverse the previous vote impact before applying the new one.

### Consensus

Always computed from the post-mutation vote set loaded from the database.

### Self-voting

Returns **403 Forbidden** on own posts and own comments.

### Vote weights

Fully deterministic — identical inputs always produce identical weights.

### Ranks

`credibilityRank` recalculated automatically after every post vote that changes author credibility.

---

## Migration Required

None. Schema unchanged.

---

## Test Results

```
npm run test:coverage  → 20 passed, 100% coverage (credibility.ts, credibility-ranks.ts, self-vote.ts)
npm run typecheck      → PASS
npm run build          → PASS
```

---

## Breaking Changes

None for API consumers. Vote responses no longer include internal `mutation` / `debugEvent` fields in the JSON body (debug data still written to Redis for admins).
