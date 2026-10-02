"use client";

/* eslint-disable react-hooks/immutability --
   This project does not enable the React Compiler, and useFrame mutating uniforms /
   Object3D properties every frame is the documented, performant R3F pattern, not a
   React re-render concern. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ───────────────────────────── Tunables ─────────────────────────────

/** World units the camera travels forward between the top and the bottom of the page. */
const SCROLL_DEPTH_RANGE = 110;
/** Camera spring rate (1/s). Higher follows the scroll position more tightly, lower floats more. */
const SMOOTHING = 3.2;
/** How far ahead the camera can see. Stars fade in at this distance and are dimmest near it. */
const FIELD_DEPTH = 60;
/** Number of small ambient clusters spread along the scroll path. */
const AMBIENT_COUNT = { desktop: 20, mobile: 12 };
/** Number of large hand-shaped constellations, one per major section (see HERO_SECTIONS). */
const HERO_COUNT = 5;
/** Longest line a constellation may draw (world units, before growth). Longer pattern edges are
 *  skipped so no shape turns into long bare lines across the screen. */
const LINE_DISTANCE = 8;
/** Star core size range in CSS px when the star is 10 units from the camera (scales with 1/depth). */
const STAR_SIZE_RANGE: [number, number] = [1.05, 10.5];
/** How much a linked constellation expands around its own centre by the time the camera reaches it
 *  (on top of normal perspective growth). 1 = no extra growth. Reverses exactly on scroll up. */
const CLUSTER_GROWTH = 1.8;
/** Camera distance at which a constellation starts growing, and distance at which it is fully grown. */
const GROWTH_START = 46;
const GROWTH_END = 6;
/** Line opacity multiplier when a constellation is fully grown (its lines fade as it grows; stars stay bright). */
const GROWN_OPACITY = 0.6;
/** Base opacity of constellation lines (0-1). The far destination keeps its own, softer value. */
const LINE_OPACITY = 0.34;
/** Seed for the layout when RANDOMIZE_EACH_VISIT is off. Change it for a different, but fixed, sky. */
const SEED = 20261002;
/** true: a fresh random sky on every page load (still identical scrolling down and back up within
 *  that visit). false: the same sky for everyone, every time, from SEED. */
const RANDOMIZE_EACH_VISIT = true;
/** Share of ambient clusters that are unnamed, randomly generated constellations (0-1); the rest are real ones. */
const PROCEDURAL_SHARE = 0.35;

/** The layout seed for this page load. */
export function pickSeed() {
  return RANDOMIZE_EACH_VISIT ? Math.floor(Math.random() * 0x7fffffff) : SEED;
}

// Secondary knobs
/** Loose background stars (no lines) that fill the space between clusters. */
const DUST_COUNT = { desktop: 420, mobile: 220 };
/** A section's constellation sits this far ahead of the camera when that section is centred. */
const HERO_LEAD = 14;
/** Max camera offset (world units) from mouse parallax. Keep it subtle. */
const MOUSE_PARALLAX = 0.35;
/** Camera field of view (degrees): landscape screens use the first, the tallest portrait phones
 *  the second, so a phone sees about as much sky as a desktop instead of a zoomed-in slice. */
const FOV_RANGE: [number, number] = [60, 78];
/** Screen size (CSS px, sqrt of width x height) at which stars are drawn at their designed size.
 *  1138 ≈ a 1440x900 desktop. Smaller screens draw stars proportionally smaller, so a star takes
 *  the same share of a phone screen as of a desktop one. */
const STAR_SCALE_REFERENCE = 1138;
/** Clamp for that star scale: [smallest phones, very large monitors]. */
const STAR_SCALE_RANGE: [number, number] = [0.55, 1.15];
/** Per-frame delta cap (s) so a tab returning from the background can't cause a jump. */
const MAX_DT = 1 / 20;

/** Page sections that get a hand-shaped constellation, in scroll order. */
export const HERO_SECTIONS = ["#services", "#portfolio", "#team-preview-title", ".social-proof", "#contact"];
/** The far "destination" constellation you fly toward but never reach. Its distance from the
 *  camera at the top of the page, and the closest it ever gets (at the very bottom). */
const DEST_FAR = 62;
const DEST_NEAR = 36;
/** Size of the destination constellation (desktop / mobile). */
const DEST_SCALE = { desktop: 1.5, mobile: 0.9 };
/** How far (radians) the destination turns over the whole page. Tied to scroll, so it reverses. */
const DEST_SPIN = 0.8;
/** Overall opacity of the destination. Low, so it reads as very far away and never upstages nearer stars. */
const DEST_OPACITY = 0.3;
/** Softness of the destination's stars (sprite blow-up factor). Higher = blurrier, hazier points. */
const DEST_BLUR = 2.4;
/** Strength of the faint glowing haze behind the destination. 0 = none. */
const DEST_HAZE = 0.07;

/** Light falloff: a star at this distance (world units) shines at its base brightness. */
const BRIGHTNESS_REF_DIST = 14;
/** How fast brightness drops with distance: brightness ∝ (REF / distance)^FALLOFF.
 *  2 is the true inverse-square law; lower is gentler. */
const BRIGHTNESS_FALLOFF = 1.2;
/** Brightness clamp: [faintest far star, brightest near star] as multiples of base brightness. */
const BRIGHTNESS_RANGE: [number, number] = [0.12, 1.9];

export const CAMERA_FAR = FIELD_DEPTH + 10;

const TAU = Math.PI * 2;
const YELLOW = new THREE.Color("#ffd400");
const WARM_WHITE = new THREE.Color("#fff4c4");

// ───────────────────── Page measurements (cached) ─────────────────────
// Measured on mount/resize only — never inside the frame loop.

export interface PageMetrics {
  maxScroll: number;
  viewportH: number;
  aboutTop: number;
  hasAbout: boolean;
  heroFracs: number[];
}

export function createPageMetrics(): PageMetrics {
  return { maxScroll: 1, viewportH: 1, aboutTop: 0, hasAbout: false, heroFracs: new Array(HERO_COUNT).fill(0) };
}

export function measurePage(m: PageMetrics) {
  const vh = window.innerHeight;
  const sy = window.scrollY;
  m.viewportH = vh;
  m.maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const about = document.getElementById("about");
  m.hasAbout = !!about;
  m.aboutTop = about ? about.getBoundingClientRect().top + sy : 0;
  for (let i = 0; i < HERO_COUNT; i++) {
    let el = HERO_SECTIONS[i] ? document.querySelector(HERO_SECTIONS[i]) : null;
    if (el && el.tagName !== "SECTION") el = el.closest("section") ?? el;
    if (el) {
      const r = el.getBoundingClientRect();
      const centred = r.top + sy + r.height / 2 - vh / 2;
      m.heroFracs[i] = Math.min(1, Math.max(0, centred / m.maxScroll));
    } else {
      m.heroFracs[i] = 0.25 + (0.75 * (i + 0.5)) / HERO_COUNT;
    }
  }
}

