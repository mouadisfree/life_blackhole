import { describe, expect, it } from "vitest";
import realData from "@/data/life-tables.json";
import { countryOptions } from "./countries";
import type { LifeTableData } from "./life-expectancy";

const data = realData as LifeTableData;

describe("countryOptions", () => {
  const options = countryOptions(data, "en");

  it("excludes the World aggregate and keeps every country", () => {
    expect(options.find((o) => o.iso3 === "WLD")).toBeUndefined();
    expect(options).toHaveLength(Object.keys(data.locations).length - 1);
  });

  it("uses localised display names", () => {
    expect(options.find((o) => o.iso3 === "USA")?.name).toBe("United States");
    const fr = countryOptions(data, "fr");
    expect(fr.find((o) => o.iso3 === "MAR")?.name).toBe("Maroc");
  });

  it("is sorted for the locale", () => {
    const names = options.map((o) => o.name);
    expect([...names].sort(new Intl.Collator("en").compare)).toEqual(names);
  });

  it("falls back to the UN name when there's no ISO2 code", () => {
    const custom: LifeTableData = {
      ...data,
      locations: {
        XXX: { name: "Somewhere", iso2: null, ex: data.locations.WLD!.ex },
      },
    };
    expect(countryOptions(custom, "en")).toEqual([
      { iso3: "XXX", name: "Somewhere" },
    ]);
  });
});
