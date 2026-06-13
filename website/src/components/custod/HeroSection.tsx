"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusDot, StatusLamp } from "@/components/custod/StatusLamp";
import { BRAND } from "@/lib/custod-content";
import type { StatusLevel } from "@/types/custod";

const DEVICE_BADGES = [
  { label: "Browser badge", position: "top-6 left-[5%] md:top-8 md:left-[8%]" },
  { label: "Menu bar", position: "top-8 right-[5%] md:top-12 md:right-[10%]" },
  { label: "iOS widget", position: "bottom-14 left-[5%] md:bottom-16 md:left-[12%]" },
  { label: "Desk LED", position: "bottom-10 right-[5%] md:bottom-12 md:right-[8%]" },
] as const;

export function HeroSection() {
  const [syncStatus, setSyncStatus] = useState<StatusLevel>("green");

  useEffect(() => {
    const cycle: StatusLevel[] = ["green", "yellow", "red"];
    let index = 0;
    const id = window.setInterval(() => {
      index = (index + 1) % cycle.length;
      setSyncStatus(cycle[index] ?? "green");
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="custod-hero-gradient relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      {/* Slidesgo-style organic blobs */}
      <div
        aria-hidden
        className="custod-hero-blob pointer-events-none absolute -right-16 top-10 size-64 bg-custod-rose/40 md:size-80"
      />
      <div
        aria-hidden
        className="custod-hero-blob pointer-events-none absolute -left-20 bottom-20 size-56 bg-custod-amber/30 md:size-72"
      />
      <div
        aria-hidden
        className="custod-hero-blob pointer-events-none absolute left-1/3 top-1/2 size-40 bg-custod-taupe/25"
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 inline-block rounded-full bg-accent/40 px-4 py-1.5 text-sm font-medium tracking-wide text-foreground"
          >
            {BRAND.tagline}
          </motion.p>

          <h1 className="font-heading text-[42px] leading-[1.08] text-foreground sm:text-[54px] lg:text-[64px]">
            {BRAND.heroHeadline.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: "1.25em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 900,
                  damping: 70,
                  delay: index * 0.06,
                }}
                className="mr-[0.18em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <div className="mx-auto mt-5 flex justify-center">
            <span className="custod-accent-bar" />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {BRAND.heroSubhead}
          </motion.p>

          <motion.div
            id="download-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="mailto:hello@custod.app?subject=Custod%20Waitlist"
              className="custod-primary-button min-w-[200px] rounded-full px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Join waitlist
            </Link>
            <Link
              href="#how-it-works"
              className="custod-secondary-button min-w-[200px] rounded-full px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
            >
              See how it works
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
            delay: 1.2,
          }}
          className="relative mx-auto mt-14 max-w-2xl"
        >
          <div className="custod-glass relative overflow-hidden rounded-[32px] p-8 md:p-14">
            {DEVICE_BADGES.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className={`absolute ${badge.position} z-10 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm`}
              >
                <StatusDot status={syncStatus} />
                {badge.label}
              </motion.div>
            ))}

            <div className="relative flex flex-col items-center gap-5 py-4">
              <StatusLamp status={syncStatus} size="lg" showLabel />
              <p className="text-center text-sm text-muted-foreground">
                One score. Every device. Updated every five minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5">
                  <StatusDot status="green" /> 0–40
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5">
                  <StatusDot status="yellow" /> 41–70
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5">
                  <StatusDot status="red" /> 71–100
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mx-auto mt-8 max-w-xl text-center font-heading text-sm italic leading-relaxed text-muted-foreground"
        >
          {BRAND.etymology}
        </motion.p>
      </div>
    </section>
  );
}
