import { describe, expect, it } from "vitest";
import realData from "@/data/life-tables.json";
import { computeHorizon } from "./horizon";
import type { LifeTableData } from "./life-expectancy";

const data = realData as LifeTableData;
const now = new Date("2026-10-12T12:00:00Z");

describe("computeHorizon", () => {
  it("returns lifespan, snapshot and stats for a valid profile", () => {
    const h = computeHorizon(
      {
        birth: { date: "1996-03-14", timeZone: "Africa/Casablanca" },
        country: "MAR",
        sex: "female",
      },
      data,
      now,
    );
    if (!h.ok) throw new Error(h.reason);
    expect(h.lifespan.source).toMatchObject({ iso3: "MAR", sex: "female" });
    expect(h.snapshot.percentLived).toBeGreaterThan(30);
    expect(h.snapshot.percentLived).toBeLessThan(45);
    expect(h.remainingWholeYears).toBe(h.snapshot.remaining.breakdown.years);
    expect(h.stats.length).toBeGreaterThan(0);
  });

  it("reports invalid stored data instead of throwing", () => {
    expect(
      computeHorizon(
        { birth: { date: "2030-01-01", timeZone: "UTC" }, sex: "unspecified" },
        data,
        now,
      ),
    ).toEqual({ ok: false, reason: "future" });
  });
});

describe("computeHorizon extras", () => {
  const profile = {
    birth: { date: "1996-10-10", timeZone: "UTC" },
    sex: "unspecified" as const,
  };

  it("includes the weeks grid", () => {
    const h = computeHorizon(profile, data, now);
    if (!h.ok) throw new Error(h.reason);
    expect(h.weeks.current?.row).toBe(30);
    expect(h.weeks.livedWeeks).toBeLessThan(h.weeks.totalWeeks);
  });

  it("offers the birthday bonus in the week after a birthday, until seen", () => {
    const h = computeHorizon(profile, data, now);
    if (!h.ok) throw new Error(h.reason);
    expect(h.birthdayBonus?.age).toBe(30);
    expect(h.birthdayBonus?.ms).toBeGreaterThan(0);
    const seen = computeHorizon(profile, data, now, 30);
    if (!seen.ok) throw new Error(seen.reason);
    expect(seen.birthdayBonus).toBeNull();
  });
});
