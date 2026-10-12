import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WeeksView } from "@/components/weeks/weeks-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("weeksTitle"), robots: { index: false } };
}

export default function WeeksPage() {
  return <WeeksView />;
}
