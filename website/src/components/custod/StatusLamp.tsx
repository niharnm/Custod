"use client";

import { useEffect, useState } from "react";
import type { StatusLevel } from "@/types/custod";
import { STATUS_CONFIG } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STATUS_PULSE: Record<StatusLevel, string> = {
  green: "",
  yellow: "animate-[custod-pulse-amber_2s_ease-in-out_infinite]",
  red: "animate-[custod-pulse-red_0.8s_ease-in-out_infinite]",
};

interface StatusLampProps {
  status?: StatusLevel;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function StatusLamp({
  status: controlledStatus,
  size = "md",
  animate = false,
  showLabel = false,
  className,
}: StatusLampProps) {
  const [demoStatus, setDemoStatus] = useState<StatusLevel>("green");
  const status = controlledStatus ?? demoStatus;

  useEffect(() => {
    if (!animate || controlledStatus) return;
    const cycle: StatusLevel[] = ["green", "yellow", "red"];
    let index = 0;
    const id = window.setInterval(() => {
      index = (index + 1) % cycle.length;
      setDemoStatus(cycle[index] ?? "green");
    }, 4000);
    return () => window.clearInterval(id);
  }, [animate, controlledStatus]);

  const config = STATUS_CONFIG[status];
  const sizeClasses = { sm: "size-8", md: "size-16", lg: "size-24" };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "absolute rounded-full blur-xl",
            sizeClasses[size],
            STATUS_PULSE[status],
          )}
          style={{ backgroundColor: config.glow }}
        />
        <div
          className={cn(
            "relative rounded-full border-2 border-border bg-card",
            sizeClasses[size],
          )}
          style={{
            backgroundColor: config.color,
            boxShadow: `0 0 28px ${config.glow}, inset 0 2px 6px rgb(255 255 255 / 35%)`,
          }}
        />
      </div>
      {showLabel ? (
        <span
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      ) : null}
    </div>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: StatusLevel;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{
        backgroundColor: config.color,
        boxShadow: `0 0 8px ${config.glow}`,
      }}
    />
  );
}

export { getStatusColor } from "@/lib/design-tokens";
