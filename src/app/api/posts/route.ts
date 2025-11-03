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
    const { limit, page, subredditName } = z
      .object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
      })
      .parse({
        subredditName: url.searchParams.get("subredditName"),
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
      });

    let whereClause = {};

    // Check if user is browsing a specific subreddit, and if not, whether
    // they're logged in (show custom feed) or not (show generic feed)
    if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      };
    } else if (session) {
      whereClause = {
        subreddit: {
          id: {
            in: joinedCommunitiesIds,
          },
        },
      };
    }

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
        citationCount: true,
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
