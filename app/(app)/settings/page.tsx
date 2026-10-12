import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsView } from "@/components/settings/settings-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("settingsTitle"), robots: { index: false } };
}

export default function SettingsPage() {
  return <SettingsView />;
}
