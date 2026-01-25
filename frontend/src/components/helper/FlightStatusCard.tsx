'use client';

import { useState, useEffect } from 'react';
import type { FlightSegment } from '@/types';

interface FlightStatusCardProps {
  flight: FlightSegment;
}

export function FlightStatusCard({ flight }: FlightStatusCardProps) {
  const [countdown, setCountdown] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: FlightSegment['status']) => {
    switch (status) {
      case 'scheduled':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'delayed':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'boarding':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ),
        };
      case 'departed':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          ),
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: null,
        };
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const departure = new Date(flight.departure_time);
      const diff = departure.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Departed');
        setIsUrgent(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdown(`${days}d ${hours % 24}h`);
        setIsUrgent(false);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
        setIsUrgent(hours < 1);
      } else {
        setCountdown(`${minutes}m`);
        setIsUrgent(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [flight.departure_time]);

  const statusConfig = getStatusConfig(flight.status);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Flight number and status header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-aa-blue/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-aa-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-aa-blue">{flight.flight_number}</h2>
            <p className="text-sm text-gray-500">American Airlines</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
          {statusConfig.icon}
          {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
        </span>
      </div>

      {/* Route display */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{flight.origin}</p>
            <p className="text-lg font-medium text-gray-600">{formatTime(flight.departure_time)}</p>
            <p className="text-xs text-gray-500">{formatDate(flight.departure_time)}</p>
          </div>

          <div className="flex-1 mx-4">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-aa-blue" />
              <div className="h-0.5 flex-1 bg-gradient-to-r from-aa-blue to-aa-red" />
              <svg className="w-5 h-5 text-aa-red -mx-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="h-0.5 flex-1 bg-aa-red" />
              <div className="w-2 h-2 rounded-full bg-aa-red" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{flight.destination}</p>
            <p className="text-lg font-medium text-gray-600">{formatTime(flight.arrival_time)}</p>
            <p className="text-xs text-gray-500">{formatDate(flight.arrival_time)}</p>
          </div>
        </div>
      </div>

      {/* Flight details grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Gate */}
        <div className="bg-gray-50 rounded-xl p-3">
          <span className="text-xs text-gray-500 block">Gate</span>
          <span className="text-lg font-bold text-gray-800">{flight.gate || 'TBD'}</span>
        </div>

        {/* Seat */}
        <div className="bg-gray-50 rounded-xl p-3">
          <span className="text-xs text-gray-500 block">Seat</span>
          <span className="text-lg font-bold text-gray-800">{flight.seat || 'Not assigned'}</span>
        </div>
      </div>

      {/* Countdown timer */}
      {flight.status !== 'cancelled' && flight.status !== 'departed' && (
        <div className={`rounded-xl p-4 text-center ${
          isUrgent
            ? 'bg-red-50 border-2 border-red-200'
            : 'bg-purple-50 border border-purple-200'
        }`}>
          <span className={`text-xs font-medium uppercase tracking-wide ${
            isUrgent ? 'text-red-600' : 'text-purple-600'
          }`}>
            {flight.status === 'boarding' ? 'Now Boarding' : 'Departs in'}
          </span>
          <p className={`text-2xl font-bold mt-1 ${
            isUrgent ? 'text-red-700' : 'text-purple-800'
          }`}>
            {countdown}
          </p>
          {isUrgent && flight.status !== 'boarding' && (
            <p className="text-xs text-red-600 mt-1">Time to head to the gate!</p>
          )}
        </div>
      )}
    </div>
  );
}
