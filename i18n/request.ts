import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// No locale in the URL until a second locale ships (PROGRESS.md D7).
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
