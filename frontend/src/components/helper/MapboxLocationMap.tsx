'use client';

import { useRef, useEffect, useState } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { LocationData, GateLocation, LocationMetrics, LocationAlert, AlertStatus } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxLocationMapProps {
  passengerLocation: LocationData | null;
  gateLocation: GateLocation | null;
  metrics: LocationMetrics | null;
  directions: string;
  message: string;
  alert: LocationAlert | null;
  onRefresh?: () => void;
  loading?: boolean;
}

// Alert status colors
const ALERT_COLORS: Record<AlertStatus, string> = {
  safe: '#22c55e',      // green
  warning: '#eab308',   // yellow
  urgent: '#ef4444',    // red
  arrived: '#3b82f6',   // blue
};

export function MapboxLocationMap({
  passengerLocation,
  gateLocation,
  metrics,
  directions,
  alert,
  onRefresh,
  loading,
}: MapboxLocationMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Center map on passenger or gate when locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (passengerLocation && gateLocation) {
      // Fit bounds to show both markers
      const bounds = [
        [Math.min(passengerLocation.lng, gateLocation.lng) - 0.002,
         Math.min(passengerLocation.lat, gateLocation.lat) - 0.002],
        [Math.max(passengerLocation.lng, gateLocation.lng) + 0.002,
         Math.max(passengerLocation.lat, gateLocation.lat) + 0.002],
      ];
      map.fitBounds(bounds as [[number, number], [number, number]], {
        padding: 60,
        duration: 1000,
      });
    } else if (passengerLocation) {
      map.flyTo({ center: [passengerLocation.lng, passengerLocation.lat], zoom: 17 });
    } else if (gateLocation) {
      map.flyTo({ center: [gateLocation.lng, gateLocation.lat], zoom: 17 });
    }
  }, [passengerLocation, gateLocation, mapLoaded]);

  // Default center (will be overridden when locations load)
  const defaultCenter = passengerLocation
    ? { lng: passengerLocation.lng, lat: passengerLocation.lat }
    : gateLocation
    ? { lng: gateLocation.lng, lat: gateLocation.lat }
    : { lng: -80.2413, lat: 40.4958 }; // PIT airport default

  // Line between passenger and gate
  const routeLine = passengerLocation && gateLocation ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [passengerLocation.lng, passengerLocation.lat],
        [gateLocation.lng, gateLocation.lat],
      ],
    },
  } : null;

  const alertColor = metrics?.alert_status ? ALERT_COLORS[metrics.alert_status] : '#9333ea';

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
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
              <h3 className="font-bold text-lg">Live Location</h3>
              <p className="text-sm text-white/80">Real-time airport tracking</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{alert.message}</span>
          </div>
        </div>
      )}

      {/* Mapbox Map */}
      <div className="h-80">
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{
            longitude: defaultCenter.lng,
            latitude: defaultCenter.lat,
            zoom: 16,
            pitch: 45,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          onLoad={() => setMapLoaded(true)}
        >
          <NavigationControl position="top-right" />

          {/* Route line */}
          {routeLine && (
            <Source id="route" type="geojson" data={routeLine}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': alertColor,
                  'line-width': 4,
                  'line-dasharray': [2, 1],
                }}
              />
            </Source>
          )}

          {/* Passenger Marker */}
          {passengerLocation && (
            <Marker
              longitude={passengerLocation.lng}
              latitude={passengerLocation.lat}
              anchor="center"
            >
              <div className="relative">
                <div className="absolute inset-0 w-8 h-8 -m-1 bg-blue-400 rounded-full animate-ping opacity-40" />
                <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>
            </Marker>
          )}

          {/* Gate Marker */}
          {gateLocation && (
            <Marker
              longitude={gateLocation.lng}
              latitude={gateLocation.lat}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-lg">
                  Gate {gateLocation.gate}
                </div>
                <div className="w-3 h-3 bg-green-500 rotate-45 -mt-1.5 shadow-lg" />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Metrics Panel */}
      <div className="p-6">
        {/* Status Badge */}
        {metrics?.alert_status && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{
              backgroundColor: `${alertColor}20`,
              color: alertColor,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alertColor }} />
            <span className="font-medium text-sm capitalize">
              {metrics.alert_status === 'safe' ? 'On Track' : metrics.alert_status}
            </span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {metrics?.distance_meters ? `${metrics.distance_meters}m` : '--'}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Distance</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {metrics?.walking_time_minutes ? `${metrics.walking_time_minutes} min` : '--'}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Walk Time</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {metrics?.time_to_departure_minutes ? `${metrics.time_to_departure_minutes} min` : '--'}
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
      </div>
    </div>
  );
}
