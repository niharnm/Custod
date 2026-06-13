import { cn } from "@/lib/utils";
import type { BurnoutStatus } from "@/lib/product/types";

const CONFIG = {
  green: {
    label: "Green",
    copy: "On track",
    dot: "bg-custod-status-green shadow-[0_0_8px_var(--custod-status-green-glow)]",
    pill: "border-custod-status-green/25 bg-custod-status-green/10 text-custod-status-green",
  },
  yellow: {
    label: "Yellow",
    copy: "Watch out",
    dot: "bg-custod-status-yellow shadow-[0_0_8px_var(--custod-status-yellow-glow)]",
    pill: "border-custod-status-yellow/25 bg-custod-status-yellow/10 text-custod-status-yellow",
  },
  red: {
    label: "Red",
    copy: "Burnout signal",
    dot: "bg-custod-status-red shadow-[0_0_8px_var(--custod-status-red-glow)]",
    pill: "border-custod-status-red/25 bg-custod-status-red/10 text-custod-status-red",
  },
};

export function StatusBadge({ status, large }: { status: BurnoutStatus; large?: boolean }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold",
        large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
        c.pill,
      )}
    >
      <span className={cn("shrink-0 rounded-full", large ? "size-2.5" : "size-2", c.dot)} />
      <span>{c.label}</span>
      <span className="font-normal opacity-70">— {c.copy}</span>
    </span>
  );
}
