"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  type DeviceTier,
  getDeviceTier,
  planRender,
  readDeviceEnv,
  type SceneVariant,
} from "@/lib/render-mode";
import { Fallback2D } from "./fallback-2d";
import type { FallbackReason } from "./scene";
import { SceneErrorBoundary } from "./scene-error-boundary";

// three.js (~600 KB) only loads when the WebGL scene is actually used.
const Scene = dynamic(() => import("./scene"), { ssr: false });

/**
 * Decorative black hole. Picks WebGL or the 2D canvas per device and motion
 * preference, and falls back to 2D on any WebGL failure. The numbers it
 * visualises are always rendered as text elsewhere, so it's aria-hidden.
 */
export function BlackHole({
  percentLived,
  variant,
  className,
}: {
  percentLived: number;
  variant: SceneVariant;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [device, setDevice] = useState<{
    tier: DeviceTier;
    maxDpr: number;
  } | null>(null);
  const [failed, setFailed] = useState<FallbackReason | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (variant === "idle") return; // never needs WebGL; skip the probe
    // Probing WebGL needs the DOM, so it runs after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDevice({
      tier: getDeviceTier(readDeviceEnv()),
      maxDpr: window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2,
    });
  }, [variant]);

  const plan = planRender({
    tier: device?.tier ?? "none",
    reducedMotion,
    variant,
  });
  const useWebgl = plan.mode === "webgl" && failed === null;
  // Visual changes per 0.1% are invisible; avoid rebuilding geometry every tick.
  const visualPercent = Math.round(percentLived * 10) / 10;
  const fallback = (
    <Fallback2D percentLived={visualPercent} animate={plan.animate} />
  );

  return (
    <div
      aria-hidden="true"
      data-render-mode={useWebgl ? "webgl" : "canvas"}
      data-animate={plan.animate}
      data-fallback-reason={failed ?? undefined}
      className={`pointer-events-none relative ${className ?? ""}`}
    >
      {useWebgl && device ? (
        <>
          {/* Keep the 2D version up until the WebGL scene has drawn. */}
          {!ready && fallback}
          <SceneErrorBoundary
            fallback={fallback}
            onError={() => setFailed("error")}
          >
            <Scene
              percentLived={visualPercent}
              animate={plan.animate}
              maxDpr={device.maxDpr}
              onReady={() => setReady(true)}
              onFallback={setFailed}
            />
          </SceneErrorBoundary>
        </>
      ) : (
        fallback
      )}
    </div>
  );
}
