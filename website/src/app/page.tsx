import { AudienceCtaSection } from "@/components/custod/AudienceCtaSection";
import { Footer } from "@/components/custod/Footer";
import { FourComponentsSection } from "@/components/custod/FourComponentsSection";
import { Header } from "@/components/custod/Header";
import { HeroSection } from "@/components/custod/HeroSection";
import { HowItWorksSection } from "@/components/custod/HowItWorksSection";
import { PrivacyFaqSection } from "@/components/custod/PrivacyFaqSection";
import { ProblemSection } from "@/components/custod/ProblemSection";
import {
  GradientFade,
  SectionDivider,
} from "@/components/custod/SectionPrimitives";
import { SignalsSection } from "@/components/custod/SignalsSection";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col gap-12 md:gap-24 lg:gap-32">
        <HeroSection />
        <SectionDivider />
        <HowItWorksSection />
        <SectionDivider />
        <ProblemSection />
        <SectionDivider />
        <FourComponentsSection />
        <SectionDivider />
        <SignalsSection />
        <SectionDivider />
        <PrivacyFaqSection />
        <AudienceCtaSection />
        <GradientFade />
      </main>
      <Footer />
    </>
  );
}
