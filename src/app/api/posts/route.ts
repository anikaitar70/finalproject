import { type NextRequest } from "next/server";
import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { parseExpertise } from "~/lib/expertise";
import { publicUserSelect } from "~/lib/public-user-select";
import { PaginationQuerySchema } from "~/lib/validators/pagination";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const session = await getServerAuthSession();

  let joinedCommunitiesIds: string[] = [];

  if (session) {
    const joinedCommunities = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        subreddit: true,
      },
    });

    joinedCommunitiesIds = joinedCommunities.map((sub) => sub.subreddit.id);
  }

  try {
    const { limit, page, subredditName, feedType } = PaginationQuerySchema.extend({
      subredditName: z.string().trim().min(1).max(21).nullish().optional(),
      feedType: z.enum(["custom", "all"]).optional(),
    }).parse({
        subredditName: url.searchParams.get("subredditName"),
        limit: url.searchParams.get("limit") ?? undefined,
        page: url.searchParams.get("page") ?? undefined,
        feedType: url.searchParams.get("feedType"),
      });

    let whereClause = {};

    if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      };
    } else if (
      feedType === "custom" &&
      session &&
      joinedCommunitiesIds.length > 0
    ) {
      whereClause = {
        subreddit: {
          id: {
            in: joinedCommunitiesIds,
          },
        },
      };
    }

    const posts = await prisma.post.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: [
        {
          credibilityScore: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        subredditId: true,
        credibilityScore: true,
        researchDomain: true,
        subreddit: true,
        votes: {
          select: {
            type: true,
            userId: true,
            postId: true,
            weight: true,
            votedAt: true,
            lastWeightUpdate: true,
          },
        },
        author: {
          select: publicUserSelect,
        },
        comments: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            authorId: true,
          },
        },
      },
      where: whereClause,
      distinct: ["id"],
    });

    return new Response(JSON.stringify(posts), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response("Could not fetch posts. Please try again later", {
      status: 500,
    });
  }
}
