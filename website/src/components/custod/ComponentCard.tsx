"use client";

import { motion, useInView } from "framer-motion";
import { Cpu, Globe, Laptop, Smartphone } from "lucide-react";
import { useRef } from "react";
import type { ComponentSpec } from "@/types/custod";
import { cn } from "@/lib/utils";

const ICONS = {
  chrome: Globe,
  laptop: Laptop,
  smartphone: Smartphone,
  cpu: Cpu,
} as const;

interface ComponentCardProps {
  spec: ComponentSpec;
  index?: number;
  className?: string;
}

export function ComponentCard({ spec, index = 0, className }: ComponentCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const Icon = ICONS[spec.iconName];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={cn("custod-card-gradient custod-card flex h-full flex-col p-6 md:p-8", className)}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/40">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{spec.title}</h3>
          <p className="text-sm text-muted-foreground">{spec.subtitle}</p>
        </div>
      </div>

      <ul className="mb-5 flex-1 space-y-2.5">
        {spec.signals.map((signal) => (
          <li
            key={signal}
            className="flex items-start gap-2.5 text-sm text-custod-slate-light"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-custod-status-green" />
            {signal}
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-primary/20 bg-accent/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Defining feature
        </p>
        <p className="mt-2 text-sm leading-relaxed text-custod-slate-light">
          {spec.highlight}
        </p>
      </div>
    </motion.div>
  );
}
