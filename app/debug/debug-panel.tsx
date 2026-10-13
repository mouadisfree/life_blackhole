"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBirthdayBonus,
  getExpectedLifespan,
  type LifeTableData,
  loadLifeTables,
} from "@/lib/life-expectancy";
import {
  lifeSnapshot,
  MS_PER_DAY,
  type Sex,
  validateBirth,
} from "@/lib/life-math";
import { computePerspectiveStats } from "@/lib/perspective-stats";

const fieldClass =
  "rounded-md border border-input bg-sky-deep px-3 py-2 text-ink";

export function DebugPanel() {
  const [data, setData] = useState<LifeTableData | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [date, setDate] = useState("1996-01-01");
  const [time, setTime] = useState("");
  const [country, setCountry] = useState("");
  const [sex, setSex] = useState<Sex>("unspecified");
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    void loadLifeTables().then(setData);
    // Browser APIs only after mount, so server and client render the same markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const countries = useMemo(
    () =>
      data
        ? Object.entries(data.locations)
            .filter(([iso]) => iso !== "WLD")
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        : [],
    [data],
  );

  let output: unknown = "Loading…";
  if (data && now) {
    const v = validateBirth({ date, time: time || undefined, timeZone }, now);
    if (!v.ok) {
      output = { error: v.reason };
    } else {
      const input = {
        birthDate: v.birth,
        timeZone,
        country: country || undefined,
        sex,
        now,
        data,
      };
      const lifespan = getExpectedLifespan(input);
      const bonus = getBirthdayBonus(input);
      output = {
        now: now.toISOString(),
        birth: v.birth.toISOString(),
        lifespan,
        birthdayBonusDays: bonus === null ? null : bonus / MS_PER_DAY,
        snapshot: lifeSnapshot({
          birth: v.birth,
          expectedDeath: lifespan.expectedDeathDate,
          now,
          timeZone,
        }),
        perspective: computePerspectiveStats({
          birth: v.birth,
          now,
          expectedDeath: lifespan.expectedDeathDate,
          timeZone,
        }),
      };
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Life math debug</h1>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-haze">
          Birth date
          <input
            type="date"
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-haze">
          Birth time (optional)
          <input
            type="time"
            className={fieldClass}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-haze">
          Country
          <select
            className={fieldClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">World average</option>
            {countries.map(([iso, loc]) => (
              <option key={iso} value={iso}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-haze">
          Sex
          <select
            className={fieldClass}
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="unspecified">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-haze sm:col-span-2">
          Time zone
          <input
            className={fieldClass}
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
          />
        </label>
      </form>
      <pre className="overflow-x-auto rounded-lg bg-sky-deep p-4 counter text-xs leading-relaxed text-ink">
        {JSON.stringify(output, null, 2)}
      </pre>
    </main>
  );
}
