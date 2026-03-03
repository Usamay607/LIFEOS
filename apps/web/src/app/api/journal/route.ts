import { NextResponse } from "next/server";
import type { CreateJournalEntryInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "0");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : undefined;

  const entries = await losService.listJournalEntries(limit);
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "journal_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateJournalEntryInput>(request, 32_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!body.title?.trim() || !body.entry?.trim()) {
      return NextResponse.json({ error: "title and entry are required" }, { status: 400 });
    }

    const created = await losService.createJournalEntry(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create journal entry" },
      { status: 400 },
    );
  }
}
