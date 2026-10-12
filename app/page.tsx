import { getTranslations } from "next-intl/server";
import { LandingEntry } from "@/components/landing/landing-entry";

export default async function Home() {
  const t = await getTranslations("Landing");

  return (
    <main
      id="main"
      className="relative flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center"
    >
      {/* Placeholder glow — replaced by the idle black hole in Phase 4. */}
      <div
        aria-hidden="true"
        className="relative size-40 rounded-full bg-void shadow-[0_0_80px_10px_var(--ember),0_0_160px_40px_color-mix(in_oklch,var(--gold),transparent_70%)] sm:size-48"
      >
        <div className="absolute inset-0 rounded-full ring-2 ring-flare/80" />
      </div>

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
        <p className="text-xs text-dust">{t("privacy")}</p>
      </div>
    </main>
  );
}
