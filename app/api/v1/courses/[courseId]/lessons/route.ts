import { NextResponse } from "next/server";
import { MOCK_LESSONS } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapter_id");

  let lessons = MOCK_LESSONS[id] ?? [];

  if (chapterId) {
    lessons = lessons.filter((l) => l.chapter_id === Number(chapterId));
  }

  return NextResponse.json(lessons);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const body = await request.json();
  const lessons = MOCK_LESSONS[id] ?? [];
  const newLesson = {
    id: Date.now(),
    course_id: id,
    chapter_id: body.chapter_id ?? null,
    title: body.title,
    description: body.description ?? null,
    order: lessons.length + 1,
  };
  return NextResponse.json(newLesson, { status: 201 });
}
