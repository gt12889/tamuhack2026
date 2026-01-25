'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LocationData, GateLocation, LocationMetrics, LocationAlert, AlertStatus } from '@/types';

interface LocationMapProps {
  passengerLocation: LocationData | null;
  gateLocation: GateLocation | null;
  metrics: LocationMetrics | null;
  directions: string;
  message: string;
  alert: LocationAlert | null;
  onRefresh?: () => void;
  loading?: boolean;
}

/**
 * Alert status badge colors and labels
 */
const ALERT_STATUS_CONFIG: Record<AlertStatus, { bg: string; text: string; label: string; icon: string }> = {
  safe: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'On Track',
    icon: 'M5 13l4 4L19 7', // Checkmark
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Running Late',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // Warning
  },
  urgent: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Urgent',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // Exclamation
  },
  arrived: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Arrived',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', // Location pin
  },
};

/**
 * Format distance for display
 */
function formatDistance(meters: number | null): string {
  if (meters === null) return '--';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format time for display
 */
function formatTime(minutes: number | null): string {
  if (minutes === null) return '--';
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Simple map visualization showing passenger and gate positions.
 * Uses a static visual representation (not a full map library).
 */
export function LocationMap({
  passengerLocation,
  gateLocation,
  metrics,
  directions,
  message,
  alert,
  onRefresh,
  loading = false,
}: LocationMapProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update last update time when location changes
  useEffect(() => {
    if (passengerLocation?.timestamp) {
      setLastUpdate(new Date(passengerLocation.timestamp));
    }
  }, [passengerLocation?.timestamp]);

  // Get status config
  const statusConfig = metrics?.alert_status
    ? ALERT_STATUS_CONFIG[metrics.alert_status]
    : null;

  // Calculate relative positions for visual display
  const getRelativePosition = useCallback(() => {
    if (!passengerLocation || !gateLocation) {
      return { passenger: { x: 30, y: 70 }, gate: { x: 70, y: 30 } };
    }

    // Normalize positions to 0-100 range
    const latDiff = gateLocation.lat - passengerLocation.lat;
    const lngDiff = gateLocation.lng - passengerLocation.lng;

    // Simple scaling - center passenger, position gate relative
    const scale = 40; // Percentage distance to show

    return {
      passenger: { x: 50, y: 60 },
      gate: {
        x: 50 + Math.sign(lngDiff) * Math.min(Math.abs(lngDiff) * 10000, scale),
        y: 60 - Math.sign(latDiff) * Math.min(Math.abs(latDiff) * 10000, scale),
      },
    };
  }, [passengerLocation, gateLocation]);

  const positions = getRelativePosition();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with status */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Passenger Location</h3>
              {lastUpdate && (
                <p className="text-sm text-white/80">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh location"
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Alert banner if present */}
      {alert && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{alert.message}</span>
          </div>
        </div>
      )}

      {/* Map visualization */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {/* Grid lines for visual reference */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${(i + 1) * 20}%` }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${(i + 1) * 20}%` }} />
          ))}
        </div>

        {/* Path line between passenger and gate */}
        {passengerLocation && gateLocation && (
          <svg className="absolute inset-0 w-full h-full">
            <line
              x1={`${positions.passenger.x}%`}
              y1={`${positions.passenger.y}%`}
              x2={`${positions.gate.x}%`}
              y2={`${positions.gate.y}%`}
              stroke="#9333ea"
              strokeWidth="3"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Passenger marker */}
        {passengerLocation ? (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${positions.passenger.x}%`, top: `${positions.passenger.y}%` }}
          >
            <div className="relative">
              {/* Pulse animation */}
              <div className="absolute inset-0 w-12 h-12 -m-3 bg-blue-400 rounded-full animate-ping opacity-30" />
              {/* Marker */}
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
              </div>
              {/* Label */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">
                Passenger
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="text-sm">Waiting for location data...</p>
            </div>
          </div>
        )}

        {/* Gate marker */}
        {gateLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${positions.gate.x}%`, top: `${positions.gate.y}%` }}
          >
            <div className="w-8 h-8 bg-green-500 rounded-lg border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">{gateLocation.gate}</span>
            </div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
              Gate {gateLocation.gate}
              {gateLocation.terminal && ` (${gateLocation.terminal})`}
            </div>
          </div>
        )}
      </div>

      {/* Metrics panel */}
      <div className="p-6">
        {/* Status badge */}
        {statusConfig && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} mb-4`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.icon} />
            </svg>
            <span className="font-medium text-sm">{statusConfig.label}</span>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {formatDistance(metrics?.distance_meters ?? null)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Distance</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {formatTime(metrics?.walking_time_minutes ?? null)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Walk Time</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {formatTime(metrics?.time_to_departure_minutes ?? null)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">To Departure</div>
          </div>
        </div>

        {/* Directions */}
        {directions && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <div>
                <p className="font-medium text-purple-800 mb-1">Directions</p>
                <p className="text-purple-700 text-sm">{directions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && !directions && (
          <p className="text-gray-600 text-center">{message}</p>
        )}
      </div>
    </div>
  );
}

export default LocationMap;
