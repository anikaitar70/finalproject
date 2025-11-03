import { type NextRequest } from "next/server";
import { z } from "zod";
import { checkVoteRateLimit } from "~/lib/vote-server";

import { redis } from "~/lib/redis";
import { PostVoteValidator } from "~/lib/validators/vote";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";
import { type CachedPost, type CredibilityUser, type CredibilityPost, type WeightedVote } from "~/types/credibility";
import {
  computeVoteWeight,
  updatePostCredibility,
  updateAuthorCredibility,
  computePostConsensus
} from "~/lib/credibility";

const TRIGGER_CACHE_UPVOTE_THRESHOLD = 1;

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, voteType } = PostVoteValidator.parse(body);
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check rate limit
    const canVote = await checkVoteRateLimit(session.user.id);
    if (!canVote) {
      return new Response("Please wait a few seconds before voting again", { status: 429 });
    }

    // Start a transaction for atomic credibility updates
    const result = await prisma.$transaction(async (tx) => {
      // Get current voter credibility
      const voter = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { credibilityScore: true }
      });

      if (!voter) {
        throw new Error("Voter not found");
      }

      // Compute vote weight based on voter credibility
      const voteWeight = computeVoteWeight(voter.credibilityScore);

      // Get existing vote
      const existingVote = await tx.vote.findFirst({
        where: {
          userId: session.user.id,
          postId,
        },
      });

      // Get post with author and votes
      const post = await tx.post.findUnique({
        where: { id: postId },
        include: {
          author: true,
          votes: true,
        },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      // Handle vote changes
      if (existingVote) {
        if (existingVote.type === voteType) {
          // Remove vote
          await tx.vote.delete({
            where: {
              userId_postId: {
                postId,
                userId: session.user.id,
              },
            },
          });
        } else {
          // Update vote
          await tx.vote.update({
            where: {
              userId_postId: {
                postId,
                userId: session.user.id,
              },
            },
            data: {
              type: voteType,
              weight: voteWeight,
              lastWeightUpdate: new Date(),
            },
          });
        }
      } else {
        // Create new vote
        await tx.vote.create({
          data: {
            type: voteType,
            userId: session.user.id,
            postId,
            weight: voteWeight,
            votedAt: new Date(),
            lastWeightUpdate: new Date(),
          },
        });
      }

      // Recompute post consensus and update scores
      const updatedPost = await tx.post.findUnique({
        where: { id: postId },
        include: { votes: true },
      });

      if (!updatedPost) {
        throw new Error("Updated post not found");
      }

      const postConsensus = computePostConsensus(updatedPost.votes);
      const newPostScore = updatePostCredibility(
        post.credibilityScore,
        voteType,
        voteWeight
      );

      // Update post credibility
      await tx.post.update({
        where: { id: postId },
        data: {
          credibilityScore: newPostScore,
        },
      });

      // Update author credibility based on post consensus
      const newAuthorScore = updateAuthorCredibility(
        post.author.credibilityScore,
        postConsensus
      );

      await tx.user.update({
        where: { id: post.authorId },
        data: {
          credibilityScore: newAuthorScore,
          lastScoreUpdate: new Date(),
        },
      });

      // Prepare debug event
      const prevPostScore = post.credibilityScore;
      const prevAuthorScore = post.author.credibilityScore;
      const deltaPost = newPostScore - (prevPostScore ?? 0);
      const deltaAuthor = newAuthorScore - (prevAuthorScore ?? 0);

      const debugEvent = {
        ts: new Date().toISOString(),
        voterId: session.user.id,
        postId,
        voteType,
        voteWeight,
        prevPostScore,
        newPostScore,
        deltaPost,
        prevAuthorScore,
        newAuthorScore,
        deltaAuthor,
        postConsensus,
      };

      try {
        // push debug event into redis list (development helper)
        await redis.lpush("credibility:events", JSON.stringify(debugEvent));
        // keep only last 200 events
        await redis.ltrim("credibility:events", 0, 199);
      } catch (e) {
        // non-fatal
        console.warn("Failed to write debug event to redis", e);
      }

      // Return updated scores for cache and client
      return {
        postScore: newPostScore,
        authorScore: newAuthorScore,
        postConsensus,
        voteWeight,
        deltaPost,
        deltaAuthor,
      };
    });

    // Update cache if needed
    const votesAmt = result.postConsensus * TRIGGER_CACHE_UPVOTE_THRESHOLD;
    if (Math.abs(votesAmt) >= TRIGGER_CACHE_UPVOTE_THRESHOLD) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { author: true },
      });

      if (post) {
        const cachePayload: CachedPost = {
          authorUsername: post.author.username ?? "",
          content: JSON.stringify(post.content),
          id: post.id,
          title: post.title,
          currentVote: voteType,
          createdAt: post.createdAt,
          credibilityScore: result.postScore,
        };

        await redis.hset(`post:${postId}`, cachePayload);
      }
    }

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    console.error("Vote error:", error);
    return new Response(
      "Could not post your vote at this time. Please try again later",
      { status: 500 }
    );
  }
}
