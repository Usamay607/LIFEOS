import { NextResponse } from "next/server";
import type { CreateTaskInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "tasks_create",
    limit: 240,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateTaskInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!body.title?.trim() || !body.projectId) {
      return NextResponse.json({ error: "title and projectId are required" }, { status: 400 });
    }

    const task = await losService.createTask(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 400 },
    );
  }
}
