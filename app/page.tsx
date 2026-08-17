import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Services from "@/components/services/Services";
import Portfolio from "@/components/portfolio/Portfolio";
import TeamPreview from "@/components/team/TeamPreview";
import SocialProof from "@/components/social-proof/SocialProof";
import Contact from "@/components/contact/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <TeamPreview />
      <SocialProof />
      <Contact />
    </>
  );
}
