import { type User, type Post, type Vote } from "@prisma/client";

export type CredibilityUser = Omit<User, "expertise"> & {
  expertise: string[];
};

export type CredibilityPost = Post;

export interface WeightedVote extends Vote {
  weight: number;
  votedAt: Date;
  lastWeightUpdate: Date;
}

export interface CachedPost {
  id: string;
  title: string;
  authorUsername: string;
  content: string;
  currentVote: "UP" | "DOWN" | null;
  createdAt: Date;
  credibilityScore: number;
  researchDomain?: string | null;
  votes?: number;
  votedBy?: string;
}
