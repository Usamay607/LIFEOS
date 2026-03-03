import { NextResponse } from "next/server";
import type { CreateEntityInput } from "@los/types";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") !== "false";
  const entities = await losService.listEntities(includeArchived);
  return NextResponse.json(entities);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateEntityInput;
    if (!body.name?.trim() || !body.areaId || !body.type) {
      return NextResponse.json({ error: "name, areaId, and type are required" }, { status: 400 });
    }

    const entity = await losService.createEntity(body);
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create entity" },
      { status: 400 },
    );
  }
}
