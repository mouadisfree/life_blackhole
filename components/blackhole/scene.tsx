"use client";

import { Billboard, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CustomBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  LinearSRGBColorSpace,
  OneFactor,
  type PerspectiveCamera,
  type ShaderMaterial,
} from "three";
import { blackHoleParams } from "@/lib/blackhole-params";
import { PALETTE } from "@/lib/palette";
import {
  diskFragment,
  diskVertex,
  haloFragment,
  haloVertex,
  particlesFragment,
  particlesVertex,
} from "./shaders";

// Sky palette (lib/palette.ts). Stored as raw sRGB values: the shaders
// output them directly without colour-space conversion.
const color = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace);
const HOT = color(PALETTE.cloud);
const MID = color(PALETTE.mist);
const COOL = color(PALETTE.cyan);

/**
 * "Light" blending on a transparent canvas: shaders output colour with
 * alpha = its brightness, and both accumulate (1·src + 1·dst). The page sky
 * shows through, and bright matter reads as glowing over it.
 */
const LIGHT = {
  blending: CustomBlending,
  blendSrc: OneFactor,
  blendDst: OneFactor,
  blendSrcAlpha: OneFactor,
  blendDstAlpha: OneFactor,
} as const;

// Stable objects: inline literals would be re-applied by R3F on every render,
// resetting the camera that CameraRig positions.
const CAMERA = { fov: 38, near: 0.1, far: 200, position: [0, 1, 9] as const };
const GL = {
  antialias: false,
  alpha: true,
  powerPreference: "high-performance" as const,
};

/** A frozen moment that looks good when motion is reduced. */
const STILL_TIME = 14;
const PARTICLE_BUDGET = 1200;

type SceneProps = {
  percentLived: number;
  animate: boolean;
  /** Mobile/coarse pointers get a lower pixel-ratio cap. */
  maxDpr: number;
  onReady: () => void;
  onFallback: (reason: FallbackReason) => void;
};

export type FallbackReason = "error" | "slow" | "context-lost";

/** Pull the camera back on narrow screens so the whole disk fits. */
function CameraRig({ diskOuter }: { diskOuter: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const aspect = size.width / size.height;
    const halfFov = (cam.fov * Math.PI) / 360;
    // On portrait phones let the outer disk run off the sides: the horizon
    // and inner disk are the subject.
    const halfWidth = diskOuter * (aspect < 1 ? 0.78 : 1.02);
    const halfHeight = diskOuter * 0.5;
    const distForWidth = halfWidth / (Math.tan(halfFov) * aspect);
    const distForHeight = halfHeight / Math.tan(halfFov);
    const dist = Math.max(distForWidth, distForHeight);
    // ~15° above the disk plane.
    cam.position.set(0, dist * 0.27, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, diskOuter]);
  return null;
}

function setUniforms(
  material: ShaderMaterial | null,
  values: Record<string, number>,
) {
  if (!material) return;
  for (const [name, value] of Object.entries(values)) {
    const slot = material.uniforms[name];
    if (slot) slot.value = value;
  }
}

function useClock(animate: boolean) {
  const time = useRef(STILL_TIME);
  useFrame((_, delta) => {
    if (animate) time.current += Math.min(delta, 0.1) * 0.6;
  });
  return time;
}

