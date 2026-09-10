"use client";

/* Cinematic first-load intro. Plays once per browser session (sessionStorage-gated)
   so route navigations and repeat visits never re-trigger it. Uses GSAP to match the
   orchestration pattern already used in HeroMotion/SmoothScroll rather than introducing
   a second animation system. */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";

// Flip to false to disable the intro sequence everywhere.
const PRELOADER_ENABLED = true;
const SESSION_KEY = "devmark-preloader-seen";
const PARTICLE_COUNT = 20;

// Deterministic per-particle distance tiers (no Math.random at render time,
// so server and client markup always match).
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (360 / PARTICLE_COUNT) * i,
  tier: i % 3,
}));

// useLayoutEffect must not run during SSR; fall back to useEffect there.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Preloader() {
  const [shouldRender, setShouldRender] = useState(true);
  const [percent, setPercent] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoInnerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!PRELOADER_ENABLED) {
      setShouldRender(false);
      return;
    }

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode etc.) - treat as first visit.
    }

    const restoreScroll = () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    const markSeen = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    };

    if (alreadySeen) {
      setShouldRender(false);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      markSeen();
      setShouldRender(false);
      return;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const finish = () => {
      restoreScroll();
      markSeen();
      setShouldRender(false);
    };

    const counter = { value: 0 };
    const tl = gsap.timeline({ onComplete: finish });

    // Logo + ambient glow settle in together.
    tl.fromTo(
      logoRef.current,
      { autoAlpha: 0, scale: 0.9, filter: "blur(10px)" },
      { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.35, ease: "power2.out" },
      0
    );
    tl.fromTo(glowRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.88, ease: "power2.out" }, 0);

    // A slow continuous breathing pulse while progress fills - separate element
    // so it never fights the intro/exit scale tweens on the same property.
    const breathe = gsap.to(logoInnerRef.current, {
      scale: 1.035,
      duration: 2.71,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.04,
    });

    // Linear (constant-rate) fill - an inOut ease decelerates through its whole
    // back half, which reads as the bar "stalling" before it reaches 100.
    tl.to(
      counter,
      {
        value: 100,
        duration: 2.08,
        ease: "none",
        onUpdate: () => setPercent(Math.round(counter.value)),
      },
      0.42
    );
    tl.to(barRef.current, { scaleX: 1, duration: 2.08, ease: "none" }, 0.42);

    // Particle burst only fires once the bar/counter actually reach 100%.
    tl.call(() => particlesRef.current?.classList.add("is-active"), undefined, 2.5);
    tl.call(() => particlesRef.current?.classList.add("is-fading"), undefined, 3.05);

    tl.to(glowRef.current, { autoAlpha: 0, scale: 1.15, duration: 0.7, ease: "power1.in" }, 2.95);
    tl.to(
      [logoRef.current, barRef.current],
      { autoAlpha: 0, scale: 1.04, duration: 0.65, ease: "power1.in" },
      2.95
    );
    tl.to(rootRef.current, { autoAlpha: 0, duration: 1.1, ease: "sine.inOut" }, 3.15);

    return () => {
      tl.kill();
      breathe.kill();
      restoreScroll();
    };
  }, []);

  if (!shouldRender) return null;

  const percentLabel = percent >= 100 ? "100" : String(percent).padStart(2, "0");

  return (
    <div ref={rootRef} className="preloader" aria-hidden="true">
      <div ref={glowRef} className="preloader__glow" />
      <div ref={particlesRef} className="preloader__particles">
        {particles.map((p, i) => (
          <span
            key={i}
            className={`preloader__particle preloader__particle--${p.tier}`}
            style={{ "--angle": `${p.angle}deg` } as CSSProperties}
          />
        ))}
      </div>
      <div className="preloader__content">
        <div ref={logoRef} className="preloader__logo">
          <div ref={logoInnerRef} className="preloader__logo-inner">
            <Image
              src="/logo/DevLogo_white01.svg"
              alt="DevMark"
              width={590}
              height={130}
              priority
              className="preloader__logo-img"
            />
          </div>
        </div>
        <div className="preloader__progress">
          <div className="preloader__track">
            <div ref={barRef} className="preloader__bar" />
          </div>
          <span className="preloader__percent">{percentLabel}</span>
        </div>
      </div>
    </div>
  );
}
