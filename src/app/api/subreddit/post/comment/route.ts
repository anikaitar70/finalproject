import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { checkRateLimit } from "~/lib/rate-limiter";
import { CommentValidator } from "~/lib/validators/comment";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canComment = await checkRateLimit(session.user.id, "comment", 5);
    if (!canComment) {
      return new Response("Please wait before commenting again", {
        status: 429,
      });
    }

    const body = await req.json();
    const { postId, text, replyToId } = CommentValidator.parse(body);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    if (replyToId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: replyToId,
          postId,
        },
        select: { id: true },
      });

      if (!parentComment) {
        return new Response("Invalid reply target", { status: 400 });
      }
    }

    await prisma.comment.create({
      data: {
        postId,
        text,
        authorId: session.user.id,
        replyToId,
      },
    });

    return new Response("OK");
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response(
      "Could not create your comment at this time. Please try again later",
      { status: 500 },
    );
  }
}
