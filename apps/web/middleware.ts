// apps/web/middleware.ts - Temporarily disabled for Vercel edge runtime compatibility
// TODO: Migrate to edge-compatible auth checks

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Pass through all requests for now
  // Auth checks will be done in page-level layout components
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|legacy/).*)",
  ],
};