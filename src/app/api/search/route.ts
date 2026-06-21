import { type NextRequest } from "next/server";
import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { prisma } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { q } = z
      .object({
        q: z.string().trim().min(1).max(100),
      })
      .parse({
        q: url.searchParams.get("q"),
      });

    const results = await prisma.subreddit.findMany({
      where: {
        name: {
          startsWith: q,
        },
      },
      include: {
        _count: true,
      },
      take: 5,
    });

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response("Could not perform search", { status: 500 });
  }
}
