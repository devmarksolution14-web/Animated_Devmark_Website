import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "section-title",
        align === "center" ? "section-title--center" : "",
        className
      )}
    >
      {eyebrow && (
        <span className="eyebrow">
          {eyebrow}
        </span>
      )}
      <h2>
        {title}
      </h2>
      {description && (
        <p>
          {description}
        </p>
      )}
    </div>
  );
}
