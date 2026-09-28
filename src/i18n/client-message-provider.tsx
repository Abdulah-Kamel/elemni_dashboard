import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { pickMessages } from "@/i18n/pick-messages"

export async function ClientMessageProvider({
  namespaces,
  children,
}: {
  namespaces: readonly string[]
  children: React.ReactNode
}) {
  const allMessages = (await getMessages()) as Record<string, unknown>
  return (
    <NextIntlClientProvider messages={pickMessages(allMessages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  )
}
