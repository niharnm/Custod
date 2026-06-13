"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ASSETS } from "@/lib/cluely-assets";

export function BottomCtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.9 });
  const [activeKey, setActiveKey] = useState<"command" | "return">("command");

  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => {
      setActiveKey((key) => (key === "command" ? "return" : "command"));
    }, 7000);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <section ref={ref} className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="cluely-heading-gradient text-3xl font-medium tracking-[-0.02em] lg:text-5xl xl:text-[56px]"
        >
          Meeting AI that helps during the call, not after.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base text-cluely-muted md:text-lg"
        >
          Try Cluely on your next meeting today.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            className="cluely-purple-button flex min-w-[180px] items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white"
          >
            <Image src={ASSETS.apple} alt="" width={16} height={16} />
            Get for Mac
          </button>
          <button
            type="button"
            className="flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-[#E5E9F2] bg-white px-5 py-3 text-sm font-medium text-[#19191D] shadow-sm"
          >
            <Image src={ASSETS.windows} alt="" width={16} height={16} />
            Get for Windows
          </button>
        </motion.div>

        <div className="relative mx-auto mt-10 flex h-16 w-40 items-center justify-center">
          <Image
            src={activeKey === "command" ? ASSETS.commandActive : ASSETS.commandBtn}
            alt="Command key"
            width={72}
            height={72}
            className="absolute left-0 transition-opacity duration-500"
          />
          <Image
            src={activeKey === "return" ? ASSETS.returnActive : ASSETS.returnBtn}
            alt="Return key"
            width={72}
            height={72}
            className="absolute right-0 transition-opacity duration-500"
          />
        </div>

        <Link
          href="https://apps.apple.com/app/cluely"
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#3152F4] hover:underline"
        >
          Download on the App Store
        </Link>
      </div>
    </section>
  );
}

export function GradientFade() {
  return <div className="cluely-fade-bottom h-24 w-full md:h-32" />;
}
