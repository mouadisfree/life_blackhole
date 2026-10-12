import { describe, expect, it } from "vitest";
import realData from "@/data/life-tables.json";
import {
  getBirthdayBonus,
  getExpectedLifespan,
  type LifeTableData,
  remainingExpectancyAt,
  resolveTable,
} from "./life-expectancy";
import {
  anniversary,
  MS_PER_DAY,
  MS_PER_YEAR,
  validateBirth,
} from "./life-math";

const UTC = "UTC";
const data = realData as LifeTableData;

/** Small hand-made table so expectations are exact. */
const fixture: LifeTableData = {
  source: {
    dataset: "Fixture",
    publisher: "Tests",
    table: "fixture",
    indicator: "e(x)",
    year: 2026,
    url: "https://example.test",
    file: "https://example.test/file",
    citation: "Fixture",
    license: "n/a",
  },
  ages: [0, 1, 5, 10, 100],
  locations: {
    WLD: {
      name: "World",
      iso2: null,
      ex: {
        both: [70, 72, 68, 63, 2],
        female: [72, 74, 70, 65, 2.5],
        male: [68, 70, 66, 61, 1.5],
      },
    },
    MAR: {
      name: "Morocco",
      iso2: "MA",
      ex: {
        both: [76, 77, 73, 68, 2.2],
        female: [78, 79, 75, 70, 2.4],
        male: [74, 75, 71, 66, 2],
      },
    },
  },
};

function birth(date: string, timeZone = UTC): Date {
  const r = validateBirth({ date, timeZone }, new Date("2027-12-31T00:00:00Z"));
  if (!r.ok) throw new Error(r.reason);
  return r.birth;
}

describe("remainingExpectancyAt", () => {
  const { ages } = fixture;
  const values = fixture.locations.WLD!.ex.both;

  it("returns exact table values at table ages", () => {
    expect(remainingExpectancyAt(ages, values, 0)).toBe(70);
    expect(remainingExpectancyAt(ages, values, 5)).toBe(68);
  });

  it("interpolates linearly between ages", () => {
    expect(remainingExpectancyAt(ages, values, 3)).toBe(70); // 72 → 68, halfway
    expect(remainingExpectancyAt(ages, values, 55)).toBeCloseTo(32.5, 10); // 63 → 2, halfway
  });

  it("uses the open 100+ group for very old ages", () => {
    expect(remainingExpectancyAt(ages, values, 100)).toBe(2);
    expect(remainingExpectancyAt(ages, values, 118)).toBe(2);
  });

  it("rejects malformed tables", () => {
    expect(() => remainingExpectancyAt([0, 1], [70], 0)).toThrow();
  });
});

describe("resolveTable", () => {
  it("picks country + sex", () => {
    const t = resolveTable(fixture, "MAR", "female");
    expect(t).toMatchObject({
      iso3: "MAR",
      sex: "female",
      usedFallback: false,
    });
    expect(t.values[0]).toBe(78);
  });

  it("is case-insensitive on ISO3", () => {
    expect(resolveTable(fixture, "mar", "male").iso3).toBe("MAR");
  });

  it("uses both sexes when sex is unspecified or missing", () => {
    expect(resolveTable(fixture, "MAR", "unspecified").sex).toBe("both");
    expect(resolveTable(fixture, "MAR", undefined).sex).toBe("both");
  });

  it("falls back to World when no country is given (not flagged as a fallback)", () => {
    expect(resolveTable(fixture, undefined, "male")).toMatchObject({
      iso3: "WLD",
      usedFallback: false,
    });
  });

  it("falls back to World for an unknown country, and says so", () => {
    expect(resolveTable(fixture, "ZZZ", "male")).toMatchObject({
      iso3: "WLD",
      usedFallback: true,
    });
  });
});

