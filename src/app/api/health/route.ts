import { prisma } from "~/server/db";
import { redis } from "~/lib/redis";
import { logInfo, logWarn } from "~/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthCheck = {
  database: boolean;
  redis: boolean;
};

export async function GET() {
  const checks: HealthCheck = {
    database: false,
    redis: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;

    const migrationCheck = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'
    `;
    checks.database = migrationCheck.length > 0;
  } catch (error) {
    logWarn("health.database.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${String(pong)}`);
    }

    const probeKey = `health:probe:${Date.now()}`;
    await redis.set(probeKey, "1", { ex: 10 });
    const probeValue = await redis.get(probeKey);
    await redis.del(probeKey);
    checks.redis = probeValue === "1";
  } catch (error) {
    logWarn("health.redis.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  const status =
    checks.database && checks.redis
      ? "healthy"
      : "degraded";

  logInfo("health.check", { status, checks });

  return Response.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: checks.database ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
