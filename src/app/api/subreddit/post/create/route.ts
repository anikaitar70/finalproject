/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { checkRateLimit } from "~/lib/rate-limiter";
import { PostValidator } from "~/lib/validators/post";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canPost = await checkRateLimit(session.user.id, "post", 10);
    if (!canPost) {
      return new Response("Please wait before posting again", { status: 429 });
    }

    const body = await req.json();
    const { content, subredditId, title } = PostValidator.parse(body);

    const subscription = await prisma.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return new Response(
        "You need to be a member of this Community to post here",
        { status: 403 },
      );
    }

    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credibilityScore: true },
    });

    await prisma.post.create({
      data: {
        authorId: session.user.id,
        content: content as Prisma.InputJsonValue,
        subredditId,
        title,
        credibilityScore: author?.credibilityScore ?? 1.0,
      },
    });

    return new Response("OK");
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response("Could not post to subreddit. Please try again later", {
      status: 500,
    });
  }
}
