"use client";

/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/purity, react-hooks/set-state-in-effect --
   This project does not enable the React Compiler (no reactCompiler config / babel plugin),
   so these are preventive lint rules only, not active runtime constraints here.
   React Three Fiber's useFrame is an imperative escape hatch by design: mutating typed
   arrays, refs, and Object3D properties (camera, points, lines) every frame is the
   documented, performant R3F pattern (see react-three-fiber docs on useFrame) — driving
   this via state would re-render at 60fps. Math.random() inside useMemo(..., []) is the
   standard one-time-random-init pattern. setState inside the mount effect is the standard
   SSR-safe way to read client-only APIs (window.matchMedia/innerWidth) after hydration. */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import HeroConstellation from "./HeroConstellation";

function scrollSettle() {
  const doc = document.documentElement;
  const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
  const frac = Math.min(1, window.scrollY / maxScroll);
  return 1 - Math.max(0, (frac - 0.85) / 0.15) * 0.7;
}

const YELLOW = "#ffd400";

interface FieldConfig {
  count: number;
  spreadX: number;
  spreadY: number;
  z: number;
  zJitter: number;
  size: number;
  opacity: number;
  connect: boolean;
  connectDist: number;
  drift: number;
  driftSpeed: number;
}

function buildField(cfg: FieldConfig) {
  const base = new Float32Array(cfg.count * 3);
  for (let i = 0; i < cfg.count; i++) {
    base[i * 3] = (Math.random() - 0.5) * cfg.spreadX;
    base[i * 3 + 1] = (Math.random() - 0.5) * cfg.spreadY;
    base[i * 3 + 2] = cfg.z + (Math.random() - 0.5) * cfg.zJitter;
  }
  const pairs: [number, number][] = [];
  if (cfg.connect) {
    for (let i = 0; i < cfg.count; i++) {
      for (let j = i + 1; j < cfg.count; j++) {
        const dx = base[i * 3] - base[j * 3];
        const dy = base[i * 3 + 1] - base[j * 3 + 1];
        const dz = base[i * 3 + 2] - base[j * 3 + 2];
        if (Math.hypot(dx, dy, dz) < cfg.connectDist) pairs.push([i, j]);
      }
    }
  }
  return { base, pairs };
}

