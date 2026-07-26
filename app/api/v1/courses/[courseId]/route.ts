import { NextResponse } from "next/server";
import { MOCK_COURSES } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const course = MOCK_COURSES.find((c) => c.id === id);

  if (!course) {
    return NextResponse.json({ detail: "Course not found" }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const course = MOCK_COURSES.find((c) => c.id === id);

  if (!course) {
    return NextResponse.json({ detail: "Course not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = { ...course, ...body };
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const id = Number(courseId);
  const course = MOCK_COURSES.find((c) => c.id === id);

  if (!course) {
    return NextResponse.json({ detail: "Course not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
