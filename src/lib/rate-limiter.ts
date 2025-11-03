import { redis } from './redis';

export async function checkRateLimit(userId: string, actionType: string, limitSeconds: number = 5): Promise<boolean> {
  const key = `ratelimit:${actionType}:${userId}`;
  const exists = await redis.get(key);
  
  if (exists) {
    return false;
  }
  
  await redis.set(key, '1', { ex: limitSeconds });
  return true;
}