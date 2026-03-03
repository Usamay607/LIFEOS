import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "auth_unlock",
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  const expectedPin = process.env.LOS_DASHBOARD_PIN;
  if (!expectedPin) {
    return NextResponse.json({ ok: true });
  }

  const parsed = await parseJsonBodyWithLimit<{ pin?: string }>(request, 1024);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.data;
  if (body.pin !== expectedPin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("los_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
