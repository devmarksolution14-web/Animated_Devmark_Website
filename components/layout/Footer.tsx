import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronUp, Globe, Mail, MapPin, Phone } from "lucide-react";

import { SITE } from "@/constants/site";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Our work", href: "/#portfolio" },
  { label: "Get in touch", href: "/#contact" },
];

const serviceLinks = [
  "Web Development",
  "Brand Design",
  "Digital Marketing",
  "SEO Optimization",
  "Graphic Design",
  "Video Editing",
  "Motion Graphics",
  "AI Automation",
];

const legalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

const websiteLabel = SITE.url.replace(/^https?:\/\//, "www.");
const telHref = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="container footer-shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="DevMark Solution home">
              <Image
                src="/logo/DevLogo_white01.svg"
                alt="DevMark Solution"
                width={524}
                height={410}
                className="footer-logo"
              />
            </Link>
            <p className="footer-brand__desc">
              We bring strategy, design, and technology together to help ambitious businesses make their next move.
            </p>
            <ul className="footer-brand__contact">
              <li>
                <MapPin aria-hidden="true" />
                <span>Samakhusi, Kathmandu, Nepal</span>
              </li>
              <li>
                <Mail aria-hidden="true" />
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <Globe aria-hidden="true" />
                <a href={SITE.url} target="_blank" rel="noreferrer">{websiteLabel}</a>
              </li>
              <li>
                <Phone aria-hidden="true" />
                <a href={telHref}>{SITE.phone}</a>
              </li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h3 className="footer-col-title">Navigation</h3>
            <ul className="footer-col-links">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-nav-col">
            <h3 className="footer-col-title">Services</h3>
            <ul className="footer-col-links">
              {serviceLinks.map((label) => (
                <li key={label}>
                  <Link href="/#services">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-newsletter">
            <h3 className="footer-col-title">Stay updated</h3>
            <p className="footer-newsletter__desc">
              Leave your details and we&apos;ll get back to you — head to the contact form above to get started.
            </p>
            <Link href="/#contact" className="footer-newsletter__cta">
              <span className="footer-newsletter__cta-label">Go to contact form</span> <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <a href="#home" className="footer-totop" aria-label="Back to top">
            <ChevronUp aria-hidden="true" />
          </a>
          <p className="footer-bottom__copyright">© {new Date().getFullYear()} DevMark Solution. All rights reserved.</p>
          <ul className="footer-bottom__legal">
            {legalLinks.map((label) => (
              <li key={label}>
                <span aria-disabled="true">{label}</span>
              </li>
            ))}
          </ul>
          <div className="footer-bottom__socials">
            <a href="https://www.facebook.com/devmarkitstudio/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/devmarkofficial14/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.1" cy="6.9" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@devmarkitstudio" target="_blank" rel="noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.6 2h-3.2v13.6a3.1 3.1 0 1 1-2.2-2.97V9.3a6.3 6.3 0 1 0 5.4 6.24V8.3a7.9 7.9 0 0 0 4.6 1.48V6.6a4.6 4.6 0 0 1-4.6-4.6Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
