"use client";

/* eslint-disable react-hooks/immutability --
   Same rationale as GlobalScene.tsx: this project does not enable the React Compiler,
   and useFrame mutating typed arrays / Object3D properties every frame is the documented,
   performant R3F pattern, not a React re-render concern. */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const YELLOW = "#ffd400";
const HALO = "#fff2b3";

// Hand-placed local layout (not random scatter) so the shape reads as an
// intentional constellation: a bright spine of primary stars with a loose
// scatter of dimmer secondary stars threaded between them.
const PRIMARY: [number, number, number][] = [
  [0, 2.3, -1.2],
  [-1.9, 0.7, -2.6],
  [1.9, 0.6, -1.6],
  [0.1, -0.9, -3.1],
  [0.3, -2.8, -2.1],
  [2.8, -1.5, -3.6],
];

const SECONDARY: [number, number, number][] = [
  [-0.7, 1.7, -1.9],
  [0.9, 1.6, -2.3],
  [-2.7, -0.2, -3.1],
  [2.8, 1.7, -2.1],
  [-1.0, -1.6, -2.7],
  [1.2, -2.0, -1.6],
  [0.4, 0.2, -3.4],
  [-1.7, -2.3, -2.3],
  [3.5, 0.2, -2.9],
  [-3.3, 1.1, -2.1],
  [2.0, -3.1, -3.1],
  [-0.2, 3.1, -2.5],
];

const ALL = [...PRIMARY, ...SECONDARY];
const PRIMARY_COUNT = PRIMARY.length;
const NODE_COUNT = ALL.length;
const CONNECT_DIST = 2.5;

function buildCandidates() {
  const edges: [number, number][] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const [ax, ay, az] = ALL[i];
      const [bx, by, bz] = ALL[j];
      if (Math.hypot(ax - bx, ay - by, az - bz) < CONNECT_DIST) edges.push([i, j]);
    }
  }
  return edges;
}

function buildChains(edges: [number, number][]) {
  // small connected walks (3-4 nodes) used for the occasional "sequence draws itself" moment
  const adjacency = new Map<number, number[]>();
  edges.forEach(([a, b]) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  });
  const chains: number[][] = [];
  adjacency.forEach((neighbors, start) => {
    if (neighbors.length === 0) return;
    const chain = [start];
    let current = start;
    for (let step = 0; step < 3; step++) {
      const options = (adjacency.get(current) || []).filter((n) => !chain.includes(n));
      if (!options.length) break;
      const next = options[Math.floor(Math.random() * options.length)];
      chain.push(next);
      current = next;
    }
    if (chain.length >= 3) chains.push(chain);
  });
  return chains;
}

type Phase = "in" | "hold" | "out";
interface Slot {
  active: boolean;
  a: number;
  b: number;
  progress: number;
  phase: Phase;
  holdTimer: number;
}


