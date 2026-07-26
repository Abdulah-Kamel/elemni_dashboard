import { NextResponse } from "next/server";
import { MOCK_LESSON_ITEMS } from "@/lib/mock-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; itemId: string }> },
) {
  const { itemId } = await params;
  const id = Number(itemId);

  const allItems = Object.values(MOCK_LESSON_ITEMS).flat();
  const item = allItems.find((i) => i.id === id);

  if (!item) {
    return NextResponse.json({ detail: "Item not found" }, { status: 404 });
  }

  const body = await request.json();
  return NextResponse.json({ ...item, ...body });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; itemId: string }> },
) {
  return new NextResponse(null, { status: 204 });
}