describe("getExpectedLifespan", () => {
  it("uses e(age at last birthday) and fixes the date from that birthday", () => {
    const b = birth("2016-10-12"); // turns 10 on 2026-10-12
    const now = new Date("2026-10-12T12:00:00Z");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      now,
      data: fixture,
    });
    expect(r.ageYears).toBe(10);
    expect(r.remainingYearsAtLastBirthday).toBe(63);
    expect(r.expectedTotalYears).toBe(73);
    expect(r.lastBirthday.toISOString()).toBe("2026-10-12T00:00:00.000Z");
    expect(r.expectedDeathDate.getTime()).toBe(
      r.lastBirthday.getTime() + Math.round(63 * MS_PER_YEAR),
    );
    expect(r.source).toMatchObject({
      iso3: "WLD",
      sex: "both",
      dataset: "Fixture",
    });
  });

  it("holds the expected date constant until the next birthday (D2)", () => {
    const b = birth("1990-03-01");
    const dates = [
      "2026-03-01T00:00:00Z",
      "2026-07-15T09:00:00Z",
      "2027-02-28T23:59:59Z",
    ].map((now) =>
      getExpectedLifespan({
        birthDate: b,
        timeZone: UTC,
        now: new Date(now),
        data,
      }).expectedDeathDate.getTime(),
    );
    expect(new Set(dates).size).toBe(1);
  });

  it("moves the horizon back a little on each birthday, and reports the bonus", () => {
    const b = birth("1990-03-01");
    const before = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      now: new Date("2027-02-28T23:59:59Z"),
      data,
    });
    const input = {
      birthDate: b,
      timeZone: UTC,
      now: new Date("2027-03-01T00:00:00Z"),
      data,
    };
    const after = getExpectedLifespan(input);
    const shift =
      after.expectedDeathDate.getTime() - before.expectedDeathDate.getTime();
    expect(shift).toBeGreaterThan(0);
    expect(shift).toBeLessThan(0.5 * MS_PER_YEAR); // weeks, not years
    expect(getBirthdayBonus(input)).toBe(shift);
  });

  it("has no birthday bonus before the first birthday", () => {
    const b = birth("2026-10-12");
    expect(
      getBirthdayBonus({
        birthDate: b,
        timeZone: UTC,
        now: new Date("2026-12-01T00:00:00Z"),
        data,
      }),
    ).toBeNull();
  });

  it("handles a birth date of today", () => {
    const b = birth("2026-10-12");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      now: new Date("2026-10-12T00:00:01Z"),
      data: fixture,
    });
    expect(r.ageYears).toBe(0);
    expect(r.expectedTotalYears).toBe(70);
    expect(r.outlivedAtBirthExpectancy).toBe(false);
  });

  it("Feb 29 birthdays anchor on Feb 28 in non-leap years", () => {
    const b = birth("2000-02-29");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      now: new Date("2026-03-15T00:00:00Z"),
      data: fixture,
    });
    expect(r.ageYears).toBe(26);
    expect(r.lastBirthday.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("flags 'outlived the average' past e(0), while remaining stays positive", () => {
    const b = birth("1950-01-01"); // 76 in 2026, past World e(0) = 70 in the fixture
    const now = new Date("2026-10-12T00:00:00Z");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      now,
      data: fixture,
    });
    expect(r.outlivedAtBirthExpectancy).toBe(true);
    expect(r.expectedDeathDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it("handles very old ages with the 100+ group", () => {
    const b = birth("1906-01-01");
    const now = new Date("2026-10-12T00:00:00Z");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: UTC,
      country: "JPN",
      sex: "female",
      now,
      data,
    });
    expect(r.ageYears).toBe(120);
    expect(r.remainingYearsAtLastBirthday).toBe(
      data.locations.JPN!.ex.female.at(-1),
    );
    expect(r.expectedDeathDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it("is computed in the user's zone", () => {
    const now = new Date("2026-01-01T04:00:00Z");
    const tokyo = getExpectedLifespan({
      birthDate: birth("2000-01-01", "Asia/Tokyo"),
      timeZone: "Asia/Tokyo",
      now,
      data: fixture,
    });
    const ny = getExpectedLifespan({
      birthDate: birth("2000-01-01", "America/New_York"),
      timeZone: "America/New_York",
      now,
      data: fixture,
    });
    expect(tokyo.ageYears).toBe(26);
    expect(ny.ageYears).toBe(25);
  });
});

describe("real UN WPP 2024 data", () => {
  it("records its source", () => {
    expect(data.source.dataset).toBe("World Population Prospects 2024");
    expect(data.source.year).toBe(2026);
    expect(data.source.url).toMatch(/^https:\/\/population\.un\.org\/wpp/);
  });

  it("covers the World aggregate and every country with three sex tables of matching length", () => {
    expect(Object.keys(data.locations).length).toBeGreaterThanOrEqual(230);
    for (const [iso3, loc] of Object.entries(data.locations)) {
      expect(iso3).toMatch(/^[A-Z]{3}$/);
      for (const sex of ["both", "female", "male"] as const) {
        expect(loc.ex[sex]).toHaveLength(data.ages.length);
        for (const v of loc.ex[sex]) expect(v).toBeGreaterThan(0);
      }
    }
  });

  it("has plausible values", () => {
    const e0 = (iso: string, sex: "both" | "female" | "male") =>
      data.locations[iso]!.ex[sex][0]!;
    expect(e0("WLD", "both")).toBeGreaterThan(65);
    expect(e0("WLD", "both")).toBeLessThan(80);
    expect(e0("JPN", "female")).toBeGreaterThan(e0("JPN", "male"));
    // Remaining expectancy at 30 + 30 exceeds expectancy at birth (survivorship).
    const i30 = data.ages.indexOf(30);
    expect(30 + data.locations.MAR!.ex.both[i30]!).toBeGreaterThan(
      e0("MAR", "both"),
    );
  });

  it("gives a 30-year-old in Morocco a total above Morocco's e(0)", () => {
    const b = birth("1996-01-01");
    const r = getExpectedLifespan({
      birthDate: b,
      timeZone: "Africa/Casablanca",
      country: "MAR",
      now: new Date("2026-10-12T00:00:00Z"),
      data,
    });
    expect(r.ageYears).toBe(30);
    expect(r.expectedTotalYears).toBeGreaterThan(r.expectancyAtBirth);
    expect(anniversary(b, 30, "Africa/Casablanca").getTime()).toBe(
      r.lastBirthday.getTime(),
    );
    expect(
      r.expectedDeathDate.getTime() - r.lastBirthday.getTime(),
    ).toBeGreaterThan(40 * 365 * MS_PER_DAY);
  });
});

describe("served copy", () => {
  it("public/data matches data/life-tables.json (run `pnpm data:build` after changes)", async () => {
    const { readFileSync } = await import("node:fs");
    const served = JSON.parse(
      readFileSync("public/data/life-tables-2026.json", "utf8"),
    );
    expect(served).toEqual(data);
  });
});
