import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    id: Date.now(),
    lesson_id: 0,
    title: "Uploaded Video",
    bunny_stream_id: "mock_bunny_stream_id",
    document_path: null,
    exam_id: null,
    order: 1,
  });
}
