import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BlackHole } from "@/components/blackhole/black-hole";
import { LandingEntry } from "@/components/landing/landing-entry";
import { SITE_URL } from "@/lib/site";

export default async function Home() {
  const t = await getTranslations("Landing");
  const tm = await getTranslations("Metadata");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tm("title"),
    description: tm("description"),
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main
      id="main"
      className="relative flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center"
    >
      <script
        type="application/ld+json"
        // Static, server-built JSON (no user data).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Idle black hole: lightweight 2D canvas on the landing page (D8). */}
      <BlackHole
        variant="idle"
        percentLived={35}
        className="-my-6 h-64 w-screen max-w-xl sm:h-80"
      />

      <div className="flex max-w-md flex-col gap-4">
        <p className="text-sm tracking-[0.3em] text-dust uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold text-balance sm:text-4xl">
          {t("headline")}
        </h1>
        <p className="text-pretty text-dust">{t("subline")}</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <LandingEntry />
        <p className="text-xs text-dust">
          {t("privacy")}{" "}
          <Link
            href="/about"
            className="rounded-sm underline underline-offset-4 outline-none hover:text-starlight focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("aboutLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
