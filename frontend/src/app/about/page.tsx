'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  Mail,
  Zap,
  Check,
  ArrowRight,
  Sparkles,
  Heart,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Voice-First Interface',
    description: 'Natural conversation using Web Speech API for input and ElevenLabs for lifelike voice responses.',
    color: 'from-blue-500 to-blue-600',
    highlight: 'Web Speech + ElevenLabs',
  },
  {
    icon: Brain,
    title: 'Google Gemini AI',
    description: 'Powered by Gemini 2.0 Flash for intelligent intent detection, entity extraction, and context-aware responses.',
    color: 'from-purple-500 to-purple-600',
    highlight: 'Gemini 2.0 Flash',
  },
  {
    icon: Globe,
    title: 'Bilingual Support',
    description: 'Automatic English/Spanish detection with native voice synthesis for each language.',
    color: 'from-green-500 to-green-600',
    highlight: 'English + Spanish',
  },
  {
    icon: Users,
    title: 'Family Helper Mode',
    description: 'Share a secure link with family to view conversations and send real-time suggestions.',
    color: 'from-orange-500 to-orange-600',
    highlight: 'Remote Assistance',
  },
  {
    icon: Mail,
    title: 'Email Confirmations',
    description: 'Instant email confirmations via Resend API with beautiful bilingual HTML templates.',
    color: 'from-pink-500 to-pink-600',
    highlight: 'Resend Integration',
  },
  {
    icon: Shield,
    title: 'Elderly-Friendly Design',
    description: 'Large fonts (24px+), high contrast, 60px touch targets, and patient, simple language.',
    color: 'from-teal-500 to-teal-600',
    highlight: 'Accessibility First',
  },
];

const techStack = [
  { name: 'Next.js 14', category: 'Frontend', icon: '⚡' },
  { name: 'React 18', category: 'Frontend', icon: '⚛️' },
  { name: 'TypeScript', category: 'Frontend', icon: '📘' },
  { name: 'Tailwind CSS', category: 'Frontend', icon: '🎨' },
  { name: 'Framer Motion', category: 'Frontend', icon: '✨' },
  { name: 'Django 4.2', category: 'Backend', icon: '🐍' },
  { name: 'Django REST', category: 'Backend', icon: '🔌' },
  { name: 'PostgreSQL', category: 'Backend', icon: '🐘' },
  { name: 'Gemini 2.0', category: 'AI', icon: '🧠' },
  { name: 'ElevenLabs', category: 'AI', icon: '🔊' },
  { name: 'Retell AI', category: 'AI', icon: '📞' },
  { name: 'Resend', category: 'API', icon: '📧' },
];

const demoFlows = [
  {
    title: 'Flight Rebooking',
    description: 'Change your flight with just your voice',
    steps: ['Say: "I need to change my flight"', 'Provide confirmation code', 'Select new date/time', 'Receive email confirmation'],
    icon: Plane,
    color: 'from-aa-blue to-blue-700',
  },
  {
    title: 'Family Helper',
    description: 'Let family assist remotely',
    steps: ['Start a conversation', 'Click "Share with Family"', 'Family opens secure link', 'Send real-time suggestions'],
    icon: Users,
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Spanish Support',
    description: 'Full bilingual experience',
    steps: ['Say: "Necesito ayuda"', 'Auto-detects Spanish', 'Responds in Spanish', 'Email in Spanish too'],
    icon: Globe,
    color: 'from-green-500 to-green-600',
  },
];

const stats = [
  { value: '6+', label: 'AI Features', icon: Sparkles },
  { value: '2', label: 'Languages', icon: Globe },
  { value: '12+', label: 'Tech Integrations', icon: Zap },
  { value: '24/7', label: 'Available', icon: Clock },
];

