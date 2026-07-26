import { NextResponse } from "next/server";
import { MOCK_LESSON_ITEMS } from "@/lib/mock-data";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  const items = MOCK_LESSON_ITEMS[id] ?? [];
  return NextResponse.json(items);
}
