"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SignalTable } from "@/components/custod/SignalTable";
import { SectionHeading } from "@/components/custod/SectionPrimitives";
import { ML_STATS, SIGNAL_ROWS } from "@/lib/custod-content";

export function SignalsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="signals" className="scroll-mt-24 px-5 py-12 md:px-8 md:py-16 lg:py-24">
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
        <div className="flex flex-col gap-8 lg:flex-row">
          {ML_STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="flex-1 border-b border-[#E2E8F0] pb-8 last:border-b-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 last:lg:border-r-0 last:lg:pr-0"
            >
              <span className="text-4xl font-medium tracking-[-0.03em] text-[#0f172a] md:text-5xl">
                {stat.value}
              </span>
              <p className="mt-1 text-lg font-medium text-[#0f172a]">{stat.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-custod-muted md:text-base">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Signal summary</h3>
          <SignalTable rows={SIGNAL_ROWS} />
        </div>
      </motion.div>
    </section>
  );
}
