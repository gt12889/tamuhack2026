'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CoordinatePoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

interface CoordinatePickerProps {
  airportCode?: string;
  gate?: string;
  initialCenter?: { lat: number; lng: number };
}

export function CoordinatePicker({ 
  airportCode = 'DFW', 
  gate = 'B22',
  initialCenter 
}: CoordinatePickerProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [points, setPoints] = useState<CoordinatePoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Default center based on airport or provided center
  const defaultCenter = initialCenter || 
    (airportCode === 'DFW' ? { lat: 32.8998, lng: -97.0403 } :
     airportCode === 'ORD' ? { lat: 41.9742, lng: -87.9073 } :
     airportCode === 'LAX' ? { lat: 33.9425, lng: -118.4081 } :
     { lat: 32.8998, lng: -97.0403 }); // Default to DFW

  const hasMapboxToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMapClick = useCallback((event: any) => {
    if (!mapRef.current) return;
    
    const { lng, lat } = event.lngLat;
    const newPoint: CoordinatePoint = {
      id: `point-${Date.now()}`,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      label: points.length === 0 ? `Gate ${gate}` : `Point ${points.length + 1}`,
    };
    
    setPoints(prev => [...prev, newPoint]);
    setSelectedPoint(newPoint.id);
  }, [points.length, gate]);

  const removePoint = useCallback((id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id));
    if (selectedPoint === id) {
      setSelectedPoint(null);
    }
  }, [selectedPoint]);

  const copyCoordinates = useCallback((point: CoordinatePoint) => {
    const text = `${point.lat}, ${point.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedId(point.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const copyAllCoordinates = useCallback(() => {
    if (points.length === 0) return;
    const text = points.map(p => `${p.label || 'Point'}: ${p.lat}, ${p.lng}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  }, [points]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Coordinate Picker</h3>
            <p className="text-sm text-white/80">Click on the map to place points and get coordinates</p>
          </div>
          {points.length > 0 && (
            <button
              onClick={copyAllCoordinates}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              {copiedId === 'all' ? 'Copied!' : 'Copy All'}
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="h-96 relative">
        {!hasMapboxToken ? (
          <div className="h-full bg-gradient-to-br from-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-blue-800 font-semibold text-center mb-2">Mapbox Token Required</p>
            <p className="text-blue-600 text-sm text-center">
              Please set NEXT_PUBLIC_MAPBOX_TOKEN to use the coordinate picker
            </p>
          </div>
        ) : (
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={{
              longitude: defaultCenter.lng,
              latitude: defaultCenter.lat,
              zoom: 17,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            onLoad={() => setMapLoaded(true)}
            onClick={handleMapClick}
            interactive={true}
          >
            <NavigationControl position="top-right" />

            {/* Markers for all points */}
            {points.map((point) => (
              <Marker
                key={point.id}
                longitude={point.lng}
                latitude={point.lat}
                anchor="center"
              >
                <div className="relative">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                  {point.label && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-lg">
                      {point.label}
                    </div>
                  )}
                </div>
              </Marker>
            ))}
          </Map>
        )}
      </div>

      {/* Points List */}
      <div className="p-6 max-h-64 overflow-y-auto">
        {points.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium mb-2">No points placed yet</p>
            <p className="text-sm">Click anywhere on the map to place a point</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-3">Placed Points ({points.length})</h4>
            {points.map((point) => (
              <div
                key={point.id}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPoint === point.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedPoint(point.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {point.label && (
                      <div className="font-semibold text-gray-800 mb-1">{point.label}</div>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Latitude:</span> {point.lat}
                      </div>
                      <div>
                        <span className="font-medium">Longitude:</span> {point.lng}
                      </div>
                      <div className="mt-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {point.lat}, {point.lng}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCoordinates(point);
                      }}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                    >
                      {copiedId === point.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePoint(point.id);
                      }}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
