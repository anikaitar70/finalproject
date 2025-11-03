import { type NextRequest } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // If userId provided, get specific user, otherwise get all users sorted by credibility
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          name: true,
          credibilityScore: true,
          credibilityRank: true,
          expertise: true,
          lastScoreUpdate: true,
          posts: {
            select: {
              id: true,
              title: true,
              credibilityScore: true,
              researchDomain: true,
            },
            orderBy: {
              credibilityScore: 'desc'
            },
            take: 5 // Get top 5 posts by credibility
          }
        }
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Get top users by credibility
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          credibilityScore: true,
          credibilityRank: true,
          expertise: true,
          _count: {
            select: {
              posts: true
            }
          }
        },
        orderBy: {
          credibilityScore: 'desc'
        },
        take: 50 // Get top 50 users
      });

      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error("Error fetching credibility data:", error);
    return new Response("Could not fetch credibility data", { status: 500 });
  }
}