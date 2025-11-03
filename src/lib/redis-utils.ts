'use server';

import { redis } from './redis';

export async function getFromRedis(key: string) {
  return redis.get(key);
}

export async function setInRedis(key: string, value: string, expireSeconds?: number) {
  if (expireSeconds) {
    return redis.set(key, value, { ex: expireSeconds });
  }
  return redis.set(key, value);
}

export async function deleteFromRedis(key: string) {
  return redis.del(key);
}