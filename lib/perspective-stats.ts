/**
 * "Perspective" stats — rough, shareable estimates (PROMPT.md §4.3).
 * Add a stat by appending to PERSPECTIVE_STATS and adding its copy under
 * `Stats.<id>` in messages/en.json. Every stat is labelled as an estimate in the UI.
 */
import { tz, TZDate } from "@date-fns/tz";
import {
  differenceInCalendarDays,
  differenceInMonths,
  nextSaturday,
  startOfDay,
} from "date-fns";
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_YEAR,
} from "./life-math";

export const ASSUMPTIONS = {
  /** Average resting adult heart rate used by PROMPT.md §4.3. */
  heartbeatsPerMinute: 70,
  /** Typical adult resting breathing rate is 12–20 breaths/min; midpoint-ish. */
  breathsPerMinute: 15,
  /** Roughly a third of life is spent asleep. */
  sleepFraction: 1 / 3,
  /** Mean synodic month (new moon to new moon), in days. */
  synodicMonthDays: 29.530589,
  booksPerMonth: 1,
} as const;

export type StatContext = {
  birth: Date;
  now: Date;
  expectedDeath: Date;
  timeZone: string;
};

export type StatDirection = "lived" | "remaining";

export type PerspectiveStat = {
  id: string;
  direction: StatDirection;
  compute: (ctx: StatContext) => number;
};

function livedMs(ctx: StatContext): number {
  return Math.max(0, ctx.now.getTime() - ctx.birth.getTime());
}

function remainingMs(ctx: StatContext): number {
  return Math.max(0, ctx.expectedDeath.getTime() - ctx.now.getTime());
}

/**
 * Saturdays (one per weekend) from today's date, inclusive, up to the
 * expected date's calendar day, exclusive — in the user's zone.
 */
export function countSaturdays(from: Date, to: Date, timeZone: string): number {
  if (to.getTime() <= from.getTime()) return 0;
  const zone = tz(timeZone);
  const today = startOfDay(new TZDate(from.getTime(), timeZone));
  const first =
    today.getDay() === 6 ? today : nextSaturday(today, { in: zone });
  const days = differenceInCalendarDays(to, first, { in: zone });
  return days <= 0 ? 0 : Math.floor((days - 1) / 7) + 1;
}

export const PERSPECTIVE_STATS: readonly PerspectiveStat[] = [
  {
    id: "weekendsLeft",
    direction: "remaining",
    compute: (ctx) => countSaturdays(ctx.now, ctx.expectedDeath, ctx.timeZone),
  },
  {
    // One summer per year; hemisphere-neutral on purpose.
    id: "summersLeft",
    direction: "remaining",
    compute: (ctx) => Math.floor(remainingMs(ctx) / MS_PER_YEAR),
  },
  {
    id: "fullMoonsLeft",
    direction: "remaining",
    compute: (ctx) =>
      Math.floor(
        remainingMs(ctx) / (ASSUMPTIONS.synodicMonthDays * MS_PER_DAY),
      ),
  },
  {
    id: "sunrisesLeft",
    direction: "remaining",
    compute: (ctx) =>
      Math.max(
        0,
        differenceInCalendarDays(ctx.expectedDeath, ctx.now, {
          in: tz(ctx.timeZone),
        }),
      ),
  },
  {
    id: "booksLeft",
    direction: "remaining",
    compute: (ctx) =>
      Math.max(
        0,
        differenceInMonths(ctx.expectedDeath, ctx.now, {
          in: tz(ctx.timeZone),
        }),
      ) * ASSUMPTIONS.booksPerMonth,
  },
  {
    id: "heartbeatsSoFar",
    direction: "lived",
    compute: (ctx) =>
      Math.floor(
        (livedMs(ctx) / MS_PER_MINUTE) * ASSUMPTIONS.heartbeatsPerMinute,
      ),
  },
  {
    id: "breathsSoFar",
    direction: "lived",
    compute: (ctx) =>
      Math.floor((livedMs(ctx) / MS_PER_MINUTE) * ASSUMPTIONS.breathsPerMinute),
  },
  {
    id: "sleepHoursSoFar",
    direction: "lived",
    compute: (ctx) =>
      Math.floor((livedMs(ctx) / MS_PER_HOUR) * ASSUMPTIONS.sleepFraction),
  },
];

export type PerspectiveValue = {
  id: string;
  direction: StatDirection;
  value: number;
};

export function computePerspectiveStats(ctx: StatContext): PerspectiveValue[] {
  return PERSPECTIVE_STATS.map((s) => ({
    id: s.id,
    direction: s.direction,
    value: s.compute(ctx),
  }));
}
