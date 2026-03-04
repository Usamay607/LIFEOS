import { NextResponse } from "next/server";
import type { CreateProjectInput, ProjectStatus } from "@los/types";
import { losService } from "@/lib/los-service";
import { parseJsonBodyWithLimit, rateLimit, rateLimitExceededResponse } from "@/lib/api-guard";

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

export async function POST(request: Request) {
  const guard = rateLimit(request, {
    namespace: "projects_create",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!guard.ok) {
    return rateLimitExceededResponse(guard.retryAfterSeconds);
  }

  try {
    const parsed = await parseJsonBodyWithLimit<CreateProjectInput>(request, 8_000);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const body = parsed.data;
    if (!body.name?.trim() || !body.entityId) {
      return NextResponse.json({ error: "name and entityId are required" }, { status: 400 });
    }

    const project = await losService.createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 400 },
    );
  }
}
