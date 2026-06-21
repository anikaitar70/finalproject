import { redis } from "./redis";

/**
 * Atomically acquire a rate-limit slot using SET NX EX.
 * Returns true when the action is allowed, false when rate-limited.
 * Fails open when Redis is unavailable so the app keeps working.
 */
export async function checkRateLimit(
  userId: string,
  actionType: string,
  limitSeconds = 5,
): Promise<boolean> {
  const key = `ratelimit:${actionType}:${userId}`;

  try {
    const result = await redis.set(key, "1", { nx: true, ex: limitSeconds });
    return result === "OK";
  } catch (error) {
    console.warn(`Rate limit check failed for ${actionType}:`, error);
    return true;
  }
}
