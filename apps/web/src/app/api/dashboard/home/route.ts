import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET() {
  try {
    const payload = await losService.getHomeDashboard();
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build dashboard payload" },
      { status: 500 },
    );
  }
}
