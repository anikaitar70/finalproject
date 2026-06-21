# Credibility Integrity Report

Phase 3: Credibility Integrity Stabilization

## Summary

| Area | Before | After |
|------|--------|-------|
| Vote flip (UP→DOWN) | Only new vote applied; old impact retained | Reverse old, apply new |
| Consensus | Stale pre-mutation array; voter excluded | Re-fetched post-mutation vote set |
| Vote weights | `Math.random()` ±10% | Pure deterministic formula |
| Self-voting | Allowed on posts and comments | HTTP 403 Forbidden |
| Rank updates | Never updated live | Recalculated after each post vote |
| Test coverage | 0% | 100% on credibility utilities |

---

## 1. Vote Direction Changes

### Old behavior

When a user changed UP → DOWN:

```typescript
// Bug: only applied DOWN on current score (which already included UP impact)
newPostScore = updatePostCredibility(post.credibilityScore, voteType, voteWeight);
```

Starting score **10.0**, UP weight **2.5** (`ALPHA = 0.1`):

| Step | Score |
|------|-------|
| After UP | 10.25 |
| Flip to DOWN (buggy) | 10.0 |
| Flip to DOWN (correct) | 9.75 |

The buggy flip left a **+0.25 phantom UP impact**.

### New behavior

```typescript
computePostScoreAfterVoteMutation(score, {
  action: "flip",
  previousType: "UP",
  previousWeight: 2.5,
  newType: "DOWN",
  newWeight: 2.5,
});
// Step 1: reverse UP  → 10.25 - 0.25 = 10.0
// Step 2: apply DOWN → 10.0 - 0.25 = 9.75
```

**Net impact from score containing UP:** `-0.50` (= `-2 × ALPHA × weight`)

This matches the requirement: UP(+2.5 weight effect) then DOWN(−2.5 weight effect) = net negative directional impact, not stacked positive residue.

### Tested scenarios

| Scenario | Test |
|----------|------|
| UP → DOWN | `flips UP to DOWN with net negative impact` |
| DOWN → UP | `flips DOWN to UP with net positive impact` |
| UP → remove | `removes an UP vote by reversing its impact` |
| DOWN → remove | `removes a DOWN vote by reversing its impact` |

---

## 2. Consensus Calculation

### Old behavior

```typescript
computePostConsensus(
  post.votes.filter(v => v.userId !== session.user.id)
);
```

Problems:
- Used votes **before** create/update/delete
- Excluded current voter even when their vote should be included after mutation

### New behavior

```typescript
const updatedVotes = await tx.vote.findMany({ where: { postId } });
const postConsensus = computePostConsensus(updatedVotes);
```

### Example

Votes after flip:

| Voter | Type | Weight |
|-------|------|--------|
| A | DOWN | 2.5 |
| B | UP | 1.0 |

```
consensus = (-2.5 + 1.0) / 2 = -0.75
authorDelta = BETA * (-0.75) = -0.0375
```

Old code with stale UP for voter A would have computed `(2.5 + 1.0) / 2 = 1.75` — wrong sign and magnitude.

---

## 3. Self-Voting Prevention

| Route | Check | Response |
|-------|-------|----------|
| Post vote | `isSelfVote(post.authorId, session.user.id)` | 403 `"You cannot vote on your own post"` |
| Comment vote | `isSelfVote(comment.authorId, session.user.id)` | 403 `"You cannot vote on your own comment"` |

Tests: `isSelfVote` unit tests in `credibility.test.ts`.

---

## 4. Deterministic Vote Weights

### Removed

```typescript
const variation = 0.9 + (Math.random() * 0.2);
```

### Current formula

```
weight = log(1 + voterCred) * (log(1 + postScore) / log(2))
```

Same `(voterCredibility, postScore)` → same weight, always.

Test: 20 consecutive calls return identical values.

---

## 5. Rank Recalculation

### Implementation

```sql
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY credibilityScore DESC, id ASC) AS rank
  FROM User
)
UPDATE User SET credibilityRank = (SELECT rank FROM ranked WHERE ranked.id = User.id)
```

- Runs inside the post-vote transaction after author score update
- **O(N log N)** — single sort via window function, not O(N²)
- Ties: lower `id` wins higher rank (deterministic)

### Example

| User | Score | Rank |
|------|-------|------|
| alice | 50.0 | 1 |
| bob | 50.0 | 2 |
| carol | 30.0 | 3 |

After bob gains consensus and reaches 52.0, ranks reorder in one pass.

---

## Edge Cases Tested

| Edge case | Expected | Covered |
|-----------|----------|---------|
| Empty vote set consensus | 0 | ✓ |
| Score at MAX_CREDIBILITY | Clamped to 100 | ✓ |
| Score at MIN_CREDIBILITY | Clamped to 0.1 | ✓ |
| Flip with equal weights | Net ±2×ALPHA×weight | ✓ |
| Remove restores original score | Round-trip create+remove | ✓ |
| Self-vote same IDs | true | ✓ |
| Self-vote different IDs | false | ✓ |

---

## Verification Results

| Command | Result |
|---------|--------|
| `npm run test:coverage` | **PASS** — 20 tests, 100% coverage on credibility utilities |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

---

## Remaining Known Limitations (Out of Scope)

- Author credibility uses `currentScore + BETA * consensus` on every vote (cumulative drift possible over many votes — not changed per Phase 3 scope)
- Comment votes still do not affect credibility scores (pre-existing design)
- Rank recalculation runs on every post vote, not batched (acceptable for current scale)
