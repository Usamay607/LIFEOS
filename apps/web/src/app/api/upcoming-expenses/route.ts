import { NextResponse } from "next/server";
import type { CreateUpcomingExpenseInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const expenses = await losService.listUpcomingExpenses(true);
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list upcoming expenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "upcoming_expenses_create",
    limit: 200,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateUpcomingExpenseInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;
    if (!body.bill?.trim() || !body.entityId || !body.frequency || !body.dueDate || !Number.isFinite(body.amount)) {
      return NextResponse.json({ error: "bill, entityId, frequency, dueDate, and numeric amount are required" }, { status: 400 });
    }

    const expense = await losService.createUpcomingExpense(body);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create upcoming expense" },
      { status: 400 },
    );
  }
}
