import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const parsedDays = daysParam ? Number(daysParam) : 14;
    const days = Number.isFinite(parsedDays) ? Math.max(1, Math.min(60, Math.round(parsedDays))) : 14;

    const reminders = await losService.getUpcomingExpenseReminders(days);
    return NextResponse.json(reminders);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load expense reminders" },
      { status: 500 },
    );
  }
}
