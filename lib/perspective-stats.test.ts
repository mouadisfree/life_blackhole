import { describe, expect, it } from "vitest";
import { MS_PER_DAY, MS_PER_MINUTE, MS_PER_YEAR } from "./life-math";
import {
  ASSUMPTIONS,
  computePerspectiveStats,
  countSaturdays,
  PERSPECTIVE_STATS,
  type StatContext,
} from "./perspective-stats";

const UTC = "UTC";
const at = (iso: string) => new Date(iso);

describe("countSaturdays", () => {
  // 2026-10-12 is a Monday; 2026-10-17 is a Saturday.
  it("counts Saturdays from today up to (not including) the end date", () => {
    expect(
      countSaturdays(
        at("2026-10-12T12:00:00Z"),
        at("2026-10-17T00:00:00Z"),
        UTC,
      ),
    ).toBe(0);
    expect(
      countSaturdays(
        at("2026-10-12T12:00:00Z"),
        at("2026-10-18T00:00:00Z"),
        UTC,
      ),
    ).toBe(1);
    expect(
      countSaturdays(
        at("2026-10-12T12:00:00Z"),
        at("2026-10-25T00:00:00Z"),
        UTC,
      ),
    ).toBe(2);
  });

  it("includes today when today is Saturday", () => {
    expect(
      countSaturdays(
        at("2026-10-17T20:00:00Z"),
        at("2026-10-18T00:00:00Z"),
        UTC,
      ),
    ).toBe(1);
  });

  it("matches ~52.18 per year over long spans", () => {
    const n = countSaturdays(
      at("2026-01-01T00:00:00Z"),
      at("2126-01-01T00:00:00Z"),
      UTC,
    );
    expect(n).toBeGreaterThanOrEqual(5217);
    expect(n).toBeLessThanOrEqual(5218);
  });

  it("returns 0 for empty or reversed ranges", () => {
    expect(
      countSaturdays(
        at("2026-10-17T00:00:00Z"),
        at("2026-10-17T00:00:00Z"),
        UTC,
      ),
    ).toBe(0);
    expect(
      countSaturdays(
        at("2026-10-20T00:00:00Z"),
        at("2026-10-01T00:00:00Z"),
        UTC,
      ),
    ).toBe(0);
  });

  it("uses the user's zone to decide what day it is", () => {
    // Fri 23:00 in New York is already Saturday in UTC.
    const now = at("2026-10-17T03:00:00Z");
    const end = at("2026-10-18T12:00:00Z");
    expect(countSaturdays(now, end, "America/New_York")).toBe(1);
    expect(countSaturdays(now, end, UTC)).toBe(1);
  });
});

describe("computePerspectiveStats", () => {
  const ctx: StatContext = {
    birth: at("2000-01-01T00:00:00Z"),
    now: new Date(at("2000-01-01T00:00:00Z").getTime() + 10 * MS_PER_YEAR),
    expectedDeath: new Date(
      at("2000-01-01T00:00:00Z").getTime() + 80 * MS_PER_YEAR,
    ),
    timeZone: UTC,
  };
  const byId = Object.fromEntries(
    computePerspectiveStats(ctx).map((s) => [s.id, s]),
  );
  const livedMinutes = (10 * MS_PER_YEAR) / MS_PER_MINUTE;
  const remainingMs = 70 * MS_PER_YEAR;

  it("has unique ids and covers the stats listed in the spec", () => {
    const ids = PERSPECTIVE_STATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "weekendsLeft",
        "summersLeft",
        "fullMoonsLeft",
        "heartbeatsSoFar",
        "breathsSoFar",
        "sleepHoursSoFar",
        "booksLeft",
        "sunrisesLeft",
      ]),
    );
  });

  it("computes lived-based estimates from the stated assumptions", () => {
    expect(byId.heartbeatsSoFar!.value).toBe(
      Math.floor(livedMinutes * ASSUMPTIONS.heartbeatsPerMinute),
    );
    expect(byId.breathsSoFar!.value).toBe(
      Math.floor(livedMinutes * ASSUMPTIONS.breathsPerMinute),
    );
    expect(byId.sleepHoursSoFar!.value).toBe(
      Math.floor((10 * MS_PER_YEAR) / 3_600_000 / 3),
    );
  });

  it("computes remaining-based estimates", () => {
    expect(byId.summersLeft!.value).toBe(70);
    expect(byId.fullMoonsLeft!.value).toBe(
      Math.floor(remainingMs / (ASSUMPTIONS.synodicMonthDays * MS_PER_DAY)),
    );
    expect(byId.booksLeft!.value).toBeGreaterThanOrEqual(839);
    expect(byId.booksLeft!.value).toBeLessThanOrEqual(840);
    expect(
      Math.abs(byId.sunrisesLeft!.value - remainingMs / MS_PER_DAY),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(byId.weekendsLeft!.value - (70 * 365.2425) / 7),
    ).toBeLessThanOrEqual(1);
  });

  it("never returns negatives past the expected date", () => {
    const past = {
      ...ctx,
      now: new Date(ctx.expectedDeath.getTime() + MS_PER_YEAR),
    };
    for (const s of computePerspectiveStats(past)) {
      expect(s.value).toBeGreaterThanOrEqual(0);
      if (s.direction === "remaining") expect(s.value).toBe(0);
    }
  });
});

describe("copy", () => {
  it("every stat has a label and assumption in messages/en.json", async () => {
    const messages = (await import("@/messages/en.json")).default as {
      Stats: Record<string, unknown>;
    };
    for (const { id } of PERSPECTIVE_STATS) {
      expect(messages.Stats[id]).toMatchObject({
        label: expect.any(String),
        assumption: expect.any(String),
      });
    }
  });
});
