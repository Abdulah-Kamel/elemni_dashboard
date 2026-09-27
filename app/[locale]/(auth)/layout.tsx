import { ClientMessageProvider } from "@/i18n/client-message-provider"
import { AUTH_CLIENT_NAMESPACES } from "@/i18n/pick-messages"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientMessageProvider
      namespaces={AUTH_CLIENT_NAMESPACES}
    >
      {children}
    </ClientMessageProvider>
  )
}
