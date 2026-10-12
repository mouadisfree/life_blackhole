"use client";

import { MotionConfig } from "motion/react";
import { useAppStore } from "@/lib/store";

/** Motion follows the in-app setting; "system" defers to the OS preference. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pref = useAppStore((s) => s.settings.motion);
  const reducedMotion =
    pref === "reduce" ? "always" : pref === "full" ? "never" : "user";
  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
