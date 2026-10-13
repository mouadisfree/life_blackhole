import { Grid3x3, Orbit, Settings } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  return (
    <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
      <Link
        href="/"
        className="rounded-md text-sm font-medium tracking-[0.2em] text-haze uppercase outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {t("home")}
      </Link>
      <nav aria-label={t("primary")} className="flex items-center gap-1">
        <Link
          href="/horizon"
          aria-label={t("horizon")}
          className="grid size-11 place-items-center rounded-full text-haze outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Orbit aria-hidden="true" className="size-5" />
        </Link>
        <Link
          href="/weeks"
          aria-label={t("weeks")}
          className="grid size-11 place-items-center rounded-full text-haze outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Grid3x3 aria-hidden="true" className="size-5" />
        </Link>
        <Link
          href="/settings"
          aria-label={t("settings")}
          className="grid size-11 place-items-center rounded-full text-haze outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Settings aria-hidden="true" className="size-5" />
        </Link>
      </nav>
    </header>
  );
}