export default function AboutPage() {
  const [activeFlow, setActiveFlow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFlow((prev) => (prev + 1) % demoFlows.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="bg-aa-blue text-white py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="bg-white rounded-full p-2">
              <Plane className="w-8 h-8 text-aa-blue" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AA Voice Concierge</h1>
              <p className="text-sm opacity-90">TAMUHack 2026</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-white text-aa-blue px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <Mic className="w-5 h-5" />
              <span className="hidden md:inline">Try Demo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-aa-blue/5 via-white to-aa-red/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-aa-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-aa-red to-red-600 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-8 shadow-lg"
          >
            <Plane className="w-4 h-4" />
            American Airlines Track
            <Star className="w-4 h-4 fill-current" />
          </motion.div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Voice Concierge for
            <span className="block bg-gradient-to-r from-aa-blue to-blue-600 bg-clip-text text-transparent pb-2">
              Elderly Travelers
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            A voice-first AI assistant that helps elderly passengers manage their flights
            through <span className="text-aa-blue font-semibold">natural conversation</span>,
            reducing calls to AA's reservation hotline.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-aa-blue to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-lg"
            >
              <Mic className="w-6 h-6" />
              Try Live Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/gt12889/tamuhack2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 hover:shadow-xl transition-all"
            >
              <Github className="w-6 h-6" />
              View Source
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
              >
                <stat.icon className="w-6 h-6 text-aa-blue mx-auto mb-2" />
                <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-16"
          >
            Why We Built This
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl p-8 border border-red-200 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-500 p-3 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-800">The Problem</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Elderly passengers struggle with complex mobile apps',
                  'Long hold times on phone support (30+ minutes)',
                  'Confusing automated phone menus frustrate users',
                  'Family members cannot help remotely',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-red-700">
                    <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 border border-green-200 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-500 p-3 rounded-xl">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-800">Our Solution</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Natural voice conversation - just talk normally',
                  'Instant AI responses - zero wait times',
                  'Large, accessible interface designed for seniors',
                  'Family Helper mode for real-time remote assistance',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-green-700">
                    <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge AI technologies to deliver the best experience for elderly travelers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {feature.highlight}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Flows - Interactive */}
      <section className="py-20 px-6 bg-gradient-to-br from-aa-blue via-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Try These Demo Flows</h2>
            <p className="text-xl opacity-90">See how easy it is to manage your flights with voice</p>
          </motion.div>

          {/* Flow Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {demoFlows.map((flow, index) => (
              <button
                key={flow.title}
                onClick={() => setActiveFlow(index)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeFlow === index
                    ? 'bg-white text-aa-blue shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <flow.icon className="w-5 h-5" />
                {flow.title}
              </button>
            ))}
          </div>

          {/* Active Flow Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFlow}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 border border-white/20 max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className={`bg-gradient-to-br ${demoFlows[activeFlow].color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  {(() => {
                    const Icon = demoFlows[activeFlow].icon;
                    return <Icon className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold mb-2">{demoFlows[activeFlow].title}</h3>
                <p className="text-lg opacity-90">{demoFlows[activeFlow].description}</p>
              </div>

              <div className="grid gap-4">
                {demoFlows[activeFlow].steps.map((step, stepIndex) => (
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: stepIndex * 0.15 }}
                    className="flex items-center gap-4 bg-white/10 rounded-xl p-4"
                  >
                    <span className="bg-white text-aa-blue w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                      {stepIndex + 1}
                    </span>
                    <span className="text-lg">{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built With</h2>
            <p className="text-xl text-gray-600">Modern tech stack for reliability and performance</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                  tech.category === 'Frontend'
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                    : tech.category === 'Backend'
                    ? 'bg-green-50 border-green-200 hover:border-green-400'
                    : tech.category === 'AI'
                    ? 'bg-purple-50 border-purple-200 hover:border-purple-400'
                    : 'bg-pink-50 border-pink-200 hover:border-pink-400'
                }`}
              >
                <span className="text-2xl">{tech.icon}</span>
                <div>
                  <div className="font-bold text-gray-900">{tech.name}</div>
                  <div className={`text-xs font-medium ${
                    tech.category === 'Frontend' ? 'text-blue-600'
                    : tech.category === 'Backend' ? 'text-green-600'
                    : tech.category === 'AI' ? 'text-purple-600'
                    : 'text-pink-600'
                  }`}>{tech.category}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-aa-red text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Heart className="w-4 h-4" />
              Built with care for TAMUHack 2026
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Experience It?
            </h2>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Try the live demo now and see how voice AI can transform the travel experience for elderly passengers.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-aa-blue to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all shadow-lg"
              >
                <Mic className="w-7 h-7" />
                Launch Demo
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/gt12889/tamuhack2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all"
              >
                <Github className="w-7 h-7" />
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-aa-dark text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-aa-blue p-2 rounded-full">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg">AA Voice Concierge</span>
                <p className="text-sm text-gray-400">TAMUHack 2026 - American Airlines Track</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/gt12889/tamuhack2026"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            Built with love for elderly travelers everywhere
          </div>
        </div>
      </footer>
    </div>
  );
}
