import { z } from "zod";

import { validationErrorResponse } from "~/lib/api-response";
import { checkRateLimit } from "~/lib/rate-limiter";
import { UsernameValidator } from "~/lib/validators/username";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const canUpdate = await checkRateLimit(session.user.id, "username", 30);
    if (!canUpdate) {
      return new Response("Please wait before changing your username again", {
        status: 429,
      });
    }

    const body = await req.json();
    const { name } = UsernameValidator.parse(body);

    const usernameExists = await prisma.user.findFirst({
      where: {
        username: name,
        NOT: {
          id: session.user.id,
        },
      },
    });

    if (usernameExists) {
      return new Response("Username already taken", { status: 409 });
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        username: name,
      },
    });

    return new Response("OK");
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) {
      return validationResponse;
    }

    return new Response(
      "Could not update username at this time. Please try again later",
      { status: 500 },
    );
  }
}
