'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { updateLocation } from '@/lib/api';
import type { LocationMetrics, AlertStatus } from '@/types';

interface UseLocationTrackingOptions {
  sessionId: string | null;
  enabled: boolean;
  minMovementMeters?: number;  // Minimum movement to trigger update
  updateInterval?: number;     // Fallback interval in ms
}

interface LocationTrackingState {
  isTracking: boolean;
  lastPosition: GeolocationPosition | null;
  lastUpdateTime: Date | null;
  metrics: LocationMetrics | null;
  alertStatus: AlertStatus | null;
  directions: string;
  error: string | null;
}

/**
 * Hook for tracking user location and sending updates to the backend.
 * Designed for elderly passengers navigating airports.
 *
 * Features:
 * - Only sends updates on significant movement (> minMovementMeters)
 * - Uses high accuracy GPS when available
 * - Handles permissions and errors gracefully
 * - Returns current alert status and directions
 */
export function useLocationTracking({
  sessionId,
  enabled,
  minMovementMeters = 50,
  updateInterval = 30000, // 30 seconds fallback
}: UseLocationTrackingOptions): LocationTrackingState {
  const [state, setState] = useState<LocationTrackingState>({
    isTracking: false,
    lastPosition: null,
    lastUpdateTime: null,
    metrics: null,
    alertStatus: null,
    directions: '',
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastSentPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate distance between two points in meters using Haversine formula.
   */
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg: number) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  /**
   * Check if we've moved significantly since last update.
   */
  const hasMovedSignificantly = useCallback((position: GeolocationPosition): boolean => {
    if (!lastSentPositionRef.current) {
      return true; // Always send first position
    }

    const distance = calculateDistance(
      lastSentPositionRef.current.lat,
      lastSentPositionRef.current.lng,
      position.coords.latitude,
      position.coords.longitude
    );

    return distance >= minMovementMeters;
  }, [calculateDistance, minMovementMeters]);

  /**
   * Send location update to backend.
   */
  const sendLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    if (!sessionId) return;

    try {
      const result = await updateLocation(
        sessionId,
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy || undefined
      );

      // Update last sent position
      lastSentPositionRef.current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        lastPosition: position,
        lastUpdateTime: new Date(),
        metrics: result.metrics,
        alertStatus: result.alert_status,
        directions: result.directions,
        error: null,
      }));

    } catch (error) {
      console.error('Failed to update location:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to send location update',
      }));
    }
  }, [sessionId]);

  /**
   * Handle position update from geolocation API.
   */
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    setState(prev => ({ ...prev, lastPosition: position }));

    // Only send to backend if moved significantly
    if (hasMovedSignificantly(position)) {
      sendLocationUpdate(position);
    }
  }, [hasMovedSignificantly, sendLocationUpdate]);

  /**
   * Handle geolocation error.
   */
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Please check your GPS settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Trying again...';
        break;
      default:
        errorMessage = 'Unable to get your location.';
    }

    console.error('Geolocation error:', error.message);
    setState(prev => ({
      ...prev,
      error: errorMessage,
    }));
  }, []);

  /**
   * Start location tracking.
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 30000,        // Accept positions up to 30 seconds old
        timeout: 27000,           // Timeout after 27 seconds
      }
    );

    // Also set up interval for periodic updates even without movement
    // This ensures we still get status updates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Force send update regardless of movement
          if (sessionId) {
            sendLocationUpdate(position);
          }
        },
        handlePositionError,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, updateInterval);

    setState(prev => ({ ...prev, isTracking: true }));
  }, [handlePositionUpdate, handlePositionError, sendLocationUpdate, sessionId, updateInterval]);

  /**
   * Stop location tracking.
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Start/stop tracking based on enabled prop
  useEffect(() => {
    if (!sessionId || !enabled) {
      stopTracking();
      return;
    }

    startTracking();

    return () => {
      stopTracking();
    };
  }, [sessionId, enabled, startTracking, stopTracking]);

  return state;
}

export default useLocationTracking;
