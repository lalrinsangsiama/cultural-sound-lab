import { Navigation } from '@/components/landing/navigation';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { InteractiveDemoSection } from '@/components/landing/interactive-demo-section';
import { TrustSection } from '@/components/landing/trust-section';
import { Footer } from '@/components/landing/footer';
import { ScrollToTop } from '@/components/landing/scroll-to-top';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <InteractiveDemoSection />
      <TrustSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}