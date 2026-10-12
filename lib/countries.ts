import type { LifeTableData } from "./life-expectancy";

export type CountryOption = { iso3: string; name: string };

/**
 * Country choices with names localised via Intl.DisplayNames (from ISO2),
 * falling back to the UN name when the runtime has no translation.
 */
export function countryOptions(
  data: LifeTableData,
  locale: string,
): CountryOption[] {
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([locale], {
      type: "region",
      fallback: "none",
    });
  } catch {
    display = null;
  }
  const collator = new Intl.Collator(locale);
  return Object.entries(data.locations)
    .filter(([iso3]) => iso3 !== "WLD")
    .map(([iso3, loc]) => ({
      iso3,
      name: (loc.iso2 && display?.of(loc.iso2)) || loc.name,
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}
