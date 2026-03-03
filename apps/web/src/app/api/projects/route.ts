import { NextResponse } from "next/server";
import type { ProjectStatus } from "@los/types";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const allowedStatuses: ProjectStatus[] = ["ACTIVE", "ON_HOLD", "CEASED"];

    if (statusParam && !allowedStatuses.includes(statusParam as ProjectStatus)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const status = statusParam as ProjectStatus | null;
    const projects = await losService.listProjects(status ?? undefined);
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list projects" },
      { status: 500 },
    );
  }
}
