import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { HowItWorks } from '@/components/how-it-works';
import { FeaturesGrid } from '@/components/features-grid';
import { PricingSection } from '@/components/pricing-section';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturesGrid />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
