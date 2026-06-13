"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { ASSETS } from "@/lib/cluely-assets";
import { STATS } from "@/lib/cluely-content";
import { SectionHeading } from "@/components/cluely/SectionPrimitives";

export function TranscriptionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading title="Real-time transcription" className="mb-12 lg:mb-16" />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.5 }}
        className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <div className="overflow-hidden rounded-4xl border border-[#E5E9F2] bg-[#F9FAFB] p-2 shadow-sm">
          <Image
            src={ASSETS.transcript}
            alt="Real-time transcription interface"
            width={1080}
            height={720}
            className="w-full rounded-3xl"
          />
        </div>

        <div className="flex flex-col gap-8">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="border-b border-[#E5E9F2] pb-8 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col items-start lg:flex-row lg:items-baseline lg:gap-4">
                <span className="text-4xl font-medium tracking-[-0.03em] text-[#19191D] md:text-5xl">
                  {stat.value}
                </span>
                <span className="text-lg font-medium text-[#19191D]">{stat.label}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cluely-muted md:text-base">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
