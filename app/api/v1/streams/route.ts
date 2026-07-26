import { NextResponse } from "next/server";
import { MOCK_STREAMS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(MOCK_STREAMS);
}
