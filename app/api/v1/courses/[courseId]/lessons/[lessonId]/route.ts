import { NextResponse } from "next/server";
import { MOCK_LESSONS } from "@/lib/mock-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  const lId = Number(lessonId);

  const allLessons = Object.values(MOCK_LESSONS).flat();
  const lesson = allLessons.find((l) => l.id === lId);

  if (!lesson) {
    return NextResponse.json({ detail: "Lesson not found" }, { status: 404 });
  }

  const body = await request.json();
  return NextResponse.json({ ...lesson, ...body });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  return new NextResponse(null, { status: 204 });
}
