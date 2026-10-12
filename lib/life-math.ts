/**
 * Pure date/life arithmetic. Every function takes `now` explicitly so results
 * are deterministic and testable. All calendar math happens in the user's
 * IANA time zone, never the host's.
 */
import { TZDate, tz } from "@date-fns/tz";
import { addYears, differenceInDays, intervalToDuration } from "date-fns";

export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
/** Mean Gregorian year (365.2425 days). Used to turn fractional life-table years into time. */
export const MS_PER_YEAR = 365.2425 * MS_PER_DAY;

/** Oldest verified human lived 122 years 164 days; anything beyond this is treated as a typo. */
export const MAX_AGE_YEARS = 125;

export type Sex = "female" | "male" | "unspecified";

/** What the user typed. `date` is a local calendar date in `timeZone`. */
export type BirthInput = {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm, optional — defaults to 00:00 (PROGRESS.md D9). */
  time?: string;
  /** IANA zone the date/time are expressed in, e.g. "Africa/Casablanca". */
  timeZone: string;
};

export type BirthValidation =
  | { ok: true; birth: Date }
  | {
      ok: false;
      reason: "invalid-date" | "invalid-time-zone" | "future" | "too-old";
    };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Converts the user's local birth date/time to an absolute instant, or explains why it can't. */
export function validateBirth(input: BirthInput, now: Date): BirthValidation {
  if (!isValidTimeZone(input.timeZone)) {
    return { ok: false, reason: "invalid-time-zone" };
  }
  const dm = DATE_RE.exec(input.date);
  const tm = TIME_RE.exec(input.time ?? "00:00");
  if (!dm || !tm) return { ok: false, reason: "invalid-date" };

  const [year, month, day] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const [hour, minute] = [Number(tm[1]), Number(tm[2])];

  const birth = new TZDate(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    input.timeZone,
  );
  // Reject overflow like 2023-02-29 → 2023-03-01.
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return { ok: false, reason: "invalid-date" };
  }

  if (birth.getTime() > now.getTime()) return { ok: false, reason: "future" };
  if (completedYears(birth, now, input.timeZone) > MAX_AGE_YEARS) {
    return { ok: false, reason: "too-old" };
  }
  return { ok: true, birth: new Date(birth.getTime()) };
}

/**
 * The k-th birthday as an instant. Feb 29 births celebrate on Feb 28 in
 * non-leap years (date-fns `addYears` clamping) — used consistently for both
 * age and anniversaries.
 */
export function anniversary(
  birth: Date,
  years: number,
  timeZone: string,
): Date {
  return new Date(
    addYears(new TZDate(birth.getTime(), timeZone), years).getTime(),
  );
}

/** Whole years completed at `now`, consistent with `anniversary`. */
export function completedYears(
  birth: Date,
  now: Date,
  timeZone: string,
): number {
  const b = new TZDate(birth.getTime(), timeZone);
  const n = new TZDate(now.getTime(), timeZone);
  let years = n.getFullYear() - b.getFullYear();
  if (anniversary(birth, years, timeZone).getTime() > now.getTime()) years--;
  return Math.max(0, years);
}

export type Breakdown = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type Totals = {
  /** Full calendar days (DST-aware in the user's zone). */
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const ZERO_BREAKDOWN: Breakdown = {
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

/** Calendar-aware Y/M/D/h/m/s between two instants. Returns zeros if `end <= start`. */
export function breakdown(start: Date, end: Date, timeZone: string): Breakdown {
  if (end.getTime() <= start.getTime()) return { ...ZERO_BREAKDOWN };
  const d = intervalToDuration({ start, end }, { in: tz(timeZone) });
  return {
    years: d.years ?? 0,
    months: d.months ?? 0,
    days: d.days ?? 0,
    hours: d.hours ?? 0,
    minutes: d.minutes ?? 0,
    seconds: d.seconds ?? 0,
  };
}

export function totals(start: Date, end: Date, timeZone: string): Totals {
  const ms = Math.max(0, end.getTime() - start.getTime());
  return {
    days: ms === 0 ? 0 : differenceInDays(end, start, { in: tz(timeZone) }),
    hours: Math.floor(ms / MS_PER_HOUR),
    minutes: Math.floor(ms / MS_PER_MINUTE),
    seconds: Math.floor(ms / MS_PER_SECOND),
  };
}

/**
 * Percentage of the expected life already lived, floored (never rounded up)
 * to 4 decimals and clamped to [0, 100] so the UI never shows 100% early.
 */
export function percentLived(
  birth: Date,
  expectedDeath: Date,
  now: Date,
): number {
  const span = expectedDeath.getTime() - birth.getTime();
  if (span <= 0) return 100;
  const raw = ((now.getTime() - birth.getTime()) / span) * 100;
  const clamped = Math.min(100, Math.max(0, raw));
  // Guard against FP noise like 12.3456999999 → 12.3456.
  return Math.floor(clamped * 10_000 + 1e-6) / 10_000;
}

export type LifeSnapshot = {
  lived: { breakdown: Breakdown; totals: Totals; ms: number };
  remaining: { breakdown: Breakdown; totals: Totals; ms: number };
  percentLived: number;
};

/** Everything the counters need for one tick. Remaining never goes negative. */
export function lifeSnapshot(params: {
  birth: Date;
  expectedDeath: Date;
  now: Date;
  timeZone: string;
}): LifeSnapshot {
  const { birth, expectedDeath, now, timeZone } = params;
  return {
    lived: {
      breakdown: breakdown(birth, now, timeZone),
      totals: totals(birth, now, timeZone),
      ms: Math.max(0, now.getTime() - birth.getTime()),
    },
    remaining: {
      breakdown: breakdown(now, expectedDeath, timeZone),
      totals: totals(now, expectedDeath, timeZone),
      ms: Math.max(0, expectedDeath.getTime() - now.getTime()),
    },
    percentLived: percentLived(birth, expectedDeath, now),
  };
}
