import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";
import { logInfo } from "~/lib/logger";
import {
  applySecurityHeaders,
  attachRequestId,
  isProtectedRoute,
} from "~/lib/security-headers";

export async function middleware(req: NextRequest) {
  const requestId =
    req.headers.get("x-request-id") ??
    req.headers.get("x-correlation-id") ??
    crypto.randomUUID();

  const pathname = req.nextUrl.pathname;

  if (pathname === "/api/health") {
    const response = NextResponse.next();
    attachRequestId(req, response);
    return applySecurityHeaders(response);
  }

  let response: NextResponse;

  if (isProtectedRoute(pathname)) {
    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });

    if (!token) {
      response = NextResponse.redirect(new URL("/login", req.nextUrl));
    } else if (
      (pathname.startsWith("/admin") || pathname.startsWith("/dev")) &&
      token.role !== "ADMIN"
    ) {
      response = NextResponse.redirect(new URL("/", req.nextUrl));
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  response.headers.set("x-request-id", requestId);

  if (pathname.startsWith("/api/")) {
    logInfo("http.request", {
      requestId,
      method: req.method,
      path: pathname,
    });
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
