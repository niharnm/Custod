import { cn } from "@/lib/utils";
import type { BurnoutStatus } from "@/lib/types";

const CONFIG = {
  green: {
    label: "Green",
    copy: "On track",
    dot: "bg-ok shadow-[0_0_8px_hsl(var(--ok)/0.9)]",
    pill: "border-ok/20 bg-ok/10 text-ok",
  },
  yellow: {
    label: "Yellow",
    copy: "Watch out",
    dot: "bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.9)]",
    pill: "border-warning/20 bg-warning/10 text-warning",
  },
  red: {
    label: "Red",
    copy: "Burnout signal",
    dot: "bg-danger shadow-[0_0_8px_hsl(var(--danger)/0.9)]",
    pill: "border-danger/20 bg-danger/10 text-danger",
  },
};

export function StatusBadge({ status, large }: { status: BurnoutStatus; large?: boolean }) {
  const c = CONFIG[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full border font-semibold",
      large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
      c.pill
    )}>
      <span className={cn("rounded-full shrink-0", large ? "h-2.5 w-2.5" : "h-2 w-2", c.dot)} />
      <span>{c.label}</span>
      <span className="font-normal opacity-70">— {c.copy}</span>
    </span>
  );
}
