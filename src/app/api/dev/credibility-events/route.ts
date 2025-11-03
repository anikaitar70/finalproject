import { redis } from "~/lib/redis";

export async function GET() {
  try {
    // Return last 50 events
    const raw = await redis.lrange("credibility:events", 0, 49);
    const events = raw.map((r) => {
      try {
        return JSON.parse(r as string);
      } catch (e) {
        return { raw: r };
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
