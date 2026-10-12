"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLifeTables } from "@/hooks/use-life-tables";
import { useNow } from "@/hooks/use-now";
import { getDirection } from "@/i18n/config";
import { computeHorizon } from "@/lib/horizon";
import { useAppStore } from "@/lib/store";
import { WeeksGrid } from "./weeks-grid";

export function WeeksView() {
  const t = useTranslations("Weeks");
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const data = useLifeTables();
  const now = useNow();
  // The grid only changes weekly; recompute once a minute, not every second.
  const minute = now ? Math.floor(now.getTime() / 60_000) : null;

  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  const horizon = useMemo(
    () =>
      profile && data && minute !== null
        ? computeHorizon(profile, data, new Date(minute * 60_000))
        : null,
    [profile, data, minute],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-dust">{t("intro")}</p>
      </header>

      {!horizon?.ok ? (
        <p role="status" className="py-16 text-center text-dust">
          {t("loading")}
        </p>
      ) : (
        <>
          <p className="text-starlight tabular-nums">
            {t("summary", {
              lived: horizon.weeks.livedWeeks,
              remaining: horizon.weeks.totalWeeks - horizon.weeks.livedWeeks,
            })}
          </p>

          <ul
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-dust"
            aria-label={t("legend")}
          >
            <li className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full bg-gold"
                aria-hidden="true"
              />
              {t("legendLived")}
            </li>
            <li className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full bg-flare"
                aria-hidden="true"
              />
              {t("legendNow")}
            </li>
            <li className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full bg-void-line"
                aria-hidden="true"
              />
              {t("legendAhead")}
            </li>
          </ul>

          <figure className="flex flex-col gap-4">
            <WeeksGrid
              grid={horizon.weeks}
              yearLabel={(age) => t("yearLabel", { age })}
              rtl={getDirection(locale) === "rtl"}
            />
            <figcaption className="sr-only">
              {t("srGrid", {
                total: horizon.weeks.totalWeeks,
                lived: horizon.weeks.livedWeeks,
                week: (horizon.weeks.current?.col ?? 0) + 1,
                age: horizon.weeks.current?.row ?? horizon.lifespan.ageYears,
              })}
            </figcaption>
          </figure>

          <p className="text-center text-sm text-dust">{t("line")}</p>
        </>
      )}
    </div>
  );
}
