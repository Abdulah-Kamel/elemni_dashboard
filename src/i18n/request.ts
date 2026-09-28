import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { loadMessages } from "./messages/load";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale as "ar" | "en"),
  };
});