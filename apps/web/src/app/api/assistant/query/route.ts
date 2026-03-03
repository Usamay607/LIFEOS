import { NextResponse } from "next/server";
import type { AssistantQueryRequest, RedactionLevel } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "assistant_query",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<AssistantQueryRequest>(request, 12_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    const redactionLevel: RedactionLevel = body.redactionLevel === "STANDARD" ? "STANDARD" : "STRICT";

    if (!body.question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const response = await losService.queryAssistant({
      question: body.question,
      redactionLevel,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process assistant query" },
      { status: 400 },
    );
  }
}
