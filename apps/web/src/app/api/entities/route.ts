import { NextResponse } from "next/server";
import type { CreateEntityInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") !== "false";
  const entities = await losService.listEntities(includeArchived);
  return NextResponse.json(entities);
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "entities_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateEntityInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!body.name?.trim() || !body.areaId || !body.type) {
      return NextResponse.json({ error: "name, areaId, and type are required" }, { status: 400 });
    }

    const entity = await losService.createEntity(body);
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create entity" },
      { status: 400 },
    );
  }
}
