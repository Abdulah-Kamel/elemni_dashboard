import { NextResponse } from "next/server";
import { MOCK_CHAPTERS } from "@/lib/mock-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  const { courseId, chapterId } = await params;
  const cId = Number(courseId);
  const chId = Number(chapterId);
  const chapters = MOCK_CHAPTERS[cId] ?? [];
  const chapter = chapters.find((ch) => ch.id === chId);

  if (!chapter) {
    return NextResponse.json({ detail: "Chapter not found" }, { status: 404 });
  }

  const body = await request.json();
  return NextResponse.json({ ...chapter, ...body });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  const { courseId, chapterId } = await params;
  return new NextResponse(null, { status: 204 });
}
