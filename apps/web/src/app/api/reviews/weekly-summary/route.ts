import { NextResponse } from "next/server";
import type { WeeklySummaryRequest } from "@los/types";
import { losService } from "@/lib/los-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WeeklySummaryRequest;
    const validRedaction = body.redactionLevel === "STRICT" || body.redactionLevel === "STANDARD";
    const validWindow =
      typeof body.taskWindowDays === "number" && Number.isFinite(body.taskWindowDays) && body.taskWindowDays > 0 && body.taskWindowDays <= 90;

    if (!body.reviewDate || !validWindow || !validRedaction) {
      return NextResponse.json(
        { error: "reviewDate, taskWindowDays(1-90), redactionLevel(STRICT|STANDARD) are required" },
        { status: 400 },
      );
    }

    const summary = await losService.generateWeeklySummary(body);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 400 },
    );
  }
}
