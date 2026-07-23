"use client";

import { Upload } from "lucide-react";

export function UploadFAB() {
  return (
    <button
      className="fixed bottom-6 end-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95"
      aria-label="Upload"
    >
      <Upload className="size-6" />
    </button>
  );
}
