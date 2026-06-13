"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StatusLamp } from "@/components/custod/StatusLamp";
import { AUDIENCE } from "@/lib/custod-content";

export function AudienceCtaSection() {
  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <StatusLamp animate size="md" showLabel />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="custod-heading-gradient text-3xl font-medium tracking-[-0.02em] lg:text-5xl xl:text-[56px]"
        >
          {AUDIENCE.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base text-custod-muted md:text-lg"
        >
          {AUDIENCE.subtitle}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#334155] md:text-base"
        >
          {AUDIENCE.body}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={AUDIENCE.ctaPrimaryHref}
            className="custod-primary-button min-w-[180px] rounded-lg px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03] active:scale-[0.97]"
          >
            {AUDIENCE.ctaPrimary}
          </Link>
          <Link
            href={AUDIENCE.ctaSecondaryHref}
            className="min-w-[180px] rounded-lg border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-medium text-[#0f172a] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            {AUDIENCE.ctaSecondary}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
