"use client";

import { useEffect, useRef } from "react";

const interactiveSelector = [
  "a", "button", "input", "textarea", "[role='button']",
  ".project", ".service-card", ".stat", ".tool-chip", ".testimonial-card",
].join(",");

const trailLength = 11;

export default function SmoothCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const trailRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const head = headRef.current;
    const cursor = cursorRef.current;
    const trails = trailRefs.current;
    if (!cursor || !head || trails.some((particle) => !particle)) return;

    document.body.classList.add("has-custom-cursor");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let frame = 0;
    let idleTimer: ReturnType<typeof setTimeout>;
    const points = Array.from({ length: trailLength + 1 }, () => ({ x: targetX, y: targetY }));

    const render = () => {
      points[0].x += (targetX - points[0].x) * 0.48;
      points[0].y += (targetY - points[0].y) * 0.48;
      head.style.transform = `translate3d(${points[0].x}px, ${points[0].y}px, 0) translate(-50%, -50%)`;

      trails.forEach((particle, index) => {
        if (!particle) return;
        const point = points[index + 1];
        const leader = points[index];
        const ease = Math.max(0.2, 0.34 - index * 0.012);
        point.x += (leader.x - point.x) * ease;
        point.y += (leader.y - point.y) * ease;
        particle.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      });

      frame = requestAnimationFrame(render);
    };

    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add("is-moving");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => cursor.classList.remove("is-moving"), 220);
      head.classList.add("is-visible");
      trails.forEach((particle) => particle?.classList.add("is-visible"));
    };

    const hover = (event: PointerEvent) => {
      const target = event.target as Element | null;
      head.classList.toggle("is-active", Boolean(target?.closest(interactiveSelector)));
    };

    const press = () => head.classList.add("is-pressed");
    const release = () => head.classList.remove("is-pressed");
    const hide = () => {
      clearTimeout(idleTimer);
      cursor.classList.remove("is-moving");
      head.classList.remove("is-visible");
      trails.forEach((particle) => particle?.classList.remove("is-visible"));
    };

    frame = requestAnimationFrame(render);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", hover, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", hover);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.documentElement.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <div ref={cursorRef} className="smooth-cursor" aria-hidden="true">
      {Array.from({ length: trailLength }, (_, index) => (
        <span
          key={index}
          ref={(node) => { trailRefs.current[index] = node; }}
          className="smooth-cursor__trail"
          style={{ width: `${Math.max(2.2, 7.5 - index * .48)}px`, height: `${Math.max(2.2, 7.5 - index * .48)}px`, opacity: `${Math.max(.08, .48 - index * .035)}` }}
        />
      ))}
      <span ref={headRef} className="smooth-cursor__head" />
    </div>
  );
}
