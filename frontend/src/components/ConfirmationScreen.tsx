'use client';

import { motion } from 'framer-motion';
import { Reservation } from '@/types';
import { FlightCard } from './FlightCard';
import { TripSummaryCard } from './TripSummaryCard';

interface ConfirmationScreenProps {
  reservation: Reservation;
  tripSummary?: string;
  tripSummaryShort?: string;
  changes?: string[];
  isChange?: boolean;
  language?: 'en' | 'es';
  onStartOver: () => void;
}

export function ConfirmationScreen({
  reservation,
  tripSummary,
  tripSummaryShort,
  changes = [],
  isChange = false,
  language = 'en',
  onStartOver,
}: ConfirmationScreenProps) {
  const isSpanish = language === 'es';
  const firstFlight = reservation.flights?.[0];

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-display font-bold text-green-600 mb-4">
          {isSpanish ? '¡Todo Listo!' : "You're All Set!"}
        </h1>
        <p className="text-heading text-gray-600 mb-8">
          {isChange
            ? (isSpanish ? 'Su vuelo ha sido cambiado exitosamente.' : 'Your flight has been changed successfully.')
            : (isSpanish ? 'Su reservación está confirmada.' : 'Your booking is confirmed.')}
        </p>
      </motion.div>

      {/* Trip Summary Card (if available) */}
      {tripSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <TripSummaryCard
            summary={tripSummary}
            summaryShort={tripSummaryShort}
            confirmationCode={reservation.confirmation_code}
            origin={firstFlight?.origin}
            destination={firstFlight?.destination}
            departureTime={firstFlight?.departure_time}
            seat={firstFlight?.seat}
            language={language}
            isChange={isChange}
            changes={changes}
          />
        </motion.div>
      )}

      {/* Fallback: Show basic info if no trip summary */}
      {!tripSummary && (
        <>
          {/* Confirmation code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-100 rounded-2xl p-8 mb-8"
          >
            <p className="text-body-lg text-gray-600 mb-2">
              {isSpanish ? 'Código de Confirmación' : 'Confirmation Code'}
            </p>
            <p className="text-display font-bold text-aa-blue tracking-wider">
              {reservation.confirmation_code}
            </p>
          </motion.div>

          {/* Flight details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-heading font-bold text-aa-dark mb-4">
              {isChange
                ? (isSpanish ? 'Su Nuevo Vuelo' : 'Your New Flight')
                : (isSpanish ? 'Su Vuelo' : 'Your Flight')}
            </h2>
            {reservation.flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
          </motion.div>
        </>
      )}

      {/* Passenger info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-50 rounded-2xl p-6 mb-8"
      >
        <p className="text-body-lg">
          <span className="text-gray-600">
            {isSpanish ? 'Pasajero: ' : 'Passenger: '}
          </span>
          <span className="font-bold">
            {reservation.passenger.first_name} {reservation.passenger.last_name}
          </span>
        </p>
        <p className="text-body text-gray-600 mt-2">
          {isSpanish
            ? `Confirmación enviada a ${reservation.passenger.email}`
            : `Confirmation sent to ${reservation.passenger.email}`}
        </p>
      </motion.div>

      {/* Start over button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onStartOver}
        className="btn-secondary"
      >
        {isSpanish ? 'Comenzar de Nuevo' : 'Start Over'}
      </motion.button>
    </div>
  );
}
