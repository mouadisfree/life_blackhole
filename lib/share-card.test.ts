import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHARE_OPTIONS,
  SHARE_SIZES,
  shareCardContent,
  shareFileName,
} from "./share-card";

const strings = {
  brand: "LIFE BLACKHOLE",
  percent: "38.33%",
  percentCaption: "of an average life lived",
  remaining: "About 49 years left",
  weekends: "≈ 2,567 weekends left",
  birthDate: "Born 14 March 1996",
  tagline: "Watch your time fall in.",
  host: "lifeblackhole.app",
};

describe("shareCardContent", () => {
  it("never includes the birth date by default", () => {
    expect(DEFAULT_SHARE_OPTIONS.showBirthDate).toBe(false);
    const c = shareCardContent(strings, DEFAULT_SHARE_OPTIONS);
    expect(JSON.stringify(c)).not.toContain("1996");
    expect(c.lines).toEqual([strings.remaining, strings.weekends]);
    expect(c.percent).toEqual({
      value: "38.33%",
      caption: strings.percentCaption,
    });
  });

  it("includes the birth date only when turned on", () => {
    const c = shareCardContent(strings, {
      ...DEFAULT_SHARE_OPTIONS,
      showBirthDate: true,
    });
    expect(c.lines).toContain(strings.birthDate);
  });

  it("can hide every personal number and keep the brand", () => {
    const c = shareCardContent(strings, {
      showPercent: false,
      showRemaining: false,
      showWeekends: false,
      showBirthDate: false,
    });
    expect(c.percent).toBeNull();
    expect(c.lines).toEqual([]);
    expect(c.brand).toBe("LIFE BLACKHOLE");
    expect(c.host).toBe("lifeblackhole.app");
  });
});

describe("share formats", () => {
  it("are 9:16 and 1:1 at 1080px wide", () => {
    expect(SHARE_SIZES.story.height / SHARE_SIZES.story.width).toBeCloseTo(
      16 / 9,
    );
    expect(SHARE_SIZES.post.height).toBe(SHARE_SIZES.post.width);
  });

  it("use file names without personal data", () => {
    expect(shareFileName("story")).toBe("life-blackhole-story.png");
    expect(shareFileName("post")).toBe("life-blackhole-post.png");
  });
});

describe("calendarDate", () => {
  it("keeps the calendar day regardless of the host zone", async () => {
    const { calendarDate } = await import("./share-card");
    const d = calendarDate("1996-03-14");
    expect(d.toISOString()).toBe("1996-03-14T00:00:00.000Z");
    expect(
      new Intl.DateTimeFormat("en", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(d),
    ).toBe("March 14, 1996");
  });
});
