/**
 * "Life in weeks": one row per year of age, 52 weeks per row (the classic
 * layout — the extra 1–2 days a year are folded into week 52). Rows start on
 * birthdays, so the grid lines up with the age you actually feel.
 */
import { tz } from "@date-fns/tz";
import { differenceInDays } from "date-fns";
import { anniversary, completedYears } from "./life-math";

export const WEEKS_PER_ROW = 52;

export type WeeksGrid = {
  /** Number of year-rows to draw (the last may be partial). */
  rows: number;
  /** Weeks in the final row (1..52). */
  lastRowWeeks: number;
  totalWeeks: number;
  /** Weeks fully lived before the current one. */
  livedWeeks: number;
  /** The week happening now, or null once past the expected date. */
  current: { row: number; col: number; index: number } | null;
};

function weekInYear(
  birth: Date,
  at: Date,
  timeZone: string,
): { row: number; col: number } {
  const row = completedYears(birth, at, timeZone);
  const days = differenceInDays(at, anniversary(birth, row, timeZone), {
    in: tz(timeZone),
  });
  return { row, col: Math.min(WEEKS_PER_ROW - 1, Math.floor(days / 7)) };
}

export function weeksGrid(params: {
  birth: Date;
  expectedDeath: Date;
  now: Date;
  timeZone: string;
}): WeeksGrid {
  const { birth, expectedDeath, now, timeZone } = params;
  const end = weekInYear(birth, expectedDeath, timeZone);
  const rows = end.row + 1;
  const lastRowWeeks = end.col + 1;
  const totalWeeks = end.row * WEEKS_PER_ROW + lastRowWeeks;

  if (now.getTime() >= expectedDeath.getTime()) {
    return {
      rows,
      lastRowWeeks,
      totalWeeks,
      livedWeeks: totalWeeks,
      current: null,
    };
  }
  const at = weekInYear(birth, now, timeZone);
  const index = at.row * WEEKS_PER_ROW + at.col;
  return {
    rows,
    lastRowWeeks,
    totalWeeks,
    livedWeeks: index,
    current: { ...at, index },
  };
}