function BlackHoleBody({
  percentLived,
  animate,
}: {
  percentLived: number;
  animate: boolean;
}) {
  const params = blackHoleParams(percentLived);
  const time = useClock(animate);
  const dpr = useThree((s) => s.viewport.dpr);
  const diskMat = useRef<ShaderMaterial>(null);
  const haloMat = useRef<ShaderMaterial>(null);
  const particleMat = useRef<ShaderMaterial>(null);

  // Uniform objects are created once; values are updated in place.
  const uniforms = useMemo(
    () => ({
      disk: {
        uTime: { value: STILL_TIME },
        uInner: { value: 1 },
        uOuter: { value: 4 },
        uMatter: { value: 1 },
        uHot: { value: HOT },
        uMid: { value: MID },
        uCool: { value: COOL },
      },
      halo: {
        uTime: { value: STILL_TIME },
        uHorizon: { value: 1 },
        uMatter: { value: 1 },
        uHot: { value: HOT },
        uMid: { value: MID },
        uCool: { value: COOL },
      },
      particles: {
        uTime: { value: STILL_TIME },
        uInner: { value: 1 },
        uOuter: { value: 4 },
        uHorizon: { value: 1 },
        uShare: { value: 1 },
        uPixelRatio: { value: 1 },
        uHot: { value: HOT },
        uCool: { value: COOL },
      },
    }),
    [],
  );

  const particleGeometry = useMemo(() => {
    const g = new BufferGeometry();
    const seeds = new Float32Array(PARTICLE_BUDGET * 4);
    const index = new Float32Array(PARTICLE_BUDGET);
    // Deterministic pseudo-random so the still frame is stable across renders.
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < PARTICLE_BUDGET; i++) {
      seeds.set(
        [rand(), rand() * Math.PI * 2, 0.4 + rand() * 0.8, rand()],
        i * 4,
      );
      index[i] = i / PARTICLE_BUDGET;
    }
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(PARTICLE_BUDGET * 3), 3),
    );
    g.setAttribute("aSeed", new BufferAttribute(seeds, 4));
    g.setAttribute("aIndex", new BufferAttribute(index, 1));
    return g;
  }, []);

  useEffect(() => () => particleGeometry.dispose(), [particleGeometry]);

  // Update uniforms through the material refs (three.js owns these objects).
  useFrame(() => {
    const t = time.current;
    setUniforms(diskMat.current, {
      uTime: t,
      uInner: params.diskInner,
      uOuter: params.diskOuter,
      uMatter: params.matter,
    });
    setUniforms(haloMat.current, {
      uTime: t,
      uHorizon: params.horizonRadius,
      uMatter: params.matter,
    });
    setUniforms(particleMat.current, {
      uTime: t,
      uInner: params.diskInner,
      uOuter: params.diskOuter,
      uHorizon: params.horizonRadius,
      uShare: params.particleShare,
      uPixelRatio: dpr,
    });
  });

  const quad = params.horizonRadius * 4.4;

  return (
    <group>
      {/* Lensed far side + photon ring, always facing the viewer. */}
      <Billboard>
        <mesh renderOrder={0}>
          <planeGeometry args={[quad, quad]} />
          <shaderMaterial
            ref={haloMat}
            vertexShader={haloVertex}
            fragmentShader={haloFragment}
            uniforms={uniforms.halo}
            transparent
            depthWrite={false}
            {...LIGHT}
          />
        </mesh>
      </Billboard>

      {/* Event horizon: pure black, writes depth so the far disk hides behind it. */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[params.horizonRadius, 64, 32]} />
        <meshBasicMaterial color={PALETTE.horizon} />
      </mesh>

      {/* Accretion disk in the XZ plane. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <ringGeometry args={[params.diskInner, params.diskOuter, 192, 1]} />
        <shaderMaterial
          ref={diskMat}
          vertexShader={diskVertex}
          fragmentShader={diskFragment}
          uniforms={uniforms.disk}
          transparent
          depthWrite={false}
          side={DoubleSide}
          {...LIGHT}
        />
      </mesh>

      <points geometry={particleGeometry} renderOrder={3} frustumCulled={false}>
        <shaderMaterial
          ref={particleMat}
          vertexShader={particlesVertex}
          fragmentShader={particlesFragment}
          uniforms={uniforms.particles}
          transparent
          depthWrite={false}
          {...LIGHT}
        />
      </points>
    </group>
  );
}

export default function Scene({
  percentLived,
  animate,
  maxDpr,
  onReady,
  onFallback,
}: SceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState(maxDpr);
  const params = blackHoleParams(percentLived);

  // Stop rendering while scrolled out of view.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setVisible(Boolean(entry?.isIntersecting)),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const frameloop = !animate ? "demand" : visible ? "always" : "never";

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        frameloop={frameloop}
        dpr={dpr}
        camera={CAMERA}
        gl={GL}
        onCreated={({ gl }) => {
          // Transparent: the sky and clouds behind the page show through.
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onFallback("context-lost");
          });
          requestAnimationFrame(onReady);
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
          flipflops={3}
          onFallback={() => {
            // Throttled background tabs report terrible fps; only trust a visible page.
            if (document.visibilityState === "visible") onFallback("slow");
          }}
        />
        <CameraRig diskOuter={params.diskOuter} />
        <BlackHoleBody percentLived={percentLived} animate={animate} />
      </Canvas>
    </div>
  );
}
