import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATH_PREFIXES = ["/admin", "/dev"] as const;

function isProtectedRoute(pathname: string): boolean {
  if (pathname === "/r/create") {
    return true;
  }

  if (PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /^\/r\/[^/]+\/submit\/?$/.test(pathname);
}

function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://github.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://utfs.io https://*.utfs.io https://avatars.githubusercontent.com https://i.pravatar.cc",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      "https://uploadthing.com",
      "https://*.uploadthing.com",
      "https://ingest.uploadthing.com",
      "https://*.ingest.uploadthing.com",
      "https://*.upstash.io",
      "https://utfs.io",
      "https://*.utfs.io",
    ].join(" "),
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "media-src 'self' blob: https://utfs.io https://*.utfs.io",
    "worker-src 'self' blob:",
  ];

  return directives.join("; ");
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(),
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export function attachRequestId(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    crypto.randomUUID();

  response.headers.set("x-request-id", requestId);
  return response;
}

export { isProtectedRoute };
