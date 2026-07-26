import { NextResponse } from "next/server";
import { MOCK_LESSONS } from "@/lib/mock-data";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const lessons = MOCK_LESSONS[id] ?? [];
  return NextResponse.json(lessons);
}
