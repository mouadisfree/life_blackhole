import type { Metadata } from "next";
import { preload } from "react-dom";
import { getTranslations } from "next-intl/server";
import { LIFE_TABLES_URL } from "@/lib/life-expectancy";
import { HorizonView } from "@/components/horizon/horizon-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  // Personal screen: nothing here for search engines.
  return { title: t("horizonTitle"), robots: { index: false } };
}

export default function HorizonPage() {
  // Start downloading the life tables with the HTML, before any JS runs.
  preload(LIFE_TABLES_URL, { as: "fetch", crossOrigin: "anonymous" });
  return <HorizonView />;
}
