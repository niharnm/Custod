"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { ASSETS } from "@/lib/cluely-assets";
import { SectionHeading } from "@/components/cluely/SectionPrimitives";

export function MeetingNotesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading
        title="Instant meeting notes"
        subtitle="The easiest way to get beautiful, shareable meeting notes."
        className="mb-12 lg:mb-16"
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="mx-auto max-w-6xl"
      >
        <div className="cluely-card-gradient relative overflow-hidden rounded-4xl p-4 md:p-8">
          <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-4 md:gap-6">
            <Image
              src={ASSETS.mobileNotes}
              alt="Mobile meeting notes"
              width={320}
              height={640}
              className="relative z-10 w-[42%] max-w-[220px] drop-shadow-2xl md:w-[28%]"
            />
            <div className="relative flex w-full items-end justify-center gap-4 md:gap-8">
              <Image
                src={ASSETS.tabletNotes}
                alt="Tablet meeting notes"
                width={640}
                height={480}
                className="relative z-20 w-[55%] max-w-[420px] drop-shadow-2xl md:w-[45%]"
              />
              <Image
                src={ASSETS.desktopNotes}
                alt="Desktop meeting notes"
                width={1200}
                height={800}
                className="relative z-30 hidden w-[62%] max-w-[720px] drop-shadow-2xl md:block"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
