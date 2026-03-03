import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET() {
  const runway = await losService.getRunway();
  return NextResponse.json(runway);
}
