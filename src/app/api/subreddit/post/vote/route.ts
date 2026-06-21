import { type NextRequest } from "next/server";

import { validationErrorResponse } from "~/lib/api-response";
import {
  computePostConsensus,
  computePostScoreAfterVoteMutation,
  computeVoteWeight,
  resolveVoteMutation,
  updateAuthorCredibility,
} from "~/lib/credibility";
import { recalculateCredibilityRanks } from "~/lib/credibility-ranks";
import { isSelfVote } from "~/lib/self-vote";
import { checkRateLimit } from "~/lib/rate-limiter";
import { redis } from "~/lib/redis";
import { PostVoteValidator } from "~/lib/validators/vote";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";
import { type CachedPost } from "~/types/credibility";

const TRIGGER_CACHE_UPVOTE_THRESHOLD = 1;

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, voteType } = PostVoteValidator.parse(body);
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canVote = await checkRateLimit(session.user.id, "vote", 5);
    if (!canVote) {
      return new Response("Please wait a few seconds before voting again", {
        status: 429,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const [voter, post, existingVote] = await Promise.all([
        tx.user.findUnique({
          where: { id: session.user.id },
          select: { credibilityScore: true },
        }),
        tx.post.findUnique({
          where: { id: postId },
          include: {
            author: {
              select: {
                id: true,
                credibilityScore: true,
              },
            },
          },
        }),
        tx.vote.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId,
            },
          },
        }),
      ]);

      if (!voter) {
        throw new Error("Voter not found");
      }
      if (!post) {
        throw new Error("Post not found");
      }

      if (isSelfVote(post.authorId, session.user.id)) {
        throw new SelfVoteError();
      }

      const voteWeight = computeVoteWeight(
        voter.credibilityScore,
        post.credibilityScore,
      );

      const mutation = resolveVoteMutation(
        existingVote
          ? { type: existingVote.type, weight: existingVote.weight }
          : null,
        voteType,
        voteWeight,
      );

      if (mutation.action === "remove") {
        await tx.vote.delete({
          where: {
            userId_postId: {
              postId,
              userId: session.user.id,
            },
          },
        });
      } else if (mutation.action === "flip") {
        await tx.vote.update({
          where: {
            userId_postId: {
              postId,
              userId: session.user.id,
            },
          },
          data: {
            type: mutation.newType,
            weight: mutation.newWeight,
            lastWeightUpdate: new Date(),
          },
        });
      } else {
        await tx.vote.create({
          data: {
            type: mutation.voteType,
            userId: session.user.id,
            postId,
            weight: mutation.weight,
            votedAt: new Date(),
            lastWeightUpdate: new Date(),
          },
        });
      }

      const newPostScore = computePostScoreAfterVoteMutation(
        post.credibilityScore,
        mutation,
      );

      const updatedVotes = await tx.vote.findMany({
        where: { postId },
        select: { type: true, weight: true },
      });

      const postConsensus = computePostConsensus(updatedVotes);

      await tx.post.update({
        where: { id: postId },
        data: {
          credibilityScore: newPostScore,
        },
      });

      const newAuthorScore = updateAuthorCredibility(
        post.author.credibilityScore,
        postConsensus,
      );

      await tx.user.update({
        where: { id: post.author.id },
        data: {
          credibilityScore: newAuthorScore,
          lastScoreUpdate: new Date(),
        },
      });

      await recalculateCredibilityRanks(tx);

      const prevPostScore = post.credibilityScore;
      const prevAuthorScore = post.author.credibilityScore;
      const deltaPost = newPostScore - prevPostScore;
      const deltaAuthor = newAuthorScore - prevAuthorScore;

      return {
        postScore: newPostScore,
        authorScore: newAuthorScore,
        postConsensus,
        voteWeight,
        deltaPost,
        deltaAuthor,
        mutation,
        debugEvent: {
          ts: new Date().toISOString(),
          voterId: session.user.id,
          postId,
          voteType,
          voteWeight,
          mutation,
          prevPostScore,
          newPostScore,
          deltaPost,
          prevAuthorScore,
          newAuthorScore,
          deltaAuthor,
          postConsensus,
        },
      };
    });

    try {
      await redis.lpush(
        "credibility:events",
        JSON.stringify(result.debugEvent),
      );
      await redis.ltrim("credibility:events", 0, 199);
    } catch (error) {
      console.warn("Failed to write debug event to redis", error);
    }

    const votesAmt = result.postConsensus * TRIGGER_CACHE_UPVOTE_THRESHOLD;
    if (Math.abs(votesAmt) >= TRIGGER_CACHE_UPVOTE_THRESHOLD) {
      try {
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
            researchDomain: post.researchDomain,
          };

          await redis.hset(
            `post:${postId}`,
            Object.entries(cachePayload).reduce(
              (acc, [key, value]) => {
                acc[key] =
                  typeof value === "string" ? value : JSON.stringify(value);
                return acc;
              },
              {} as Record<string, string>,
            ),
          );
        }
      } catch (error) {
        console.warn("Failed to update post cache in redis", error);
      }
    }

    const { debugEvent: _debugEvent, mutation: _mutation, ...responseBody } =
      result;

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof SelfVoteError) {
      return new Response("You cannot vote on your own post", { status: 403 });
    }

    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    console.error("Vote error:", error);
    return new Response(
      "Could not post your vote at this time. Please try again later",
      { status: 500 },
    );
  }
}

class SelfVoteError extends Error {
  constructor() {
    super("Self-vote not allowed");
    this.name = "SelfVoteError";
  }
}