export default function HeroConstellation({ mobile, aboutFade }: { mobile: boolean; aboutFade: React.RefObject<number> }) {
  const { camera } = useThree();
  const candidates = useMemo(() => buildCandidates(), []);
  const chains = useMemo(() => buildChains(candidates), [candidates]);
  const slotCount = mobile ? 5 : 9;
  const slots = useRef<Slot[]>(
    Array.from({ length: slotCount }, () => ({ active: false, a: 0, b: 0, progress: 0, phase: "in" as Phase, holdTimer: 0 }))
  );
  const nextSpawn = useRef(0);
  const nextChain = useRef(6);
  const chainQueue = useRef<{ slotIndex: number; a: number; b: number; delay: number }[]>([]);

  const livePositions = useMemo(() => new Float32Array(NODE_COUNT * 3), []);
  const primaryBuf = useMemo(() => new Float32Array(PRIMARY_COUNT * 3), []);
  const secondaryBuf = useMemo(() => new Float32Array((NODE_COUNT - PRIMARY_COUNT) * 3), []);

  const groupRef = useRef<THREE.Group>(null);
  const primaryPointsRef = useRef<THREE.Points>(null);
  const haloPointsRef = useRef<THREE.Points>(null);
  const secondaryPointsRef = useRef<THREE.Points>(null);
  const primaryMatRef = useRef<THREE.PointsMaterial>(null);
  const haloMatRef = useRef<THREE.PointsMaterial>(null);
  const secondaryMatRef = useRef<THREE.PointsMaterial>(null);

  // "line" collides with the SVG <line> JSX type, so slot lines are built as
  // real THREE.Line objects and mounted via <primitive>.
  const slotLines = useMemo(
    () => Array.from({ length: slotCount }, () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const material = new THREE.LineBasicMaterial({ color: YELLOW, transparent: true, opacity: 0.21, depthWrite: false });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      return line;
    }),
    [slotCount]
  );

  const cursorWorld = useRef(new THREE.Vector3(9999, 9999, 9999));
  const scratchDir = useRef(new THREE.Vector3());
  const scratchOrigin = useRef(new THREE.Vector3(0, 0, 0.5));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const fade = aboutFade.current;

    if (groupRef.current) groupRef.current.visible = fade > 0.01;
    if (!groupRef.current || fade <= 0.01) return;

    // project pointer to a world point at the constellation's approximate depth
    scratchOrigin.current.set(state.pointer.x, state.pointer.y, 0.5).unproject(camera);
    scratchDir.current.copy(scratchOrigin.current).sub(camera.position).normalize();
    const targetZ = -3 + (groupRef.current.position.z || 0);
    const dist = (targetZ - camera.position.z) / scratchDir.current.z;
    if (isFinite(dist)) {
      cursorWorld.current.copy(camera.position).addScaledVector(scratchDir.current, dist);
    }

    // node positions: tiny organic drift + gentle attraction of primary stars toward the cursor
    for (let i = 0; i < NODE_COUNT; i++) {
      const [bx, by, bz] = ALL[i];
      let x = bx + Math.sin(t * 0.09 + i * 1.7) * 0.06;
      let y = by + Math.cos(t * 0.07 + i * 2.1) * 0.06;
      const z = bz + Math.sin(t * 0.05 + i * 1.3) * 0.05;
      if (i < PRIMARY_COUNT) {
        const worldX = x + (groupRef.current.position.x || 0);
        const worldY = y + (groupRef.current.position.y || 0);
        const dx = cursorWorld.current.x - worldX;
        const dy = cursorWorld.current.y - worldY;
        const d = Math.hypot(dx, dy);
        if (d < 3.2 && d > 0.001) {
          const pull = (1 - d / 3.2) * 0.22;
          x += (dx / d) * pull;
          y += (dy / d) * pull;
        }
      }
      livePositions[i * 3] = x;
      livePositions[i * 3 + 1] = y;
      livePositions[i * 3 + 2] = z;
    }

    for (let i = 0; i < PRIMARY_COUNT; i++) {
      primaryBuf[i * 3] = livePositions[i * 3];
      primaryBuf[i * 3 + 1] = livePositions[i * 3 + 1];
      primaryBuf[i * 3 + 2] = livePositions[i * 3 + 2];
    }
    for (let i = PRIMARY_COUNT; i < NODE_COUNT; i++) {
      const o = (i - PRIMARY_COUNT) * 3;
      secondaryBuf[o] = livePositions[i * 3];
      secondaryBuf[o + 1] = livePositions[i * 3 + 1];
      secondaryBuf[o + 2] = livePositions[i * 3 + 2];
    }
    if (primaryPointsRef.current) (primaryPointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    if (haloPointsRef.current) (haloPointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    if (secondaryPointsRef.current) (secondaryPointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // slow, gentle group-level pulsing, distinct phase per tier
    const primaryPulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 0.5));
    const secondaryPulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.38 + 2.1));
    if (primaryMatRef.current) primaryMatRef.current.opacity = 0.82 * primaryPulse * fade;
    if (haloMatRef.current) haloMatRef.current.opacity = 0.08 * primaryPulse * fade;
    if (secondaryMatRef.current) secondaryMatRef.current.opacity = 0.42 * secondaryPulse * fade;

    // spawn scheduling: mostly single connections, occasionally a drawn-out chain sequence
    if (t > nextSpawn.current) {
      const free = slots.current.findIndex((s) => !s.active);
      if (free !== -1 && candidates.length) {
        const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
        slots.current[free] = { active: true, a, b, progress: 0, phase: "in", holdTimer: 0 };
      }
      nextSpawn.current = t + 1.8 + Math.random() * 2.2;
    }
    if (t > nextChain.current && chains.length && !mobile) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      let delay = 0;
      for (let i = 0; i < chain.length - 1; i++) {
        const free = slots.current.findIndex((s) => !s.active && !chainQueue.current.some((q) => q.slotIndex === slots.current.indexOf(s)));
        if (free === -1) continue;
        chainQueue.current.push({ slotIndex: free, a: chain[i], b: chain[i + 1], delay: t + delay });
        slots.current[free].active = true; // reserve immediately so spawn scheduler skips it
        delay += 0.55;
      }
      nextChain.current = t + 11 + Math.random() * 7;
    }
    chainQueue.current = chainQueue.current.filter((q) => {
      if (t >= q.delay) {
        slots.current[q.slotIndex] = { active: true, a: q.a, b: q.b, progress: 0, phase: "in", holdTimer: 0 };
        return false;
      }
      return true;
    });

    // advance + render each slot's drawing line
    slots.current.forEach((slot, i) => {
      const line = slotLines[i];
      const geo = line.geometry;
      const mat = line.material as THREE.LineBasicMaterial;

      if (!slot.active) {
        line.visible = false;
        return;
      }

      if (slot.phase === "in") {
        slot.progress = Math.min(1, slot.progress + dt / 1.3);
        if (slot.progress >= 1) { slot.phase = "hold"; slot.holdTimer = 2.6 + Math.random() * 2.2; }
      } else if (slot.phase === "hold") {
        slot.holdTimer -= dt;
        if (slot.holdTimer <= 0) slot.phase = "out";
      } else {
        slot.progress = Math.max(0, slot.progress - dt / 1.1);
        if (slot.progress <= 0) { slot.active = false; }
      }

      line.visible = true;
      const ax = livePositions[slot.a * 3], ay = livePositions[slot.a * 3 + 1], az = livePositions[slot.a * 3 + 2];
      const bx = livePositions[slot.b * 3], by = livePositions[slot.b * 3 + 1], bz = livePositions[slot.b * 3 + 2];
      const ease = slot.progress * slot.progress * (3 - 2 * slot.progress);
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, ax, ay, az);
      posAttr.setXYZ(1, ax + (bx - ax) * ease, ay + (by - ay) * ease, az + (bz - az) * ease);
      posAttr.needsUpdate = true;

      const midX = (ax + bx) / 2, midY = (ay + by) / 2;
      const worldMidX = midX + (groupRef.current!.position.x || 0);
      const worldMidY = midY + (groupRef.current!.position.y || 0);
      const cursorDist = Math.hypot(cursorWorld.current.x - worldMidX, cursorWorld.current.y - worldMidY);
      const cursorBoost = cursorDist < 2.4 ? (1 - cursorDist / 2.4) * 0.35 : 0;
      mat.opacity = (0.21 + cursorBoost) * fade;
    });
  });

  return (
    <group ref={groupRef} position={mobile ? [1.2, 0.4, -1.8] : [3.2, 1.6, -1.7]} scale={mobile ? 0.68 : 0.95}>
      <points ref={haloPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[primaryBuf, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={haloMatRef} color={HALO} size={0.3} sizeAttenuation transparent opacity={0.09} depthWrite={false} />
      </points>
      <points ref={primaryPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[primaryBuf, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={primaryMatRef} color={YELLOW} size={0.12} sizeAttenuation transparent opacity={0.88} depthWrite={false} />
      </points>
      <points ref={secondaryPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[secondaryBuf, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={secondaryMatRef} color={YELLOW} size={0.06} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
      </points>
      {slotLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
