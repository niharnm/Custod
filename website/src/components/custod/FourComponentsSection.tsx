import { ComponentCard } from "@/components/custod/ComponentCard";
import { SectionHeading, SectionShell } from "@/components/custod/SectionPrimitives";
import { COMPONENTS } from "@/lib/custod-content";

export function FourComponentsSection() {
  return (
    <SectionShell id="components">
      <SectionHeading
        title="The four components"
        subtitle="Browser, computer, phone, and desk — each measuring different invisible stress signals."
        className="mb-12 lg:mb-16"
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:gap-8">
        {COMPONENTS.map((spec, index) => (
          <ComponentCard key={spec.id} spec={spec} index={index} />
        ))}
      </div>
    </SectionShell>
  );
}
