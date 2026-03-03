import { NextResponse } from "next/server";
import type { TaskCompletedWebhookRequest } from "@los/types";
import { losService } from "@/lib/los-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TaskCompletedWebhookRequest;
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const result = await losService.handleTaskCompletedWebhook(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process webhook" },
      { status: 400 },
    );
  }
}
