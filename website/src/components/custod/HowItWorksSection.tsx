"use client";

import { SyncDiagram } from "@/components/custod/SyncDiagram";
import { SectionHeading, SectionShell } from "@/components/custod/SectionPrimitives";
import { HOW_IT_WORKS } from "@/lib/custod-content";

export function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works">
      <SectionHeading
        title={HOW_IT_WORKS.title}
        subtitle={HOW_IT_WORKS.subtitle}
        className="mb-12 lg:mb-16"
      />

      <SyncDiagram />

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3 md:gap-6">
        {HOW_IT_WORKS.steps.map((step, index) => (
          <div key={step.label} className="custod-card p-5 text-center">
            <span className="font-heading text-3xl text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-primary">
              {step.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
