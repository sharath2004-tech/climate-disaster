/**
 * LiveGlobalWeatherMap Component
 * 
 * A full-screen, interactive world map visualizing live global weather patterns.
 * Uses Windy.com embed API for real-time weather data visualization.
 * 
 * Features:
 * - Global wind flow animation
 * - Rain/precipitation layer
 * - Cloud cover visualization
 * - Temperature overlay
 * - Storm/cyclone tracking
 * 
 * @author SKYNETRA Team
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';

// Available weather layers with their Windy overlay codes
const WEATHER_LAYERS = [
  { id: 'wind', label: 'Wind', overlay: 'wind', description: 'Wind speed and direction' },
  { id: 'rain', label: 'Rain', overlay: 'rain', description: 'Precipitation intensity' },
  { id: 'clouds', label: 'Clouds', overlay: 'clouds', description: 'Cloud coverage' },
  { id: 'temp', label: 'Temperature', overlay: 'temp', description: 'Surface temperature' },
  { id: 'pressure', label: 'Pressure', overlay: 'pressure', description: 'Atmospheric pressure' },
  { id: 'waves', label: 'Waves', overlay: 'waves', description: 'Ocean wave height' },
] as const;

type WeatherLayerId = typeof WEATHER_LAYERS[number]['id'];

interface LiveGlobalWeatherMapProps {
  /** Initial latitude for map center */
  initialLat?: number;
  /** Initial longitude for map center */
  initialLon?: number;
  /** Initial zoom level (3-18) */
  initialZoom?: number;
  /** Initial active layer */
  initialLayer?: WeatherLayerId;
  /** Callback when layer changes */
  onLayerChange?: (layer: WeatherLayerId) => void;
  /** Callback when map position changes */
  onPositionChange?: (lat: number, lon: number, zoom: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show layer controls */
  showControls?: boolean;
}

/**
 * Generates the Windy embed URL with specified parameters
 */
const getWindyEmbedUrl = (
  lat: number,
  lon: number,
  zoom: number,
  overlay: string
): string => {
  // Windy embed URL structure
  // Using the embed2 endpoint for better iframe support
  const baseUrl = 'https://embed.windy.com/embed2.html';
  
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    zoom: zoom.toString(),
    level: 'surface',
    overlay: overlay,
    product: 'ecmwf', // European Centre for Medium-Range Weather Forecasts
    menu: '', // Hide menu for cleaner look
    message: 'true',
    marker: '',
    calendar: 'now',
    pressure: 'true',
    type: 'map',
    location: 'coordinates',
    detail: '',
    metricWind: 'km/h',
    metricTemp: '°C',
    radarRange: '-1',
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * LiveGlobalWeatherMap - Main component for weather visualization
 */
const LiveGlobalWeatherMap: React.FC<LiveGlobalWeatherMapProps> = ({
  initialLat = 20,
  initialLon = 0,
  initialZoom = 3,
  initialLayer = 'wind',
  onLayerChange,
  onPositionChange,
  className,
  showControls = true,
}) => {
  const [activeLayer, setActiveLayer] = useState<WeatherLayerId>(initialLayer);
  const [mapPosition, setMapPosition] = useState({
    lat: initialLat,
    lon: initialLon,
    zoom: initialZoom,
  });
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate the embed URL based on current state
  const embedUrl = getWindyEmbedUrl(
    mapPosition.lat,
    mapPosition.lon,
    mapPosition.zoom,
    WEATHER_LAYERS.find(l => l.id === activeLayer)?.overlay || 'wind'
  );

  // Handle layer change
  const handleLayerChange = useCallback((layerId: WeatherLayerId) => {
    setActiveLayer(layerId);
    setIsLoading(true);
    onLayerChange?.(layerId);
  }, [onLayerChange]);

  // Handle iframe load complete
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Get current layer info
  const currentLayer = WEATHER_LAYERS.find(l => l.id === activeLayer);

  return (
    <div className={cn('relative w-full h-full min-h-screen bg-slate-900', className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 text-sm">Loading weather data...</p>
          </div>
        </div>
      )}

      {/* Windy Map Embed */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        title="Live Global Weather Map"
        onLoad={handleIframeLoad}
        loading="eager"
        allow="geolocation"
        style={{ minHeight: '100vh' }}
      />

      {/* UI Controls Overlay */}
      {showControls && (
        <>
          {/* Layer Toggle Panel */}
          <div className="absolute top-4 left-4 z-30">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/50 p-2 shadow-xl">
              <p className="text-xs text-slate-400 uppercase tracking-wider px-2 mb-2">
                Weather Layers
              </p>
              <div className="flex flex-col gap-1">
                {WEATHER_LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => handleLayerChange(layer.id)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-md transition-all duration-200 text-left',
                      'hover:bg-slate-700/50',
                      activeLayer === layer.id
                        ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                        : 'text-slate-300 border border-transparent'
                    )}
                    title={layer.description}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Layer Indicator */}
          <div className="absolute top-4 right-4 z-30">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/50 px-4 py-3 shadow-xl">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Active Layer
              </p>
              <p className="text-cyan-400 font-medium">
                {currentLayer?.label}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {currentLayer?.description}
              </p>
            </div>
          </div>

          {/* Data Source Attribution */}
          <div className="absolute bottom-4 left-4 z-30">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-slate-700/50">
              <p className="text-xs text-slate-400">
                Data: ECMWF / GFS
              </p>
              <p className="text-xs text-slate-500">
                Visualization: Windy.com
              </p>
            </div>
          </div>

          {/* Legend Hint */}
          <div className="absolute bottom-4 right-4 z-30">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-slate-700/50">
              <p className="text-xs text-slate-400">
                Scroll to zoom / Drag to pan
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveGlobalWeatherMap;
