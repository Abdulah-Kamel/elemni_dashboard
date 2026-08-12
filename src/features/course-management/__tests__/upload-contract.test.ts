import { describe, expect, it, vi } from "vitest";
import {
  itemOutSchema,
  tusCredentialsSchema,
  uploadUrlResponseSchema,
} from "@/features/course-management/items-schema";

const tusMock = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
  start: vi.fn(),
}));

vi.mock("tus-js-client", () => ({
  Upload: class MockUpload {
    private options: {
      onProgress?: (uploaded: number, total: number) => void;
      onSuccess?: () => void;
    };

    constructor(_file: File, options: Record<string, unknown>) {
      tusMock.options = options;
      this.options = options;
    }

    start() {
      tusMock.start();
      this.options.onProgress?.(5, 10);
      this.options.onSuccess?.();
    }
  },
}));

import { uploadVideoToBunnyTus } from "@/lib/tus-upload";

describe("upload contracts", () => {
  it("parses the backend document upload response", () => {
    const response = uploadUrlResponseSchema.parse({
      upload_url: "https://storage.example.test/signed",
      key: "courses/1/lessons/2/items/3.pdf",
      public_url: "https://cdn.example.test/courses/1/lessons/2/items/3.pdf",
    });

    expect(response.key).toBe("courses/1/lessons/2/items/3.pdf");
  });

  it("keeps the backend video processing status", () => {
    const item = itemOutSchema.parse({
      id: 3,
      lesson_id: 2,
      title: "Video",
      bunny_stream_id: "video-guid",
      bunny_stream_status: "uploading",
      document_path: null,
      exam_id: null,
      order: 1,
    });

    expect(item.bunny_stream_status).toBe("uploading");
  });

  it("starts Bunny TUS with the backend credentials", async () => {
    const credentials = tusCredentialsSchema.parse({
      video_id: "video-guid",
      library_id: 42,
      expiration_time: 2_000_000_000,
      signature: "signature",
      embed_url: "https://player.example.test/embed/42/video-guid",
    });
    const progress = vi.fn();

    await uploadVideoToBunnyTus(
      new File(["video"], "lesson.mp4", { type: "video/mp4" }),
      credentials,
      progress,
    );

    expect(tusMock.start).toHaveBeenCalledOnce();
    expect(tusMock.options).toMatchObject({
      endpoint: "https://video.bunnycdn.com/tusupload",
      headers: {
        AuthorizationSignature: "signature",
        AuthorizationExpire: "2000000000",
        VideoId: "video-guid",
        LibraryId: "42",
      },
      metadata: { filetype: "video/mp4", title: "lesson.mp4" },
    });
    expect(progress).toHaveBeenCalledWith(50);
  });
});
