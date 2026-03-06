import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/api/auth/unlock", "/api/auth/logout"];

function resolveNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function proxy(request: NextRequest) {
  const pin = process.env.LOS_DASHBOARD_PIN;
  if (!pin) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const authenticated = request.cookies.get("los_auth")?.value === "1";
  if (pathname === "/unlock") {
    if (authenticated) {
      const redirectTarget = resolveNextPath(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
