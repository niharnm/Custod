"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StatusLamp } from "@/components/custod/StatusLamp";
import { SectionShell } from "@/components/custod/SectionPrimitives";
import { AUDIENCE } from "@/lib/custod-content";

export function AudienceCtaSection() {
  return (
    <SectionShell muted>
      <div className="mx-auto max-w-3xl">
        <div className="custod-card-gradient custod-card border-accent/30 px-6 py-10 text-center md:px-10 md:py-14">
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
            className="font-heading text-3xl text-foreground lg:text-5xl"
          >
            {AUDIENCE.title}
          </motion.h2>
          <div className="custod-accent-bar mx-auto mt-4" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base text-muted-foreground md:text-lg"
          >
            {AUDIENCE.subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-custod-brown-light md:text-base"
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
              className="custod-primary-button min-w-[180px] rounded-full px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.97]"
            >
              {AUDIENCE.ctaPrimary}
            </Link>
            <Link
              href={AUDIENCE.ctaSecondaryHref}
              className="custod-secondary-button min-w-[180px] rounded-full px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {AUDIENCE.ctaSecondary}
            </Link>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}
