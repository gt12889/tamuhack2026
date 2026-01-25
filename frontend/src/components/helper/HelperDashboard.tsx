'use client';

import type { Reservation } from '@/types';
import { PassengerInfoCard } from './PassengerInfoCard';
import { FlightStatusCard } from './FlightStatusCard';

interface HelperDashboardProps {
  reservation: Reservation;
}

export function HelperDashboard({ reservation }: HelperDashboardProps) {
  return (
    <section className="space-y-6">
      {/* Dashboard header */}
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <h2 className="text-lg font-bold text-gray-800">Travel Dashboard</h2>
      </div>

      {/* Responsive grid: 2 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Passenger Info */}
        <PassengerInfoCard
          passenger={reservation.passenger}
          confirmationCode={reservation.confirmation_code}
        />

        {/* Right column: Flight Status Cards */}
        <div className="space-y-4">
          {reservation.flights.map((flight) => (
            <FlightStatusCard key={flight.id} flight={flight} />
          ))}
        </div>
      </div>
    </section>
  );
}
