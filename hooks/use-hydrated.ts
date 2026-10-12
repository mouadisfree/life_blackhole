"use client";

import { useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";

const subscribe = (onChange: () => void) =>
  useAppStore.persist.onFinishHydration(onChange);

/**
 * True once the persisted store has loaded from localStorage. Before that
 * (and always during server prerender) render a neutral skeleton, so server
 * and client markup match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
