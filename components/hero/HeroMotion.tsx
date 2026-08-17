"use client";

import { useEffect } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import gsap from "gsap";

const options: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 62, density: { enable: true, width: 1100, height: 700 } },
    color: { value: ["#ffd500", "#f1f1ed", "#777770"] },
    shape: { type: "circle" },
    opacity: { value: { min: 0.18, max: 0.72 } },
    size: { value: { min: 1, max: 3 } },
    links: { enable: true, distance: 145, color: "#ffd500", opacity: 0.13, width: 1 },
    move: { enable: true, speed: 0.48, direction: "none", random: true, outModes: { default: "out" } },
  },
  interactivity: {
    detectsOn: "window",
    events: { onHover: { enable: true, mode: ["grab", "repulse"] }, onClick: { enable: true, mode: "push" }, resize: { enable: true } },
    modes: {
      grab: { distance: 170, links: { opacity: 0.42 } },
      repulse: { distance: 90, duration: 0.45, speed: 0.65 },
      push: { quantity: 5 },
    },
  },
};

const init = async (engine: Engine) => loadSlim(engine);

function Scene() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.querySelector<HTMLElement>(".growth-hero");
    const core = document.querySelector<HTMLElement>(".growth-core");
    if (!hero || !core) return;

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro.from(".growth-kicker", { y: 18, opacity: 0, duration: 0.65 })
        .from(".growth-word", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.1 }, "-=.3")
        .from(".growth-lead, .growth-actions", { y: 22, opacity: 0, stagger: 0.1, duration: 0.7 }, "-=.55")
        .from(".growth-core", { scale: 0.72, opacity: 0, rotation: -18, duration: 1.1 }, "-=.9")
        .from(".growth-metric", { y: 16, opacity: 0, stagger: 0.08, duration: 0.5 }, "-=.45");
      gsap.to(".orbit-a", { rotation: 360, duration: 18, repeat: -1, ease: "none" });
      gsap.to(".orbit-b", { rotation: -360, duration: 26, repeat: -1, ease: "none" });
      gsap.to(".growth-center", { scale: 1.06, repeat: -1, yoyo: true, duration: 2.1, ease: "sine.inOut" });
      gsap.to(".signal-bar i", { scaleX: 0.35, transformOrigin: "left", repeat: -1, yoyo: true, duration: 1.1, stagger: { each: 0.12, from: "random" } });
    }, hero);

    const xTo = gsap.quickTo(core, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(core, "y", { duration: 0.7, ease: "power3.out" });
    const rotateTo = gsap.quickTo(core, "rotation", { duration: 0.9, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      const box = hero.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      xTo(x * 0.035); yTo(y * 0.04); rotateTo(x * 0.004);
    };
    const reset = () => { xTo(0); yTo(0); rotateTo(0); };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", reset);
    return () => { hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", reset); context.revert(); };
  }, []);

  return <Particles id="growth-particles" className="growth-particles" options={options} />;
}

export default function HeroMotion() {
  return <ParticlesProvider init={init}><Scene /></ParticlesProvider>;
}
