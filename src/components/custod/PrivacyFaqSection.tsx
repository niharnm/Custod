"use client";

import { ChevronDown, Shield } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/custod/SectionPrimitives";
import { FAQ_ITEMS, PRIVACY_PRINCIPLES } from "@/lib/custod-content";
import { cn } from "@/lib/utils";

export function PrivacyFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="privacy" className="scroll-mt-24 px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading
        title="Privacy by design"
        subtitle="Custod minimizes data exposure at every layer. It watches patterns — not your private content."
        className="mb-10 lg:mb-14"
      />

      <div className="mx-auto mb-16 grid max-w-6xl gap-4 md:grid-cols-2">
        {PRIVACY_PRINCIPLES.map((principle) => (
          <div
            key={principle.title}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <Shield className="size-4 text-custod-primary" />
              <h3 className="font-semibold text-[#0f172a]">{principle.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-custod-muted">
              {principle.description}
            </p>
          </div>
        ))}
      </div>

      <div id="faq" className="scroll-mt-24">
        <SectionHeading
          title="Frequently asked questions"
          className="mb-10 lg:mb-14"
        />

        <div className="mx-auto max-w-3xl divide-y divide-[#E2E8F0]">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.question} className="py-1">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  <span className="font-inter text-lg font-medium text-[#0f172a] lg:text-xl">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-5 shrink-0 text-custod-muted transition-transform duration-200",
                      open && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-out",
                    open
                      ? "grid-rows-[1fr] pb-5 opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pr-8 text-sm leading-relaxed text-custod-muted md:text-base">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
