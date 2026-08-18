"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const team = [
  { name: "Shishir Gautam", role: "CEO", image: "/team/UpgradedImg_Shishir04.png", focus: "team-showcase__image--shishir" },
  { name: "Abhishek Rayamajhi", role: "Founder", image: "/team/upgradedImg_Abhishek02.png", focus: "team-showcase__image--abhishek" },
  { name: "Ashutosh Sharma", role: "Founding Member", image: "/team/upgradedImg_Ashutosh04.png", focus: "team-showcase__image--ashutosh" },
];

export default function TeamPreview() {
  const [activeMember, setActiveMember] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const member = team[activeMember];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from(".team-showcase__intro > *", { y: 42, opacity: 0, duration: 1, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 72%", once: true } });
      gsap.from(".team-showcase__stage", { y: 80, opacity: 0, scale: 0.96, duration: 1.25, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 62%", once: true } });
      gsap.from(".team-showcase__selector", { x: 45, opacity: 0, duration: 1, delay: 0.18, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 62%", once: true } });
    }, section);
    return () => context.revert();
  }, []);

  useEffect(() => {
    const feature = featureRef.current;
    if (!feature || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(".team-showcase__portrait", { opacity: 0, scale: 1.08, xPercent: -3 }, { opacity: 1, scale: 1, xPercent: 0, duration: 1, ease: "power3.out" });
      gsap.fromTo(".team-showcase__role", { y: -12, opacity: 0, scale: 0.88 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" });
      gsap.fromTo(".team-showcase__identity > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: "power3.out" });
      gsap.fromTo(".team-showcase__signal", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" });
    }, feature);
    return () => context.revert();
  }, [activeMember]);

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setActiveMember((current) => (current + 1) % team.length);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [activeMember, isPaused]);

  useEffect(() => {
    const feature = featureRef.current;
    if (!feature || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const portrait = feature.querySelector<HTMLElement>(".team-showcase__portrait");
    const rotateX = gsap.quickTo(feature, "rotationX", { duration: 0.55, ease: "power3.out" });
    const rotateY = gsap.quickTo(feature, "rotationY", { duration: 0.55, ease: "power3.out" });
    const imageX = portrait ? gsap.quickTo(portrait, "x", { duration: 0.7, ease: "power3.out" }) : null;
    const imageY = portrait ? gsap.quickTo(portrait, "y", { duration: 0.7, ease: "power3.out" }) : null;
    const handleMove = (event: PointerEvent) => {
      const bounds = feature.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      rotateY(x * 4.5); rotateX(y * -4.5); imageX?.(x * -13); imageY?.(y * -10);
    };
    const handleLeave = () => { rotateX(0); rotateY(0); imageX?.(0); imageY?.(0); };
    feature.addEventListener("pointermove", handleMove);
    feature.addEventListener("pointerleave", handleLeave);
    return () => {
      feature.removeEventListener("pointermove", handleMove);
      feature.removeEventListener("pointerleave", handleLeave);
    };
  }, [activeMember]);

  return (
    <section
      ref={sectionRef}
      className={`team-showcase ${isPaused ? "is-paused" : ""}`}
      aria-labelledby="team-preview-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="team-showcase__grid-lines" aria-hidden="true" />
      <div className="team-showcase__orb" aria-hidden="true"><i /><i /><i /></div>
      <div className="team-showcase__shell">
        <header className="team-showcase__intro">
          <div>
            <span className="team-showcase__eyebrow"><i /> Meet our team</span>
            <h2 id="team-preview-title">People Behind The Momentum.</h2>
          </div>
          <p>Strategy, design, and technology—moving forward together.</p>
        </header>

        <div className="team-showcase__layout">
          <div ref={featureRef} className="team-showcase__stage">
            <div className="team-showcase__portrait">
              <Image src={member.image} alt={member.name} fill priority sizes="(max-width: 760px) calc(100vw - 36px), 760px" className={member.focus} />
              <span className="team-showcase__portrait-shade" aria-hidden="true" />
            </div>
            <span className="team-showcase__count">0{activeMember + 1} / 03</span>
            <span className="team-showcase__role"><i /> {member.role}</span>
            <div className="team-showcase__identity">
              <h3>
                <span>{member.name.split(" ")[0]}</span>
                <span>{member.name.split(" ").slice(1).join(" ")}</span>
              </h3>
              <p>Core team · DevMark IT Studio</p>
              <span className="team-showcase__signal" aria-hidden="true" />
            </div>
          </div>

          <div className="team-showcase__selector" role="list" aria-label="Choose a team member">
            <span className="team-showcase__selector-label">Core team / 03</span>
            {team.map((person, index) => (
              <button
                type="button"
                role="listitem"
                key={person.name}
                className={`team-showcase__person ${index === activeMember ? "is-active" : ""}`}
                onClick={() => setActiveMember(index)}
                aria-pressed={index === activeMember}
              >
                <span className="team-showcase__thumb"><Image src={person.image} alt="" fill sizes="72px" className={person.focus} /></span>
                <span><strong>{person.name}</strong><small>{person.role}</small></span>
                <b aria-hidden="true">0{index + 1}</b>
              </button>
            ))}
            <div className="team-showcase__progress" aria-hidden="true"><span key={activeMember} /></div>
            <p className="team-showcase__hint"><span /> Select a profile to bring them into focus.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
