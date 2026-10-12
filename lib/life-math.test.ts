import { describe, expect, it } from "vitest";
import {
  anniversary,
  breakdown,
  completedYears,
  lifeSnapshot,
  MAX_AGE_YEARS,
  MS_PER_DAY,
  MS_PER_HOUR,
  percentLived,
  totals,
  validateBirth,
} from "./life-math";

const NY = "America/New_York";
const TOKYO = "Asia/Tokyo";
const UTC = "UTC";

const at = (iso: string) => new Date(iso);

function birthOrThrow(date: string, timeZone: string, time?: string): Date {
  const r = validateBirth({ date, time, timeZone }, at("2026-10-12T12:00:00Z"));
  if (!r.ok) throw new Error(`unexpected: ${r.reason}`);
  return r.birth;
}

describe("validateBirth", () => {
  const now = at("2026-10-12T12:00:00Z");

  it("converts a local date to the right instant for the zone", () => {
    expect(birthOrThrow("2000-01-01", UTC).toISOString()).toBe(
      "2000-01-01T00:00:00.000Z",
    );
    expect(birthOrThrow("2000-01-01", TOKYO).toISOString()).toBe(
      "1999-12-31T15:00:00.000Z",
    );
    expect(birthOrThrow("2000-01-01", NY, "13:45").toISOString()).toBe(
      "2000-01-01T18:45:00.000Z",
    );
  });

  it("defaults the time to midnight", () => {
    expect(birthOrThrow("1995-06-15", UTC)).toEqual(
      birthOrThrow("1995-06-15", UTC, "00:00"),
    );
  });

  it("rejects malformed and impossible dates", () => {
    for (const date of [
      "2023-02-29",
      "2024-13-01",
      "2024-04-31",
      "24-01-01",
      "",
      "2024/01/01",
    ]) {
      expect(validateBirth({ date, timeZone: UTC }, now)).toEqual({
        ok: false,
        reason: "invalid-date",
      });
    }
    expect(
      validateBirth({ date: "2000-01-01", time: "24:00", timeZone: UTC }, now)
        .ok,
    ).toBe(false);
  });

  it("accepts Feb 29 in leap years", () => {
    expect(validateBirth({ date: "2024-02-29", timeZone: UTC }, now).ok).toBe(
      true,
    );
    expect(validateBirth({ date: "2000-02-29", timeZone: UTC }, now).ok).toBe(
      true,
    );
  });

  it("rejects unknown time zones", () => {
    expect(
      validateBirth({ date: "2000-01-01", timeZone: "Mars/Olympus" }, now),
    ).toEqual({
      ok: false,
      reason: "invalid-time-zone",
    });
  });

  it("rejects a birth date in the future", () => {
    expect(validateBirth({ date: "2026-10-13", timeZone: UTC }, now)).toEqual({
      ok: false,
      reason: "future",
    });
    // Later today (UTC) is still the future.
    expect(
      validateBirth({ date: "2026-10-12", time: "18:00", timeZone: UTC }, now),
    ).toEqual({
      ok: false,
      reason: "future",
    });
  });

  it("accepts a birth date of today", () => {
    expect(validateBirth({ date: "2026-10-12", timeZone: UTC }, now).ok).toBe(
      true,
    );
  });

  it("accepts very old ages up to the cap and rejects beyond", () => {
    expect(validateBirth({ date: "1904-01-01", timeZone: UTC }, now).ok).toBe(
      true,
    ); // 122
    expect(
      validateBirth(
        { date: `${2026 - MAX_AGE_YEARS}-10-12`, timeZone: UTC },
        now,
      ).ok,
    ).toBe(true);
    expect(
      validateBirth(
        { date: `${2025 - MAX_AGE_YEARS}-10-11`, timeZone: UTC },
        now,
      ),
    ).toEqual({
      ok: false,
      reason: "too-old",
    });
  });
});

describe("completedYears / anniversary", () => {
  it("counts whole years, flipping exactly at the local birthday", () => {
    const birth = birthOrThrow("1990-05-20", NY);
    expect(completedYears(birth, at("2026-05-20T03:59:59Z"), NY)).toBe(35); // 23:59:59 NY on the 19th
    expect(completedYears(birth, at("2026-05-20T04:00:00Z"), NY)).toBe(36);
  });

  it("Feb 29 birthdays: celebrated on Feb 28 in non-leap years, consistently", () => {
    const birth = birthOrThrow("2000-02-29", UTC);
    expect(anniversary(birth, 1, UTC).toISOString()).toBe(
      "2001-02-28T00:00:00.000Z",
    );
    expect(anniversary(birth, 4, UTC).toISOString()).toBe(
      "2004-02-29T00:00:00.000Z",
    );
    expect(completedYears(birth, at("2001-02-27T23:59:59Z"), UTC)).toBe(0);
    expect(completedYears(birth, at("2001-02-28T00:00:00Z"), UTC)).toBe(1);
    expect(completedYears(birth, at("2004-02-28T23:59:59Z"), UTC)).toBe(3);
    expect(completedYears(birth, at("2004-02-29T00:00:00Z"), UTC)).toBe(4);
  });

  it("is computed in the user's zone, not the host's", () => {
    // Same instant: already the 1st in Tokyo, still Dec 31 in New York.
    const instant = at("2026-01-01T04:00:00Z");
    expect(
      completedYears(birthOrThrow("2000-01-01", TOKYO), instant, TOKYO),
    ).toBe(26);
    expect(completedYears(birthOrThrow("2000-01-01", NY), instant, NY)).toBe(
      25,
    );
  });

  it("is 0 on the day of birth", () => {
    const birth = birthOrThrow("2026-10-12", UTC);
    expect(completedYears(birth, at("2026-10-12T12:00:00Z"), UTC)).toBe(0);
  });
});

