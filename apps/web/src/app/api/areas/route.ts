import { NextResponse } from "next/server";
import { losService } from "@/lib/los-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") !== "false";
  const areas = await losService.listAreas(activeOnly);
  return NextResponse.json(areas);
}
