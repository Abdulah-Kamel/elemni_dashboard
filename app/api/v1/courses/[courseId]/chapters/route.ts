import { NextResponse } from "next/server";
import { MOCK_CHAPTERS } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const chapters = MOCK_CHAPTERS[id] ?? [];

  return NextResponse.json(chapters);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const body = await request.json();
  const chapters = MOCK_CHAPTERS[id] ?? [];
  const newChapter = {
    id: Date.now(),
    course_id: id,
    title: body.title,
    order: chapters.length + 1,
  };
  return NextResponse.json(newChapter, { status: 201 });
}
