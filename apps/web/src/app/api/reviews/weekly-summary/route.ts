import { NextResponse } from "next/server";
import type { WeeklySummaryRequest } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "weekly_summary",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<WeeklySummaryRequest>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
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
