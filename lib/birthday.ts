/**
 * When to show the "birthday bonus" moment (PROGRESS.md D2): for a week after
 * each birthday, once per age, tell the user how far their horizon moved back.
 */
import { anniversary, completedYears, MS_PER_DAY } from "./life-math";

export const BONUS_WINDOW_DAYS = 7;

export function birthdayBonusAge(params: {
  birth: Date;
  now: Date;
  timeZone: string;
  /** Age at which the user last dismissed the moment. */
  seenAge: number | null;
}): number | null {
  const { birth, now, timeZone, seenAge } = params;
  const age = completedYears(birth, now, timeZone);
  if (age < 1 || seenAge === age) return null;
  const since = now.getTime() - anniversary(birth, age, timeZone).getTime();
  return since < BONUS_WINDOW_DAYS * MS_PER_DAY ? age : null;
}

/** Days → a friendly unit: days under two weeks, weeks above. */
export function bonusDuration(ms: number): {
  unit: "days" | "weeks";
  count: number;
} {
  const days = ms / MS_PER_DAY;
  return days < 14
    ? { unit: "days", count: Math.max(1, Math.round(days)) }
    : { unit: "weeks", count: Math.round(days / 7) };
}
