import { NextResponse } from "next/server";
import type { CreateFamilyEventInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const events = await losService.listFamilyEvents();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list family events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "family_events_create",
    limit: 160,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const parsed = await parseJsonBodyWithLimit<CreateFamilyEventInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const body = parsed.data;
    if (!body.title?.trim() || !body.date || !body.category || !body.importance) {
      return NextResponse.json({ error: "title, date, category, and importance are required" }, { status: 400 });
    }

    const created = await losService.createFamilyEvent(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create family event" },
      { status: 400 },
    );
  }
}