function NodeField({ cfg, phase }: { cfg: FieldConfig; phase: number }) {
  const { base, pairs } = useMemo(() => buildField(cfg), [cfg]);
  const positions = useMemo(() => base.slice(), [base]);
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const linePositions = useMemo(() => new Float32Array(pairs.length * 6), [pairs.length]);

  useFrame((state) => {
    const settle = scrollSettle();
    const t = state.clock.elapsedTime * cfg.driftSpeed * settle + phase;
    const drift = cfg.drift * settle;
    for (let i = 0; i < cfg.count; i++) {
      positions[i * 3] = base[i * 3] + Math.sin(t + i) * drift;
      positions[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * 0.8 + i * 1.3) * drift;
      positions[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 0.6 + i * 0.7) * drift * 0.5;
    }
    if (pointsRef.current) {
      (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    if (cfg.connect && lineRef.current) {
      for (let p = 0; p < pairs.length; p++) {
        const [a, b] = pairs[p];
        linePositions[p * 6] = positions[a * 3];
        linePositions[p * 6 + 1] = positions[a * 3 + 1];
        linePositions[p * 6 + 2] = positions[a * 3 + 2];
        linePositions[p * 6 + 3] = positions[b * 3];
        linePositions[p * 6 + 4] = positions[b * 3 + 1];
        linePositions[p * 6 + 5] = positions[b * 3 + 2];
      }
      (lineRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={YELLOW} size={cfg.size} sizeAttenuation transparent opacity={cfg.opacity} depthWrite={false} />
      </points>
      {cfg.connect && (
        <lineSegments ref={lineRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={YELLOW} transparent opacity={cfg.opacity * 0.55} depthWrite={false} />
        </lineSegments>
      )}
    </>
  );
}

interface Trail {
  from: THREE.Vector3;
  to: THREE.Vector3;
  progress: number;
  speed: number;
}

function EnergyTrails({ anchors }: { anchors: THREE.Vector3[] }) {
  const trailsRef = useRef<Trail[]>([]);
  const lastSpawn = useRef(0);
  const meshRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const settle = scrollSettle();
    const spawnGap = 3.2 + (1 - settle) * 9;
    if (trailsRef.current.length < 2 && t - lastSpawn.current > spawnGap && anchors.length > 1) {
      const a = anchors[Math.floor(Math.random() * anchors.length)];
      let b = anchors[Math.floor(Math.random() * anchors.length)];
      let guard = 0;
      while (b === a && guard < 5) { b = anchors[Math.floor(Math.random() * anchors.length)]; guard++; }
      trailsRef.current.push({ from: a, to: b, progress: 0, speed: 0.09 + Math.random() * 0.05 });
      lastSpawn.current = t;
    }
    trailsRef.current.forEach((trail) => { trail.progress += trail.speed * 0.016; });
    trailsRef.current = trailsRef.current.filter((trail) => trail.progress < 1);

    meshRefs.forEach((ref, i) => {
      const trail = trailsRef.current[i];
      if (!ref.current) return;
      if (!trail) { ref.current.visible = false; return; }
      ref.current.visible = true;
      ref.current.position.lerpVectors(trail.from, trail.to, trail.progress);
      const fade = Math.sin(Math.min(Math.max(trail.progress, 0), 1) * Math.PI);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.9;
    });
  });

  return (
    <>
      {meshRefs.map((ref, i) => (
        <mesh ref={ref} key={i} visible={false}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#fff2b3" transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const smoothed = useRef({ x: 0, y: 0, z: 12, scroll: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reducedMotion]);

  useFrame((state) => {
    if (reducedMotion) {
      camera.position.set(0, 0, 12);
      camera.lookAt(0, 0, 0);
      return;
    }
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const scrollFrac = Math.min(1, window.scrollY / maxScroll);
    smoothed.current.scroll += (scrollFrac - smoothed.current.scroll) * 0.06;

    // near the very end of the journey, let the world settle: dampen parallax and bob
    const settle = 1 - Math.max(0, (smoothed.current.scroll - 0.85) / 0.15) * 0.85;

    const targetX = pointer.current.x * 0.7 * settle;
    const targetY = -pointer.current.y * 0.4 * settle;
    smoothed.current.x += (targetX - smoothed.current.x) * 0.035;
    smoothed.current.y += (targetY - smoothed.current.y) * 0.035;

    const dolly = 12 - smoothed.current.scroll * 13.5;
    const bob = Math.sin(state.clock.elapsedTime * 0.12) * 0.25 * settle;

    camera.position.x = smoothed.current.x;
    camera.position.y = smoothed.current.y + bob;
    camera.position.z = dolly;
    camera.lookAt(smoothed.current.x * 0.3, smoothed.current.scroll * -2.2, dolly - 9);
  });

  return null;
}

const FIELD_CONFIGS = {
  desktop: [
    { count: 30, spreadX: 34, spreadY: 20, z: -20, zJitter: 6, size: 0.05, opacity: 0.4, connect: false, connectDist: 0, drift: 0.4, driftSpeed: 0.05 },
    { count: 52, spreadX: 26, spreadY: 15, z: -9, zJitter: 4, size: 0.075, opacity: 0.68, connect: true, connectDist: 4.8, drift: 0.35, driftSpeed: 0.08 },
    { count: 28, spreadX: 18, spreadY: 11, z: -3, zJitter: 2.5, size: 0.085, opacity: 0.78, connect: true, connectDist: 4.2, drift: 0.3, driftSpeed: 0.1 },
    { count: 12, spreadX: 14, spreadY: 9, z: 2, zJitter: 2, size: 0.06, opacity: 0.5, connect: false, connectDist: 0, drift: 0.5, driftSpeed: 0.12 },
  ] as FieldConfig[],
  mobile: [
    { count: 16, spreadX: 24, spreadY: 16, z: -18, zJitter: 5, size: 0.05, opacity: 0.34, connect: false, connectDist: 0, drift: 0.3, driftSpeed: 0.05 },
    { count: 26, spreadX: 18, spreadY: 12, z: -8, zJitter: 3, size: 0.075, opacity: 0.6, connect: true, connectDist: 4.4, drift: 0.25, driftSpeed: 0.07 },
    { count: 14, spreadX: 12, spreadY: 9, z: -3, zJitter: 2, size: 0.075, opacity: 0.68, connect: true, connectDist: 3.8, drift: 0.22, driftSpeed: 0.09 },
  ] as FieldConfig[],
};

function Scene({ reducedMotion, mobile }: { reducedMotion: boolean; mobile: boolean }) {
  const fields = mobile ? FIELD_CONFIGS.mobile : FIELD_CONFIGS.desktop;
  const anchors = useMemo(
    () => Array.from({ length: 10 }, () => new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 13, -9 + (Math.random() - 0.5) * 4)),
    []
  );

  return (
    <>
      <fog attach="fog" args={["#050403", 10, 40]} />
      <ambientLight intensity={0.15} />
      {fields.map((cfg, i) => (
        <NodeField key={i} cfg={cfg} phase={i * 12.4} />
      ))}
      {!reducedMotion && !mobile && <EnergyTrails anchors={anchors} />}
      {!reducedMotion && <HeroConstellation mobile={mobile} />}
      <CameraRig reducedMotion={reducedMotion} />
    </>
  );
}

export default function GlobalScene() {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const checkMobile = () => setMobile(window.innerWidth < 760);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setReady(true);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!ready) return null;

  return (
    <div className="global-scene" aria-hidden="true">
      <Canvas
        dpr={mobile ? [1, 1.2] : [1, 1.5]}
        camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <Scene reducedMotion={reducedMotion} mobile={mobile} />
      </Canvas>
    </div>
  );
}
