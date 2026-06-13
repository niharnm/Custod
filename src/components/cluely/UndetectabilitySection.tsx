"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { ASSETS } from "@/lib/cluely-assets";
import {
  PARTICIPANTS,
  PLATFORM_LOGOS,
  UNDETECTABILITY_CARDS,
} from "@/lib/cluely-content";
import { SectionHeading } from "@/components/cluely/SectionPrimitives";
import { cn } from "@/lib/utils";

function ParticipantsCard() {
  return (
    <div className="cluely-card-gradient flex h-full min-h-[420px] flex-col overflow-hidden rounded-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#19191D]">
          Meeting participants <span className="text-cluely-muted">(4)</span>
        </h3>
        <span className="rounded-full bg-[#2CB4631A] px-3 py-1 text-xs font-medium text-[#2CB463]">
          No bots detected
        </span>
      </div>
      <div className="space-y-3">
        {PARTICIPANTS.map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-3 rounded-2xl bg-white/60 p-3"
          >
            <Image
              src={person.avatar}
              alt={person.name}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {person.name}
                {person.isYou ? " (You)" : ""}
              </p>
              <p className="truncate text-xs text-cluely-muted">{person.email}</p>
            </div>
            <span className="text-xs text-cluely-muted">{person.role}</span>
          </div>
        ))}
      </div>
      <div className="relative mt-auto pt-6">
        <Image
          src={ASSETS.invisibleTool}
          alt=""
          width={280}
          height={120}
          className="mx-auto w-[70%] max-w-[240px]"
        />
      </div>
    </div>
  );
}

function CompareCard() {
  const [position, setPosition] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="cluely-card-gradient relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-4xl p-6"
    >
      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs font-medium">
        <span className="rounded-full bg-white/70 px-3 py-1">Invisible to others</span>
        <span className="rounded-full bg-[#3152F4] px-3 py-1 text-white">
          Visible to you
        </span>
      </div>
      <div
        className="relative flex-1 overflow-hidden rounded-3xl bg-white/50"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const next = ((e.clientX - rect.left) / rect.width) * 100;
          setPosition(Math.min(92, Math.max(8, next)));
        }}
      >
        <motion.div
          initial={{ clipPath: "inset(0 50% 0 0)" }}
          animate={inView ? { clipPath: `inset(0 ${100 - position}% 0 0)` } : undefined}
          className="absolute inset-0"
        >
          <Image
            src={ASSETS.messaging}
            alt="Visible to you"
            fill
            className="object-cover object-left"
          />
        </motion.div>
        <Image
          src={ASSETS.videoConference}
          alt="Invisible to others"
          fill
          className="object-cover"
        />
        <div
          className="absolute inset-y-0 z-10 w-1 bg-white shadow-lg"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="mt-4 rounded-2xl bg-[#21232a] p-4 text-sm text-white">
        <p className="mb-1 text-xs text-white/60">AI Response</p>
        <p>
          Add a check for missing userId before calling the API. Also handle
          data.name safely to avoid undefined.
        </p>
      </div>
    </div>
  );
}

function WindowGridCard() {
  const windows = [
    ASSETS.fileBrowser,
    ASSETS.messaging,
    ASSETS.videoPlayer,
    ASSETS.videoConference,
  ];
  const [active, setActive] = useState(0);

  return (
    <div className="cluely-card-gradient flex h-full min-h-[420px] flex-col overflow-hidden rounded-4xl p-6">
      <div className="grid flex-1 grid-cols-2 gap-3">
        {windows.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-white/40 transition",
              active === index ? "border-[#3152F4]" : "border-transparent",
            )}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="200px" />
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cluely-muted">
        <span className="rounded bg-[#21232a] px-2 py-1 font-mono text-white">
          command
        </span>
        <span>↑↑↑↑</span>
      </div>
    </div>
  );
}

const CARD_COMPONENTS = [ParticipantsCard, CompareCard, WindowGridCard];

export function UndetectabilitySection() {
  return (
    <section
      id="undetectability"
      className="scroll-mt-24 px-5 py-12 md:px-8 md:py-16 lg:py-24"
    >
      <SectionHeading
        title="Undetectable in every way"
        subtitle="Suite of features to use Cluely without a trace."
        className="mb-12 lg:mb-16"
      />

      <div className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:pb-0">
        {UNDETECTABILITY_CARDS.map((card, index) => {
          const Card = CARD_COMPONENTS[index];
          return (
            <div
              key={card.title}
              className="min-w-[85vw] shrink-0 snap-center md:min-w-0"
            >
              <Card />
              <div className="mt-4 px-2">
                <h3 className="text-lg font-medium text-[#19191D]">{card.title}</h3>
                <p className="mt-2 text-sm text-cluely-muted">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-7xl text-center">
        <p className="mb-6 text-sm font-medium text-cluely-muted">
          Compatible with every tool
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {PLATFORM_LOGOS.map((platform) => (
            <div key={platform.name} className="flex items-center gap-2">
              <Image
                src={platform.src}
                alt={platform.name}
                width={32}
                height={32}
                className="size-8 rounded-lg"
              />
              <span className="text-sm text-[#36393F]">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
