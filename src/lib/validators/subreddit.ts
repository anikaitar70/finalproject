import { z } from "zod";

const subredditNameSchema = z
  .string()
  .trim()
  .min(3)
  .max(21)
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Community name can only contain letters, numbers, and underscores",
  });

export const SubredditValidator = z.object({
  name: subredditNameSchema,
});

export const SubredditSubscriptionValidator = z.object({
  subredditId: z.string().min(1),
});

export type CreateSubredditPayload = z.infer<typeof SubredditValidator>;
export type SubscribeToSubredditPayload = z.infer<
  typeof SubredditSubscriptionValidator
>;
