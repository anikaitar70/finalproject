import { type NextRequest } from "next/server";
import { z } from "zod";

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
    const { limit, page, subredditName, feedType } = z
      .object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
        feedType: z.enum(["custom", "all"]).optional(),
      })
      .parse({
        subredditName: url.searchParams.get("subredditName"),
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
        feedType: url.searchParams.get("feedType"),
      });

    let whereClause = {};

    // If viewing a specific subreddit, filter by that
    if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      };
    } 
    // If custom feed and logged in, show subscribed posts
    else if (feedType === "custom" && session && joinedCommunitiesIds.length > 0) {
      whereClause = {
        subreddit: {
          id: {
            in: joinedCommunitiesIds,
          },
        },
      };
    }
    // Otherwise (all feed or no subscriptions), show all posts

    // Get distinct posts with all needed relations
    const posts = await prisma.post.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: [{
        credibilityScore: 'desc'
      }, {
        createdAt: 'desc'
      }],
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
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
            emailVerified: true,
            credibilityScore: true,
          }
        },
        comments: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            authorId: true,
          }
        }
      },
      where: whereClause,
      distinct: ['id']
    });

    return new Response(JSON.stringify(posts));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response("Could not fetch posts. Please try again later", {
      status: 500,
    });
  }
}
