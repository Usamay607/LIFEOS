import { NextResponse } from "next/server";
import type { WeeklyReviewDraftRequest } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

type WeeklyDraftBody = WeeklyReviewDraftRequest & {
  review_date?: string;
  task_window_days?: number;
};

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "weekly_review_draft",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<WeeklyDraftBody>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    const reviewDate = body.reviewDate ?? body.review_date;
    const taskWindowDays = body.taskWindowDays ?? body.task_window_days;
    const validWindow = typeof taskWindowDays === "number" && Number.isFinite(taskWindowDays) && taskWindowDays > 0 && taskWindowDays <= 90;

    if (!reviewDate || !validWindow) {
      return NextResponse.json(
        { error: "reviewDate/review_date and taskWindowDays/task_window_days(1-90) are required" },
        { status: 400 },
      );
    }

    const draft = await losService.generateWeeklyReviewDraft({
      reviewDate,
      taskWindowDays,
    });

    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate weekly draft" },
      { status: 400 },
    );
  }
}
