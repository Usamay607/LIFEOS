import { NextResponse } from "next/server";
import type { UpdateRelationshipCheckinInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = rateLimit(request, {
    namespace: "relationship_checkins_update",
    limit: 220,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Relationship check-in id is required" }, { status: 400 });

    const parsed = await parseJsonBodyWithLimit<UpdateRelationshipCheckinInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const updated = await losService.updateRelationshipCheckin(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update relationship check-in" },
      { status: 400 },
    );
  }
}
