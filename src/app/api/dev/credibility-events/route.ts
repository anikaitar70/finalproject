import { assertAdminApi } from "~/server/admin";
import { redis } from "~/lib/redis";

export async function GET() {
  const forbidden = await assertAdminApi();
  if (forbidden) {
    return forbidden;
  }

  try {
    const raw = await redis.lrange("credibility:events", 0, 49);
    const events = raw.map((entry) => {
      try {
        return JSON.parse(entry as string) as Record<string, unknown>;
      } catch {
        return { raw: entry };
      }
    });

    return new Response(JSON.stringify(events), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error reading credibility events:", error);
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