/** 0 while the hero is on screen, ramping to 1 as #about scrolls into view, then staying at 1. */
export function revealFade(m: PageMetrics, scrollY: number) {
  if (!m.hasAbout) return 0;
  const raw = (m.viewportH - (m.aboutTop - scrollY)) / (m.viewportH * 0.6);
  return Math.min(1, Math.max(0, raw));
}

// ───────────────────────────── Layout ─────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Real constellation patterns, normalised to roughly [-1, 1] (x right, y up).
// `bright` marks the first-magnitude anchor stars (Betelgeuse, Rigel, Vega...).
interface Pattern {
  name: string;
  stars: [number, number][];
  edges: [number, number][];
  bright: number[];
}
const PATTERNS: Record<string, Pattern> = {
  orion: {
    name: "Orion",
    // Betelgeuse, Bellatrix, Alnitak, Alnilam, Mintaka, Saiph, Rigel, Meissa, sword
    stars: [[-0.55, 0.72], [0.45, 0.62], [-0.16, 0.0], [0, 0.03], [0.16, 0.07], [-0.42, -0.82], [0.52, -0.74], [-0.03, 0.98], [0.0, -0.3]],
    edges: [[7, 0], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [3, 8]],
    bright: [0, 6, 3],
  },
  bigDipper: {
    name: "Big Dipper",
    // Dubhe, Merak, Phecda, Megrez, Alioth, Mizar, Alkaid
    stars: [[0.62, 0.3], [0.6, -0.18], [0.15, -0.3], [0.1, 0.08], [-0.24, 0.16], [-0.55, 0.2], [-0.92, -0.02]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
    bright: [0, 4],
  },
  cassiopeia: {
    name: "Cassiopeia",
    stars: [[-0.9, 0.25], [-0.45, -0.25], [0, 0.12], [0.45, -0.32], [0.9, 0.18]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
    bright: [2],
  },
  cygnus: {
    name: "Cygnus",
    // Deneb, Sadr, Albireo, wings
    stars: [[0, 0.92], [0, 0.28], [0.05, -0.32], [0.08, -0.92], [-0.6, 0.38], [-0.95, 0.6], [0.58, 0.12], [0.92, -0.08]],
    edges: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [1, 6], [6, 7]],
    bright: [0],
  },
  leo: {
    name: "Leo",
    // Regulus, sickle, Algieba, Zosma, Denebola, Chertan
    stars: [[0.6, -0.32], [0.64, 0.02], [0.48, 0.32], [0.62, 0.6], [0.86, 0.56], [-0.3, 0.26], [-0.88, -0.14], [-0.3, -0.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [7, 0], [5, 7]],
    bright: [0, 6],
  },
  scorpius: {
    name: "Scorpius",
    // claws, Antares, body, tail and stinger
    stars: [[0.82, 0.8], [0.95, 0.42], [0.68, 0.2], [0.4, 0.08], [0.2, -0.08], [0.06, -0.34], [0.0, -0.62], [-0.25, -0.84], [-0.56, -0.8], [-0.78, -0.58], [-0.68, -0.36]],
    edges: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]],
    bright: [3, 9],
  },
  lyra: {
    name: "Lyra",
    // Vega + the parallelogram
    stars: [[0, 0.9], [-0.22, 0.32], [0.2, 0.38], [-0.12, -0.45], [0.3, -0.38]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]],
    bright: [0],
  },
  crux: {
    name: "Crux",
    stars: [[0, 0.9], [0, -0.9], [-0.58, 0.05], [0.55, 0.18], [0.22, -0.22]],
    edges: [[0, 1], [2, 3]],
    bright: [1, 3],
  },
  pegasus: {
    name: "Pegasus",
    // Great Square + neck
    stars: [[-0.55, 0.5], [0.45, 0.52], [0.48, -0.4], [-0.52, -0.42], [0.82, -0.58], [1.0, -0.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5]],
    bright: [1, 3],
  },
  gemini: {
    name: "Gemini",
    // Castor, Pollux, bodies, feet
    stars: [[-0.3, 0.88], [0.26, 0.82], [-0.42, 0.18], [0.16, 0.14], [-0.6, -0.72], [0.02, -0.82]],
    edges: [[0, 1], [0, 2], [2, 4], [1, 3], [3, 5], [2, 3]],
    bright: [0, 1],
  },
  taurus: {
    name: "Taurus",
    // Hyades "V" with Aldebaran, the horns, and the Pleiades (unlinked)
    stars: [[0, -0.22], [-0.3, 0.12], [-0.85, 0.72], [0.28, 0.1], [0.92, 0.55], [0.68, -0.62], [0.74, -0.68], [0.71, -0.58]],
    edges: [[0, 1], [1, 2], [0, 3], [3, 4]],
    bright: [3],
  },
  ursaMinor: {
    name: "Little Dipper",
    // Polaris at the end of the handle
    stars: [[-0.9, 0.3], [-0.55, 0.2], [-0.2, 0.05], [0.15, -0.05], [0.2, -0.42], [0.7, -0.46], [0.66, -0.1]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
    bright: [0, 5],
  },
  andromeda: {
    name: "Andromeda",
    // Alpheratz, Mirach, Almach and the branch toward the galaxy
    stars: [[-0.9, -0.3], [-0.35, -0.05], [0.2, 0.2], [0.85, 0.45], [0.05, 0.55], [-0.1, 0.88]],
    edges: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]],
    bright: [0, 2, 3],
  },
  perseus: {
    name: "Perseus",
    // Mirfak in the middle, Algol to the side
    stars: [[0, 0.9], [0.05, 0.45], [-0.05, 0.1], [-0.35, -0.2], [-0.55, -0.62], [0.3, -0.15], [0.55, -0.52], [-0.4, 0.35]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [1, 7]],
    bright: [2, 6],
  },
  aquila: {
    name: "Aquila",
    // Altair flanked by Tarazed and Alshain, with the wings
    stars: [[0, 0.1], [-0.15, 0.32], [0.15, -0.12], [-0.8, 0.5], [0.78, -0.5], [-0.3, 0.88], [0.4, -0.9]],
    edges: [[1, 0], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6]],
    bright: [0],
  },
  draco: {
    name: "Draco",
    // the head quadrilateral and the long winding body
    stars: [[0.7, 0.62], [0.92, 0.5], [0.86, 0.24], [0.6, 0.35], [0.4, 0.0], [0.1, -0.22], [-0.25, 0.04], [-0.5, 0.36], [-0.76, 0.1], [-0.92, -0.32]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
    bright: [2],
  },
  coronaBorealis: {
    name: "Corona Borealis",
    stars: [[-0.82, 0.12], [-0.56, -0.24], [-0.2, -0.42], [0.2, -0.4], [0.55, -0.2], [0.8, 0.14], [0.86, 0.46]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    bright: [2],
  },
  bootes: {
    name: "Boötes",
    // the kite with Arcturus at its tail
    stars: [[0, -0.85], [-0.3, -0.2], [0.3, -0.25], [-0.25, 0.45], [0.2, 0.5], [0, 0.92], [0.56, -0.56]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [0, 6]],
    bright: [0],
  },
  auriga: {
    name: "Auriga",
    // pentagon with Capella
    stars: [[0.1, 0.86], [0.76, 0.34], [0.5, -0.56], [-0.46, -0.56], [-0.72, 0.3]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
    bright: [0],
  },
  canisMajor: {
    name: "Canis Major",
    // Sirius, the brightest star in the night sky
    stars: [[0.2, 0.55], [0.56, 0.7], [0.0, 0.95], [-0.05, 0.05], [-0.25, -0.35], [-0.7, -0.6], [0.15, -0.6], [-0.35, -0.9]],
    edges: [[0, 1], [0, 2], [0, 3], [3, 4], [4, 5], [4, 6], [4, 7]],
    bright: [0, 5],
  },
  sagittarius: {
    name: "Sagittarius",
    // the Teapot
    stars: [[-0.85, 0.15], [-0.85, -0.3], [-0.4, 0.25], [-0.4, -0.35], [0.1, 0.3], [0.1, -0.3], [0.56, 0.0], [-0.15, 0.66]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6], [5, 6], [2, 7], [4, 7]],
    bright: [5, 3],
  },
  hercules: {
    name: "Hercules",
    // the Keystone and limbs
    stars: [[-0.3, 0.3], [0.3, 0.35], [0.35, -0.25], [-0.25, -0.3], [-0.7, 0.85], [0.75, 0.8], [0.8, -0.85], [-0.6, -0.85]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7]],
    bright: [1],
  },
};
const AMBIENT_PATTERNS = Object.values(PATTERNS);
/** Famous figures the section constellations are picked from (shuffled per seed). */
const HERO_POOL = [
  PATTERNS.orion, PATTERNS.bigDipper, PATTERNS.cygnus, PATTERNS.leo, PATTERNS.scorpius,
  PATTERNS.cassiopeia, PATTERNS.sagittarius, PATTERNS.canisMajor, PATTERNS.perseus, PATTERNS.andromeda,
];

