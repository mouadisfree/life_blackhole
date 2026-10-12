/**
 * Life expectancy lookup on UN World Population Prospects 2024 period life
 * tables (see data/README.md for source, year and URL).
 *
 * Method (PROGRESS.md D2): on each birthday the user's whole-year age k is used
 * to look up remaining life expectancy e(k), and the expected date is fixed at
 * `birthday_k + e(k)` until the next birthday.
 */
import {
  anniversary,
  completedYears,
  MS_PER_YEAR,
  type Sex,
} from "./life-math";

export type SexKey = "both" | "female" | "male";

export type LifeTableData = {
  source: {
    dataset: string;
    publisher: string;
    table: string;
    indicator: string;
    year: number;
    url: string;
    file: string;
    citation: string;
    license: string;
  };
  /** Exact ages x (years) at which e(x) is given, ascending. Last entry is the open 100+ group. */
  ages: readonly number[];
  locations: Record<
    string,
    { name: string; iso2: string | null; ex: Record<SexKey, readonly number[]> }
  >;
};

export const WORLD = "WLD";

export type ResolvedTable = {
  iso3: string;
  locationName: string;
  sex: SexKey;
  values: readonly number[];
  /** True when the requested country or sex wasn't available and a broader table was used. */
  usedFallback: boolean;
};

export function sexKey(sex: Sex | undefined): SexKey {
  return sex === "female" || sex === "male" ? sex : "both";
}

/**
 * Picks the table for a country and sex. WPP 2024 has female, male and
 * both-sexes tables for every country, so the only fallback needed is an
 * unknown or missing country → World. "unspecified" sex → both sexes.
 */
export function resolveTable(
  data: LifeTableData,
  country: string | undefined,
  sex: Sex | undefined,
): ResolvedTable {
  const wantedSex = sexKey(sex);
  const wantedIso = country?.toUpperCase();
  const loc = wantedIso ? data.locations[wantedIso] : undefined;
  const iso3 = loc && wantedIso ? wantedIso : WORLD;
  const entry = loc ?? data.locations[WORLD];
  if (!entry) throw new Error("Life table data is missing the World aggregate");
  return {
    iso3,
    locationName: entry.name,
    sex: wantedSex,
    values: entry.ex[wantedSex],
    usedFallback: Boolean(wantedIso) && !loc,
  };
}

/**
 * Remaining life expectancy at exact age `age`, linearly interpolated between
 * the table's ages. Ages at or past the last (open 100+) group use its value.
 */
export function remainingExpectancyAt(
  ages: readonly number[],
  values: readonly number[],
  age: number,
): number {
  if (ages.length === 0 || ages.length !== values.length) {
    throw new Error("Malformed life table");
  }
  if (age <= (ages[0] as number)) return values[0] as number;
  const last = ages.length - 1;
  if (age >= (ages[last] as number)) return values[last] as number;
  let i = 1;
  while ((ages[i] as number) < age) i++;
  const x0 = ages[i - 1] as number;
  const x1 = ages[i] as number;
  const y0 = values[i - 1] as number;
  const y1 = values[i] as number;
  return y0 + ((y1 - y0) * (age - x0)) / (x1 - x0);
}

export type LifespanInput = {
  birthDate: Date;
  timeZone: string;
  country?: string;
  sex?: Sex;
  now: Date;
  data: LifeTableData;
};

export type LifespanSource = {
  dataset: string;
  year: number;
  url: string;
  citation: string;
  iso3: string;
  locationName: string;
  sex: SexKey;
  usedFallback: boolean;
};

export type Lifespan = {
  expectedDeathDate: Date;
  /** Age at last birthday + e(age): the statistical total for someone exactly this age. */
  expectedTotalYears: number;
  /** e(age) at the last birthday. */
  remainingYearsAtLastBirthday: number;
  ageYears: number;
  lastBirthday: Date;
  /** e(0) for the same table: what a newborn would expect today. */
  expectancyAtBirth: number;
  /**
   * True once the user has lived past e(0). Remaining expectancy is still
   * positive (it always is, conditionally on survival) — the UI switches to
   * the "bonus time" framing instead of showing negatives (PROMPT.md §4.2).
   */
  outlivedAtBirthExpectancy: boolean;
  source: LifespanSource;
};

function expectedDeathForAge(
  input: Pick<LifespanInput, "birthDate" | "timeZone">,
  table: ResolvedTable,
  ages: readonly number[],
  age: number,
): { date: Date; ex: number; birthday: Date } {
  const ex = remainingExpectancyAt(ages, table.values, age);
  const birthday = anniversary(input.birthDate, age, input.timeZone);
  return {
    date: new Date(birthday.getTime() + Math.round(ex * MS_PER_YEAR)),
    ex,
    birthday,
  };
}

export function getExpectedLifespan(input: LifespanInput): Lifespan {
  const { data, now } = input;
  const table = resolveTable(data, input.country, input.sex);
  const ageYears = completedYears(input.birthDate, now, input.timeZone);
  const { date, ex, birthday } = expectedDeathForAge(
    input,
    table,
    data.ages,
    ageYears,
  );
  const expectancyAtBirth = table.values[0] as number;
  const msLived = now.getTime() - input.birthDate.getTime();

  return {
    expectedDeathDate: date,
    expectedTotalYears: ageYears + ex,
    remainingYearsAtLastBirthday: ex,
    ageYears,
    lastBirthday: birthday,
    expectancyAtBirth,
    outlivedAtBirthExpectancy: msLived >= expectancyAtBirth * MS_PER_YEAR,
    source: {
      dataset: data.source.dataset,
      year: data.source.year,
      url: data.source.url,
      citation: data.source.citation,
      iso3: table.iso3,
      locationName: table.locationName,
      sex: table.sex,
      usedFallback: table.usedFallback,
    },
  };
}

/**
 * How far the horizon moved back at the most recent birthday, in ms:
 * expectedDeath(age k) − expectedDeath(age k−1). Null before the first birthday.
 * Powers the Phase 5 "birthday bonus" moment.
 */
export function getBirthdayBonus(input: LifespanInput): number | null {
  const table = resolveTable(input.data, input.country, input.sex);
  const age = completedYears(input.birthDate, input.now, input.timeZone);
  if (age < 1) return null;
  const current = expectedDeathForAge(input, table, input.data.ages, age);
  const previous = expectedDeathForAge(input, table, input.data.ages, age - 1);
  return current.date.getTime() - previous.date.getTime();
}

/** Lazy-load the ~40 KB (gzip) table so it stays out of the initial bundle. */
export async function loadLifeTables(): Promise<LifeTableData> {
  const mod = await import("@/data/life-tables.json");
  return mod.default as LifeTableData;
}
