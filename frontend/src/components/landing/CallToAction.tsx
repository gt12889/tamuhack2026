'use client';

import { Phone, Clock, Zap, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CallToActionProps {
  phoneNumber?: string;
  className?: string;
}

export function CallToAction({
  phoneNumber = '+1 (877) 211-0332',
  className
}: CallToActionProps) {
  const formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
  const displayPhone = phoneNumber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      {/* Main CTA Card */}
      <div className="bg-gradient-to-br from-aa-blue to-blue-700 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          Need help with your flight?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-lg md:text-xl opacity-90 mb-8 max-w-md mx-auto"
        >
          Our AI assistant can help you change flights, check status, and answer your questions instantly.
        </motion.p>

        {/* Phone Number Card */}
        <motion.a
          href={`tel:${formattedPhone}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="block bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="bg-aa-blue rounded-full p-3">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <span className="text-aa-blue text-lg font-semibold">Call AI Assistant</span>
          </div>

          <div className="text-aa-dark text-4xl md:text-5xl font-bold tracking-tight mb-2">
            {displayPhone}
          </div>

          <p className="text-gray-500 text-sm">(Tap to call)</p>
        </motion.a>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-6"
        >
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
            <Bot className="w-4 h-4 mr-1" />
            AI-Powered
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
            <Clock className="w-4 h-4 mr-1" />
            Available 24/7
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            No wait times
          </Badge>
        </motion.div>
      </div>
    </motion.div>
  );
}
