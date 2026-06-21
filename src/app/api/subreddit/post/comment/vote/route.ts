import { isSelfVote } from "~/lib/self-vote";
import { validationErrorResponse } from "~/lib/api-response";
import { checkRateLimit } from "~/lib/rate-limiter";
import { CommentVoteValidator } from "~/lib/validators/vote";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canVote = await checkRateLimit(session.user.id, "comment-vote", 5);
    if (!canVote) {
      return new Response("Please wait before voting again", { status: 429 });
    }

    const body = await req.json();
    const { commentId, voteType } = CommentVoteValidator.parse(body);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return new Response("Comment not found", { status: 404 });
    }

    if (isSelfVote(comment.authorId, session.user.id)) {
      return new Response("You cannot vote on your own comment", {
        status: 403,
      });
    }

    const existingVote = await prisma.commentVote.findFirst({
      where: {
        userId: session.user.id,
        commentId,
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        await prisma.commentVote.delete({
          where: {
            userId_commentId: {
              commentId,
              userId: session.user.id,
            },
          },
        });

        return new Response("OK");
      }

      await prisma.commentVote.update({
        where: {
          userId_commentId: {
            commentId,
            userId: session.user.id,
          },
        },
        data: {
          type: voteType,
        },
      });

      return new Response("OK");
    }

    await prisma.commentVote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        commentId,
      },
    });

    return new Response("OK");
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response(
      "Could not create your vote at this time. Please try again later",
      { status: 500 },
    );
  }
}
