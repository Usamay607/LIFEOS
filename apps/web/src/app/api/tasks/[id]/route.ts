import { NextResponse } from "next/server";
import type { UpdateTaskInput } from "@los/types";
import { losService } from "@/lib/los-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }
    const body = (await request.json()) as UpdateTaskInput;
    const task = await losService.updateTask(id, body);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 400 },
    );
  }
}
