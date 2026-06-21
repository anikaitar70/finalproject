import { type NextRequest } from "next/server";
import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { parseExpertise } from "~/lib/expertise";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

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
              credibilityScore: "desc",
            },
            take: 5,
          },
        },
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      return new Response(
        JSON.stringify({
          ...user,
          expertise: parseExpertise(user.expertise),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
            posts: true,
          },
        },
      },
      orderBy: {
        credibilityScore: "desc",
      },
      take: 50,
    });

    return new Response(
      JSON.stringify(
        users.map((user) => ({
          ...user,
          expertise: parseExpertise(user.expertise),
        })),
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching credibility data:", error);
    return new Response("Could not fetch credibility data", { status: 500 });
  }
}
