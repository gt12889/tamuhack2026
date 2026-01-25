'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Plane, Navigation, CheckCircle, Circle } from 'lucide-react';
import { MapboxLocationMap } from '@/components/helper';
import { DFW_JOURNEY_WAYPOINTS, DFW_GATE_LOCATION } from '@/lib/dfwDemoData';
import type { DFWJourneyState } from '@/hooks/useDFWJourneySimulation';
import type { AlertStatus } from '@/types';

interface DFWNavigationPanelProps {
  journeyState: DFWJourneyState;
  passengerName?: string;
  className?: string;
}

const ALERT_STATUS_COLORS: Record<AlertStatus, { bg: string; text: string; border: string }> = {
  safe: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  arrived: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
};

const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  safe: 'On Track',
  warning: 'Running Behind',
  urgent: 'Running Late!',
  arrived: 'Arrived!',
};

export function DFWNavigationPanel({
  journeyState,
  passengerName = 'MeeMaw',
  className = '',
}: DFWNavigationPanelProps) {
  const {
    currentPosition,
    currentInstruction,
    currentWaypoint,
    distanceToGate,
    estimatedTimeRemaining,
    timeToDeparture,
    alertStatus,
    waypointIndex,
  } = journeyState;

  const statusColors = ALERT_STATUS_COLORS[alertStatus];

  // Convert journey state to MapboxLocationMap props
  const passengerLocation = {
    lat: currentPosition.lat,
    lng: currentPosition.lng,
    accuracy: 10,
    timestamp: new Date().toISOString(),
  };

  const gateLocation = {
    lat: DFW_GATE_LOCATION.lat,
    lng: DFW_GATE_LOCATION.lng,
    gate: DFW_GATE_LOCATION.gate,
    terminal: DFW_GATE_LOCATION.terminal,
  };

  const metrics = {
    distance_meters: distanceToGate,
    walking_time_minutes: estimatedTimeRemaining,
    time_to_departure_minutes: timeToDeparture,
    alert_status: alertStatus,
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Large Navigation Instruction Card */}
      <motion.div
        key={currentWaypoint.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${statusColors.bg} ${statusColors.border} border-2 rounded-xl p-4 mb-4`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${statusColors.bg}`}>
            <Navigation className={`w-8 h-8 ${statusColors.text}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium ${statusColors.text}`}>
                {ALERT_STATUS_LABELS[alertStatus]}
              </span>
              {alertStatus === 'arrived' && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <p className={`text-xl font-bold ${statusColors.text}`}>
              {currentInstruction}
            </p>
            {currentWaypoint.landmarks.length > 0 && (
              <p className="text-sm mt-1 opacity-75">
                Look for: {currentWaypoint.landmarks.join(', ')}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Location Status */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-800">
            {passengerName} is at: <span className="font-bold">{currentWaypoint.name}</span>
          </span>
        </div>
      </div>

      {/* Mapbox Map */}
      <div className="flex-1 min-h-0">
        <MapboxLocationMap
          passengerLocation={passengerLocation}
          gateLocation={gateLocation}
          metrics={metrics}
          directions={currentInstruction}
          message={`${passengerName} is ${distanceToGate}m from Gate ${DFW_GATE_LOCATION.gate}`}
          alert={alertStatus === 'urgent' ? {
            id: 'journey-alert',
            type: 'running_late',
            message: `${passengerName} may be running late for the flight!`,
            created_at: new Date().toISOString(),
          } : null}
        />
      </div>

      {/* Waypoint Progress Checklist */}
      <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Journey Progress
        </h4>
        <div className="space-y-2">
          {DFW_JOURNEY_WAYPOINTS.map((waypoint, idx) => {
            const isCompleted = idx < waypointIndex;
            const isCurrent = idx === waypointIndex;
            const isPending = idx > waypointIndex;

            return (
              <div
                key={waypoint.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-purple-50 border border-purple-200' : ''
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Circle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div className="absolute inset-0 w-5 h-5 bg-purple-500 rounded-full animate-ping opacity-25" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-purple-700' : 'text-gray-400'
                    }`}
                  >
                    {waypoint.name}
                  </p>
                </div>
                <span
                  className={`text-xs ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  {waypoint.terminal}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-gray-800">{distanceToGate}m</p>
          <p className="text-xs text-gray-500">to gate</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-gray-800">~{estimatedTimeRemaining} min</p>
          <p className="text-xs text-gray-500">walk time</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Plane className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-gray-800">{timeToDeparture} min</p>
          <p className="text-xs text-gray-500">to departure</p>
        </div>
      </div>
    </div>
  );
}