describe("breakdown / totals", () => {
  it("counts the extra leap day", () => {
    const start = at("2000-01-01T00:00:00Z");
    expect(totals(start, at("2001-01-01T00:00:00Z"), UTC).days).toBe(366);
    expect(
      totals(at("2001-01-01T00:00:00Z"), at("2002-01-01T00:00:00Z"), UTC).days,
    ).toBe(365);
  });

  it("gives a calendar breakdown", () => {
    expect(
      breakdown(at("2000-01-15T10:00:00Z"), at("2026-03-20T12:34:56Z"), UTC),
    ).toEqual({
      years: 26,
      months: 2,
      days: 5,
      hours: 2,
      minutes: 34,
      seconds: 56,
    });
  });

  it("treats a 23-hour DST day as one calendar day in the user's zone", () => {
    // US spring-forward: 2026-03-08 in New York has 23 hours.
    const start = at("2026-03-08T05:00:00Z"); // 00:00 EST
    const end = at("2026-03-09T04:00:00Z"); // 00:00 EDT
    expect(end.getTime() - start.getTime()).toBe(23 * MS_PER_HOUR);
    expect(totals(start, end, NY).days).toBe(1);
    expect(breakdown(start, end, NY)).toMatchObject({ days: 1, hours: 0 });
    expect(totals(start, end, NY).hours).toBe(23);
  });

  it("returns zeros, never negatives, for reversed intervals", () => {
    const a = at("2026-01-01T00:00:00Z");
    const b = at("2025-01-01T00:00:00Z");
    expect(breakdown(a, b, UTC)).toEqual({
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(totals(a, b, UTC)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("counts seconds lived for someone born today", () => {
    const birth = birthOrThrow("2026-10-12", UTC);
    const t = totals(birth, at("2026-10-12T12:00:00Z"), UTC);
    expect(t).toEqual({ days: 0, hours: 12, minutes: 720, seconds: 43_200 });
  });
});

describe("percentLived", () => {
  const birth = at("2000-01-01T00:00:00Z");
  const death = new Date(birth.getTime() + 10_000 * MS_PER_DAY);

  it("floors to 4 decimals instead of rounding up", () => {
    // 1/3 lived → 33.3333…
    const now = new Date(birth.getTime() + (10_000 * MS_PER_DAY) / 3);
    expect(percentLived(birth, death, now)).toBe(33.3333);
    // 99.99999% must not display as 100.
    const almost = new Date(death.getTime() - 86); // 86ms of 864,000,000,000ms left
    expect(percentLived(birth, death, almost)).toBe(99.9999);
  });

  it("is exact at the boundaries and clamps outside them", () => {
    expect(percentLived(birth, death, birth)).toBe(0);
    expect(percentLived(birth, death, death)).toBe(100);
    expect(
      percentLived(birth, death, new Date(death.getTime() + MS_PER_DAY)),
    ).toBe(100);
    expect(
      percentLived(birth, death, new Date(birth.getTime() - MS_PER_DAY)),
    ).toBe(0);
  });

  it("does not lose precision to floating-point noise", () => {
    const now = new Date(birth.getTime() + 0.123456 * 10_000 * MS_PER_DAY);
    expect(percentLived(birth, death, now)).toBe(12.3456);
  });
});

describe("lifeSnapshot", () => {
  it("never reports negative remaining time past the expected date", () => {
    const birth = at("1930-01-01T00:00:00Z");
    const expectedDeath = at("2020-01-01T00:00:00Z");
    const s = lifeSnapshot({
      birth,
      expectedDeath,
      now: at("2026-10-12T00:00:00Z"),
      timeZone: UTC,
    });
    expect(s.remaining.ms).toBe(0);
    expect(s.remaining.totals.seconds).toBe(0);
    expect(s.percentLived).toBe(100);
  });

  it("lived + remaining = expected span", () => {
    const birth = at("1995-06-15T00:00:00Z");
    const expectedDeath = at("2075-06-15T00:00:00Z");
    const s = lifeSnapshot({
      birth,
      expectedDeath,
      now: at("2026-10-12T08:30:00Z"),
      timeZone: UTC,
    });
    expect(s.lived.ms + s.remaining.ms).toBe(
      expectedDeath.getTime() - birth.getTime(),
    );
  });
});
