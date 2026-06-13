"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/cluely-content";
import { SectionHeading } from "@/components/cluely/SectionPrimitives";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading
        title="Frequently asked questions"
        className="mb-10 lg:mb-14"
      />

      <div className="mx-auto max-w-3xl divide-y divide-[#E5E9F2]">
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
                <span className="font-inter text-lg font-medium text-[#19191D] lg:text-2xl">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 size-5 shrink-0 text-cluely-muted transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200 ease-out",
                  open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="pr-8 text-sm leading-relaxed text-cluely-muted md:text-base">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
