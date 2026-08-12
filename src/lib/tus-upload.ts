import * as tus from "tus-js-client";
import type { TusCredentials } from "@/features/course-management/items-schema";

export function uploadVideoToBunnyTus(
  file: File,
  credentials: TusCredentials,
  onProgress?: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000, 60_000],
      headers: {
        AuthorizationSignature: credentials.signature,
        AuthorizationExpire: String(credentials.expiration_time),
        VideoId: credentials.video_id,
        LibraryId: String(credentials.library_id),
      },
      metadata: {
        filetype: file.type || "application/octet-stream",
        title: file.name,
      },
      removeFingerprintOnSuccess: true,
      onError: reject,
      onProgress: (uploaded, total) => {
        onProgress?.(total > 0 ? Math.round((uploaded / total) * 100) : 0);
      },
      onSuccess: () => resolve(),
    });

    upload.start();
  });
}
