import { NextResponse } from "next/server";
import type { CreateRelationshipCheckinInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const checkins = await losService.listRelationshipCheckins();
    return NextResponse.json(checkins);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list relationship check-ins" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "relationship_checkins_create",
    limit: 160,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const parsed = await parseJsonBodyWithLimit<CreateRelationshipCheckinInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const body = parsed.data;
    if (!body.person?.trim() || !body.lastMeaningfulContact || !body.relationType) {
      return NextResponse.json({ error: "person, lastMeaningfulContact, and relationType are required" }, { status: 400 });
    }

    const created = await losService.createRelationshipCheckin(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create relationship check-in" },
      { status: 400 },
    );
  }
}
