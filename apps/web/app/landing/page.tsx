import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { InteractiveDemoSection } from '@/components/landing/interactive-demo-section';
import { TrustSection } from '@/components/landing/trust-section';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <InteractiveDemoSection />
      <TrustSection />
    </main>
  );
}