"use client";

import { useEffect, useRef } from "react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { BadgeCheck, Bolt, Rocket, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const benefits = [
  { value: "1-on-1", label: "Direct access to your developer", icon: Bolt },
  { value: "Fast", label: "Lightning-fast load speeds", icon: Rocket },
  { value: "Clean", label: "Modern, maintainable code", icon: ShieldCheck },
  { value: "100%", label: "Satisfaction Guarantee", icon: BadgeCheck },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".stat");

      media.add("(min-width: 801px)", () => {
        gsap.from(".about-heading > *", { y: 32, opacity: 0, duration: .9, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 75%", once: true } });
        gsap.from(".about-story > *", { y: 26, opacity: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".about-story", start: "top 82%", once: true } });
        gsap.from(cards, { y: 36, opacity: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".stats", start: "top 85%", once: true } });

        cards.forEach((card) => {
          const rotateX = gsap.quickTo(card, "rotationX", { duration: .5, ease: "power3.out" });
          const rotateY = gsap.quickTo(card, "rotationY", { duration: .5, ease: "power3.out" });
          const moveTo = gsap.quickTo(card, "y", { duration: .5, ease: "power3.out" });
          const move = (event: PointerEvent) => {
            const box = card.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            rotateY((x - .5) * 6); rotateX((y - .5) * -6); moveTo(-3);
          };
          const leave = () => { rotateX(0); rotateY(0); moveTo(0); };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          cleanup.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
        });
      });

      media.add("(max-width: 800px)", () => {
      const anchorCard = cards[0];
      gsap.set(cards, { force3D: true, willChange: "transform", transformOrigin: "50% 62%" });
      cards.forEach((card, index) => gsap.set(card, {
        zIndex: cards.length - index,
        x: anchorCard.offsetLeft - card.offsetLeft + index * 6,
        y: anchorCard.offsetTop - card.offsetTop + index * 8,
        rotation: [-1.4, 1.7, -2, 2.2][index] ?? 0,
        scale: 1 - index * 0.016,
        autoAlpha: index === 0 ? 1 : 0,
      }));

      const deckTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".stats",
          start: "top 88%",
          end: () => `+=${Math.max(430, window.innerHeight * 0.72)}`,
          scrub: 0.42,
          invalidateOnRefresh: true,
        },
      });

      deckTimeline.to(cards[0], { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.55, ease: "none" }, 0);
      cards.slice(1).forEach((card, index) => {
        const dealAt = index * 0.18;
        deckTimeline.to(card, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: "none" }, dealAt);
        deckTimeline.to(card, { autoAlpha: 1, duration: 0.12, ease: "none" }, dealAt + 0.8);
      });
      });
    }, section);

    return () => { cleanup.forEach((remove) => remove()); media.revert(); context.revert(); };
  }, []);

  return (
    <section ref={sectionRef} id="about" className="section section--white about-section">
      <Container>
        <SectionTitle
          eyebrow="About Us"
          title="Web Design And Digital Growth For Ambitious Brands."
          description="A Kathmandu-based studio combining web design, branding, and development to create fast digital experiences built for measurable growth."
          align="center"
          className="about-heading"
        />

        <div className="about-content">
          <article className="about-story">
            <span className="about-story__index">01 / Our approach</span>
            <h3>Built with intent.</h3>
            <p>
              We unite strategy, design, and engineering to turn ambitious ideas
              into distinctive digital products that move businesses forward.
            </p>
            <div className="about-story__footer">
              <span>Strategy</span><i /><span>Design</span><i /><span>Engineering</span>
            </div>
          </article>

          <div className="stats">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
              <div key={benefit.label} className="stat">
                <span className="stat__icon" aria-hidden="true"><Icon size={22} strokeWidth={2.2} /></span>
                <small className="stat__index">0{index + 1}</small>
                <strong>{benefit.value}</strong>
                <i className="stat__dash" aria-hidden="true" />
                <span className="stat__label">{benefit.label}</span>
              </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
