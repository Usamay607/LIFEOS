import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET() {
  try {
    const readiness = await losService.getSystemReadiness();
    const dashboardPinConfigured = Boolean(process.env.LOS_DASHBOARD_PIN?.trim());

    return NextResponse.json({
      ...readiness,
      dashboardPinConfigured,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build system readiness" },
      { status: 500 },
    );
  }
}
