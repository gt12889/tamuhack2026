'use client';

import { Reservation } from '@/types';
import { FlightCard } from './FlightCard';

interface ConfirmationScreenProps {
  reservation: Reservation;
  onStartOver: () => void;
}

export function ConfirmationScreen({ reservation, onStartOver }: ConfirmationScreenProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Success checkmark */}
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success message */}
      <h1 className="text-display font-bold text-green-600 mb-4">You're All Set!</h1>
      <p className="text-heading text-gray-600 mb-8">
        Your flight has been changed successfully.
      </p>

      {/* Confirmation code */}
      <div className="bg-gray-100 rounded-2xl p-8 mb-8">
        <p className="text-body-lg text-gray-600 mb-2">Confirmation Code</p>
        <p className="text-display font-bold text-aa-blue tracking-wider">
          {reservation.confirmation_code}
        </p>
      </div>

      {/* New flight details */}
      <div className="mb-8">
        <h2 className="text-heading font-bold text-aa-dark mb-4">Your New Flight</h2>
        {reservation.flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* Passenger info */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        <p className="text-body-lg">
          <span className="text-gray-600">Passenger: </span>
          <span className="font-bold">
            {reservation.passenger.first_name} {reservation.passenger.last_name}
          </span>
        </p>
        <p className="text-body text-gray-600 mt-2">
          Confirmation sent to {reservation.passenger.email}
        </p>
      </div>

      {/* Start over button */}
      <button onClick={onStartOver} className="btn-secondary">
        Start Over
      </button>
    </div>
  );
}
