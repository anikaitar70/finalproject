import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (token.email !== "anikaitar@gmail.com") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/r/:path*/submit", "/r/create", "/admin/:path*"],
};
