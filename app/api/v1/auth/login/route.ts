import { NextResponse } from "next/server";
import { MOCK_CREDENTIALS, MOCK_TOKENS } from "@/lib/mock-data";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
    return NextResponse.json({
      ...MOCK_TOKENS,
      email: MOCK_CREDENTIALS.email,
      name: "Admin User",
    });
  }

  return NextResponse.json(
    { detail: "Invalid email or password" },
    { status: 401 },
  );
}
