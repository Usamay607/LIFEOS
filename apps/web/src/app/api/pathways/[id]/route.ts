import { NextResponse } from "next/server";
import type { UpdatePathwayInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = rateLimit(request, {
    namespace: "pathways_update",
    limit: 180,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Pathway id is required" }, { status: 400 });
    }

    const parsed = await parseJsonBodyWithLimit<UpdatePathwayInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const pathway = await losService.updatePathway(id, parsed.data);
    return NextResponse.json(pathway);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update pathway" },
      { status: 400 },
    );
  }
}
