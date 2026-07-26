import { NextResponse } from "next/server";
import { MOCK_LESSON_ITEMS } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  const items = MOCK_LESSON_ITEMS[id] ?? [];

  return NextResponse.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  const body = await request.json();
  const items = MOCK_LESSON_ITEMS[id] ?? [];
  const newItem = {
    id: Date.now(),
    lesson_id: id,
    title: body.title,
    bunny_stream_id: null,
    document_path: null,
    exam_id: null,
    order: items.length + 1,
  };
  return NextResponse.json(newItem, { status: 201 });
}
