"use client";

import { ChevronDown, Shield } from "lucide-react";
import { useState } from "react";
import { SectionHeading, SectionShell } from "@/components/custod/SectionPrimitives";
import { FAQ_ITEMS, PRIVACY_PRINCIPLES } from "@/lib/custod-content";
import { cn } from "@/lib/utils";

export function PrivacyFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionShell id="privacy">
      <SectionHeading
        title="Privacy by design"
        subtitle="Custod minimizes data exposure at every layer. It watches patterns — not your private content."
        className="mb-10 lg:mb-14"
      />

      <div className="mx-auto mb-16 grid max-w-6xl gap-4 md:grid-cols-2">
        {PRIVACY_PRINCIPLES.map((principle) => (
          <div key={principle.title} className="custod-card p-5">
              <div className="mb-2 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-accent/40">
                <Shield className="size-4 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">{principle.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
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

        <div className="custod-card mx-auto max-w-3xl divide-y divide-border px-2 md:px-6">
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
                  <span className="font-inter text-lg font-medium text-foreground lg:text-xl">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180 text-primary",
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
                    <p className="pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
