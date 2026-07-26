import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    url: "https://mock-storage.example.com/upload/video.mp4",
    key: "uploads/mock-key-12345",
  });
}
