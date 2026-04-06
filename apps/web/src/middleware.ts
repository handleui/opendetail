import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  SANDBOX_PREVIEW_DOCUMENT_HEADER,
  SANDBOX_PREVIEW_PATH,
} from "@/lib/ui-sandbox/paths";

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith(SANDBOX_PREVIEW_PATH)) {
    const res = NextResponse.next();
    res.headers.set(SANDBOX_PREVIEW_DOCUMENT_HEADER, "1");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/ui/preview", "/ui/preview/:path*"],
};