function shuffled<T>(list: T[], rand: () => number) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// An unnamed but plausible constellation: well-spaced stars in an elongated
// patch, joined by a minimum spanning tree (how real figures tend to look),
// sometimes with one small closed loop. Edges come out in growth order, so the
// figure draws itself outward from its first star.
function proceduralPattern(rand: () => number): Pattern {
  const n = 5 + Math.floor(rand() * 5);
  const aspect = 0.45 + rand() * 0.55;
  const stars: [number, number][] = [];
  let guard = 0;
  while (stars.length < n && guard++ < 400) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand());
    const p: [number, number] = [Math.cos(a) * r, Math.sin(a) * r * aspect];
    if (stars.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) < 0.34)) continue;
    stars.push(p);
  }
  const dist = (i: number, j: number) => Math.hypot(stars[i][0] - stars[j][0], stars[i][1] - stars[j][1]);
  const inTree = new Set([0]);
  const edges: [number, number][] = [];
  while (inTree.size < stars.length) {
    let best: [number, number] = [0, 0];
    let bd = Infinity;
    inTree.forEach((i) => {
      for (let j = 0; j < stars.length; j++) {
        if (!inTree.has(j) && dist(i, j) < bd) {
          bd = dist(i, j);
          best = [i, j];
        }
      }
    });
    edges.push(best);
    inTree.add(best[1]);
  }
  if (rand() < 0.4) {
    let best: [number, number] | null = null;
    let bd = 0.9;
    for (let i = 0; i < stars.length; i++)
      for (let j = i + 1; j < stars.length; j++)
        if (dist(i, j) < bd && !edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
          bd = dist(i, j);
          best = [i, j];
        }
    if (best) edges.push(best);
  }
  const bright = [Math.floor(rand() * stars.length)];
  if (rand() < 0.4) bright.push(Math.floor(rand() * stars.length));
  return { name: "", stars, edges, bright };
}

// Places a normalised 2D figure in 3D with its own size, rotation, optional
// mirroring and a tilt out of the screen plane, so the same pattern never
// looks the same twice and its shape shifts in perspective as you fly past.
function orient(rand: () => number, scale: number, opts: { spin: number; mirror: boolean; tilt: number }) {
  const rot = (rand() - 0.5) * 2 * opts.spin;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const flip = opts.mirror && rand() < 0.5 ? -1 : 1;
  const tx = (rand() - 0.5) * 2 * opts.tilt;
  const ty = (rand() - 0.5) * 2 * opts.tilt;
  return ([sx, sy]: [number, number]) => {
    const mx = sx * flip;
    const x = mx * cos - sy * sin;
    const y = mx * sin + sy * cos;
    const z = x * Math.sin(ty) + y * Math.sin(tx) + (rand() - 0.5) * 0.2;
    return [x * Math.cos(ty) * scale, y * Math.cos(tx) * scale, z * scale];
  };
}

class StarBuffer {
  pos: number[] = [];
  size: number[] = [];
  seed: number[] = [];
  tint: number[] = [];
  float: number[] = [];
  center: number[] = [];
  // center = the cluster centre this star grows away from (its own position for loose stars)
  add(x: number, y: number, z: number, size: number, seed: number, tint: number, float: number, center: number[] = [x, y, z]) {
    this.pos.push(x, y, z);
    this.center.push(center[0], center[1], center[2]);
    this.size.push(size);
    this.seed.push(seed);
    this.tint.push(tint);
    this.float.push(float);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(this.size, 1));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(this.seed, 1));
    g.setAttribute("aTint", new THREE.Float32BufferAttribute(this.tint, 1));
    g.setAttribute("aFloat", new THREE.Float32BufferAttribute(this.float, 1));
    g.setAttribute("aCenter", new THREE.Float32BufferAttribute(this.center, 3));
    return g;
  }
}

