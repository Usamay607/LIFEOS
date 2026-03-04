import { NextResponse } from "next/server";
import type { CreatePathwayInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const pathways = await losService.listPathways();
    return NextResponse.json(pathways);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list pathways" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "pathways_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreatePathwayInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const pathway = await losService.createPathway(body);
    return NextResponse.json(pathway, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create pathway" },
      { status: 400 },
    );
  }
}
