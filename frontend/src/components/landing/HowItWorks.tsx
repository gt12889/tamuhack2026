'use client';

import { Phone, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HowItWorksProps {
  className?: string;
}

const steps = [
  {
    icon: Phone,
    title: 'Call the number above',
    description: 'Just dial and we will answer immediately',
  },
  {
    icon: MessageCircle,
    title: 'Tell me what you need',
    description: 'Speak naturally - I understand plain English',
  },
  {
    icon: CheckCircle,
    title: 'I will help you make changes',
    description: 'Fast, easy, and confirmed while you wait',
  },
];

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className={cn("w-full max-w-3xl mx-auto py-12", className)}
    >
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px bg-gray-300 w-16" />
          <h3 className="text-xl md:text-2xl font-bold text-aa-dark">How it works</h3>
          <div className="h-px bg-gray-300 w-16" />
        </div>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            className="text-center"
          >
            {/* Step Number with Icon */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-aa-blue/10 flex items-center justify-center">
                <step.icon className="w-8 h-8 text-aa-blue" />
              </div>
              <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-aa-blue text-white text-sm font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </div>

            {/* Step Content */}
            <h4 className="text-lg font-semibold text-aa-dark mb-2">
              {step.title}
            </h4>
            <p className="text-gray-600 text-sm">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
