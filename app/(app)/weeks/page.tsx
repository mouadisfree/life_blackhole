import type { Metadata } from "next";
import { preload } from "react-dom";
import { getTranslations } from "next-intl/server";
import { LIFE_TABLES_URL } from "@/lib/life-expectancy";
import { WeeksView } from "@/components/weeks/weeks-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("weeksTitle"), robots: { index: false } };
}

export default function WeeksPage() {
  // Start downloading the life tables with the HTML, before any JS runs.
  preload(LIFE_TABLES_URL, { as: "fetch", crossOrigin: "anonymous" });
  return <WeeksView />;
}
