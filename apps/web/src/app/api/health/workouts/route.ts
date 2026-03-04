import { NextResponse } from "next/server";
import type { CreateWorkoutInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const workouts = await losService.listWorkouts();
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list workouts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "workouts_create",
    limit: 220,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const parsed = await parseJsonBodyWithLimit<CreateWorkoutInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const body = parsed.data;
    if (!body.date || !body.entityId || !body.sessionType || !body.intensity) {
      return NextResponse.json({ error: "date, entityId, sessionType, and intensity are required" }, { status: 400 });
    }

    const created = await losService.createWorkout(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create workout" },
      { status: 400 },
    );
  }
}
