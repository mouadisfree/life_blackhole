"use client";

import { useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** The in-app setting wins; "system" follows the OS preference. Server: reduced (safe default). */
export function useReducedMotion(): boolean {
  const pref = useAppStore((s) => s.settings.motion);
  const system = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
  if (pref === "reduce") return true;
  if (pref === "full") return false;
  return system;
}
