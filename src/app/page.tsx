import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Comparison } from '@/components/landing/comparison';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Faq } from '@/components/landing/faq';
import { CtaBanner } from '@/components/landing/cta-banner';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-brand-sand selection:text-brand-crimson">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Comparison />
        <Features />
        <HowItWorks />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
