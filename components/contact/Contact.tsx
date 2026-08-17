"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import { Mail, Phone, MapPin } from "lucide-react";
import emailjs from "@emailjs/browser";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const emailJsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
};

const messagePrompts = [
  "Tell us about your project...",
  "What are you hoping to build?",
  "Which challenge should we solve together?",
  "Share your goals, timeline, and big idea...",
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [messagePlaceholder, setMessagePlaceholder] = useState(messagePrompts[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const type = () => {
      const phrase = messagePrompts[phraseIndex];

      if (deleting) {
        characterIndex -= 1;
      } else {
        characterIndex += 1;
      }

      setMessagePlaceholder(phrase.slice(0, characterIndex));

      if (!deleting && characterIndex === phrase.length) {
        deleting = true;
        timer = setTimeout(type, 1500);
        return;
      }

      if (deleting && characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % messagePrompts.length;
        timer = setTimeout(type, 320);
        return;
      }

      timer = setTimeout(type, deleting ? 28 : 55);
    };

    timer = setTimeout(type, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from(".contact-heading > *", { y: 32, opacity: 0, duration: .9, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: section, start: "top 75%", once: true } });
      gsap.from(".contact-brief > *", { y: 24, opacity: 0, duration: .8, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: ".contact-brief", start: "top 82%", once: true } });
      gsap.from(".contact-form", { y: 30, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".contact-form", start: "top 85%", once: true } });
    }, section);

    return () => context.revert();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (status === "sent" || status === "error") setStatus("idle");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailJsConfig.serviceId || !emailJsConfig.templateId || !emailJsConfig.publicKey) {
      console.error("EmailJS is not configured. Add the required values to .env.local.");
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const submittedAt = new Date().toLocaleString("en-NP", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kathmandu",
      });

      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: fullName,
          name: fullName,
          from_name: fullName,
          user_name: fullName,
          contact: formData.contact,
          phone: formData.contact,
          phone_number: formData.contact,
          user_phone: formData.contact,
          email: formData.email,
          from_email: formData.email,
          user_email: formData.email,
          reply_to: formData.email,
          message: formData.message,
          time: submittedAt,
          submitted: submittedAt,
          submitted_at: submittedAt,
        },
        { publicKey: emailJsConfig.publicKey }
      );
      setStatus("sent");
      setFormData({ firstName: "", lastName: "", contact: "", email: "", message: "" });
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setStatus("error");
    }
  };

  return (
    <section ref={sectionRef} id="contact" className="section section--soft contact-section">
      <Container>
        <SectionTitle
          eyebrow="Get In Touch"
          title="Let's Build Something Great"
          description="Have a project in mind? Tell us where you want to go next, and we&apos;ll help shape the way forward."
          align="center"
          className="contact-heading"
        />

        <div className="contact-grid">
          <div className="contact-brief">
            <span className="contact-brief__index">01 / Conversation</span>
            <h3>Start with an idea.<br />We&apos;ll bring the momentum.</h3>
            <p>Share the challenge, the opportunity, or even the rough first thought. We&apos;ll respond with clarity and a practical next step.</p>
            <div className="contact-details">
              <a className="contact-detail" href="mailto:devmarksolution14@gmail.com">
                <div className="contact-detail__icon">
                  <Mail size={18} />
                </div>
                <span><small>Email us</small>devmarksolution14@gmail.com</span>
              </a>
              <a className="contact-detail" href="tel:+9779869118159">
                <div className="contact-detail__icon">
                  <Phone size={18} />
                </div>
                <span><small>Call us</small>+977 986-9118159</span>
              </a>
              <div className="contact-detail">
                <div className="contact-detail__icon">
                  <MapPin size={18} />
                </div>
                <span><small>Based in</small>Samakhusi, Kathmandu</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="contact-form"
          >
            <div className="contact-form__head">
              <span>02 / Project brief</span>
              <i aria-hidden="true" />
            </div>
            <div className="contact-form__row">
              <label className="field">
                First name
                <input
                  type="text"
                  name="firstName"
                  required
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Your first name"
                />
              </label>

              <label className="field">
                Last name
                <input
                  type="text"
                  name="lastName"
                  required
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Your last name"
                />
              </label>

              <label className="field">
                Contact
                <input
                  type="tel"
                  name="contact"
                  required
                  autoComplete="tel"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Your phone number"
                />
              </label>

              <label className="field">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="field">
              Message
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder={messagePlaceholder}
              />
            </label>

            <Button
              className="w-full"
              variant="primary"
              type="submit"
              disabled={status === "sending"}
            >
              {status === "sending"
                ? "Sending..."
                : status === "sent"
                ? "Message Sent ✓"
                : status === "error"
                ? "Try Sending Again"
                : "Send Message"}
            </Button>
            <p className="contact-form__status" role="status" aria-live="polite">
              {status === "sent" && "Thanks! Your message has been sent."}
              {status === "error" && "Could not send. Please try again or email us directly."}
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}
