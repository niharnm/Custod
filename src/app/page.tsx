import { BottomCtaSection, GradientFade } from "@/components/cluely/BottomCtaSection";
import { FaqSection } from "@/components/cluely/FaqSection";
import { Footer } from "@/components/cluely/Footer";
import { Header } from "@/components/cluely/Header";
import { HeroSection } from "@/components/cluely/HeroSection";
import { HowItWorksSection } from "@/components/cluely/HowItWorksSection";
import { MeetingNotesSection } from "@/components/cluely/MeetingNotesSection";
import { SectionDivider } from "@/components/cluely/SectionPrimitives";
import { TranscriptionSection } from "@/components/cluely/TranscriptionSection";
import { UndetectabilitySection } from "@/components/cluely/UndetectabilitySection";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col gap-12 md:gap-24 lg:gap-32">
        <HeroSection />
        <SectionDivider />
        <HowItWorksSection />
        <SectionDivider />
        <MeetingNotesSection />
        <SectionDivider />
        <UndetectabilitySection />
        <SectionDivider />
        <TranscriptionSection />
        <SectionDivider />
        <FaqSection />
        <BottomCtaSection />
        <GradientFade />
      </main>
      <Footer />
    </>
  );
}
