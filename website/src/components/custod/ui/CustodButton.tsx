import Link from "next/link";
import { cn } from "@/lib/utils";

type CustodButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

const sizeClasses = {
  sm: "rounded-xl px-3 py-2 text-xs",
  md: "rounded-xl px-4 py-2.5 text-sm",
  lg: "rounded-xl px-5 py-3 text-sm",
};

export function CustodButton({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  disabled,
  type = "button",
  onClick,
}: CustodButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    sizeClasses[size],
    variant === "primary" && "custod-primary-button text-foreground",
    variant === "secondary" && "custod-secondary-button",
    variant === "ghost" &&
      "border-0 bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
