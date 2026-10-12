import { getTranslations } from "next-intl/server";

// Phase 1 placeholder: proves tokens, fonts and i18n are wired.
// The real landing (birth-date input + idle black hole) arrives in Phase 3.
export default async function Home() {
  const t = await getTranslations("Landing");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div
        aria-hidden="true"
        className="relative size-48 rounded-full bg-void shadow-[0_0_80px_10px_var(--ember),0_0_160px_40px_color-mix(in_oklch,var(--gold),transparent_70%)] motion-safe:animate-orbit"
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

      <p className="counter text-sm text-gold">{t("comingSoon")}</p>
    </main>
  );
}
