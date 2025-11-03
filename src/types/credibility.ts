import { type User, type Post, type Vote } from "@prisma/client";

export interface CredibilityUser extends User {
  credibilityScore: number;
  credibilityRank: number;
  lastScoreUpdate: Date;
  expertise: string[];
}

export interface CredibilityPost extends Post {
  credibilityScore: number;
  researchDomain?: string;
  citationCount: number;
  lastConsensusUpdate: Date;
}

export interface WeightedVote extends Vote {
  weight: number;
  votedAt: Date;
  lastWeightUpdate: Date;
}

// Update CachedPost to include credibility
export interface CachedPost {
  id: string;
  title: string;
  authorUsername: string;
  content: string;
  currentVote: "UP" | "DOWN" | null;
  createdAt: Date;
  credibilityScore: number;
  votes?: number;
  votedBy?: string;
}