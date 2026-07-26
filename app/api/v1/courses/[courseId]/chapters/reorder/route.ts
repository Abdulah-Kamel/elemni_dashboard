import { NextResponse } from "next/server";
import { MOCK_CHAPTERS } from "@/lib/mock-data";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const chapters = MOCK_CHAPTERS[id] ?? [];
  return NextResponse.json(chapters);
}
