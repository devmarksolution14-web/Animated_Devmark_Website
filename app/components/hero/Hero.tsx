import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-[var(--background)]">
      <Container>
        <div className="max-w-3xl">
          <h1 className="text-[var(--primary)] mb-4 font-bold text-5xl md:text-7xl leading-tight">
            DevMark Solution
          </h1>
          <p className="text-[var(--secondary)] mb-8 text-lg md:text-xl">
            Innovate. Elevate. Dominate.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="/contact" variant="primary">
              Get Started
            </Button>
            <Button href="/portfolio" variant="outline">
              View Portfolio
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}