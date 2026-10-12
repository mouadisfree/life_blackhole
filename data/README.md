# Data

## `life-tables.json`

Remaining life expectancy **e(x)** at exact age x, by country/area and sex, for the period year **2026**.

|             |                                                                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dataset     | World Population Prospects 2024 (WPP 2024), Online Edition — the latest edition as of 2026-10-12                                                                                                               |
| Publisher   | United Nations, Department of Economic and Social Affairs, Population Division                                                                                                                                 |
| Table       | Abridged life tables, **medium variant**, 2024–2100                                                                                                                                                            |
| Source page | https://population.un.org/wpp/                                                                                                                                                                                 |
| File        | [`WPP2024_Life_Table_Abridged_Medium_2024-2100.csv.gz`](<https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Life_Table_Abridged_Medium_2024-2100.csv.gz>) (~149 MB) |
| Downloaded  | 2026-10-12                                                                                                                                                                                                     |
| Citation    | United Nations, Department of Economic and Social Affairs, Population Division (2024). _World Population Prospects 2024, Online Edition._                                                                      |
| License     | Not stated on the 2024 download pages we could reach. Earlier WPP editions are published under CC BY 3.0 IGO. We attribute per UN DESA's citation guidance.                                                    |

### What's kept

- Locations: every row with `LocTypeName = "Country/Area"` (237) plus the `World` aggregate (stored as `WLD`).
- Sexes: `both` (WPP "Total"), `female`, `male`.
- Ages: 0, 1, 5, 10, …, 95, 100 (100 is the open 100+ group).
- Values: `ex`, rounded to 2 decimals. Also kept: location name and ISO2 code (for localised country names via `Intl.DisplayNames`).

### Why 2026 and the medium variant

WPP 2024 gives estimates through 2023 and projections from 2024. The app shows _today's_ period life table, so we use the current calendar year's row (2026) from the medium-variant projection, which is the UN's central scenario. Rebuild the file each year (or when WPP 2026 is published) by changing `TABLE_YEAR` in the script.

### How it's used

See `lib/life-expectancy.ts`: on each birthday the user's whole-year age k is looked up (linear interpolation between table ages) and the expected date is fixed at `birthday_k + e(k)` until the next birthday (PROGRESS.md D2). This is a **statistical average** for people of the same age, sex and country today, not a prediction for any individual.

### Regenerate

```bash
pnpm data:download   # → data/raw/ (gitignored)
pnpm data:build      # → data/life-tables.json
```