class LineBuffer {
  pos: number[] = [];
  other: number[] = [];
  end: number[] = [];
  center: number[] = [];
  draw: number[] = [];
  seed: number[] = [];
  float: number[] = [];
  // draw = (start distance, fully-drawn distance, order 0..1, brightness gain)
  add(a: number[], b: number[], c: number[], draw: [number, number, number, number], seed: number, float: number) {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    this.other.push(a[0], a[1], a[2], a[0], a[1], a[2]);
    this.end.push(0, 1);
    this.center.push(c[0], c[1], c[2], c[0], c[1], c[2]);
    this.draw.push(...draw, ...draw);
    this.seed.push(seed, seed);
    this.float.push(float, float);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("aOther", new THREE.Float32BufferAttribute(this.other, 3));
    g.setAttribute("aEnd", new THREE.Float32BufferAttribute(this.end, 1));
    g.setAttribute("aCenter", new THREE.Float32BufferAttribute(this.center, 3));
    g.setAttribute("aDraw", new THREE.Float32BufferAttribute(this.draw, 4));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(this.seed, 1));
    g.setAttribute("aFloat", new THREE.Float32BufferAttribute(this.float, 1));
    return g;
  }
}

function starStats(rand: () => number, scale = 1) {
  const bright = rand() < 0.1; // ~10% brighter, whiter stars
  const [lo, hi] = STAR_SIZE_RANGE;
  // power-law spread: lots of tiny stars, a fair number of medium ones, a few big ones
  const size = bright ? lo + (hi - lo) * (0.6 + rand() * 0.4) : lo + (hi - lo) * Math.pow(rand(), 1.7) * 0.8;
  return { size: size * scale, tint: bright ? 0.75 + rand() * 0.25 : rand() * 0.3 };
}

// A large, intricate "galaxy" constellation: bright core, three spiral arms
// cross-linked to each other, and an outer ring. Its lines reveal from the
// core outward as you get closer, and you never get close enough to finish it.
function buildDestination(mobile: boolean, seed: number) {
  const rand = mulberry32(seed ^ 0x5bd1e995);
  const k = mobile ? DEST_SCALE.mobile : DEST_SCALE.desktop;
  const pts: number[][] = [];
  const bright: boolean[] = [];
  const edges: [number, number][] = [];
  const addStar = (x: number, y: number, isBright: boolean) => {
    pts.push([x * k, y * k, (rand() - 0.5) * 1.2 * k]);
    bright.push(isBright);
    return pts.length - 1;
  };
  const nearestIn = (i: number, list: number[]) => {
    let best = list[0];
    let bd = Infinity;
    for (const j of list) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (j !== i && d < bd) {
        bd = d;
        best = j;
      }
    }
    return best;
  };

  const hub = addStar(0, 0, true);
  const core: number[] = [];
  const coreN = mobile ? 6 : 9;
  for (let i = 0; i < coreN; i++) {
    const a = (i / coreN) * TAU + rand() * 0.4;
    const r = 0.7 + rand() * 0.9;
    core.push(addStar(Math.cos(a) * r, Math.sin(a) * r, i % 3 === 0));
  }
  core.forEach((c, i) => {
    edges.push([c, core[(i + 1) % coreN]]);
    if (i % 2 === 0) edges.push([hub, c]);
  });

  const arms: number[][] = [];
  const perArm = mobile ? 8 : 13;
  for (let a = 0; a < 3; a++) {
    const base = (a * TAU) / 3;
    const arm: number[] = [];
    for (let j = 0; j < perArm; j++) {
      const t = j / (perArm - 1);
      const theta = base + t * 3.6 + (rand() - 0.5) * 0.12;
      const r = 1.9 + t * 9.5 + (rand() - 0.5) * 0.5;
      arm.push(addStar(Math.cos(theta) * r, Math.sin(theta) * r, rand() < 0.18));
      if (j > 0) edges.push([arm[j - 1], arm[j]]);
    }
    edges.push([nearestIn(arm[0], core), arm[0]]);
    arms.push(arm);
  }
  // web of cross-links between neighbouring arms
  arms.forEach((arm, a) => {
    for (let j = 2; j < arm.length; j += 3) edges.push([arm[j], nearestIn(arm[j], arms[(a + 1) % 3])]);
  });

  const ring: number[] = [];
  const ringN = mobile ? 12 : 20;
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * TAU + (rand() - 0.5) * 0.15;
    const r = 12.2 + (rand() - 0.5) * 1.2;
    ring.push(addStar(Math.cos(a) * r, Math.sin(a) * r, rand() < 0.2));
    if (i > 0 && rand() > 0.2) edges.push([ring[i - 1], ring[i]]);
  }
  arms.forEach((arm) => edges.push([arm[arm.length - 1], nearestIn(arm[arm.length - 1], ring)]));

  const stars = new StarBuffer();
  const lines = new LineBuffer();
  const [lo, hi] = STAR_SIZE_RANGE;
  pts.forEach((p, i) => {
    // seen from far away, so sizes are boosted to read at a distance
    const size = bright[i] ? hi * 2.4 * (0.85 + rand() * 0.3) : (lo + (hi - lo) * Math.pow(rand(), 1.7) * 0.6) * 2.4;
    stars.add(p[0], p[1], p[2], size, rand(), bright[i] ? 0.9 : rand() * 0.35, rand(), [0, 0, 0]);
  });
  for (let i = 0; i < (mobile ? 18 : 45); i++) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * 13 * k;
    const { size, tint } = starStats(rand, 1.6);
    stars.add(Math.cos(a) * r, Math.sin(a) * r, (rand() - 0.5) * k, size, rand(), tint, rand(), [0, 0, 0]);
  }
  // Reveal from the core outward. The drawable window runs from a bit beyond
  // DEST_FAR (so the core is already drawn at the top) to just past DEST_NEAR
  // (so the outer ring is still finishing at the very bottom).
  edges.forEach(([a, b]) => {
    const A = pts[a];
    const B = pts[b];
    const order = Math.min(1, Math.hypot((A[0] + B[0]) / 2, (A[1] + B[1]) / 2) / (13 * k));
    lines.add(A, B, [0, 0, 0], [DEST_FAR + 8, DEST_NEAR - 2, order, 1.3], rand(), rand());
  });
  return { stars: stars.geometry(), lines: lines.geometry() };
}

