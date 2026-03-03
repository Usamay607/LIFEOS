import { NextResponse } from "next/server";
import type { AssistantQueryRequest, RedactionLevel } from "@los/types";
import { losService } from "@/lib/los-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantQueryRequest;
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
