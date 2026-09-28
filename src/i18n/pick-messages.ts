export type ClientMessages = Record<string, unknown>

export const AUTH_CLIENT_NAMESPACES = [
  "auth",
  "sign_in",
  "sign_up",
  "forgot_password",
  "reset_password",
] as const

export function pickMessages(
  messages: ClientMessages,
  namespaces: readonly string[]
): ClientMessages {
  return Object.fromEntries(
    namespaces.flatMap((namespace) =>
      namespace in messages ? [[namespace, messages[namespace]]] : []
    )
  )
}
