// Credibility scoring parameters
export const ALPHA = 0.1; // Learning rate for vote updates
export const BETA = 0.05; // Learning rate for author credibility updates
export const MIN_CREDIBILITY = 0.1;
export const MAX_CREDIBILITY = 100.0;

export type VoteDirection = "UP" | "DOWN";

export type VoteMutation =
  | { action: "create"; voteType: VoteDirection; weight: number }
  | {
      action: "remove";
      previousType: VoteDirection;
      previousWeight: number;
    }
  | {
      action: "flip";
      previousType: VoteDirection;
      previousWeight: number;
      newType: VoteDirection;
      newWeight: number;
    };

export function clampCredibility(score: number): number {
  return Math.max(MIN_CREDIBILITY, Math.min(MAX_CREDIBILITY, score));
}

/**
 * Deterministic vote weight from voter credibility and post score.
 * No randomness — identical inputs always produce identical weight.
 */
export function computeVoteWeight(
  voterCredibility: number,
  postScore = 1.0,
): number {
  const baseWeight = Math.log(1 + Math.max(MIN_CREDIBILITY, voterCredibility));
  const postFactor =
    Math.log(1 + Math.max(MIN_CREDIBILITY, postScore)) / Math.log(2);

  return baseWeight * postFactor;
}

export function updatePostCredibility(
  currentScore: number,
  voteType: VoteDirection,
  weight: number,
): number {
  const direction = voteType === "UP" ? 1 : -1;
  const delta = ALPHA * direction * weight;
  return clampCredibility(currentScore + delta);
}

export function reverseVoteDirection(voteType: VoteDirection): VoteDirection {
  return voteType === "UP" ? "DOWN" : "UP";
}

/**
 * Apply a single vote mutation to a post credibility score.
 * - create: apply new vote
 * - remove: reverse previous vote impact
 * - flip: reverse old vote, then apply new vote (net = -old + new)
 */
export function computePostScoreAfterVoteMutation(
  currentScore: number,
  mutation: VoteMutation,
): number {
  switch (mutation.action) {
    case "create":
      return updatePostCredibility(
        currentScore,
        mutation.voteType,
        mutation.weight,
      );
    case "remove":
      return updatePostCredibility(
        currentScore,
        reverseVoteDirection(mutation.previousType),
        mutation.previousWeight,
      );
    case "flip": {
      const afterRemoval = updatePostCredibility(
        currentScore,
        reverseVoteDirection(mutation.previousType),
        mutation.previousWeight,
      );
      return updatePostCredibility(
        afterRemoval,
        mutation.newType,
        mutation.newWeight,
      );
    }
  }
}

export function resolveVoteMutation(
  existingVote: { type: VoteDirection; weight: number } | null,
  requestedType: VoteDirection,
  newWeight: number,
): VoteMutation {
  if (!existingVote) {
    return { action: "create", voteType: requestedType, weight: newWeight };
  }

  if (existingVote.type === requestedType) {
    return {
      action: "remove",
      previousType: existingVote.type,
      previousWeight: existingVote.weight,
    };
  }

  return {
    action: "flip",
    previousType: existingVote.type,
    previousWeight: existingVote.weight,
    newType: requestedType,
    newWeight,
  };
}

export function updateAuthorCredibility(
  currentScore: number,
  postConsensus: number,
): number {
  const delta = BETA * postConsensus;
  return clampCredibility(currentScore + delta);
}

export function computePostConsensus(
  votes: Array<{ type: VoteDirection; weight: number }>,
): number {
  if (votes.length === 0) {
    return 0;
  }

  const weightedSum = votes.reduce((sum, vote) => {
    const direction = vote.type === "UP" ? 1 : -1;
    return sum + direction * vote.weight;
  }, 0);

  return weightedSum / votes.length;
}