function buildLayout(mobile: boolean, seed: number) {
  const rand = mulberry32(seed);
  const pathEnd = SCROLL_DEPTH_RANGE + FIELD_DEPTH;

  // Dust + ambient clusters live in world space in a single Points/LineSegments pair.
  const stars = new StarBuffer();
  const lines = new LineBuffer();

  const dust = mobile ? DUST_COUNT.mobile : DUST_COUNT.desktop;
  for (let i = 0; i < dust; i++) {
    const z = -(3 + ((i + rand()) / dust) * pathEnd); // stratified so every depth has stars
    const x = (rand() - 0.5) * (mobile ? 26 : 60);
    const y = (rand() - 0.5) * (mobile ? 40 : 38);
    const { size, tint } = starStats(rand, 0.75);
    stars.add(x, y, z, size, rand(), tint, rand());
  }

  const ambient = mobile ? AMBIENT_COUNT.mobile : AMBIENT_COUNT.desktop;
  const ambientDraw: [number, number] = [FIELD_DEPTH * 0.75, 18];
  // a shuffled bag of real figures, reshuffled when used up, so no two
  // neighbours on the path repeat and the order differs per seed
  let bag = shuffled(AMBIENT_PATTERNS, rand);
  let bagIndex = 0;
  const nextReal = () => {
    if (bagIndex >= bag.length) {
      const last = bag[bag.length - 1];
      bag = shuffled(AMBIENT_PATTERNS, rand);
      if (bag[0] === last) bag.push(bag.shift()!);
      bagIndex = 0;
    }
    return bag[bagIndex++];
  };
  for (let c = 0; c < ambient; c++) {
    // stratified depth + golden-angle bearing → clusters all around the screen, never on the axis
    const cz = -(8 + ((c + 0.15 + rand() * 0.7) / ambient) * (pathEnd - 12));
    const bearing = c * 2.39996 + rand() * 0.9;
    const r = mobile ? 2.4 + rand() * 3.2 : 5 + rand() * 8;
    const cx = Math.cos(bearing) * r * (mobile ? 0.8 : 1.35);
    const cy = Math.sin(bearing) * r * (mobile ? 1.35 : 0.8);
    // each cluster gets its own size, orientation, tilt, warmth and density
    const R = (mobile ? 1.8 + rand() * 1.2 : 2.4 + rand() * 1.8) * (0.65 + rand() * 0.85);
    const floatSeed = rand();
    const procedural = rand() < PROCEDURAL_SHARE;
    const pattern = procedural ? proceduralPattern(rand) : nextReal();
    const place = orient(rand, R, { spin: procedural ? Math.PI : 1.1, mirror: procedural, tilt: 0.6 });
    const warmth = rand() * 0.45 - 0.1; // some figures read warmer gold, some whiter
    const brightness = 0.8 + rand() * 0.4;
    const [lo, hi] = STAR_SIZE_RANGE;

    const pts = pattern.stars.map((st) => {
      const [x, y, z] = place(st);
      return [cx + x, cy + y, cz + z];
    });
    pts.forEach((p, k) => {
      const anchor = pattern.bright.includes(k);
      const size = (anchor ? hi * (0.6 + rand() * 0.3) : lo + (hi - lo) * (0.15 + rand() * 0.35)) * brightness;
      const tint = Math.min(1, Math.max(0, (anchor ? 0.8 + rand() * 0.2 : 0.15 + rand() * 0.25) + warmth));
      stars.add(p[0], p[1], p[2], size, rand(), tint, floatSeed, [cx, cy, cz]);
    });
    // a few faint field stars around the figure, like the real sky
    for (let k = 0, fieldStars = Math.floor((mobile ? 2 : 3) + rand() * (mobile ? 3 : 6)); k < fieldStars; k++) {
      const a = rand() * TAU;
      const d = (0.6 + rand() * 0.9) * R;
      const { size, tint } = starStats(rand, 0.7);
      stars.add(cx + Math.cos(a) * d, cy + Math.sin(a) * d, cz + (rand() - 0.5) * R * 0.5, size, rand(), tint, floatSeed, [cx, cy, cz]);
    }
    // the figure draws itself line by line, in the pattern's own order
    pattern.edges.forEach(([a, b], e) => {
      const p = pts[a];
      const q = pts[b];
      if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > LINE_DISTANCE) return;
      const order = pattern.edges.length > 1 ? e / (pattern.edges.length - 1) : 0;
      lines.add(p, q, [cx, cy, cz], [ambientDraw[0], ambientDraw[1], order, 1], rand(), floatSeed);
    });
  }

  // Section constellations: built in local space; their depth is set at runtime
  // from where each section sits on the page.
  const heroPicks = shuffled(HERO_POOL, rand);
  const heroes = Array.from({ length: HERO_COUNT }, (_, i) => {
    const shape = heroPicks[i % heroPicks.length];
    const scale = (mobile ? 0.87 : 1.5) * 3; // patterns are normalised to [-1, 1]
    const side = i % 2 === 0 ? 1 : -1;
    const x = mobile ? side * (1.1 + rand() * 0.5) : side * (6.6 + rand() * 1.4);
    const y = mobile ? (rand() - 0.5) * 3 : (rand() - 0.5) * 3.2;
    const floatSeed = rand();
    const hs = new StarBuffer();
    const hl = new LineBuffer();
    // famous figures keep roughly their real orientation so they stay recognisable
    const place = orient(rand, scale * (0.85 + rand() * 0.3), { spin: 0.5, mirror: false, tilt: 0.35 });
    const local = shape.stars.map((st) => place(st));
    local.forEach((p, k) => {
      const anchor = shape.bright.includes(k);
      const [lo, hi] = STAR_SIZE_RANGE;
      hs.add(p[0], p[1], p[2], anchor ? hi * (0.9 + rand() * 0.2) : lo + (hi - lo) * (0.35 + rand() * 0.3), rand(), anchor ? 0.85 : 0.25 + rand() * 0.2, floatSeed, [0, 0, 0]);
    });
    for (let k = 0; k < (mobile ? 4 : 9); k++) {
      const a = rand() * TAU, d = (0.5 + rand() * 0.8) * scale;
      const { size, tint } = starStats(rand, 0.8);
      hs.add(Math.cos(a) * d, Math.sin(a) * d, (rand() - 0.5) * 0.3 * scale, size, rand(), tint, floatSeed, [0, 0, 0]);
    }
    shape.edges.forEach(([a, b], e) => {
      const order = shape.edges.length > 1 ? e / (shape.edges.length - 1) : 0;
      hl.add(local[a], local[b], [0, 0, 0], [FIELD_DEPTH * 0.85, HERO_LEAD + 6, order, 1.5], rand(), floatSeed);
    });
    return { x, y, stars: hs.geometry(), lines: hl.geometry() };
  });

  return { stars: stars.geometry(), lines: lines.geometry(), heroes, destination: buildDestination(mobile, seed) };
}

// ───────────────────────────── Shaders ─────────────────────────────

