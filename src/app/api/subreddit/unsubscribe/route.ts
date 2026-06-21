import { type NextRequest } from "next/server";

import { validationErrorResponse } from "~/lib/api-response";
import { SubredditSubscriptionValidator } from "~/lib/validators/subreddit";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { subredditId } = SubredditSubscriptionValidator.parse(body);

    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
      select: { id: true },
    });

    if (!subreddit) {
      return new Response("Subreddit not found", { status: 404 });
    }

    const subscriptionExists = await prisma.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });

    if (!subscriptionExists) {
      return new Response(
        "You've not been subscribed to this subreddit, yet.",
        {
          status: 400,
        },
      );
    }

    await prisma.subscription.delete({
      where: {
        userId_subredditId: {
          subredditId,
          userId: session.user.id,
        },
      },
    });

    return new Response(subredditId);
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response(
      "Could not unsubscribe from subreddit at this time. Please try again later",
      { status: 500 },
    );
  }
}
