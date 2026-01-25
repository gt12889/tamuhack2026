'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Phone,
  Mic,
  Users,
  Globe,
  Brain,
  Volume2,
  Shield,
  Clock,
  Plane,
  MessageSquare,
  ChevronRight,
  Github,
  ExternalLink,
} from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Voice-First Interface',
    description: 'Natural conversation using Web Speech API for input and ElevenLabs for lifelike voice responses.',
    color: 'bg-blue-500',
  },
  {
    icon: Brain,
    title: 'Google Gemini AI',
    description: 'Powered by Gemini 1.5 Flash for intelligent intent detection, entity extraction, and context-aware responses.',
    color: 'bg-purple-500',
  },
  {
    icon: Globe,
    title: 'Bilingual Support',
    description: 'Automatic English/Spanish detection with native voice synthesis for each language.',
    color: 'bg-green-500',
  },
  {
    icon: Users,
    title: 'Family Helper Mode',
    description: 'Share a link with family members to view conversations and send suggestions in real-time.',
    color: 'bg-orange-500',
  },
  {
    icon: Phone,
    title: 'Phone & Web Calls',
    description: 'Retell AI integration for both browser-based calls and real phone number support.',
    color: 'bg-red-500',
  },
  {
    icon: Shield,
    title: 'Elderly-Friendly Design',
    description: 'Large fonts (24px+), high contrast, 60px touch targets, and patient, simple language.',
    color: 'bg-teal-500',
  },
];

const techStack = [
  { name: 'Next.js 14', category: 'Frontend' },
  { name: 'React 18', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Framer Motion', category: 'Frontend' },
  { name: 'Django 4.2', category: 'Backend' },
  { name: 'Django REST Framework', category: 'Backend' },
  { name: 'SQLite / PostgreSQL', category: 'Backend' },
  { name: 'Google Gemini API', category: 'AI' },
  { name: 'ElevenLabs TTS', category: 'AI' },
  { name: 'Retell AI', category: 'AI' },
  { name: 'Web Speech API', category: 'Browser' },
];

const demoFlows = [
  {
    title: 'Flight Rebooking',
    steps: ['Say: "I need to change my flight"', 'Provide confirmation code: DEMO123', 'Select new date', 'Confirm change'],
    time: '2 min',
  },
  {
    title: 'Family Helper',
    steps: ['Start a conversation', 'Click "Share with Family"', 'Open link in new tab', 'Send suggestions'],
    time: '1 min',
  },
  {
    title: 'Spanish Support',
    steps: ['Say: "Necesito ayuda con mi vuelo"', 'System detects Spanish', 'Responds in Spanish', 'Use code: ABUELA1'],
    time: '2 min',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-aa-blue text-white py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="bg-white rounded-full p-2">
              <Plane className="w-8 h-8 text-aa-blue" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AA Voice Concierge</h1>
              <p className="text-sm opacity-90">TAMUHack 2026</p>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 bg-white text-aa-blue px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Try Demo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-aa-red/10 text-aa-red px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Plane className="w-4 h-4" />
            American Airlines Track
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Voice Concierge for
            <span className="text-aa-blue"> Elderly Travelers</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A voice-first AI assistant that helps elderly passengers manage their flights
            through natural conversation, reducing calls to AA's reservation hotline.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-aa-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Try Live Demo
            </Link>
            <a
              href="https://github.com/gt12889/tamuhack2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              <Github className="w-5 h-5" />
              View Source
            </a>
          </div>
        </motion.div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-red-50 rounded-2xl p-8 border border-red-100"
            >
              <h2 className="text-2xl font-bold text-red-800 mb-4">The Problem</h2>
              <ul className="space-y-3 text-red-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  Elderly passengers struggle with complex mobile apps
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  Long hold times on phone support (30+ minutes)
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  Confusing automated phone menus
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  Family members can't help remotely
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-green-50 rounded-2xl p-8 border border-green-100"
            >
              <h2 className="text-2xl font-bold text-green-800 mb-4">Our Solution</h2>
              <ul className="space-y-3 text-green-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Natural voice conversation - just talk normally
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Instant AI responses - no wait times
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Large, accessible interface for seniors
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Family Helper mode for remote assistance
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            Key Features
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Flows */}
      <section className="py-16 px-6 bg-aa-blue text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Demo Flows</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {demoFlows.map((flow, index) => (
              <motion.div
                key={flow.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{flow.title}</h3>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{flow.time}</span>
                </div>
                <ol className="space-y-3">
                  {flow.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-3">
                      <span className="bg-white text-aa-blue w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {stepIndex + 1}
                      </span>
                      <span className="opacity-90">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Tech Stack</h2>

          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <motion.span
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  tech.category === 'Frontend'
                    ? 'bg-blue-100 text-blue-800'
                    : tech.category === 'Backend'
                    ? 'bg-green-100 text-green-800'
                    : tech.category === 'AI'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {tech.name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Team & Links */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Built for TAMUHack 2026</h2>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-aa-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Try Live Demo
            </Link>
            <a
              href="https://github.com/gt12889/tamuhack2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              <Github className="w-5 h-5" />
              GitHub Repo
            </a>
          </div>

          <p className="text-gray-600">
            American Airlines Track • Voice-First AI Assistant for Elderly Passengers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-aa-dark text-white py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Plane className="w-6 h-6" />
            <span className="font-bold">AA Voice Concierge</span>
          </div>
          <p className="text-gray-400 text-sm">
            TAMUHack 2026 • American Airlines Track
          </p>
        </div>
      </footer>
    </div>
  );
}
