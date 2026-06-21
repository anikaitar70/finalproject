import { type NextRequest } from "next/server";
import axios from "axios";

import { validationErrorResponse } from "~/lib/api-response";
import { assertSafeExternalUrl } from "~/lib/ssrf-guard";
import { getServerAuthSession } from "~/server/auth";

const MAX_RESPONSE_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 5000;

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const href = url.searchParams.get("url");

  if (!href) {
    return new Response("Invalid request", { status: 400 });
  }

  const safetyCheck = await assertSafeExternalUrl(href);
  if (!safetyCheck.ok) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const res = await axios.get<string>(safetyCheck.url.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: MAX_RESPONSE_BYTES,
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "CredRankNet-LinkPreview/1.0",
      },
    });

    const html = typeof res.data === "string" ? res.data.slice(0, MAX_RESPONSE_BYTES) : "";

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";

    const descriptionMatch = html.match(
      /<meta name="description" content="(.*?)"/i,
    );
    const description = descriptionMatch?.[1]?.trim() ?? "";

    const imageMatch = html.match(
      /<meta property="og:image" content="(.*?)"/i,
    );
    const imageUrl = imageMatch?.[1]?.trim() ?? "";

    return new Response(
      JSON.stringify({
        success: 1,
        meta: {
          title,
          description,
          image: {
            url: imageUrl,
          },
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Link preview fetch failed:", error);
    return new Response("Unable to fetch link preview", { status: 502 });
  }
}
