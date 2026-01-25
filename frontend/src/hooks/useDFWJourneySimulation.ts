'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DFWWaypoint,
  DFW_JOURNEY_WAYPOINTS,
  DFW_GATE_LOCATION,
  calculateDistance,
  getWaypointByProgress,
  interpolatePosition,
} from '@/lib/dfwDemoData';
import type { AlertStatus } from '@/types';

export interface UseDFWJourneyOptions {
  enabled: boolean;
  durationMs?: number; // Total journey time (default 120000 = 2 min)
  onWaypointReached?: (waypoint: DFWWaypoint) => void;
  onArrival?: () => void;
  departureTime?: Date;
}

export interface DFWJourneyState {
  isSimulating: boolean;
  progress: number; // 0 to 1
  currentWaypoint: DFWWaypoint;
  nextWaypoint: DFWWaypoint | null;
  currentPosition: { lat: number; lng: number };
  currentInstruction: string;
  distanceToGate: number;
  estimatedTimeRemaining: number; // minutes
  timeToDeparture: number; // minutes
  alertStatus: AlertStatus;
  waypointIndex: number;
}

export function useDFWJourneySimulation({
  enabled,
  durationMs = 120000,
  onWaypointReached,
  onArrival,
  departureTime,
}: UseDFWJourneyOptions) {
  const [state, setState] = useState<DFWJourneyState>(() => ({
    isSimulating: false,
    progress: 0,
    currentWaypoint: DFW_JOURNEY_WAYPOINTS[0],
    nextWaypoint: DFW_JOURNEY_WAYPOINTS[1] || null,
    currentPosition: { lat: DFW_JOURNEY_WAYPOINTS[0].lat, lng: DFW_JOURNEY_WAYPOINTS[0].lng },
    currentInstruction: DFW_JOURNEY_WAYPOINTS[0].instruction,
    distanceToGate: 0,
    estimatedTimeRemaining: 0,
    timeToDeparture: 90,
    alertStatus: 'safe',
    waypointIndex: 0,
  }));

  const startTimeRef = useRef<number | null>(null);
  const lastWaypointIndexRef = useRef<number>(0);
  const arrivedRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // Reset simulation
  const reset = useCallback(() => {
    startTimeRef.current = null;
    lastWaypointIndexRef.current = 0;
    arrivedRef.current = false;
    setState({
      isSimulating: false,
      progress: 0,
      currentWaypoint: DFW_JOURNEY_WAYPOINTS[0],
      nextWaypoint: DFW_JOURNEY_WAYPOINTS[1] || null,
      currentPosition: { lat: DFW_JOURNEY_WAYPOINTS[0].lat, lng: DFW_JOURNEY_WAYPOINTS[0].lng },
      currentInstruction: DFW_JOURNEY_WAYPOINTS[0].instruction,
      distanceToGate: calculateDistance(
        DFW_JOURNEY_WAYPOINTS[0].lat,
        DFW_JOURNEY_WAYPOINTS[0].lng,
        DFW_GATE_LOCATION.lat,
        DFW_GATE_LOCATION.lng
      ),
      estimatedTimeRemaining: 16, // ~16 min walk at elderly pace
      timeToDeparture: 90,
      alertStatus: 'safe',
      waypointIndex: 0,
    });
  }, []);

  // Pause/resume simulation
  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isSimulating: false }));
  }, []);

  const resume = useCallback(() => {
    if (arrivedRef.current) return;
    setState((prev) => ({ ...prev, isSimulating: true }));
  }, []);

  // Main simulation loop
  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    // Initialize
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setState((prev) => ({ ...prev, isSimulating: true }));
    }

    const updateSimulation = () => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Get current waypoint info
      const { current, next, segmentProgress } = getWaypointByProgress(progress);
      const position = interpolatePosition(current, next, segmentProgress);

      // Calculate distance to gate
      const distanceToGate = calculateDistance(
        position.lat,
        position.lng,
        DFW_GATE_LOCATION.lat,
        DFW_GATE_LOCATION.lng
      );

      // Estimate walking time (elderly pace ~50m/min)
      const estimatedTimeRemaining = Math.ceil(distanceToGate / 50);

      // Time to departure
      const actualDepartureTime = departureTime || new Date(Date.now() + 90 * 60 * 1000);
      const timeToDeparture = Math.max(
        0,
        Math.floor((actualDepartureTime.getTime() - Date.now()) / 60000)
      );

      // Determine alert status
      let alertStatus: AlertStatus = 'safe';
      if (progress >= 0.98) {
        alertStatus = 'arrived';
      } else if (estimatedTimeRemaining > timeToDeparture - 15) {
        alertStatus = 'urgent';
      } else if (estimatedTimeRemaining > timeToDeparture - 30) {
        alertStatus = 'warning';
      }

      // Find current waypoint index
      const waypointIndex = DFW_JOURNEY_WAYPOINTS.findIndex((w) => w.id === current.id);

      // Fire waypoint callback if we've moved to a new waypoint
      if (waypointIndex > lastWaypointIndexRef.current && onWaypointReached) {
        lastWaypointIndexRef.current = waypointIndex;
        onWaypointReached(current);
      }

      // Fire arrival callback
      if (progress >= 1 && !arrivedRef.current) {
        arrivedRef.current = true;
        if (onArrival) {
          onArrival();
        }
      }

      setState({
        isSimulating: progress < 1,
        progress,
        currentWaypoint: current,
        nextWaypoint: next,
        currentPosition: position,
        currentInstruction: current.instruction,
        distanceToGate: Math.round(distanceToGate),
        estimatedTimeRemaining,
        timeToDeparture,
        alertStatus,
        waypointIndex,
      });

      // Continue animation if not complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateSimulation);
      }
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateSimulation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, durationMs, onWaypointReached, onArrival, departureTime, reset]);

  return {
    ...state,
    reset,
    pause,
    resume,
    waypoints: DFW_JOURNEY_WAYPOINTS,
    gateLocation: DFW_GATE_LOCATION,
  };
}
