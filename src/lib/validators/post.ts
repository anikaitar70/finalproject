import { z } from "zod";

const EditorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string().max(64),
  data: z.record(z.string(), z.unknown()).optional(),
});

const EditorContentSchema = z
  .object({
    time: z.number().optional(),
    version: z.string().optional(),
    blocks: z.array(EditorBlockSchema).max(100),
  })
  .refine((content) => JSON.stringify(content).length <= 100_000, {
    message: "Content exceeds maximum size",
  });

export const PostValidator = z.object({
  content: EditorContentSchema,
  subredditId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(3, {
      message: "Title must be at least 3 characters long",
    })
    .max(128, {
      message: "Title mustn't exceed 128 characters",
    }),
});

export type PostCreationRequest = z.infer<typeof PostValidator>;
