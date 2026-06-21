import { redis } from "./redis";
import { type CachedPost } from "~/types/credibility";

export async function getCachedPost(
  postId: string,
): Promise<CachedPost | null> {
  try {
    const cached = await redis.hgetall(`post:${postId}`);

    if (!cached?.id) {
      return null;
    }

    return cached as unknown as CachedPost;
  } catch (error) {
    console.warn(`Failed to read cached post ${postId}:`, error);
    return null;
  }
}

export function parseCachedContent(content: unknown) {
  if (typeof content !== "string") {
    return content;
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    return content;
  }
}
