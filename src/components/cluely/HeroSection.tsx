"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ASSETS, HERO_VIDEO } from "@/lib/cluely-assets";
import { DOCK_ICONS } from "@/lib/cluely-content";

const heroWords = ["#1", "Undetectable", "AI", "for", "Meetings"];

export function HeroSection() {
  return (
    <section className="cluely-hero-gradient relative overflow-hidden px-5 pb-16 pt-20 text-white md:px-8 lg:pb-24 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-[56px] leading-[1.05] tracking-[-0.01em] lg:text-[80px]">
            {heroWords.map((word, index) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: "1.25em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 900,
                  damping: 70,
                  delay: index * 0.08,
                }}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-base text-white/85 md:text-lg"
          >
            Cluely takes perfect meeting notes and gives real-time answers, all
            while completely undetectable
          </motion.p>

          <motion.div
            id="download-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="https://apps.apple.com/app/cluely"
              className="group flex min-w-[200px] items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm backdrop-blur-sm transition hover:scale-[1.02]"
            >
              <span className="text-left text-xs leading-tight">
                Download on the
                <br />
                <span className="font-semibold">App Store</span>
              </span>
            </Link>
            <button
              type="button"
              className="cluely-purple-button min-w-[200px] rounded-lg px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03] active:scale-[0.97]"
            >
              Get the desktop app
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 200, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
            delay: 1.5,
          }}
          className="relative mx-auto mt-12 max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-black/20 shadow-2xl">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={ASSETS.wallpaper}
                alt=""
                fill
                className="object-cover"
                priority
              />
              <video
                className="absolute inset-0 size-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={ASSETS.wallpaper}
              >
                <source src={HERO_VIDEO} type="video/mp4" />
              </video>

              <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
                <div className="flex items-end gap-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-md">
                  {DOCK_ICONS.map((icon, index) => (
                    <motion.div
                      key={icon.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.7 + index * 0.1 }}
                    >
                      <Image
                        src={icon.src}
                        alt={icon.name}
                        width={44}
                        height={44}
                        className="size-11 rounded-xl"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/3 w-[min(92%,420px)] -translate-x-1/2 rounded-2xl border border-white/20 bg-[#21232a]/90 p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between text-xs text-white/60">
                  <span>Hide</span>
                  <span className="rounded bg-white/10 px-2 py-0.5">Assist</span>
                </div>
                <p className="mb-3 text-sm font-medium text-white">
                  What should I say?
                </p>
                <p className="rounded-xl bg-white/5 p-3 text-sm leading-relaxed text-white/90">
                  &ldquo;A discounted cash flow model values a company by
                  projecting future free cash flows and discounting them to
                  present value using the weighted average cost of capital.&rdquo;
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                  <span className="rounded-full bg-white/10 px-2 py-1">
                    Follow-up questions
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1">Recap</span>
                  <span className="rounded-full bg-white/10 px-2 py-1">Smart</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
