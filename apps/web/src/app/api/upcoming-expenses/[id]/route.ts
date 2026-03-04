import { NextResponse } from "next/server";
import type { UpdateUpcomingExpenseInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = rateLimit(request, {
    namespace: "upcoming_expenses_update",
    limit: 240,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Upcoming expense id is required" }, { status: 400 });
    }

    const parsed = await parseJsonBodyWithLimit<UpdateUpcomingExpenseInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const expense = await losService.updateUpcomingExpense(id, parsed.data);
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update upcoming expense" },
      { status: 400 },
    );
  }
}
