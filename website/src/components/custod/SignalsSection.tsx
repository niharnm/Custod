"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SignalTable } from "@/components/custod/SignalTable";
import { SectionHeading, SectionShell } from "@/components/custod/SectionPrimitives";
import { ML_STATS, SIGNAL_ROWS } from "@/lib/custod-content";

export function SignalsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <SectionShell id="signals" muted>
      <SectionHeading
        title="The machine learning layer"
        subtitle="A TensorFlow Lite model runs as a Supabase Edge Function — fusing signals from all four sources into one score."
        className="mb-12 lg:mb-16"
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl space-y-10"
      >
        <div className="custod-card flex flex-col gap-8 p-6 lg:flex-row lg:p-8">
          {ML_STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="flex-1 border-b border-border pb-8 last:border-b-0 last:pb-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 last:lg:border-r-0 last:lg:pr-0"
            >
              <span className="custod-stat-value">{stat.value}</span>
              <p className="mt-1 text-lg font-medium text-foreground">{stat.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Signal summary</h3>
          <SignalTable rows={SIGNAL_ROWS} />
        </div>
      </motion.div>
    </SectionShell>
  );
}
