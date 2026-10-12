"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { LiveCounter } from "@/components/counters/live-counter";
import { BlackHole } from "@/components/blackhole/black-hole";
import { BirthdayBonus } from "@/components/horizon/birthday-bonus";
import { ProgressBar } from "@/components/counters/progress-bar";
import { PerspectiveStats } from "@/components/stats/perspective-stats";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLifeTables } from "@/hooks/use-life-tables";
import { useNow } from "@/hooks/use-now";
import { computeHorizon } from "@/lib/horizon";
import { useAppStore } from "@/lib/store";

export function HorizonView() {
  const t = useTranslations("Horizon");
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const seenBonusAge = useAppStore((s) => s.birthdayBonusSeenAge);
  const markBonusSeen = useAppStore((s) => s.markBirthdayBonusSeen);
  const data = useLifeTables();
  const now = useNow();

  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  const horizon = useMemo(
    () =>
      profile && data && now
        ? computeHorizon(profile, data, now, seenBonusAge)
        : null,
    [profile, data, now, seenBonusAge],
  );

  if (!horizon) {
    return (
      <p className="py-24 text-center text-dust" role="status">
        {t("loading")}
      </p>
    );
  }

  if (!horizon.ok) {
    // Stored data no longer valid (e.g. edited by hand) — send them to fix it.
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-dust">{t("loading")}</p>
        <Link
          href="/settings"
          className="text-gold underline-offset-4 hover:underline"
        >
          {t("editDetails")}
        </Link>
      </div>
    );
  }

  const { lifespan, snapshot, stats, birthdayBonus } = horizon;
  const weekendsLeft = stats.find((s) => s.id === "weekendsLeft")?.value;
  const percent = format.number(snapshot.percentLived, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
  const bonus = lifespan.outlivedAtBirthExpectancy;
  const location =
    lifespan.source.iso3 === "WLD" ? t("world") : lifespan.source.locationName;

  return (
    <div className="flex w-full flex-col items-center gap-12">
      <p className="sr-only">
        {t("srSummary", { years: horizon.remainingWholeYears, percent })}
      </p>

      {bonus ? (
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold text-balance">
            {t("bonusTitle")}
          </h1>
          <p className="text-gold">{t("bonusBody")}</p>
        </div>
      ) : (
        <h1 className="sr-only">{t("title")}</h1>
      )}

      {birthdayBonus && (
        <BirthdayBonus
          ms={birthdayBonus.ms}
          onDismiss={() => markBonusSeen(birthdayBonus.age)}
        />
      )}

      {/* Full-bleed scene; % lived controls the horizon size and remaining matter. */}
      <div className="relative -mt-4 -mb-6 w-screen">
        <BlackHole
          variant="horizon"
          percentLived={snapshot.percentLived}
          className="h-[min(48svh,460px)] w-full"
        />
      </div>

      <section className="flex w-full max-w-xs flex-col items-center gap-3">
        <p
          className="counter text-4xl font-medium text-starlight"
          aria-hidden="true"
        >
          {percent}%
        </p>
        <ProgressBar percent={snapshot.percentLived} />
        <p className="text-xs text-dust" aria-hidden="true">
          {t("percentLivedCaption")}
        </p>
      </section>

      {settings.hideCountdown ? (
        <p className="max-w-xs text-center text-sm text-dust">
          {t("countdownHidden")}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <LiveCounter
            label={bonus ? t("bonusRemainingLabel") : t("remainingLabel")}
            breakdown={snapshot.remaining.breakdown}
            totals={snapshot.remaining.totals}
            unit={settings.unit}
          />
          <LiveCounter
            label={t("livedLabel")}
            breakdown={snapshot.lived.breakdown}
            totals={snapshot.lived.totals}
            unit={settings.unit}
            size="sm"
          />
        </div>
      )}

      {weekendsLeft !== undefined && weekendsLeft > 0 && (
        <p className="max-w-xs text-center text-lg text-balance text-starlight">
          {t("weekendsLine", { count: weekendsLeft })}
        </p>
      )}

      <PerspectiveStats stats={stats} />

      <Link
        href="/weeks"
        className="rounded-full border border-border px-5 py-3 text-sm text-gold outline-none hover:bg-void-raised focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {t("weeksLink")} →
      </Link>

      <div className="flex max-w-md flex-col gap-2 text-center">
        <p className="text-sm text-starlight">{t("averageNote")}</p>
        <p className="text-xs text-dust">
          {t("source", { location, sex: lifespan.source.sex })}{" "}
          <Link
            href="/about"
            className="rounded-sm text-dust underline underline-offset-4 outline-none hover:text-starlight focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("sourceLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
