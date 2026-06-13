import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import type { BurnoutStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONFIG = {
  green: {
    label: "Green",
    copy: "No severe spiral visible",
    icon: CheckCircle2,
    className: "border-ok/25 bg-ok/10 text-ok"
  },
  yellow: {
    label: "Yellow",
    copy: "Pattern building",
    icon: AlertTriangle,
    className: "border-warning/30 bg-warning/10 text-warning"
  },
  red: {
    label: "Red",
    copy: "Reset recommended now",
    icon: CircleAlert,
    className: "border-danger/30 bg-danger/10 text-danger"
  }
} satisfies Record<BurnoutStatus, { label: string; copy: string; icon: typeof CheckCircle2; className: string }>;

export function StatusBadge({ status, large = false }: { status: BurnoutStatus; large?: boolean }) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold",
        config.className,
        large ? "text-base" : "text-sm"
      )}
    >
      <Icon className={large ? "h-5 w-5" : "h-4 w-4"} />
      <span>{config.label}</span>
      <span className="font-normal opacity-75">{config.copy}</span>
    </div>
  );
}
