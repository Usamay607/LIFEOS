import { NextResponse } from "next/server";
import type { CreateTimeOffPlanInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const plans = await losService.listTimeOffPlans();
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list transition plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "timeoff_plans_create",
    limit: 140,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) return rateLimitExceededResponse(guard.retryAfterSeconds);

  try {
    const parsed = await parseJsonBodyWithLimit<CreateTimeOffPlanInput>(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

    const body = parsed.data;
    if (!body.title?.trim() || !body.status || !body.priority || !Number.isFinite(body.estimatedCostAud)) {
      return NextResponse.json({ error: "title, status, priority, and numeric estimatedCostAud are required" }, { status: 400 });
    }

    const created = await losService.createTimeOffPlan(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create transition plan" },
      { status: 400 },
    );
  }
}