// Shared by stars and lines: idle sideways float + depth fades. uFloat is
// wrapped to [0, TAU) on the CPU and only used with integer frequencies, so
// it never jumps and never loses float32 precision however long the tab is open.
const commonGlsl = /* glsl */ `
  uniform float uFloat;
  uniform float uFieldDepth;
  vec4 floatWorld(vec4 world, float seed) {
    float s = seed * 6.2831853;
    world.x += sin(uFloat + s) * 0.07;
    world.y += cos(2.0 * uFloat + s) * 0.035;
    return world;
  }
  // Growth is a pure function of the camera's distance to the cluster centre,
  // so scrolling up shrinks the constellation back in exact reverse.
  uniform float uGrowStart;
  uniform float uGrowEnd;
  uniform float uGrowMax;
  uniform float uGrownOpacity;
  float growthOf(vec4 centerWorld) {
  #ifdef IS_DEST
    return 0.0;
  #endif
    float g = clamp((uGrowStart - (cameraPosition.z - centerWorld.z)) / (uGrowStart - uGrowEnd), 0.0, 1.0);
    return g * g * (3.0 - 2.0 * g);
  }
  vec4 grow(vec4 world, vec4 centerWorld, float g) {
    return vec4(centerWorld.xyz + (world.xyz - centerWorld.xyz) * mix(1.0, uGrowMax, g), 1.0);
  }
  uniform float uLumRef;
  uniform float uLumFalloff;
  uniform vec2 uLumRange;
  uniform float uDestOpacity;
  uniform float uDestNear;
  // Apparent brightness falls off with distance like real light,
  // (ref / d)^falloff, clamped so near stars blaze and far ones stay faintly visible.
  float luminance(float depth) {
    return clamp(pow(uLumRef / max(depth, 0.001), uLumFalloff), uLumRange.x, uLumRange.y);
  }
  float depthFade(float depth) {
  #ifdef IS_DEST
    // Very far away: faint overall, brightening by inverse-square as you creep closer.
    return uDestOpacity * clamp(pow(uDestNear / max(depth, 0.001), 2.0), 0.35, 1.0);
  #endif
    float far = 1.0 - smoothstep(uFieldDepth * 0.62, uFieldDepth, depth);
    float near = smoothstep(0.9, 3.8, depth); // gone just before the camera plane
    return far * near * luminance(depth);
  }
`;

const starVertex = /* glsl */ `
  ${commonGlsl}
  attribute float aSize;
  attribute float aSeed;
  attribute float aTint;
  attribute float aFloat;
  attribute vec3 aCenter;
  uniform float uPixelRatio;
  uniform float uSizeScale; // star size relative to a 1440x900 desktop
  uniform float uTwinkle;
  uniform float uAspect;
  uniform vec2 uMouse;
  varying float vAlpha;
  varying float vTint;
  varying float vCore;
  void main() {
    vec4 c = modelMatrix * vec4(aCenter, 1.0);
    float g = growthOf(c);
    vec4 world = floatWorld(grow(modelMatrix * vec4(position, 1.0), c, g), aFloat);
    vec4 mv = viewMatrix * world;
    float depth = -mv.z;
    gl_Position = projectionMatrix * mv;

    float freq = 1.0 + floor(aSeed * 3.0);
    // Scintillation: a slow swell plus a faster flicker. Integer frequencies keep
    // it exactly periodic in uTwinkle, which is wrapped on the CPU (no drift, no jumps).
    float flick = 5.0 + floor(fract(aSeed * 7.31) * 3.0);
    float twinkle = 0.6 + 0.28 * sin(uTwinkle * freq + aSeed * 6.2831853) + 0.12 * sin(uTwinkle * flick + aSeed * 14.7);
    vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
    float hover = smoothstep(0.32, 0.0, length((ndc - uMouse) * vec2(uAspect, 1.0)));

    vAlpha = depthFade(depth) * twinkle * (1.0 + hover * 0.7); // stars stay bright while their constellation grows
    vTint = aTint;
    // near = bigger. The sprite is 4x the core so the glow halo fits; tiny
    // stars get a minimum sprite but keep their own, smaller core (vCore is the
    // core's share of the sprite), so different sizes stay visibly different.
    float core = aSize * uSizeScale * mix(1.0, 1.35, g) * 10.0 / max(depth, 0.5);
  #ifdef IS_DEST
    float sprite = clamp(core * 4.0 * ${DEST_BLUR.toFixed(2)}, 6.0, 135.0); // blown up = soft, out-of-focus
  #else
    float sprite = clamp(core * 4.0, 4.0, 135.0);
  #endif
    vCore = core / sprite; // 0.25 when unclamped, smaller for tiny stars
    // A star drawn bigger than its true size (the minimum sprite) spreads the
    // same light over more pixels, so dim it by the area ratio: tiny distant
    // stars stay faint instead of looking as bright as nearer ones.
    vAlpha *= clamp(pow(core * 4.0 / sprite, 2.0), 0.12, 1.0);
    gl_PointSize = sprite * uPixelRatio;
  }
`;

const starFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;
  varying float vCore;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
  #ifdef IS_DEST
    float blob = exp(-pow(d / 0.2, 2.0));
    gl_FragColor = vec4(mix(uColor, uHot, vTint * 0.6), blob * 0.8 * vAlpha * uOpacity);
    return;
  #endif
    float r = vCore * 0.6; // core radius in sprite space (0.15 for a full-size star)
    float core = smoothstep(r, r * 0.2, d);
    float halo = 4.0 * vCore; // halo shrinks with the core for tiny stars
    float glow = pow(max(1.0 - 2.0 * d / max(halo, 0.001), 0.0), 3.0) * 0.45 * halo;
    // soft 4-point diffraction flare on the bright, well-resolved stars
    vec2 q = abs(gl_PointCoord - 0.5);
    float spikes = (exp(-q.y * 70.0) * smoothstep(0.5, 0.0, q.x) + exp(-q.x * 70.0) * smoothstep(0.5, 0.0, q.y))
      * smoothstep(0.55, 0.9, vTint) * smoothstep(0.15, 0.25, vCore) * 0.4;
    vec3 col = mix(uColor, uHot, clamp(vTint * 0.85 + core * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(col, (core + glow + spikes) * vAlpha * uOpacity);
  }
`;

const lineVertex = /* glsl */ `
  ${commonGlsl}
  attribute vec3 aOther;
  attribute float aEnd;
  attribute vec3 aCenter;
  attribute vec4 aDraw;
  attribute float aSeed;
  attribute float aFloat;
  varying float vT;
  varying float vSeed;
  varying float vAlpha;
  varying float vDraw;
  void main() {
    // Draw progress is a pure function of the camera's distance to the
    // cluster, so scrolling back up un-draws the lines in exact reverse.
    vec4 c = modelMatrix * vec4(aCenter, 1.0);
    float dist = cameraPosition.z - c.z;
    float g = growthOf(c);
    float approach = clamp((aDraw.x - dist) / (aDraw.x - aDraw.y), 0.0, 1.0);
    float draw = clamp((approach - aDraw.z * 0.65) / 0.35, 0.0, 1.0);
    draw = draw * draw * (3.0 - 2.0 * draw);

    vec3 p = mix(aOther, position, aEnd * draw);
    vec4 mv = viewMatrix * floatWorld(grow(modelMatrix * vec4(p, 1.0), c, g), aFloat);
    gl_Position = projectionMatrix * mv;

    vT = aEnd;
    vSeed = aSeed;
    vDraw = draw;
    // lines never get brighter than base up close, so they can't outshine the stars they join
    vAlpha = min(depthFade(-mv.z), 1.0) * aDraw.w * mix(1.0, uGrownOpacity, g);
  }
`;

const lineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  uniform float uPulse; // wrapped to [0, 1) on the CPU
  uniform float uLineOpacity;
  varying float vT;
  varying float vSeed;
  varying float vAlpha;
  varying float vDraw;
  void main() {
    if (vDraw <= 0.001) discard;
    float p = fract(uPulse + vSeed);
    float spark = exp(-pow((vT - p) * 9.0, 2.0)) * step(0.7, vSeed); // ~30% of lines carry a pulse
    vec3 col = mix(uColor, uHot, spark);
  #ifdef IS_DEST
    float base = 0.24;
  #else
    float base = uLineOpacity;
  #endif
    gl_FragColor = vec4(col, (base + spark * 0.9) * vAlpha * uOpacity);
  }
`;

// Faint glow behind the destination so it reads as a distant, hazy galaxy.
const hazeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv - 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hazeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHaze;
  varying vec2 vUv;
  void main() {
    float r2 = dot(vUv, vUv);
    float a = exp(-r2 * 9.0) + exp(-r2 * 70.0) * 0.8; // broad disc + brighter core
    a *= smoothstep(0.5, 0.32, sqrt(r2)); // reach exactly zero before the quad's edge
    // tiny per-pixel dither so the very faint gradient doesn't show 8-bit banding rings
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    gl_FragColor = vec4(uColor, max(a * uHaze * uOpacity + dither / 255.0, 0.0));
  }
`;

const shootVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shootFragment = /* glsl */ `
  uniform vec3 uHot;
  uniform float uAlpha;
  varying float vT;
  void main() {
    gl_FragColor = vec4(uHot, vT * vT * uAlpha);
  }
`;

// ───────────────────────────── Component ─────────────────────────────

export default function ConstellationSky({
  mobile,
  seed,
  reducedMotion,
  metrics,
}: {
  mobile: boolean;
  seed: number;
  reducedMotion: boolean;
  metrics: React.RefObject<PageMetrics>;
}) {
  const sky = useMemo(() => {
    const layout = buildLayout(mobile, seed);
    const uniforms = {
      uColor: { value: YELLOW },
      uHot: { value: WARM_WHITE },
      uOpacity: { value: 0 },
      uPixelRatio: { value: 1 },
      uTwinkle: { value: 0 },
      uFloat: { value: 0 },
      uPulse: { value: 0 },
      uFieldDepth: { value: FIELD_DEPTH },
      uGrowStart: { value: GROWTH_START },
      uGrowEnd: { value: GROWTH_END },
      uGrowMax: { value: CLUSTER_GROWTH },
      uGrownOpacity: { value: GROWN_OPACITY },
      uLumRef: { value: BRIGHTNESS_REF_DIST },
      uLumFalloff: { value: BRIGHTNESS_FALLOFF },
      uLumRange: { value: new THREE.Vector2(BRIGHTNESS_RANGE[0], BRIGHTNESS_RANGE[1]) },
      uDestOpacity: { value: DEST_OPACITY },
      uDestNear: { value: DEST_NEAR },
      uLineOpacity: { value: LINE_OPACITY },
      uSizeScale: { value: 1 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(9, 9) },
    };
    const blend = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending };
    const starMat = new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, uniforms, ...blend });
    const lineMat = new THREE.ShaderMaterial({ vertexShader: lineVertex, fragmentShader: lineFragment, uniforms, ...blend });
    const destDefines = { IS_DEST: "" };
    const destStarMat = new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, uniforms, defines: destDefines, ...blend });
    const destLineMat = new THREE.ShaderMaterial({ vertexShader: lineVertex, fragmentShader: lineFragment, uniforms, defines: destDefines, ...blend });

    const mk = <T extends THREE.Object3D>(o: T) => {
      o.frustumCulled = false;
      return o;
    };
    const ambient = new THREE.Group();
    ambient.add(mk(new THREE.LineSegments(layout.lines, lineMat)), mk(new THREE.Points(layout.stars, starMat)));

    const heroes = layout.heroes.map((h) => {
      const group = new THREE.Group();
      group.position.set(h.x, h.y, -HERO_LEAD);
      group.add(mk(new THREE.LineSegments(h.lines, lineMat)), mk(new THREE.Points(h.stars, starMat)));
      return group;
    });

    // rare shooting star: one reusable 2-vertex line, rewritten in place
    const shootPos = new Float32Array(6);
    const shootGeo = new THREE.BufferGeometry();
    shootGeo.setAttribute("position", new THREE.BufferAttribute(shootPos, 3));
    shootGeo.setAttribute("aT", new THREE.Float32BufferAttribute([0, 1], 1));
    const shootMat = new THREE.ShaderMaterial({
      vertexShader: shootVertex,
      fragmentShader: shootFragment,
      uniforms: { uHot: { value: WARM_WHITE }, uAlpha: { value: 0 } },
      ...blend,
    });
    const shoot = mk(new THREE.Line(shootGeo, shootMat));
    shoot.visible = false;

    // The destination sits on the vanishing point, tilted like a galaxy seen at an angle.
    const destination = new THREE.Group();
    destination.rotation.x = 0.55;
    destination.add(mk(new THREE.LineSegments(layout.destination.lines, destLineMat)), mk(new THREE.Points(layout.destination.stars, destStarMat)));
    destination.position.z = -DEST_FAR;
    const hazeSize = 13 * (mobile ? DEST_SCALE.mobile : DEST_SCALE.desktop) * 2.6;
    const hazeGeo = new THREE.PlaneGeometry(hazeSize, hazeSize);
    const hazeMat = new THREE.ShaderMaterial({
      vertexShader: hazeVertex,
      fragmentShader: hazeFragment,
      uniforms: { uColor: uniforms.uColor, uOpacity: uniforms.uOpacity, uHaze: { value: DEST_HAZE } },
      ...blend,
    });
    destination.add(mk(new THREE.Mesh(hazeGeo, hazeMat)));

    const geometries = [layout.stars, layout.lines, shootGeo, layout.destination.stars, layout.destination.lines, hazeGeo, ...layout.heroes.flatMap((h) => [h.stars, h.lines])];
    const materials = [starMat, lineMat, shootMat, destStarMat, destLineMat, hazeMat];
    return { uniforms, ambient, heroes, destination, shoot, shootPos, shootMat, materials, geometries };
  }, [mobile, seed]);

  useEffect(
    () => () => {
      sky.geometries.forEach((g) => g.dispose());
      sky.materials.forEach((m) => m.dispose());
    },
    [sky]
  );

  const motion = useRef({
    init: false,
    camZ: 0,
    prevCamZ: 0,
    camX: 0,
    camY: 0,
    mouseX: 0,
    mouseY: 0,
    hoverX: 9,
    hoverY: 9,
    hasMouse: false,
    twinkle: 0,
    float: 0,
    pulse: 0,
    shootAge: -1,
    shootCooldown: 3,
    sx: 0, sy: 0, sz: 0, dx: 0, dy: 0,
  });

  useEffect(() => {
    if (reducedMotion) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const s = motion.current;
      s.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      s.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
      if (!s.hasMouse) {
        s.hoverX = s.mouseX;
        s.hoverY = s.mouseY;
        s.hasMouse = true;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reducedMotion]);

  useFrame((state, rawDelta) => {
    const s = motion.current;
    const m = metrics.current;
    const u = sky.uniforms;
    const dt = Math.min(Math.max(rawDelta, 0), MAX_DT);
    const scrollY = window.scrollY;
    const fade = revealFade(m, scrollY);

    // Camera depth: a pure function of scroll POSITION, spring-smoothed.
    const frac = Math.min(1, Math.max(0, scrollY / m.maxScroll));
    const targetZ = reducedMotion ? 0 : -frac * SCROLL_DEPTH_RANGE;
    const follow = 1 - Math.exp(-SMOOTHING * dt);
    // While the sky is invisible (hero), track the target exactly: nothing is
    // on screen to smooth, and it guarantees scrollY = 0 is the starting state.
    const snap = !s.init || fade <= 0;
    if (snap) {
      s.camZ = s.prevCamZ = targetZ;
    } else {
      s.camZ += (targetZ - s.camZ) * follow;
    }
    const velocity = dt > 0 ? (s.camZ - s.prevCamZ) / dt : 0;
    s.prevCamZ = s.camZ;

    // Section constellations follow their (cached) section depth; snapped on
    // the first frame, eased afterwards so a layout change never pops them.
    for (let i = 0; i < sky.heroes.length; i++) {
      const g = sky.heroes[i];
      const tz = -m.heroFracs[i] * SCROLL_DEPTH_RANGE - HERO_LEAD;
      g.position.z = snap ? tz : g.position.z + (tz - g.position.z) * follow;
    }
    s.init = true;

    // The destination rides ahead of the (smoothed) camera: it creeps a little
    // closer as you scroll down but never arrives. Pure function of camera
    // depth, so scrolling up eases it back out exactly.
    const travelled = Math.min(1, Math.max(0, -s.camZ / SCROLL_DEPTH_RANGE));
    sky.destination.position.z = s.camZ - (DEST_FAR - (DEST_FAR - DEST_NEAR) * Math.pow(travelled, 0.85));
    sky.destination.rotation.z = travelled * DEST_SPIN;

    if (!reducedMotion) {
      s.twinkle = (s.twinkle + dt * 0.9) % TAU;
      s.float = (s.float + dt * 0.35) % TAU;
      s.pulse = (s.pulse + dt * 0.12) % 1;
      const k = 1 - Math.exp(-dt * 2.5);
      s.camX += (s.mouseX * MOUSE_PARALLAX - s.camX) * k;
      s.camY += (s.mouseY * MOUSE_PARALLAX * 0.6 - s.camY) * k;
      const hk = 1 - Math.exp(-dt * 8);
      s.hoverX += (s.mouseX - s.hoverX) * hk;
      s.hoverY += (s.mouseY - s.hoverY) * hk;
    }
    state.camera.position.set(s.camX, s.camY, s.camZ);

    u.uOpacity.value = fade;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    const w = state.size.width;
    const h = Math.max(1, state.size.height);
    const aspect = w / h;
    u.uAspect.value = aspect;
    // Portrait screens see a narrow slice of sky at the desktop field of view, so
    // widen it (60° → 78° from square down to tall phones), and draw stars in
    // proportion to the screen. Desktop at 1440x900 is unchanged.
    const tall = Math.min(1, Math.max(0, (1 - aspect) / 0.55));
    const fov = FOV_RANGE[0] + (FOV_RANGE[1] - FOV_RANGE[0]) * tall;
    const cam = state.camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    u.uSizeScale.value = Math.min(STAR_SCALE_RANGE[1], Math.max(STAR_SCALE_RANGE[0], Math.sqrt(w * h) / STAR_SCALE_REFERENCE));
    u.uTwinkle.value = s.twinkle;
    u.uFloat.value = s.float;
    u.uPulse.value = s.pulse;
    if (s.hasMouse) u.uMouse.value.set(s.hoverX, s.hoverY);

    // Rare shooting star, only during a fast scroll.
    if (reducedMotion) return;
    s.shootCooldown = Math.max(0, s.shootCooldown - dt);
    if (s.shootAge < 0 && s.shootCooldown === 0 && fade > 0.6 && Math.abs(velocity) > 16 && Math.random() < dt * 2.5) {
      const side = Math.random() < 0.5 ? -1 : 1;
      s.shootAge = 0;
      s.shootCooldown = 7;
      s.sx = s.camX + side * (3 + Math.random() * 6) * (mobile ? 0.45 : 1);
      s.sy = s.camY + 2 + Math.random() * 3.5;
      s.sz = s.camZ - (14 + Math.random() * 8);
      s.dx = -side * (0.85 + Math.random() * 0.3);
      s.dy = -(0.35 + Math.random() * 0.3);
    }
    if (s.shootAge >= 0) {
      s.shootAge += dt;
      const life = 1.1;
      if (s.shootAge > life) {
        s.shootAge = -1;
        sky.shoot.visible = false;
      } else {
        const travel = s.shootAge * 13;
        const len = 2.4 * Math.min(1, s.shootAge * 4);
        const p = sky.shootPos;
        p[3] = s.sx + s.dx * travel;
        p[4] = s.sy + s.dy * travel;
        p[5] = s.sz;
        p[0] = p[3] - s.dx * len;
        p[1] = p[4] - s.dy * len;
        p[2] = s.sz;
        (sky.shoot.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        sky.shootMat.uniforms.uAlpha.value = Math.sin((Math.PI * s.shootAge) / life) * 0.85 * fade;
        sky.shoot.visible = true;
      }
    }
  });

  return (
    <>
      <primitive object={sky.ambient} />
      {sky.heroes.map((g, i) => (
        <primitive key={i} object={g} />
      ))}
      <primitive object={sky.destination} />
      <primitive object={sky.shoot} />
    </>
  );
}
