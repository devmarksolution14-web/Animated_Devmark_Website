"use client";

import { useEffect, useRef } from "react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import { Bot, Clapperboard, Code2, Palette, PenTool, Rocket, Search, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const services = [
  {
    icon: Code2,
    title: "Web Development",
    description:
      "Fast, scalable websites and web apps built with modern frameworks.",
  },
  {
    icon: Palette,
    title: "Brand Design",
    description:
      "Distinct visual identities that make your brand memorable.",
  },
  {
    icon: Rocket,
    title: "Digital Marketing",
    description:
      "Growth-focused campaigns that turn visibility into revenue.",
  },
  {
    icon: Search,
    title: "SEO Optimization",
    description:
      "Rank higher, get found faster, and outpace your competitors.",
  },
  {
    icon: PenTool,
    title: "Graphic Design",
    description:
      "Scroll-stopping design systems, campaign assets, and content built to stay on-brand.",
  },
  {
    icon: Clapperboard,
    title: "Video Editing",
    description:
      "Polished short-form and campaign video that keeps your audience watching.",
  },
  {
    icon: Sparkles,
    title: "Motion Graphics",
    description:
      "Dynamic visual stories, product explainers, and animated brand moments.",
  },
  {
    icon: Bot,
    title: "AI Automation",
    description:
      "Practical AI workflows that reduce repetitive work and help teams move faster.",
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".service-card");

      media.add("(min-width: 801px)", () => {
        gsap.from(".services-heading > *", { y: 32, opacity: 0, duration: .9, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 75%", once: true } });
        gsap.from(cards, { y: 36, opacity: 0, duration: .8, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: ".service-grid", start: "top 85%", once: true } });
      });

      // Phones: each card simply rises in from below as it scrolls into view (plays once).
      media.add("(max-width: 800px)", () => {
        gsap.set(cards, { y: 40, autoAlpha: 0, force3D: true });
        ScrollTrigger.batch(cards, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: "power3.out", overwrite: true, clearProps: "transform,willChange" }),
        });
      });

      cards.forEach((card) => {
        const rotateX = gsap.quickTo(card, "rotationX", { duration: .5, ease: "power3.out" });
        const rotateY = gsap.quickTo(card, "rotationY", { duration: .5, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          const box = card.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width;
          const y = (event.clientY - box.top) / box.height;
          card.style.setProperty("--spot-x", `${x * 100}%`);
          card.style.setProperty("--spot-y", `${y * 100}%`);
          rotateY((x - .5) * 7); rotateX((y - .5) * -7);
        };
        const leave = () => { rotateX(0); rotateY(0); };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanup.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });
    }, section);
    return () => { cleanup.forEach((remove) => remove()); media.revert(); context.revert(); };
  }, []);

  return (
    <section ref={sectionRef} id="services" className="section section--soft services-showcase">
      <Container>
        <SectionTitle
          eyebrow="What We Do"
          title="Our Services"
          description="End-to-end solutions to help your brand grow, built around your goals."
          align="center"
          className="services-heading"
        />

        <div className="service-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="service-card"
                tabIndex={0}
              >
                <span className="service-card__spotlight" aria-hidden="true" />
                <span className="service-card__index">0{index + 1}</span>
                <div className="service-icon service-icon--isometric">
                  <i className="service-icon__side service-icon__side--left" aria-hidden="true" />
                  <i className="service-icon__side service-icon__side--right" aria-hidden="true" />
                  <span className="service-icon__face">
                    <Icon size={21} />
                  </span>
                </div>
                <h3>
                  {service.title}
                </h3>
                <p>
                  {service.description}
                </p>
                <span className="service-card__signal" aria-hidden="true"><i /></span>
              </article>
            );
          })}
        </div>
        <div className="services-more">
          <Button href="#contact" variant="primary">See more services</Button>
        </div>
      </Container>
    </section>
  );
}
