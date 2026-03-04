import { NextResponse } from "next/server";
import type { CreateReviewNoteInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const parsedLimit = limitParam ? Number(limitParam) : 12;
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(50, Math.round(parsedLimit))) : 12;

    const reviews = await losService.listReviews(limit);
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "reviews_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateReviewNoteInput>(request, 12_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!body.reviewDate || !Array.isArray(body.topThreeNextWeek)) {
      return NextResponse.json({ error: "reviewDate and topThreeNextWeek[] are required" }, { status: 400 });
    }

    const created = await losService.createReviewNote({
      reviewDate: body.reviewDate,
      wins: Array.isArray(body.wins) ? body.wins : [],
      stuck: Array.isArray(body.stuck) ? body.stuck : [],
      topThreeNextWeek: body.topThreeNextWeek,
      runwayCommentary: body.runwayCommentary ?? "",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create review note" },
      { status: 400 },
    );
  }
}
