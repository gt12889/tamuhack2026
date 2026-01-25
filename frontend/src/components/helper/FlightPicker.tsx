'use client';

import { useState, useEffect } from 'react';
import { Plane, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { getHelperFlights } from '@/lib/api';
import type { FlightOption } from '@/types';

interface FlightPickerProps {
  linkId: string;
  onSelect: (flight: FlightOption) => void;
  onCancel: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function FlightPicker({ linkId, onSelect, onCancel }: FlightPickerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFlight, setCurrentFlight] = useState<{
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
  } | null>(null);
  const [alternatives, setAlternatives] = useState<FlightOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);

  useEffect(() => {
    async function loadFlights() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHelperFlights(linkId);
        setCurrentFlight(data.current_flight);
        setAlternatives(data.alternative_flights);
      } catch (err) {
        setError('Failed to load alternative flights');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFlights();
  }, [linkId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading available flights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current flight info */}
      {currentFlight && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-2">Current Flight</p>
          <div className="flex items-center gap-3">
            <Plane className="h-5 w-5 text-gray-400" />
            <span className="font-medium">{currentFlight.flight_number}</span>
            <span className="text-gray-500">
              {currentFlight.origin} <ArrowRight className="h-3 w-3 inline" /> {currentFlight.destination}
            </span>
            <span className="text-gray-400 text-sm">
              {formatDate(currentFlight.departure_time)} at {formatTime(currentFlight.departure_time)}
            </span>
          </div>
        </div>
      )}

      {/* Alternative flights */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select a new flight</p>

        {alternatives.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No alternative flights available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alternatives.map((flight) => (
              <button
                key={flight.id}
                onClick={() => setSelectedFlight(flight)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${selectedFlight?.id === flight.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${selectedFlight?.id === flight.id ? 'bg-blue-100' : 'bg-gray-100'}
                    `}>
                      <Plane className={`h-5 w-5 ${selectedFlight?.id === flight.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">{flight.flight_number}</p>
                      <p className="text-sm text-gray-500">
                        {flight.origin} <ArrowRight className="h-3 w-3 inline mx-1" /> {flight.destination}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatTime(flight.departure_time)}</p>
                    <p className="text-sm text-gray-500">{formatDate(flight.departure_time)}</p>
                  </div>
                </div>

                {flight.duration && (
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {flight.duration}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedFlight && onSelect(selectedFlight)}
          disabled={!selectedFlight}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${selectedFlight
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Select Flight
        </button>
      </div>
    </div>
  );
}
