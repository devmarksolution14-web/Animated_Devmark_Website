"use client";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import HeroMotion from "./HeroMotion";

export default function Hero() {
  return (
    <section className="growth-hero" id="home">
      <HeroMotion />
      <Container className="growth-shell">
        <div className="growth-copy">
          <p className="growth-kicker"><i /> Digital growth studio - Kathmandu & beyond</p>
          <h1 className="growth-title">
            <span className="growth-line"><span className="growth-word">BUILD THE</span></span>
            <span className="growth-line"><span className="growth-word">NEXT <em>MOVE.</em></span></span>
          </h1>
          <p className="growth-lead">Websites, intelligent automation, and creative campaigns - built as one connected growth system.</p>
          <div className="growth-actions">
            <Button href="#contact" variant="primary">Start a project</Button>
            <a href="#portfolio" className="growth-secondary"><span className="growth-secondary__label">Explore our work</span> <span className="growth-secondary__arrow">↓</span></a>
          </div>
        </div>
        <div className="growth-reactor" aria-label="DevMark growth engine">
          <div className="growth-core">
            <div className="orbit orbit-a"><span className="orbit-node node-web">WEB</span><span className="orbit-dot dot-one" /></div>
            <div className="orbit orbit-b"><span className="orbit-node node-ai">AI</span><span className="orbit-node node-brand">BRAND</span><span className="orbit-dot dot-two" /></div>
            <div className="growth-center"><small>DEVMARK</small><strong>GROWTH</strong><span>ENGINE / 01</span></div>
            <div className="core-line horizontal" /><div className="core-line vertical" />
          </div>
          <div className="reactor-caption"><span>LIVE SYSTEM</span><div className="signal-bar"><i /><i /><i /><i /><i /></div><b>98.7%</b></div>
        </div>
      </Container>
      <Container className="growth-metrics">
        <div className="growth-metric"><span>01</span><strong>DESIGN</strong><small>Experiences that convert</small></div>
        <div className="growth-metric"><span>02</span><strong>AUTOMATE</strong><small>Systems that save time</small></div>
        <div className="growth-metric"><span>03</span><strong>AMPLIFY</strong><small>Campaigns that travel</small></div>
      </Container>
    </section>
  );
}
