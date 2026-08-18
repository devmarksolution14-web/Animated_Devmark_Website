"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { navLinks } from "@/constants/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="navbar">
      <Container>
        <div className="navbar__row">
          {/* Logo */}
          <Link
            href="/"
            className="brand"
            aria-label="DevMark IT Studio Home"
          >
            <Image
              src="/logo/DevLogo_white01.svg"
              alt="DevMark IT Studio"
              width={524}
              height={410}
              priority
              className="brand-logo"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="navbar__action">
            <Button
              href="#contact"
              variant="primary"
              className="button--compact"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Button
              href="#contact"
              variant="primary"
              className="button--compact"
            >
              Get Started
            </Button>
          </nav>
        )}
      </Container>
    </header>
  );
}