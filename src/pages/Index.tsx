import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ProofCardsShowcase } from "@/components/ProofCardsShowcase";
import { AudienceSection } from "@/components/AudienceSection";
import { PrivacySection } from "@/components/PrivacySection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProofCardsShowcase />
      <AudienceSection />
      <PrivacySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
