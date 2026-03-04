import { NextResponse } from "next/server";
import type { CreateHealthLogInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const logs = await losService.listHealthLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list health logs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "health_logs_create",
    limit: 220,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const parsed = await parseJsonBodyWithLimit<CreateHealthLogInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const body = parsed.data;
    if (!body.date || !body.entityId) {
      return NextResponse.json({ error: "date and entityId are required" }, { status: 400 });
    }

    const created = await losService.createHealthLog(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create health log" },
      { status: 400 },
    );
  }
}
