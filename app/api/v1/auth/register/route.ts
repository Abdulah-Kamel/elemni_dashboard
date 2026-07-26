import { NextResponse } from "next/server";
import { MOCK_USER } from "@/lib/mock-data";

export async function POST() {
  return NextResponse.json(MOCK_USER, { status: 201 });
}
