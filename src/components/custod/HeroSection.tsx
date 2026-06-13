"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusDot, StatusLamp } from "@/components/custod/StatusLamp";
import { BRAND } from "@/lib/custod-content";
import type { StatusLevel } from "@/types/custod";

const DEVICE_BADGES = [
  { label: "Browser badge", position: "top-8 left-[8%]" },
  { label: "Menu bar", position: "top-12 right-[10%]" },
  { label: "iOS widget", position: "bottom-16 left-[12%]" },
  { label: "Desk LED", position: "bottom-12 right-[8%]" },
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
    <section className="custod-hero-gradient relative overflow-hidden px-5 pb-16 pt-20 text-white md:px-8 lg:pb-24 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-teal-300/90"
          >
            {BRAND.tagline}
          </motion.p>

          <h1 className="font-heading text-[44px] leading-[1.05] tracking-[-0.01em] sm:text-[56px] lg:text-[72px]">
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
                className="mr-[0.2em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-base text-white/80 md:text-lg"
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
              className="custod-primary-button min-w-[200px] rounded-lg px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Join waitlist
            </Link>
            <Link
              href="#how-it-works"
              className="min-w-[200px] rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
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
          <div className="relative rounded-[28px] border border-white/15 bg-white/5 p-10 backdrop-blur-sm md:p-14">
            {DEVICE_BADGES.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className={`absolute ${badge.position} flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs backdrop-blur-md`}
              >
                <StatusDot status={syncStatus} />
                {badge.label}
              </motion.div>
            ))}

            <div className="flex flex-col items-center gap-4">
              <StatusLamp status={syncStatus} size="lg" showLabel />
              <p className="text-center text-sm text-white/70">
                One score. Every device. Updated every five minutes.
              </p>
              <div className="flex gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <StatusDot status="green" /> 0–40
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusDot status="yellow" /> 41–70
                </span>
                <span className="flex items-center gap-1.5">
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
          className="mx-auto mt-8 max-w-xl text-center text-sm italic text-white/50"
        >
          {BRAND.etymology}
        </motion.p>
      </div>
    </section>
  );
}
