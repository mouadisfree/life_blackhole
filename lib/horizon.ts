/**
 * One pure call that turns a saved profile into everything the Horizon screen
 * shows. Components render this; they never do date math themselves.
 */
import {
  getExpectedLifespan,
  type LifeTableData,
  type Lifespan,
} from "./life-expectancy";
import {
  type BirthValidation,
  type LifeSnapshot,
  lifeSnapshot,
  validateBirth,
} from "./life-math";
import {
  computePerspectiveStats,
  type PerspectiveValue,
} from "./perspective-stats";
import type { Profile } from "./store";

export type Horizon =
  | {
      ok: true;
      lifespan: Lifespan;
      snapshot: LifeSnapshot;
      stats: PerspectiveValue[];
      /** Whole years remaining, for summaries like "about 47 years left". */
      remainingWholeYears: number;
    }
  | { ok: false; reason: Extract<BirthValidation, { ok: false }>["reason"] };

export function computeHorizon(
  profile: Profile,
  data: LifeTableData,
  now: Date,
): Horizon {
  const v = validateBirth(profile.birth, now);
  if (!v.ok) return { ok: false, reason: v.reason };

  const { timeZone } = profile.birth;
  const lifespan = getExpectedLifespan({
    birthDate: v.birth,
    timeZone,
    country: profile.country,
    sex: profile.sex,
    now,
    data,
  });
  const snapshot = lifeSnapshot({
    birth: v.birth,
    expectedDeath: lifespan.expectedDeathDate,
    now,
    timeZone,
  });
  const stats = computePerspectiveStats({
    birth: v.birth,
    now,
    expectedDeath: lifespan.expectedDeathDate,
    timeZone,
  });
  return {
    ok: true,
    lifespan,
    snapshot,
    stats,
    remainingWholeYears: snapshot.remaining.breakdown.years,
  };
}
