"use client";

import { useEffect, useState } from "react";
import { type LifeTableData, loadLifeTables } from "@/lib/life-expectancy";

let cache: Promise<LifeTableData> | null = null;

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
