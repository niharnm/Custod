"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SectionDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLHRElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.hr
      ref={ref}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ type: "spring", stiffness: 490, damping: 130 }}
      className={cn(
        "mx-auto h-px w-full max-w-7xl origin-left border-0 bg-[#E5E9F2]",
        className,
      )}
    />
  );
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={cn("mx-auto max-w-3xl text-center", className)}
    >
      <h2 className="cluely-heading-gradient font-sans text-3xl font-medium tracking-[-0.02em] lg:text-5xl xl:text-[56px] xl:leading-[1.1]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base text-cluely-muted md:text-lg">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}
