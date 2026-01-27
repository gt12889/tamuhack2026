'use client';

import { motion } from 'framer-motion';
import { Users, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CallToAction } from './CallToAction';
import { HowItWorks } from './HowItWorks';
import { FeatureList } from './FeatureList';
import { FamilyHelp } from './FamilyHelp';
import { MockCallTranscript } from './MockCallTranscript';
import { DomeGallery } from '@/components/ui/dome-gallery';

interface LandingPageProps {
  phoneNumber?: string;
  showDemoToggle?: boolean;
  isDemoMode?: boolean;
  onDemoToggle?: () => void;
}

export function LandingPage({
  phoneNumber = '+1 (877) 211-0332',
  showDemoToggle = false,
  isDemoMode = false,
  onDemoToggle,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        showDemoToggle={showDemoToggle}
        isDemoMode={isDemoMode}
        onDemoToggle={onDemoToggle}
      />

      <main className="flex-1">
        {/* Hero Section - Full viewport height */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 py-8 relative"
        >
          <CallToAction phoneNumber={phoneNumber} />

          {/* Helper Link Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <Link
              href="/help/demo-meemaw"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm"
            >
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <span>Need a helper link?</span>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-gray-400"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Live Call Demo Section */}
        <section className="px-4 py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                See MeeMaw in Action
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Watch how our voice assistant helps Margaret book a flight with patience and clarity.
                No confusing menus, just natural conversation.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MockCallTranscript className="max-w-2xl mx-auto" />
            </motion.div>
          </div>
        </section>

        <DomeGallery />

        {/* How It Works Section */}
        <section className="px-4 bg-white">
          <HowItWorks />
        </section>

        {/* Features Section */}
        <section className="px-4 bg-gray-50">
          <FeatureList />
        </section>

        {/* Family Help Section */}
        <section className="px-4 pb-12 bg-white">
          <FamilyHelp />
        </section>
      </main>

      <Footer />
    </div>
  );
}
