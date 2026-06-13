"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeading } from "@/components/custod/SectionPrimitives";
import { PROBLEM, WHAT_IT_IS } from "@/lib/custod-content";

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading
        title={PROBLEM.title}
        subtitle={PROBLEM.subtitle}
        className="mb-10 lg:mb-14"
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.5 }}
        className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <div className="space-y-4">
          {PROBLEM.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-[#334155] md:text-lg">
              {paragraph}
            </p>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {PROBLEM.patterns.map((pattern) => (
              <span
                key={pattern}
                className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-sm text-custod-muted"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>

        <div className="custod-card-gradient rounded-4xl border border-[#E2E8F0] p-6 md:p-8">
          <h3 className="mb-4 text-xl font-semibold text-[#0f172a]">{WHAT_IT_IS.title}</h3>
          <div className="space-y-4">
            {WHAT_IT_IS.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-[#334155] md:text-base">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
