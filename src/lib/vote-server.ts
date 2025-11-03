'use server';

import { getFromRedis, setInRedis } from './redis-utils';

export async function checkVoteRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:vote:${userId}`;
  const exists = await getFromRedis(key);
  
  if (exists) {
    return false;
  }
  
  await setInRedis(key, '1', 5); // 5 second cooldown between votes
  return true;
}