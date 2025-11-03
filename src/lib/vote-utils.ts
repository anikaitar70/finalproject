'use client';

import type { Vote } from "@prisma/client";

export function calculateVoteCount(votes: Vote[]): number {
  return votes.reduce((acc, vote) => {
    if (vote.type === "UP") return acc + 1;
    if (vote.type === "DOWN") return acc - 1;
    return acc;
  }, 0);
}

export function getInitialVoteCount(votes: Vote[]): number {
  if (!votes || !Array.isArray(votes)) return 0;
  return calculateVoteCount(votes);
}