"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Breakdown, Totals } from "@/lib/life-math";
import type { CounterUnit } from "@/lib/store";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Big ticking display. role="timer" is aria-live="off" by default, so screen
 * readers aren't spammed every second; a separate summary describes it.
 */
export function LiveCounter({
  label,
  breakdown,
  totals,
  unit,
  size = "lg",
}: {
  label: string;
  breakdown: Breakdown;
  totals: Totals;
  unit: CounterUnit;
  size?: "lg" | "sm";
}) {
  const t = useTranslations("Units");
  const format = useFormatter();
  const n = (v: number) => format.number(v);
  const big = size === "lg";

  const clock = `${pad(breakdown.hours)}:${pad(breakdown.minutes)}:${pad(breakdown.seconds)}`;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={label}
      className="flex flex-col items-center gap-1"
    >
      <p className={big ? "text-sm text-dust" : "text-xs text-dust"}>{label}</p>
      {unit === "seconds" ? (
        <p
          className={`counter ${big ? "text-4xl sm:text-5xl" : "text-xl"} font-medium text-starlight`}
        >
          {n(totals.seconds)}{" "}
          <span className="font-sans text-base text-dust">
            {t("seconds", { count: totals.seconds })}
          </span>
        </p>
      ) : (
        <>
          <p
            className={`counter ${big ? "text-3xl sm:text-4xl" : "text-lg"} font-medium text-starlight`}
          >
            {unit === "days" ? (
              <>
                {n(totals.days)}{" "}
                <span className="font-sans text-base text-dust">
                  {t("days", { count: totals.days })}
                </span>
              </>
            ) : (
              <>
                {n(breakdown.years)}{" "}
                <span className="font-sans text-base text-dust">
                  {t("years", { count: breakdown.years })}
                </span>{" "}
                {n(breakdown.months)}{" "}
                <span className="font-sans text-base text-dust">
                  {t("months", { count: breakdown.months })}
                </span>{" "}
                {n(breakdown.days)}{" "}
                <span className="font-sans text-base text-dust">
                  {t("days", { count: breakdown.days })}
                </span>
              </>
            )}
          </p>
          <p className={`counter ${big ? "text-2xl" : "text-base"} text-gold`}>
            {clock}
          </p>
        </>
      )}
    </div>
  );
}
