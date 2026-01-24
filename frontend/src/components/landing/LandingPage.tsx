'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CallToAction } from './CallToAction';
import { HowItWorks } from './HowItWorks';
import { FeatureList } from './FeatureList';

interface LandingPageProps {
  phoneNumber?: string;
  showDemoToggle?: boolean;
  isDemoMode?: boolean;
  onDemoToggle?: () => void;
}

export function LandingPage({
  phoneNumber = '+1-800-555-1234',
  showDemoToggle = false,
  isDemoMode = false,
  onDemoToggle,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header
        showDemoToggle={showDemoToggle}
        isDemoMode={isDemoMode}
        onDemoToggle={onDemoToggle}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="py-12 md:py-16 px-4"
        >
          <CallToAction phoneNumber={phoneNumber} />
        </motion.section>

        {/* How It Works Section */}
        <section className="px-4 bg-white">
          <HowItWorks />
        </section>

        {/* Features Section */}
        <section className="px-4 pb-12">
          <FeatureList />
        </section>
      </main>

      <Footer />
    </div>
  );
}
