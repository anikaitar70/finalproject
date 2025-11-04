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
      // Get all necessary data upfront
      const [voter, post, existingVote] = await Promise.all([
        tx.user.findUnique({
          where: { id: session.user.id },
          select: { credibilityScore: true }
        }),
        tx.post.findUnique({
          where: { id: postId },
          include: {
            votes: true,
            author: {
              select: {
                id: true,
                credibilityScore: true
              }
            }
          }
        }),
        tx.vote.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId
            }
          }
        })
      ]);

      if (!voter) {
        throw new Error("Voter not found");
      }
      if (!post) {
        throw new Error("Post not found");
      }

      // Compute vote weight based on voter credibility and post score
      const voteWeight = computeVoteWeight(voter.credibilityScore, post.credibilityScore);

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

      // Calculate new scores
      let newPostScore = post.credibilityScore;
      
      if (existingVote?.type === voteType) {
        // Removing vote - reverse the previous vote's effect
        const reverseDirection = voteType === "UP" ? "DOWN" : "UP";
        newPostScore = updatePostCredibility(
          post.credibilityScore,
          reverseDirection,
          existingVote.weight
        );
      } else {
        // New vote or changing vote direction
        newPostScore = updatePostCredibility(
          post.credibilityScore,
          voteType,
          voteWeight
        );
      }
      
      // Recalculate consensus after vote changes
      const postConsensus = computePostConsensus(
        post.votes.filter(v => v.userId !== session.user.id) // Remove existing vote if any
      );

      // Update post credibility
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          credibilityScore: newPostScore,
        },
        include: {
          votes: true,
        }
      });

      // Update author credibility based on post consensus
      const newAuthorScore = updateAuthorCredibility(
        post.author.credibilityScore,
        postConsensus
      );

      await tx.user.update({
        where: { id: post.author.id },
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

        await redis.hset(`post:${postId}`, Object.entries(cachePayload).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
          return acc;
        }, {} as Record<string, string>));
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
