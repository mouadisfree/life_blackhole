"use client";

import { useEffect, useState } from "react";
import { type LifeTableData, loadLifeTables } from "@/lib/life-expectancy";

let cache: Promise<LifeTableData> | null = null;

/**
 * Start fetching the tables early (call at module scope of a screen that
 * needs them) so the request doesn't wait for hydration.
 */
export function preloadLifeTables(): void {
  if (typeof window === "undefined") return;
  cache ??= loadLifeTables();
}

/** Lazily loads the life tables once per page session. Pass `enabled=false` to defer. */
export function useLifeTables(enabled = true): LifeTableData | null {
  const [data, setData] = useState<LifeTableData | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    cache ??= loadLifeTables();
    void cache.then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return data;
}
