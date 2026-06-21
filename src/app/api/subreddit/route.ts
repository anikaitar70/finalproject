import { type NextRequest } from "next/server";
import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { checkRateLimit } from "~/lib/rate-limiter";
import { SubredditValidator } from "~/lib/validators/subreddit";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canCreate = await checkRateLimit(session.user.id, "subreddit", 30);
    if (!canCreate) {
      return new Response("Please wait before creating another community", {
        status: 429,
      });
    }

    const body = await req.json();
    const { name } = SubredditValidator.parse(body);

    const subredditExists = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (subredditExists) {
      return new Response("Subreddit already exists", { status: 409 });
    }

    const subreddit = await prisma.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: subreddit.id,
      },
    });

    return new Response(subreddit.name);
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response("Could not create subreddit. Please try again later.", {
      status: 500,
    });
  }
}
