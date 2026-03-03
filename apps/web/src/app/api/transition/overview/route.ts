import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET() {
  const overview = await losService.getTransitionOverview();
  return NextResponse.json(overview);
}
