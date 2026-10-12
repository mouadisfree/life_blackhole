import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HorizonView } from "@/components/horizon/horizon-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  // Personal screen: nothing here for search engines.
  return { title: t("horizonTitle"), robots: { index: false } };
}

export default function HorizonPage() {
  return <HorizonView />;
}
