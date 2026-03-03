import { NextResponse } from "next/server";
import type { UpsertFocusStateInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const state = await losService.getFocusState(date);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load focus state" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const guard = rateLimit(request, {
    namespace: "focus_state_upsert",
    limit: 180,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<UpsertFocusStateInput>(request, 12_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!Array.isArray(body.outcomes) || !Array.isArray(body.completed)) {
      return NextResponse.json({ error: "outcomes and completed arrays are required" }, { status: 400 });
    }
    if (body.outcomes.length < 3 || body.completed.length < 3) {
      return NextResponse.json({ error: "focus state requires 3 outcomes and 3 completion flags" }, { status: 400 });
    }

    const state = await losService.upsertFocusState(body);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save focus state" },
      { status: 400 },
    );
  }
}
