"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";

const projects = [
  { title: "Annapurna Dental", category: "Dental Clinic", image: "/Dental_portfolio06.png", alt: "Annapurna Dental clinic brand identity and website project" },
  { title: "connectuni.ai", category: "AI Study Abroad Platform", image: "/Connectuni_portfolio05.png", alt: "ConnectUni.ai study abroad platform website project" },
  { title: "Nexus HR", category: "Human Resources Website", image: "/Nexus_Portfolio_04.png", alt: "Nexus HR recruitment and human resources website project" },
];

export default function Portfolio() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      gsap.from(".portfolio-showcase .portfolio-heading > *", { y: 35, opacity: 0, duration: .9, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 72%", once: true } });
      const projectCards = gsap.utils.toArray<HTMLElement>(".portfolio-showcase .project");

      media.add("(min-width: 801px)", () => {
        gsap.from(projectCards, { y: 40, opacity: 0, duration: .85, stagger: .12, ease: "power3.out", scrollTrigger: { trigger: ".portfolio-grid", start: "top 85%", once: true } });
      });

      media.add("(max-width: 800px)", () => {
        const anchorCard = projectCards[0];

        projectCards.forEach((card, index) => {
          gsap.set(card, {
            zIndex: projectCards.length - index,
            transformOrigin: "50% 62%",
            willChange: "transform",
            force3D: true,
          });
        });

        gsap.from(projectCards, {
          x: (index, card: HTMLElement) => anchorCard.offsetLeft - card.offsetLeft + index * 7,
          y: (index, card: HTMLElement) => anchorCard.offsetTop - card.offsetTop + index * 9,
          rotation: (index) => [-1.5, 1.8, -2.2, 2.4][index] ?? 0,
          scale: (index) => 1 - index * 0.018,
          duration: 1,
          stagger: 0.13,
          ease: "none",
          scrollTrigger: {
            trigger: ".portfolio-showcase .portfolio-grid",
            start: "top 78%",
            end: () => `+=${Math.max(520, window.innerHeight * 0.9)}`,
            scrub: 0.42,
            invalidateOnRefresh: true,
          },
        });
      });

      section.querySelectorAll<HTMLElement>(".project:not(.project--cta)").forEach((card) => {
        const image = card.querySelector<HTMLElement>(".project__image");
        const rotateX = gsap.quickTo(card, "rotationX", { duration: .5, ease: "power3.out" });
        const rotateY = gsap.quickTo(card, "rotationY", { duration: .5, ease: "power3.out" });
        const imageX = image ? gsap.quickTo(image, "x", { duration: .65, ease: "power3.out" }) : null;
        const imageY = image ? gsap.quickTo(image, "y", { duration: .65, ease: "power3.out" }) : null;
        const move = (event: PointerEvent) => {
          const box = card.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width - .5;
          const y = (event.clientY - box.top) / box.height - .5;
          rotateY(x * 5); rotateX(y * -5); imageX?.(x * -10); imageY?.(y * -8);
        };
        const leave = () => { rotateX(0); rotateY(0); imageX?.(0); imageY?.(0); };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanup.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });
    }, section);
    return () => { cleanup.forEach((remove) => remove()); media.revert(); context.revert(); };
  }, []);

  return (
    <section ref={sectionRef} id="portfolio" className="section section--white portfolio-showcase">
      <Container>
        <div className="portfolio-heading">
          <SectionTitle eyebrow="Our Work" title="Work That Moves Brands." description="A look at the brands and products we've helped bring to life." align="center" />
        </div>

        <div className="portfolio-grid">
          {projects.map((project) => (
            <article key={project.title} className="project" tabIndex={0}>
              <Image src={project.image} alt={project.alt} fill sizes="(max-width: 800px) calc(100vw - 36px), 570px" className="project__image" />
              <span className="project__sweep" aria-hidden="true" />
              <div className="project__content">
                <span className="project__category">{project.category}</span>
                <h3>{project.title}</h3>
                <span className="project__arrow"><ArrowUpRight size={20} /></span>
              </div>
            </article>
          ))}

          <article className="project project--cta">
            <span className="project-cta__orbit" aria-hidden="true"><i /><i /></span>
            <div className="project-cta__content">
              <span>Have something ambitious in mind?</span>
              <h3>Your project<br />could be next.</h3>
              <Button href="#contact" variant="primary">Start a Project</Button>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
