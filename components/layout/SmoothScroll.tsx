"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const NAV_OFFSET = -84;

export default function SmoothScroll() {
  useEffect(() => {
    // A link to the page you're already on with no hash (navbar "Home", the logo,
    // footer "Home" — all href="/") is a no-op for the Next.js router, which only
    // scrolls when the URL changes or has a #target. Treat it as "back to top".
    const isSamePageTop = (anchor: HTMLAnchorElement) => {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin && url.pathname === window.location.pathname && !url.hash;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const handleTopClick = (event: MouseEvent) => {
        const anchor = (event.target as HTMLElement)?.closest<HTMLAnchorElement>("a[href]");
        if (anchor && isSamePageTop(anchor)) window.scrollTo({ top: 0 });
      };
      document.addEventListener("click", handleTopClick);
      return () => document.removeEventListener("click", handleTopClick);
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const handleAnchorClick = (event: MouseEvent) => {
      const topLink = (event.target as HTMLElement)?.closest<HTMLAnchorElement>("a[href]");
      if (topLink && isSamePageTop(topLink)) {
        event.preventDefault();
        lenis.scrollTo(0, { duration: 1.3 });
        return;
      }

      const anchor = (event.target as HTMLElement)?.closest<HTMLAnchorElement>("a[href^='#']");
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: NAV_OFFSET, duration: 1.3 });
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
