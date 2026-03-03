import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expectedPin = process.env.LOS_DASHBOARD_PIN;
  if (!expectedPin) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json()) as { pin?: string };
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
