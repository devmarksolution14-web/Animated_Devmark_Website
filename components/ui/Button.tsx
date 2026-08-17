import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const styles = {
    primary: "button--primary",
    secondary: "button--dark",
    outline: "button--outline",
  };

  const classes = cn(
    "button",
    styles[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        <span className="button__label">{children}</span>
        <ArrowRight size={18} />
      </Link>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled}>
      <span className="button__label">{children}</span>
      <ArrowRight size={18} />
    </button>
  );
}
