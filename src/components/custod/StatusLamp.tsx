"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { StatusLevel } from "@/types/custod";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<StatusLevel, { glow: string; core: string; label: string }> = {
  green: {
    glow: "rgba(34, 197, 94, 0.6)",
    core: "#22C55E",
    label: "Healthy",
  },
  yellow: {
    glow: "rgba(234, 179, 8, 0.6)",
    core: "#EAB308",
    label: "Caution",
  },
  red: {
    glow: "rgba(239, 68, 68, 0.7)",
    core: "#EF4444",
    label: "Burnout risk",
  },
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

  const colors = STATUS_COLORS[status];
  const sizeClasses = {
    sm: "size-8",
    md: "size-16",
    lg: "size-24",
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={
            status === "yellow"
              ? { opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }
              : status === "red"
                ? { opacity: [1, 0.4, 1], scale: [1, 1.1, 1] }
                : { opacity: 1, scale: 1 }
          }
          transition={{
            duration: status === "red" ? 0.8 : 2,
            repeat: status !== "green" ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={cn("rounded-full blur-xl", sizeClasses[size])}
          style={{ backgroundColor: colors.glow }}
        />
        <div
          className={cn(
            "relative rounded-full border-2 border-white/20 shadow-lg",
            sizeClasses[size],
          )}
          style={{
            backgroundColor: colors.core,
            boxShadow: `0 0 24px ${colors.glow}, inset 0 2px 4px rgba(255,255,255,0.3)`,
          }}
        />
      </div>
      {showLabel ? (
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: colors.core }}
        >
          {colors.label}
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
  const color = STATUS_COLORS[status].core;
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full", className)}
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

export function getStatusColor(status: StatusLevel): string {
  return STATUS_COLORS[status].core;
}
