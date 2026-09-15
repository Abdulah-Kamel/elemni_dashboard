import { describe, it, expect, vi } from "vitest";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => {
    const map: Record<string, string> = {
      brand: "Elemni",
      brand_subtitle: "School Management",
    };
    return map[key] ?? key;
  },
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} width={props.width} height={props.height} />
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

import { AuthShell } from "@/features/auth/components/auth-shell";

function renderToHtml(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, cb) {
        chunks.push(chunk);
        cb();
      },
    });
    stream.on("finish", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
    renderToPipeableStream(element).pipe(stream);
  });
}

describe("AuthShell layout", () => {
  it("uses full-width container with a responsive max-width, not an invalid max-w-2/4", async () => {
    const html = await renderToHtml(
      <AuthShell title="Sign In" children={<input />} />
    );

    // The inner wrapper div should NOT use spacing-colliding classes
    expect(html).not.toMatch(/max-w-2\/4/);
    expect(html).not.toMatch(/max-w-md/);

    // It should be full-width on small screens (w-full)
    expect(html).toMatch(/w-full/);

    // It should use an explicit max-width to avoid the --spacing-md collision
    expect(html).toMatch(/max-w-\[28rem\]/);
  });
});
