import { NextResponse } from "next/server";
import type { CreateJournalEntryInput } from "@los/types";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "0");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : undefined;

  const entries = await losService.listJournalEntries(limit);
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateJournalEntryInput;
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
