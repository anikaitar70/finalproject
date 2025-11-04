// Credibility scoring parameters
export const ALPHA = 0.1; // Learning rate for vote updates
export const BETA = 0.05; // Learning rate for author credibility updates
export const MIN_CREDIBILITY = 0.1;
export const MAX_CREDIBILITY = 100.0;

export function computeVoteWeight(voterCredibility: number, postScore: number = 1.0): number {
  // Base weight from voter credibility
  const baseWeight = Math.log(1 + Math.max(MIN_CREDIBILITY, voterCredibility));
  
  // Scale based on post score to add more weight to votes on higher quality posts
  const postFactor = Math.log(1 + Math.max(MIN_CREDIBILITY, postScore)) / Math.log(2);
  
  // Add some randomness to create variation (±10%)
  const variation = 0.9 + (Math.random() * 0.2);
  
  return baseWeight * postFactor * variation;
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