import { ComponentCard } from "@/components/custod/ComponentCard";
import { SectionHeading } from "@/components/custod/SectionPrimitives";
import { COMPONENTS } from "@/lib/custod-content";

export function FourComponentsSection() {
  return (
    <section
      id="components"
      className="scroll-mt-24 px-5 py-12 md:px-8 md:py-16 lg:py-24"
    >
      <SectionHeading
        title="The four components"
        subtitle="Browser, computer, phone, and desk — each measuring different invisible stress signals."
        className="mb-12 lg:mb-16"
      />

      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:gap-8">
        {COMPONENTS.map((spec, index) => (
          <ComponentCard key={spec.id} spec={spec} index={index} />
        ))}
      </div>
    </section>
  );
}
