import { NextResponse } from "next/server";
import type { UpdateEntityInput } from "@los/types";
import { losService } from "@/lib/los-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Entity id is required" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateEntityInput;
    const updated = await losService.updateEntity(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update entity" },
      { status: 400 },
    );
  }
}
