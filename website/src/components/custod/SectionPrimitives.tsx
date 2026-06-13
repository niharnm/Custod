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
        "mx-auto h-0.5 w-full max-w-7xl origin-left border-0 bg-accent/50",
        className,
      )}
    />
  );
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <h2 className="font-heading text-3xl text-foreground lg:text-5xl xl:text-[52px] xl:leading-[1.15]">
        {title}
      </h2>
      {subtitle ? (
        <>
          <div
            className={cn(
              "custod-accent-bar mt-4",
              align === "center" && "mx-auto",
            )}
          />
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        </>
      ) : null}
    </motion.div>
  );
}

export function GradientFade() {
  return <div className="custod-fade-bottom h-24 w-full md:h-32" />;
}

export function SectionShell({
  children,
  className,
  muted = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "custod-section scroll-mt-24 py-12 md:py-16 lg:py-24",
        muted && "custod-section-muted",
        className,
      )}
    >
      {children}
    </section>
  );
}
