"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BirthForm } from "@/components/birth-form";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAppStore } from "@/lib/store";

export function LandingEntry() {
  const t = useTranslations("Landing");
  const tf = useTranslations("BirthForm");
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  // Same height before/after hydration to avoid layout shift.
  if (!hydrated) return <div className="h-44 w-full" aria-hidden="true" />;

  if (profile) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <p className="text-haze">{t("returning")}</p>
        <Button
          asChild
          size="lg"
          className="h-12 w-full rounded-full text-base"
        >
          <Link href="/horizon">{t("returnCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <BirthForm
      initial={null}
      submitLabel={tf("submit")}
      onSubmit={(p) => {
        setProfile(p);
        router.push("/horizon");
      }}
    />
  );
}
