/**
 * WeatherMapPage
 * 
 * Full-screen weather visualization page for SKYNETRA platform.
 * Displays live global weather patterns with layer controls and
 * provides plain-language weather interpretation for users.
 * 
 * @author SKYNETRA Team
 */

import { Button } from '@/components/ui/button';
import LiveGlobalWeatherMap from '@/components/weather/LiveGlobalWeatherMap';
import { cn } from '@/lib/utils';
import {
    getMockWeatherData,
    interpretWeatherConditions,
    type NearbyWeatherData,
    type UserLocation,
    type WeatherInterpretation
} from '@/lib/weatherInterpretation';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WeatherMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentLayer, setCurrentLayer] = useState<string>('wind');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [weatherData, setWeatherData] = useState<NearbyWeatherData | null>(null);
  const [interpretation, setInterpretation] = useState<WeatherInterpretation | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setIsLocating(false);
        
        // Get mock weather data for this location
        // In production, this would call a real weather API
        const mockData = getMockWeatherData(location.latitude, location.longitude);
        setWeatherData(mockData);
        
        // Generate interpretation
        const interp = interpretWeatherConditions(location, currentLayer, mockData);
        setInterpretation(interp);
        setShowInterpretation(true);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [currentLayer]);

  // Update interpretation when layer changes
  useEffect(() => {
    if (userLocation && weatherData) {
      const interp = interpretWeatherConditions(userLocation, currentLayer, weatherData);
      setInterpretation(interp);
    }
  }, [currentLayer, userLocation, weatherData]);

  // Handle layer change from map
  const handleLayerChange = useCallback((layer: string) => {
    setCurrentLayer(layer);
  }, []);

  // Get severity color
  const getSeverityColor = (severity: WeatherInterpretation['severity']) => {
    switch (severity) {
      case 'warning':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'caution':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
      case 'moderate':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'calm':
      default:
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      {/* Main Weather Map */}
      <LiveGlobalWeatherMap
        initialLat={20}
        initialLon={78} // Centered on India
        initialZoom={4}
        initialLayer="wind"
        onLayerChange={handleLayerChange}
        showControls={true}
      />

      {/* Back to Home Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="bg-slate-900/90 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md"
        >
          Back to SKYNETRA
        </Button>
      </div>

      {/* Location-based Weather Analysis Button */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={getUserLocation}
          disabled={isLocating}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-md"
        >
          {isLocating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Locating...
            </span>
          ) : (
            'Analyze Weather at My Location'
          )}
        </Button>
        
        {locationError && (
          <p className="mt-2 text-sm text-red-400 text-center bg-slate-900/80 px-3 py-1 rounded">
            {locationError}
          </p>
        )}
      </div>

      {/* Weather Interpretation Panel */}
      {showInterpretation && interpretation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
            {/* Header with severity indicator */}
            <div className={cn(
              'px-4 py-3 border-b border-slate-700/50',
              getSeverityColor(interpretation.severity)
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    Weather Analysis for Your Location
                  </p>
                  <p className="font-medium mt-1">
                    {interpretation.summary}
                  </p>
                </div>
                <button
                  onClick={() => setShowInterpretation(false)}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
              {/* Current Conditions */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Current Conditions
                </p>
                <ul className="space-y-1">
                  {interpretation.conditions.map((condition, idx) => (
                    <li key={idx} className="text-sm text-slate-300">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Be Aware */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Be Aware
                </p>
                <ul className="space-y-1">
                  {interpretation.awareness.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Recommendation
                </p>
                <p className="text-sm text-cyan-400">
                  {interpretation.recommendation}
                </p>
              </div>

              {/* Location Info */}
              {userLocation && (
                <div className="pt-2 text-xs text-slate-500">
                  Location: {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherMapPage;
