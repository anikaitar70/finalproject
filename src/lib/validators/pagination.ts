import { z } from "zod";

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
