import Link from "next/link";
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
              Dev<span>Mark</span>
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
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 7.02a1.96 1.96 0 1 0 0-3.92 1.96 1.96 0 0 0 0 3.92ZM20.44 20h-3.37v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.68V8.5h3.23v1.57h.05c.45-.85 1.55-1.75 3.19-1.75 3.41 0 4.04 2.25 4.04 5.17V20Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.1" cy="6.9" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.behance.net" target="_blank" rel="noreferrer" aria-label="Behance">
              <span aria-hidden="true">Bē</span>
            </a>
            <a href="https://www.x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
              <span aria-hidden="true">X</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
