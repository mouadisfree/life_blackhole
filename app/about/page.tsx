import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import lifeTables from "@/data/life-tables.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("aboutTitle"), description: t("aboutDescription") };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-starlight">{title}</h2>
      <div className="flex flex-col gap-3 text-pretty text-dust">
        {children}
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  const tw = await getTranslations("Wellbeing");
  const { source } = lifeTables;
  const countries = Object.keys(lifeTables.locations).length - 1; // minus World

  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pt-6 pb-8"
      >
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-balance">{t("title")}</h1>
          <p className="text-lg text-pretty text-starlight">{t("lede")}</p>
        </header>

        <Section title={t("numbersTitle")}>
          <p>{t("numbersBody")}</p>
        </Section>

        <Section title={t("methodTitle")}>
          <p>{t("methodBody1", { year: source.year })}</p>
          <p>{t("methodBody2")}</p>
          <p>{t("methodBody3")}</p>
        </Section>

        <Section title={t("sourceTitle")}>
          <p>
            {t("sourceBody", {
              citation: source.citation,
              year: source.year,
              count: countries,
            })}{" "}
            <a
              href={source.url}
              className="rounded-sm text-gold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("sourceLink")}
            </a>
          </p>
          <p className="text-sm">{t("licenseNote")}</p>
        </Section>

        <Section title={t("statsTitle")}>
          <p>{t("statsBody")}</p>
        </Section>

        <Section title={t("privacyTitle")}>
          <p>{t("privacyBody")}</p>
        </Section>

        <section className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-void-raised/60 p-6 text-center">
          <h2 className="text-xl font-semibold text-gold">
            {t("averageTitle")}
          </h2>
          <p className="text-dust">{t("averageBody")}</p>
          <Link
            href="/horizon"
            className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("start")}
          </Link>
        </section>

        <p className="text-center text-xs text-dust">{tw("note")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
