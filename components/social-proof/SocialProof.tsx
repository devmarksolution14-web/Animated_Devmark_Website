"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

const tools = [
  { name: "Next.js", slug: "nextdotjs", type: "Development" },
  { name: "React", slug: "react", type: "Development" },
  { name: "Figma", slug: "figma", type: "Design" },
  { name: "Framer", slug: "framer", type: "Design" },
  { name: "Google Ads", slug: "googleads", type: "Marketing" },
  { name: "Meta", slug: "meta", type: "Marketing" },
  { name: "Webflow", slug: "webflow", type: "Development" },
  { name: "Shopify", slug: "shopify", type: "Commerce" },
  { name: "Notion", slug: "notion", type: "Workflow" },
  { name: "HubSpot", slug: "hubspot", type: "Growth" },
];

// Draft quotes for our actual portfolio clients — pending real client sign-off before launch.
const testimonials = [
  {
    quote: "DevMark gave Annapurna Dental a website that finally matches the quality of care we provide. Patients tell us booking feels effortless now.",
    name: "Annapurna Dental",
    role: "Dental Clinic",
  },
  {
    quote: "The DevMark team turned a complex study-abroad journey into a platform students actually enjoy using. Our sign-ups picked up right after launch.",
    name: "connectuni.ai",
    role: "AI Study Abroad Platform",
  },
  {
    quote: "DevMark understood exactly what HR teams need from a recruitment site. Clean, fast, and it makes us look as sharp as the candidates we place.",
    name: "Nexus HR",
    role: "Human Resources Website",
  },
];

// Keep each repeating half wider than an ultra-wide viewport so the marquee
// never exposes an empty edge before the identical half takes over.
const wideScreenTools = [...tools, ...tools, ...tools];
const wideScreenTestimonials = [...testimonials, ...testimonials, ...testimonials];

function ToolTrack() {
  return (
    <div className="tool-marquee" aria-label="Tools we use">
      <div className="tool-track">
        {[0, 1].map((group) => (
          <div className="tool-track__group" aria-hidden={group === 1} key={group}>
            {wideScreenTools.map((tool, index) => (
              <span className="tool-chip" key={`${tool.name}-${index}`}>
                <span className="tool-chip__logo" aria-hidden="true">
                  <img src={`https://cdn.simpleicons.org/${tool.slug}/FFD500`} alt="" width="28" height="28" loading="lazy" />
                </span>
                <span className="tool-chip__copy">
                  <strong>{tool.name}</strong>
                  <small>{tool.type}</small>
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialTrack() {
  return (
    <div className="testimonial-marquee" aria-label="Client testimonials">
      <div className="testimonial-track">
        {[0, 1].map((group) => (
          <div className="testimonial-track__group" aria-hidden={group === 1} key={group}>
            {wideScreenTestimonials.map((testimonial, index) => (
              <article className="testimonial-card" key={`${testimonial.name}-${index}`}>
            <span className="testimonial-mark">“</span>
            <p>{testimonial.quote}</p>
            <footer>
              <span className="testimonial-avatar">{testimonial.name.split(" ").map((part) => part[0]).join("")}</span>
              <span><strong>{testimonial.name}</strong><small>{testimonial.role}</small></span>
            </footer>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from(".tools-heading > *", { y: 28, opacity: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 78%", once: true } });
      gsap.from(".testimonial-title > *", { y: 28, opacity: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".testimonial-title", start: "top 82%", once: true } });
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="social-proof" aria-labelledby="testimonial-title">
      <Container>
        <div className="tools-heading">
          <span className="eyebrow">Tools we use</span>
          <h2>Powering Every Bold Move.</h2>
          <p>The design, development, and growth stack behind our work.</p>
        </div>
      </Container>
      <div className="tools-stage">
        <ToolTrack />
      </div>
      <Container>
        <SectionTitle
          eyebrow="Client Testimonials"
          title="What Our Clients Say"
          description="Built to look bold. Designed to create momentum."
          align="center"
          className="testimonial-title"
        />
      </Container>
      <TestimonialTrack />
    </section>
  );
}
