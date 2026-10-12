"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { PerspectiveValue } from "@/lib/perspective-stats";
import type messages from "@/messages/en.json";

/** Above this, full digits overflow a phone-width card. */
const COMPACT_FROM = 100_000_000;

type StatId = Exclude<keyof (typeof messages)["Stats"], "estimateNote">;

export function PerspectiveStats({ stats }: { stats: PerspectiveValue[] }) {
  const t = useTranslations("Stats");
  const th = useTranslations("Horizon");
  const format = useFormatter();

  return (
    <section
      aria-labelledby="perspective-title"
      className="flex w-full flex-col gap-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="perspective-title" className="text-lg font-semibold">
          {th("perspectiveTitle")}
        </h2>
        <p className="text-xs text-dust">{t("estimateNote")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const id = s.id as StatId;
          return (
            <li
              key={s.id}
              className="flex flex-col gap-1 rounded-xl border border-border bg-void-raised/70 p-4"
            >
              <span className="counter text-xl font-medium text-starlight">
                <span aria-hidden="true" className="me-1 text-base text-dust">
                  ≈
                </span>
                {s.value >= COMPACT_FROM ? (
                  <>
                    <span aria-hidden="true">
                      {format.number(s.value, {
                        notation: "compact",
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="sr-only">{format.number(s.value)}</span>
                  </>
                ) : (
                  format.number(s.value)
                )}
              </span>
              <span className="text-sm text-starlight">{t(`${id}.label`)}</span>
              <span className="text-xs text-dust">{t(`${id}.assumption`)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
