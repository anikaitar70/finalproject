// Credibility scoring parameters
export const ALPHA = 0.1; // Learning rate for vote updates
export const BETA = 0.05; // Learning rate for author credibility updates
export const MIN_CREDIBILITY = 0.1;
export const MAX_CREDIBILITY = 100.0;

export function computeVoteWeight(voterCredibility: number): number {
  // Δpost = α * direction * log(1 + voterCred)
  return Math.log(1 + Math.max(MIN_CREDIBILITY, voterCredibility));
}

export function updatePostCredibility(
  currentScore: number,
  voteType: "UP" | "DOWN",
  weight: number
): number {
  const direction = voteType === "UP" ? 1 : -1;
  const delta = ALPHA * direction * weight;
  return Math.max(MIN_CREDIBILITY, Math.min(MAX_CREDIBILITY, currentScore + delta));
}

export function updateAuthorCredibility(
  currentScore: number,
  postConsensus: number // Average weighted vote
): number {
  const delta = BETA * postConsensus;
  return Math.max(MIN_CREDIBILITY, Math.min(MAX_CREDIBILITY, currentScore + delta));
}

export function computePostConsensus(votes: Array<{ type: "UP" | "DOWN"; weight: number }>): number {
  if (votes.length === 0) return 0;
  
  const weightedSum = votes.reduce((sum, vote) => {
    const direction = vote.type === "UP" ? 1 : -1;
    return sum + direction * vote.weight;
  }, 0);

  return weightedSum / votes.length;
}