// =============================================================================
// Proxy — protect routes that require authentication (Next.js 16)
// =============================================================================
// Next.js 16 renamed middleware.ts → proxy.ts. The export is `proxy`, not
// `middleware`. This runs before the request reaches route handlers.
// We redirect unauthenticated users to the sign-in page.
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();

  // If unauthenticated and hitting a protected route, redirect to sign-in
  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect /problems/* pages (not /api/* — those return 401 JSON)
  matcher: ["/problems/:path*"],
};
