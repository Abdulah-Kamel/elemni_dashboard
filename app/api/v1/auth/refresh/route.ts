import { NextResponse } from "next/server";
import { MOCK_TOKENS } from "@/lib/mock-data";

export async function POST() {
  return NextResponse.json({
    access_token: MOCK_TOKENS.access_token,
    refresh_token: MOCK_TOKENS.refresh_token,
  });
}
