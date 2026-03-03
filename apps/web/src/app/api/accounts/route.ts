import { NextResponse } from "next/server";
import type { RedactionLevel } from "@los/types";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("redactionLevel") as RedactionLevel | null;
  const redactionLevel: RedactionLevel = requested === "STANDARD" ? "STANDARD" : "STRICT";

  const accounts = await losService.listAccountReferences(redactionLevel);
  return NextResponse.json({ redactionLevel, accounts });
}
