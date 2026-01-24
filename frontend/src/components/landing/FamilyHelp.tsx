'use client';

import { Users, Share2, MessageCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface FamilyHelpProps {
  className?: string;
}

const steps = [
  {
    icon: MessageCircle,
    title: 'Call and ask for help',
    description: 'Say "I need help from my family" during your call',
  },
  {
    icon: Share2,
    title: 'Get a shareable link',
    description: 'We will text you a link to share with family',
  },
  {
    icon: Users,
    title: 'Family joins remotely',
    description: 'They can see your conversation and send suggestions',
  },
  {
    icon: Shield,
    title: 'You stay in control',
    description: 'Only you can confirm any changes to your booking',
  },
];

export function FamilyHelp({ className }: FamilyHelpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.4 }}
      className={cn("w-full max-w-3xl mx-auto py-8", className)}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 shadow-lg rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Family Helper</h3>
              <p className="text-sm opacity-90">Let family members assist you remotely</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Need help navigating your options? Ask our AI assistant to create a helper link.
            Your family can join from their phone or computer to see your conversation and send suggestions.
          </p>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-purple-100"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-aa-dark text-sm">
                    {step.title}
                  </h4>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-sm text-purple-700">
              <strong>Privacy note:</strong> Helper links expire after 30 minutes.
              Family members can only view and suggest - they cannot make changes on your behalf.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
