import type { Comment, Post, Subreddit, User, Vote, VoteType } from "@prisma/client";

export type ExtendedUser = Pick<User, 'id' | 'name' | 'username' | 'image' | 'email' | 'emailVerified' | 'credibilityScore'>;

export type ExtendedVote = {
  type: VoteType;
  userId: string;
  postId: string;
  weight: number;
  votedAt: Date;
  lastWeightUpdate: Date;
};

export type ExtendedComment = Pick<Comment, 'id' | 'text' | 'createdAt' | 'authorId'>;

export type ExtendedPost = {
  id: string;
  title: string;
  content: any;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  subredditId: string;
  credibilityScore: number;
  researchDomain: string | null;
  author: ExtendedUser;
  comments: ExtendedComment[];
  subreddit: Subreddit;
  votes: ExtendedVote[];
};
