// English only for now. French and Arabic (RTL) are planned — see PROGRESS.md D7.
export const locales = ["en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";

const rtlLocales: ReadonlySet<string> = new Set(["ar"]);

export function getDirection(locale: string): "ltr" | "rtl" {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}
