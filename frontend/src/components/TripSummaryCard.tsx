'use client';

import { motion } from 'framer-motion';
import { Plane, Calendar, Clock, Armchair, Ticket, Luggage } from 'lucide-react';

interface TripSummaryCardProps {
  summary: string;
  summaryShort?: string;
  confirmationCode?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  seat?: string;
  language?: 'en' | 'es';
  isChange?: boolean;
  changes?: string[];
}

export function TripSummaryCard({
  summary,
  summaryShort,
  confirmationCode,
  origin,
  destination,
  departureTime,
  seat,
  language = 'en',
  isChange = false,
  changes = [],
}: TripSummaryCardProps) {
  const isSpanish = language === 'es';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-aa-blue to-blue-700 text-white rounded-2xl p-6 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/20 rounded-full p-2">
          <Plane className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold">
          {isChange
            ? (isSpanish ? 'Cambio Confirmado' : 'Change Confirmed')
            : (isSpanish ? 'Resumen de Viaje' : 'Trip Summary')}
        </h3>
      </div>

      {/* Main summary text */}
      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <p className="text-lg leading-relaxed">{summary}</p>
      </div>

      {/* Details grid */}
      {(origin || destination || departureTime || seat || confirmationCode) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {origin && destination && (
            <div className="bg-white/10 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Plane className="w-4 h-4" />
                {isSpanish ? 'Ruta' : 'Route'}
              </div>
              <p className="font-bold text-lg">{origin} → {destination}</p>
            </div>
          )}

          {departureTime && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                {isSpanish ? 'Salida' : 'Departure'}
              </div>
              <p className="font-bold">{departureTime}</p>
            </div>
          )}

          {seat && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Armchair className="w-4 h-4" />
                {isSpanish ? 'Asiento' : 'Seat'}
              </div>
              <p className="font-bold">{seat}</p>
            </div>
          )}

          {confirmationCode && (
            <div className="bg-white/10 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Ticket className="w-4 h-4" />
                {isSpanish ? 'Código de Confirmación' : 'Confirmation Code'}
              </div>
              <p className="font-bold text-xl tracking-wider">{confirmationCode}</p>
            </div>
          )}
        </div>
      )}

      {/* Changes list (for flight changes) */}
      {isChange && changes.length > 0 && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
          <p className="text-sm font-bold text-green-300 mb-2">
            {isSpanish ? 'Lo que cambió:' : 'What changed:'}
          </p>
          <ul className="space-y-1">
            {changes.map((change, index) => (
              <li key={index} className="text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Short summary footer */}
      {summaryShort && (
        <div className="mt-4 pt-3 border-t border-white/20">
          <p className="text-sm text-white/70">{summaryShort}</p>
        </div>
      )}
    </motion.div>
  );
}
