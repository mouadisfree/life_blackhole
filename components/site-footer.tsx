import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const link =
    "rounded-sm underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";
  return (
    <footer className="flex flex-col items-center gap-2 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-haze">
      <nav aria-label={t("nav")} className="flex gap-5">
        <Link href="/about" className={link}>
          {t("about")}
        </Link>
        <Link href="/weeks" className={link}>
          {t("weeks")}
        </Link>
        <Link href="/settings" className={link}>
          {t("settings")}
        </Link>
      </nav>
      <p>{t("madeWith")}</p>
    </footer>
  );
}
