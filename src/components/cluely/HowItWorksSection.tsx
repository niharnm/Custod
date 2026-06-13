"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/cluely/SectionPrimitives";

function WaveformBars() {
  const [heights, setHeights] = useState<number[]>(Array.from({ length: 24 }, () => 8));

  useEffect(() => {
    let frame = 0;
    let raf = 0;

    const tick = () => {
      frame += 1;
      if (frame % 4 === 0) {
        setHeights(Array.from({ length: 24 }, () => 6 + Math.random() * 28));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex h-10 items-end gap-1">
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-[#4984FD]"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function AssistMock() {
  return (
    <div className="rounded-3xl border border-[#E5E9F2] bg-[#F9FAFB] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-xs text-cluely-muted">
        <span>Hide</span>
        <span className="rounded-md bg-[#4984FD1A] px-2 py-1 text-[#3152F4]">
          Assist
        </span>
      </div>
      <p className="text-sm font-medium">Viewed screen</p>
      <p className="mt-3 rounded-2xl bg-white p-4 text-sm leading-relaxed text-[#36393F] shadow-sm">
        Cluely is an AI meeting assistant that listens in real time, understands
        what&apos;s being said, and gives you instant answers, notes, and next
        steps, all while staying completely undetectable on your screen.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {["Assist", "What should I say?", "Follow-up questions", "Recap", "Smart"].map(
          (item) => (
            <span
              key={item}
              className="rounded-full border border-[#E5E9F2] bg-white px-3 py-1 text-cluely-muted"
            >
              {item}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function ListenMock() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-3xl border border-[#E5E9F2] bg-[#F9FAFB] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-[#2CB463]">Recording</span>
        <span className="font-mono text-sm text-[#36393F]">
          {mins}:{secs}
        </span>
      </div>
      <WaveformBars />
      <p className="mt-4 text-sm leading-relaxed text-[#36393F]">
        It picks up the context of your meeting in real time, so it can help when
        you need it.
      </p>
    </div>
  );
}

function FeatureCard({
  eyebrow,
  title,
  children,
  delay = 0,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-6"
    >
      <div>
        <p className="mb-3 text-sm font-medium text-cluely-muted">{eyebrow}</p>
        <h3 className="cluely-heading-gradient text-2xl font-medium tracking-[-0.02em] md:text-3xl">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading title="How Cluely helps during a meeting" className="mb-12 lg:mb-16" />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:gap-16">
        <FeatureCard
          eyebrow="Cluely listens in to the conversation"
          title={
            <>
              Cluely <span className="text-[#3152F4]">listens</span> in to the
              conversation
            </>
          }
        >
          <ListenMock />
        </FeatureCard>
        <FeatureCard
          eyebrow="When you need help, Cluely assists you instantly"
          title={
            <>
              When you need help, Cluely{" "}
              <span className="text-[#3152F4]">assists</span> you instantly
            </>
          }
          delay={0.1}
        >
          <p className="text-sm text-cluely-muted">
            Hit Cmd/Ctrl + Enter and Cluely helps you with AI in the moment.
          </p>
          <AssistMock />
        </FeatureCard>
      </div>
    </section>
  );
}
