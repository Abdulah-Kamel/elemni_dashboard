import { NextResponse } from "next/server";
import { MOCK_COURSES } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    items: MOCK_COURSES,
    total: MOCK_COURSES.length,
    skip: 0,
    limit: 20,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCourse = {
    id: MOCK_COURSES.length + 1,
    ...body,
    teacher_profile_id: 1,
    created_by_id: 1,
    created_at: new Date().toISOString(),
  };
  return NextResponse.json(newCourse, { status: 201 });
}
