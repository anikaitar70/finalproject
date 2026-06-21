import { z } from "zod";

export const CommentValidator = z.object({
  postId: z.string().min(1),
  text: z.string().trim().min(1).max(10_000),
  replyToId: z.string().min(1).optional(),
});

export type CommentRequest = z.infer<typeof CommentValidator>;
