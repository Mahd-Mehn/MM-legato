import { Metadata } from 'next';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import WriterBenefitsSection from '@/components/WriterBenefitsSection';
import ReaderExperienceSection from '@/components/ReaderExperienceSection';
import IPProtectionShowcase from '@/components/IPProtectionShowcase';
import PricingMonetizationSection from '@/components/PricingMonetizationSection';
import CommunitySection from '@/components/CommunitySection';
import GlobalReachSection from '@/components/GlobalReachSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Legato - Where Stories Become IP',
  description: 'A warm, welcoming platform for storytellers to create, protect, and share their stories with the world',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Writer Benefits Section */}
      <WriterBenefitsSection />

      {/* IP Protection and Licensing Showcase */}
      <IPProtectionShowcase />

      {/* Reader Benefits Section */}
      <ReaderExperienceSection />

      {/* Pricing and Monetization Section */}
      <PricingMonetizationSection />

      {/* Community and Social Proof Section */}
      <CommunitySection />

      {/* Global Reach Section */}
      <GlobalReachSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-primary-500 to-primary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 font-crimson">
            Your Stories Deserve a Beautiful Home
          </h2>
          <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
            Join a community that celebrates storytelling, protects creativity, and rewards imagination.
            Your next chapter starts here.
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-primary-700 px-12 py-6 rounded-2xl font-bold hover:bg-neutral-50 transition-all duration-300 inline-block shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Start Writing Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

