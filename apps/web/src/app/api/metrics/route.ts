import { NextResponse } from "next/server";
import type { CreateMetricInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const metrics = await losService.listMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list metrics" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "metrics_create",
    limit: 180,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateMetricInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;
    if (!body.metricName?.trim() || !body.category || !body.unit || !body.date || !Number.isFinite(body.value)) {
      return NextResponse.json({ error: "metricName, category, unit, date, and numeric value are required" }, { status: 400 });
    }

    const metric = await losService.createMetric(body);
    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create metric" },
      { status: 400 },
    );
  }
}
