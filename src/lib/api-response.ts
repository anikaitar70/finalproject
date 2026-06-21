import { z } from "zod";

export function invalidRequestResponse(): Response {
  return new Response("Invalid request", { status: 400 });
}

export function validationErrorResponse(error: unknown): Response | null {
  if (error instanceof z.ZodError) {
    return invalidRequestResponse();
  }

  return null;
}
