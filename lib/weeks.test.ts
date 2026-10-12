import { describe, expect, it } from "vitest";
import { birthdayBonusAge, bonusDuration } from "./birthday";
import { MS_PER_DAY, validateBirth } from "./life-math";
import { weeksGrid, WEEKS_PER_ROW } from "./weeks";

const UTC = "UTC";
const at = (iso: string) => new Date(iso);
function birth(date: string, timeZone = UTC) {
  const r = validateBirth({ date, timeZone }, at("2100-01-01T00:00:00Z"));
  if (!r.ok) throw new Error(r.reason);
  return r.birth;
}

describe("weeksGrid", () => {
  const b = birth("2000-01-01");
  const expectedDeath = at("2080-07-01T00:00:00Z"); // age 80 and ~26 weeks

  it("has one row per year, ending in a partial row", () => {
    const g = weeksGrid({
      birth: b,
      expectedDeath,
      now: at("2026-10-12T00:00:00Z"),
      timeZone: UTC,
    });
    expect(g.rows).toBe(81);
    // Jan 1 → Jul 1 2080 is 182 days: weeks 0–26, including the expected date's week.
    expect(g.lastRowWeeks).toBe(27);
    expect(g.totalWeeks).toBe(80 * WEEKS_PER_ROW + 27);
  });

  it("locates the current week by birthday-aligned rows", () => {
    // 2026-10-12: age 26, 284 days after the 26th birthday → week 40.
    const g = weeksGrid({
      birth: b,
      expectedDeath,
      now: at("2026-10-12T00:00:00Z"),
      timeZone: UTC,
    });
    expect(g.current).toEqual({ row: 26, col: 40, index: 26 * 52 + 40 });
    expect(g.livedWeeks).toBe(26 * 52 + 40);
  });

  it("starts at week 0 on the day of birth and on each birthday", () => {
    expect(
      weeksGrid({ birth: b, expectedDeath, now: b, timeZone: UTC }).current,
    ).toEqual({ row: 0, col: 0, index: 0 });
    expect(
      weeksGrid({
        birth: b,
        expectedDeath,
        now: at("2030-01-01T00:00:00Z"),
        timeZone: UTC,
      }).current,
    ).toEqual({ row: 30, col: 0, index: 30 * 52 });
  });

  it("folds the last day or two of a year into week 52", () => {
    // Dec 31 is day 364 (365 in leap years) after Jan 1 → still col 51.
    const g = weeksGrid({
      birth: b,
      expectedDeath,
      now: at("2026-12-31T12:00:00Z"),
      timeZone: UTC,
    });
    expect(g.current?.col).toBe(51);
  });

  it("marks everything lived past the expected date", () => {
    const g = weeksGrid({
      birth: b,
      expectedDeath,
      now: at("2090-01-01T00:00:00Z"),
      timeZone: UTC,
    });
    expect(g.current).toBeNull();
    expect(g.livedWeeks).toBe(g.totalWeeks);
  });

  it("totals roughly a week per 7 days of expected life", () => {
    const g = weeksGrid({ birth: b, expectedDeath, now: b, timeZone: UTC });
    const realWeeks =
      (expectedDeath.getTime() - b.getTime()) / (7 * MS_PER_DAY);
    // 52-week rows drop ~1.2 days a year → slightly fewer than calendar weeks.
    expect(realWeeks - g.totalWeeks).toBeGreaterThan(0);
    expect(realWeeks - g.totalWeeks).toBeLessThan(15);
  });
});

describe("birthdayBonusAge", () => {
  const b = birth("1990-05-20");

  it("shows during the week after a birthday", () => {
    expect(
      birthdayBonusAge({
        birth: b,
        now: at("2026-05-20T08:00:00Z"),
        timeZone: UTC,
        seenAge: null,
      }),
    ).toBe(36);
    expect(
      birthdayBonusAge({
        birth: b,
        now: at("2026-05-26T23:00:00Z"),
        timeZone: UTC,
        seenAge: 35,
      }),
    ).toBe(36);
  });

  it("hides outside the window, once seen, and before the first birthday", () => {
    expect(
      birthdayBonusAge({
        birth: b,
        now: at("2026-05-27T00:00:00Z"),
        timeZone: UTC,
        seenAge: null,
      }),
    ).toBeNull();
    expect(
      birthdayBonusAge({
        birth: b,
        now: at("2026-05-21T00:00:00Z"),
        timeZone: UTC,
        seenAge: 36,
      }),
    ).toBeNull();
    expect(
      birthdayBonusAge({
        birth: b,
        now: at("2026-05-19T00:00:00Z"),
        timeZone: UTC,
        seenAge: null,
      }),
    ).toBeNull();
    const baby = birth("2026-01-01");
    expect(
      birthdayBonusAge({
        birth: baby,
        now: at("2026-01-02T00:00:00Z"),
        timeZone: UTC,
        seenAge: null,
      }),
    ).toBeNull();
  });
});

describe("bonusDuration", () => {
  it("uses days for small shifts and weeks for larger ones", () => {
    expect(bonusDuration(9.4 * MS_PER_DAY)).toEqual({ unit: "days", count: 9 });
    expect(bonusDuration(27.5 * MS_PER_DAY)).toEqual({
      unit: "weeks",
      count: 4,
    });
    expect(bonusDuration(0.2 * MS_PER_DAY)).toEqual({ unit: "days", count: 1 });
  });
});
