import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";
import { Readex_Pro } from "next/font/google";

import "./globals.css";

export const metadata: Metadata = {
  title: "Elemni Teacher Dashboard",
  description: "Frontend for an LMS serving Egyptian teachers",
};

const readexPro = Readex_Pro({ subsets: ["arabic", "latin"], variable: "--font-app", display: "swap", weight: ["400", "500", "600", "700"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = h.get("x-pathname")?.split("/")[1] === "en" ? "en" : "ar";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={readexPro.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){document.documentElement.classList.add('light')}` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
