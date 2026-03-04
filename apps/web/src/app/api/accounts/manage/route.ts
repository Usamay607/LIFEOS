import { NextResponse } from "next/server";
import type { CreateAccountInput } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

export async function GET() {
  try {
    const accounts = await losService.listAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "accounts_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateAccountInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const body = parsed.data;
    if (!body.service?.trim() || !body.entityId) {
      return NextResponse.json({ error: "service and entityId are required" }, { status: 400 });
    }

    const account = await losService.createAccount(body);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create account" },
      { status: 400 },
    );
  }
}
