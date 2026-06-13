"use client";

import { SyncDiagram } from "@/components/custod/SyncDiagram";
import { SectionHeading } from "@/components/custod/SectionPrimitives";
import { HOW_IT_WORKS } from "@/lib/custod-content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-5 py-12 md:px-8 md:py-16 lg:py-24">
      <SectionHeading
        title={HOW_IT_WORKS.title}
        subtitle={HOW_IT_WORKS.subtitle}
        className="mb-12 lg:mb-16"
      />

      <SyncDiagram />

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.steps.map((step) => (
          <div
            key={step.label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 text-center shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-custod-primary">
              {step.label}
            </p>
            <p className="mt-2 text-sm text-custod-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
