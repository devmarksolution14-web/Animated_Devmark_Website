"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   This project does not enable the React Compiler (no reactCompiler config / babel plugin),
   so this is a preventive lint rule only. setState inside the mount effect is the standard
   SSR-safe way to read client-only APIs (window.matchMedia/innerWidth) after hydration. */

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ConstellationSky, { CAMERA_FAR, createPageMetrics, measurePage, pickSeed, revealFade, type PageMetrics } from "./ConstellationSky";

// While the render loop is paused (frameloop="demand"), draw only the frames
// that are needed: one when the sky deactivates (so it settles at fade 0), and
// one per scroll event, so the camera keeps tracking the scroll position while
// hidden and the reduced-motion sky still fades in at About.
function DemandFrames({ active, running }: { active: boolean; running: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [active, invalidate]);
  useEffect(() => {
    if (running) return;
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [running, invalidate]);
  return null;
}

export default function GlobalScene() {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [seed, setSeed] = useState(0);
  const [active, setActive] = useState(false);
  const metrics = useRef<PageMetrics>(createPageMetrics());

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Decided once: a later resize only resizes the canvas, it never rebuilds
    // (and so never resets) the sky.
    setMobile(window.matchMedia("(max-width: 759px)").matches);
    // Chosen once per page load: a new sky each visit, but stable while scrolling.
    setSeed(pickSeed());

    // Page measurements are cached here and refreshed only when the layout
    // changes, so the animation loop never reads layout.
    const m = metrics.current;
    const updateActive = () => setActive(!document.hidden && revealFade(m, window.scrollY) > 0);
    const remeasure = () => {
      measurePage(m);
      updateActive();
    };
    remeasure();
    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", updateActive, { passive: true });
    document.addEventListener("visibilitychange", updateActive);

    setReady(true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", updateActive);
      document.removeEventListener("visibilitychange", updateActive);
    };
  }, []);

  if (!ready) return null;

  // The loop only runs while the sky is visible and the tab is shown.
  const running = active && !reducedMotion;

  return (
    <div className="global-scene" aria-hidden="true">
      <Canvas
        dpr={mobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 0], fov: 60, near: 0.1, far: CAMERA_FAR }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        frameloop={running ? "always" : "demand"}
      >
        <ConstellationSky mobile={mobile} seed={seed} reducedMotion={reducedMotion} metrics={metrics} />
        <DemandFrames active={active} running={running} />
      </Canvas>
    </div>
  );
}
