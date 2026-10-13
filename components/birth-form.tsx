"use client";

import { ChevronDown, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLifeTables } from "@/hooks/use-life-tables";
import { countryOptions } from "@/lib/countries";
import { type Sex, validateBirth } from "@/lib/life-math";
import type { Profile } from "@/lib/store";

type ErrorKey =
  "required" | "invalid-date" | "invalid-time-zone" | "future" | "too-old";

const fieldClass =
  "h-12 w-full rounded-lg border border-input bg-sky-deep px-3 text-base text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function BirthForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: Profile | null;
  submitLabel: string;
  onSubmit: (profile: Profile) => void;
}) {
  const t = useTranslations("BirthForm");
  const locale = useLocale();
  const ids = {
    date: useId(),
    time: useId(),
    country: useId(),
    error: useId(),
    panel: useId(),
    timeHint: useId(),
  };

  const [date, setDate] = useState(initial?.birth.date ?? "");
  const [time, setTime] = useState(initial?.birth.time ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "unspecified");
  const [open, setOpen] = useState(
    Boolean(
      initial?.country ||
      initial?.birth.time ||
      (initial && initial.sex !== "unspecified"),
    ),
  );
  const [error, setError] = useState<ErrorKey | null>(null);

  const data = useLifeTables(open);
  const countries = useMemo(
    () => (data ? countryOptions(data, locale) : []),
    [data, locale],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) {
      setError("required");
      return;
    }
    // Keep the zone the birth was originally entered in, unless it's new.
    const timeZone = initial?.birth.timeZone ?? currentTimeZone();
    const birth = { date, time: time || undefined, timeZone };
    const result = validateBirth(birth, new Date());
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    onSubmit({ birth, country: country || undefined, sex });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full flex-col gap-5 text-start"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.date} className="text-sm text-haze">
          {t("birthDate")}
        </Label>
        <input
          id={ids.date}
          name="birthDate"
          type="date"
          required
          autoComplete="bday"
          className={fieldClass}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ids.error : undefined}
        />
        {error && (
          // White + icon: red text can't reach AA contrast on the sky.
          <p
            id={ids.error}
            role="alert"
            className="flex items-start gap-2 text-sm font-medium text-ink"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[#ffb4b4]"
            />
            {t(`errors.${error}`)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={ids.panel}
          className="flex items-center gap-2 self-start rounded-md text-sm text-mist outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("improveAccuracy")}
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            id={ids.panel}
            className="flex flex-col gap-5 rounded-xl border border-border bg-sky-deep/60 p-4"
          >
            <p className="text-sm text-haze">{t("improveAccuracyHint")}</p>

            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.country} className="text-sm text-haze">
                {t("country")}
              </Label>
              <select
                id={ids.country}
                name="country"
                autoComplete="country"
                className={fieldClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={!data}
              >
                <option value="">
                  {data ? t("worldAverage") : t("loadingCountries")}
                </option>
                {countries.map((c) => (
                  <option key={c.iso3} value={c.iso3}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm text-haze">{t("sex")}</legend>
              <p className="-mt-1 text-xs text-haze">{t("sexHint")}</p>
              <RadioGroup
                value={sex}
                onValueChange={(v) => setSex(v as Sex)}
                className="flex flex-wrap gap-x-6 gap-y-0"
              >
                {(["female", "male", "unspecified"] as const).map((value) => (
                  <Label
                    key={value}
                    className="flex min-h-11 items-center gap-2 text-sm text-ink"
                  >
                    <RadioGroupItem value={value} />
                    {t(
                      value === "female"
                        ? "sexFemale"
                        : value === "male"
                          ? "sexMale"
                          : "sexUnspecified",
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.time} className="text-sm text-haze">
                {t("birthTime")}
              </Label>
              <p id={ids.timeHint} className="-mt-1 text-xs text-haze">
                {t("birthTimeHint")}
              </p>
              <input
                aria-describedby={ids.timeHint}
                id={ids.time}
                name="birthTime"
                type="time"
                className={fieldClass}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" className="h-12 rounded-full text-base">
        {submitLabel}
      </Button>
    </form>
  );
}
