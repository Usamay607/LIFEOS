import { NextResponse } from "next/server";
import type { CreateTransactionInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const transactions = await losService.listTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list transactions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "transactions_create",
    limit: 240,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateTransactionInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;
    if (!body.date || !body.entityId || !body.category?.trim() || !body.type || !Number.isFinite(body.amount)) {
      return NextResponse.json({ error: "date, entityId, category, type, and numeric amount are required" }, { status: 400 });
    }

    const transaction = await losService.createTransaction(body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create transaction" },
      { status: 400 },
    );
  }
}
