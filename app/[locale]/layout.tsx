import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Readex_Pro } from "next/font/google";
import { HtmlLocale } from "@/components/html-locale";
import { QueryProvider } from "@/providers/query-provider";

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-app",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <>
      <HtmlLocale locale={locale} isRtl={isRtl} fontVar={readexPro.variable} />
      <NextIntlClientProvider messages={messages}>
        <QueryProvider>{children}</QueryProvider>
      </NextIntlClientProvider>
    </>
  );
}
