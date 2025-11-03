import { type NextRequest } from "next/server";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return new Response("Username is required", { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        credibilityScore: true,
        credibilityRank: true,
        expertise: true,
        posts: {
          select: {
            id: true,
            title: true,
            credibilityScore: true,
            researchDomain: true,
            createdAt: true,
          },
          orderBy: {
            credibilityScore: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            posts: true,
            votes: true
          }
        }
      }
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new Response("Could not fetch user profile", { status: 500 });
  }
}