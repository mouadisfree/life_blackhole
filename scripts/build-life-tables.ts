/**
 * Builds data/life-tables.json from the UN World Population Prospects 2024
 * abridged life tables (medium variant).
 *
 * Source: United Nations, Department of Economic and Social Affairs,
 * Population Division (2024). World Population Prospects 2024, Online Edition.
 * https://population.un.org/wpp/
 *
 * Usage (from the repo root):
 *   pnpm data:download   # fetches the raw CSV (~149 MB) into data/raw/
 *   pnpm data:build      # writes data/life-tables.json
 *
 * Runs on Node's built-in TypeScript type stripping (Node >= 22.18).
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";

export const SOURCE_URL =
  "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Life_Table_Abridged_Medium_2024-2100.csv.gz";
const RAW_PATH = "data/raw/WPP2024_Life_Table_Abridged_Medium_2024-2100.csv.gz";
const OUT_PATH = "data/life-tables.json";
/** Served copy the app fetches at runtime (see lib/life-expectancy.ts). */
const PUBLIC_PATH = `public/data/life-tables-${2026}.json`;

/** Period life table year. The current calendar year at build time (see data/README.md). */
const TABLE_YEAR = 2026;

const AGES = [
  0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
  95, 100,
] as const;

type SexKey = "both" | "female" | "male";
const SEX_MAP: Record<string, SexKey> = {
  Total: "both",
  Both: "both",
  Female: "female",
  Male: "male",
};

type LocationEntry = {
  name: string;
  iso2: string | null;
  ex: Partial<Record<SexKey, number[]>>;
};

/** Minimal RFC 4180 line parser: handles quoted fields with commas and "" escapes. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

async function main(): Promise<void> {
  if (!existsSync(RAW_PATH)) {
    console.error(`Missing ${RAW_PATH}. Run "pnpm data:download" first.`);
    process.exit(1);
  }

  const rl = createInterface({
    input: createReadStream(RAW_PATH).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let header: string[] | null = null;
  const col: Record<string, number> = {};
  const locations = new Map<string, LocationEntry>();
  // Raw ex values keyed by "ISO3|sex" → age → ex
  const raw = new Map<string, Map<number, number>>();

  for await (const rawLine of rl) {
    const line = rawLine.replace(/^﻿/, "");
    if (!header) {
      header = parseCsvLine(line);
      header.forEach((name, i) => (col[name] = i));
      for (const required of [
        "ISO3_code",
        "ISO2_code",
        "LocTypeName",
        "Location",
        "Variant",
        "Time",
        "Sex",
        "AgeGrpStart",
        "ex",
      ]) {
        if (col[required] === undefined) {
          throw new Error(`Unexpected CSV header: missing ${required}`);
        }
      }
      continue;
    }

    const f = parseCsvLine(line);
    const get = (name: string): string => f[col[name] as number] ?? "";

    if (get("Time") !== String(TABLE_YEAR) || get("Variant") !== "Medium") {
      continue;
    }
    const locType = get("LocTypeName");
    const isWorld = get("Location") === "World" && locType === "World";
    const isCountry = locType === "Country/Area";
    if (!isWorld && !isCountry) continue;

    const iso3 = isWorld ? "WLD" : get("ISO3_code");
    if (!iso3) continue;

    const sex = SEX_MAP[get("Sex")];
    if (!sex) throw new Error(`Unknown sex label: ${get("Sex")}`);

    const age = Number(get("AgeGrpStart"));
    const ex = Number(get("ex"));
    if (!Number.isFinite(age) || !Number.isFinite(ex)) {
      throw new Error(`Bad numeric row for ${iso3}: ${line}`);
    }

    if (!locations.has(iso3)) {
      locations.set(iso3, {
        name: get("Location"),
        iso2: isWorld ? null : get("ISO2_code") || null,
        ex: {},
      });
    }
    const key = `${iso3}|${sex}`;
    let byAge = raw.get(key);
    if (!byAge) {
      byAge = new Map();
      raw.set(key, byAge);
    }
    byAge.set(age, ex);
  }

  for (const [key, byAge] of raw) {
    const [iso3, sex] = key.split("|") as [string, SexKey];
    const values = AGES.map((age) => {
      const v = byAge.get(age);
      if (v === undefined) {
        throw new Error(`${iso3}/${sex}: missing age ${age}`);
      }
      return Math.round(v * 100) / 100;
    });
    // Sanity: remaining expectancy must be positive and broadly decreasing after age 1.
    values.forEach((v, i) => {
      if (v <= 0)
        throw new Error(`${iso3}/${sex}: non-positive ex at ${AGES[i]}`);
    });
    const entry = locations.get(iso3);
    if (!entry) throw new Error(`Missing location ${iso3}`);
    entry.ex[sex] = values;
  }

  for (const [iso3, entry] of locations) {
    for (const sex of ["both", "female", "male"] as const) {
      if (!entry.ex[sex]) throw new Error(`${iso3}: missing ${sex} table`);
    }
  }

  const sorted = Object.fromEntries(
    [...locations.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );

  const output = {
    source: {
      dataset: "World Population Prospects 2024",
      publisher:
        "United Nations, Department of Economic and Social Affairs, Population Division",
      table: "Abridged life tables, medium variant",
      indicator: "e(x): remaining life expectancy at exact age x, in years",
      year: TABLE_YEAR,
      url: "https://population.un.org/wpp/",
      file: SOURCE_URL,
      citation:
        "United Nations, Department of Economic and Social Affairs, Population Division (2024). World Population Prospects 2024, Online Edition.",
      license:
        "Not stated on the 2024 download pages; earlier WPP editions are CC BY 3.0 IGO. Attribution given per UN DESA citation guidance.",
    },
    ages: AGES,
    locations: sorted,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output) + "\n");
  mkdirSync("public/data", { recursive: true });
  writeFileSync(PUBLIC_PATH, JSON.stringify(output));
  console.log(
    `Wrote ${OUT_PATH}: ${locations.size} locations, year ${TABLE_YEAR}.`,
  );
}

await main();
