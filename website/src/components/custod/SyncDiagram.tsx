"use client";

import { motion, useInView } from "framer-motion";
import { Cpu, Database, Globe, Laptop, Radio, Smartphone, Zap } from "lucide-react";
import { useRef } from "react";

const CLIENTS = [
  { label: "Chrome", icon: Globe },
  { label: "macOS", icon: Laptop },
  { label: "iOS", icon: Smartphone },
  { label: "Arduino", icon: Cpu },
] as const;

export function SyncDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="mx-auto max-w-4xl">
      <div className="grid gap-4 md:grid-cols-4">
        {CLIENTS.map((client, index) => (
          <motion.div
            key={client.label}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ delay: index * 0.08 }}
            className="custod-card-gradient custod-card flex flex-col items-center p-4 text-center"
          >
            <client.icon className="mb-2 size-6 text-primary" />
            <span className="text-sm font-medium text-foreground">{client.label}</span>
            <span className="mt-1 text-xs text-muted-foreground">Every 5 min</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mx-auto my-2 h-8 w-px origin-top bg-primary/30"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ delay: 0.35 }}
        className="custod-card-gradient custod-card mx-auto flex max-w-md items-center gap-4 p-5"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/35">
          <Database className="size-6 text-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Supabase Hub</p>
          <p className="text-sm text-muted-foreground">
            Postgres + Realtime sync across all devices
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mx-auto my-2 h-8 w-px origin-top bg-primary/30"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ delay: 0.5 }}
        className="custod-card-gradient custod-card mx-auto flex max-w-md items-center gap-4 p-5"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/25">
          <Zap className="size-6 text-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">ML Edge Function</p>
          <p className="text-sm text-muted-foreground">
            TensorFlow Lite · 20-feature vector · score 0–100
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mx-auto my-2 h-8 w-px origin-top bg-primary/30"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ delay: 0.65 }}
        className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-2"
      >
        <Radio className="size-4 text-custod-status-green" />
        <span className="text-sm text-muted-foreground">
          Realtime fan-out → badge · menu bar · widget · desk LED
        </span>
      </motion.div>
    </div>
  );
}
