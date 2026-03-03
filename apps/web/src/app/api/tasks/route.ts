import { NextResponse } from "next/server";
import type { CreateTaskInput } from "@los/types";
import { losService } from "@/lib/los-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTaskInput;
    if (!body.title?.trim() || !body.projectId) {
      return NextResponse.json({ error: "title and projectId are required" }, { status: 400 });
    }

    const task = await losService.createTask(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 400 },
    );
  }
}
