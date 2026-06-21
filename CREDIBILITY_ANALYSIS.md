# Credibility System Analysis

Phase 3 pre-implementation audit of the Cred Rank Net credibility pipeline.

## Vote Lifecycle (Pre-Fix)

### Post votes (`PATCH /api/subreddit/post/vote`)

```
Client → validate session → rate limit → transaction {
  1. Load voter, post (+ author), existing vote
  2. computeVoteWeight(voter.credibility, post.credibility)  // included Math.random()
  3. Mutate Vote row (create | update type | delete)
  4. Update post.credibilityScore (buggy logic on flip)
  5. computePostConsensus(stale pre-mutation votes, excluding voter)
  6. Update author.credibilityScore from consensus
  7. Write Redis debug event
} → optional Redis post cache update
```

### Comment votes (`PATCH /api/subreddit/post/comment/vote`)

```
Client → validate session → rate limit → mutate CommentVote (create | update | delete)
```

Comment votes did **not** affect credibility scores. They only toggle display counts.

### Rank updates

`credibilityRank` was set in seed scripts only. **Never updated after live votes.**

---

## Core Algorithm (Constants)

| Symbol | Value | Meaning |
|--------|-------|---------|
| `ALPHA` | 0.1 | Post score learning rate per weighted vote |
| `BETA` | 0.05 | Author score learning rate per consensus |
| `MIN_CREDIBILITY` | 0.1 | Floor |
| `MAX_CREDIBILITY` | 100.0 | Ceiling |

### Vote weight (pre-fix)

```
baseWeight = log(1 + max(MIN, voterCredibility))
postFactor = log(1 + max(MIN, postScore)) / log(2)
weight = baseWeight * postFactor * (0.9 + random * 0.2)   // NON-DETERMINISTIC
```

### Post score update

```
delta = ALPHA * direction * weight     // direction: UP=+1, DOWN=-1
newScore = clamp(currentScore + delta)
```

### Author score update

```
newAuthorScore = clamp(currentAuthorScore + BETA * postConsensus)
```

### Consensus (pre-fix)

```
consensus = sum(direction_i * weight_i) / N
```

Where `N` = number of votes in the input array.

---

## Inconsistency Locations (Pre-Fix)

| # | Location | Bug |
|---|----------|-----|
| 1 | `src/lib/credibility.ts:14-17` | `Math.random()` in vote weight |
| 2 | `src/app/api/subreddit/post/vote/route.ts:126-131` | Flip applied only new vote, not reverse+apply |
| 3 | `src/app/api/subreddit/post/vote/route.ts:134-136` | Consensus used stale votes; excluded current voter entirely |
| 4 | `src/app/api/subreddit/post/vote/route.ts` | No self-vote check |
| 5 | `src/app/api/subreddit/post/comment/vote/route.ts` | No self-vote check |
| 6 | Entire codebase | `credibilityRank` never recalculated after score changes |
| 7 | `src/app/api/subreddit/post/vote/route.ts:74-77` | New weight computed even on remove (unused but confusing) |

---

## Vote Mutation States

| User action | DB change | Required score impact |
|-------------|-----------|----------------------|
| First UP | create UP | +ALPHA * weight |
| First DOWN | create DOWN | -ALPHA * weight |
| UP → UP (toggle) | delete | reverse UP (−ALPHA * oldWeight) |
| DOWN → DOWN (toggle) | delete | reverse DOWN (+ALPHA * oldWeight) |
| UP → DOWN | update type | reverse UP, then apply DOWN |
| DOWN → UP | update type | reverse DOWN, then apply UP |

---

## Post-Fix Architecture

### New helpers (`src/lib/credibility.ts`)

- `resolveVoteMutation()` — maps user intent + existing vote → `create | remove | flip`
- `computePostScoreAfterVoteMutation()` — mathematically correct score delta
- `reverseVoteDirection()` — UP↔DOWN for reversal
- `computeVoteWeight()` — **deterministic**, no randomness

### Rank helper (`src/lib/credibility-ranks.ts`)

- `recalculateCredibilityRanks(tx)` — single SQL `ROW_NUMBER()` pass, O(N log N)
- Tie-break: `credibilityScore DESC, id ASC`

### Self-vote guard (`src/lib/self-vote.ts`)

- `isSelfVote(authorId, voterId)` — used by post and comment vote routes
- Returns HTTP **403** with clear message

### Post vote route (fixed flow)

```
1. Block self-votes (403)
2. resolveVoteMutation()
3. Apply DB mutation
4. computePostScoreAfterVoteMutation()
5. Re-fetch all votes → computePostConsensus()   // fresh state
6. Update post + author scores
7. recalculateCredibilityRanks()
```

---

## Files Modified in Phase 3

| File | Change |
|------|--------|
| `src/lib/credibility.ts` | Deterministic weights, mutation helpers |
| `src/lib/credibility-ranks.ts` | **New** — rank recalculation |
| `src/lib/self-vote.ts` | **New** — self-vote helper |
| `src/app/api/subreddit/post/vote/route.ts` | Full integrity fix |
| `src/app/api/subreddit/post/comment/vote/route.ts` | Self-vote block |
| `src/lib/credibility.test.ts` | **New** — unit tests |
| `src/lib/credibility-ranks.test.ts` | **New** — rank helper test |
