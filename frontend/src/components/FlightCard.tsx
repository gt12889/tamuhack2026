'use client';

import { FlightSegment } from '@/types';

interface FlightCardProps {
  flight: FlightSegment;
  onSelect?: () => void;
  selected?: boolean;
  showSelectButton?: boolean;
}

export function FlightCard({ flight, onSelect, selected, showSelectButton }: FlightCardProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: FlightSegment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'boarding':
        return 'bg-blue-100 text-blue-800';
      case 'departed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`p-8 rounded-2xl border-4 transition-all ${
        selected
          ? 'border-aa-blue bg-blue-50 shadow-xl'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Flight number and status */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-heading font-bold text-aa-blue">{flight.flight_number}</span>
        <span className={`px-4 py-2 rounded-full text-body font-medium ${getStatusColor(flight.status)}`}>
          {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
        </span>
      </div>

      {/* Date */}
      <p className="text-body-lg font-medium text-gray-600 mb-4">{formatDate(flight.departure_time)}</p>

      {/* Route */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <p className="text-display font-bold text-aa-dark">{flight.origin}</p>
          <p className="text-heading text-gray-600">{formatTime(flight.departure_time)}</p>
        </div>

        <div className="flex-1 mx-6">
          <div className="flex items-center">
            <div className="h-1 flex-1 bg-gray-300 rounded" />
            <svg className="w-8 h-8 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <div className="h-1 flex-1 bg-gray-300 rounded" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-display font-bold text-aa-dark">{flight.destination}</p>
          <p className="text-heading text-gray-600">{formatTime(flight.arrival_time)}</p>
        </div>
      </div>

      {/* Gate info */}
      {flight.gate && (
        <p className="text-body-lg text-gray-600 mb-4">
          Gate: <span className="font-bold">{flight.gate}</span>
        </p>
      )}

      {/* Seat info */}
      {flight.seat && (
        <p className="text-body-lg text-gray-600 mb-4">
          Seat: <span className="font-bold">{flight.seat}</span>
        </p>
      )}

      {/* Select button */}
      {showSelectButton && onSelect && (
        <button
          onClick={onSelect}
          className={`w-full mt-4 ${selected ? 'btn-success' : 'btn-primary'}`}
        >
          {selected ? 'Selected' : 'Select This Flight'}
        </button>
      )}
    </div>
  );
}
