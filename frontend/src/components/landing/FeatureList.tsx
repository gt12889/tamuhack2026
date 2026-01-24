'use client';

import { CalendarDays, Plane, Search, CreditCard, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface FeatureListProps {
  className?: string;
}

const features = [
  {
    icon: CalendarDays,
    title: 'Change your flight date or time',
    description: 'Reschedule to a different day or get an earlier/later flight',
  },
  {
    icon: Plane,
    title: 'Check flight status',
    description: 'Get real-time updates on delays, gates, and arrival times',
  },
  {
    icon: Search,
    title: 'Look up your reservation',
    description: 'Find your booking details with just your name',
  },
  {
    icon: CreditCard,
    title: 'Book a new flight',
    description: 'Search and book flights with voice commands',
  },
  {
    icon: Users,
    title: 'Get help from family',
    description: 'Share a link so family can assist you remotely',
  },
];

export function FeatureList({ className }: FeatureListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}
      className={cn("w-full max-w-3xl mx-auto py-8", className)}
    >
      <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-aa-dark">What I can help with</h3>
        </div>

        {/* Feature Grid */}
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-aa-blue/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-aa-blue" />
                </div>
                <div>
                  <h4 className="font-semibold text-aa-dark text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
