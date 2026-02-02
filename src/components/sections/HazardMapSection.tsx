import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { alertsAPI, reportsAPI, resourcesAPI } from "@/lib/api";
import { AlertTriangle, Building, Layers, Loader2, Locate, MapPin, Users, ZoomIn, ZoomOut, Navigation, Filter, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const layerOptions = [
  { id: "alerts", label: "Active Alerts", icon: AlertTriangle, active: true, color: "#ef4444" },
  { id: "shelters", label: "Shelters", icon: Building, active: true, color: "#22c55e" },
  { id: "reports", label: "Citizen Reports", icon: Users, active: false, color: "#f59e0b" },
  { id: "resources", label: "Resources", icon: MapPin, active: false, color: "#3b82f6" },
];

interface MapMarker {
  id: string;
  type: 'alert' | 'shelter' | 'report' | 'resource';
  title: string;
  description?: string;
  severity?: string;
  coordinates: [number, number];
}

export function HazardMapSection() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [layers, setLayers] = useState(layerOptions);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937], // India center
      zoom: 4.5,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fetch data
  const fetchMapData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alertsRes, reportsRes, resourcesRes] = await Promise.all([
        alertsAPI.getAll({ limit: 50 }).catch((err) => { console.error('Alerts fetch error:', err); return []; }),
        reportsAPI.getAll({ limit: 50 }).catch((err) => { console.error('Reports fetch error:', err); return { reports: [] }; }),
        resourcesAPI.getAll({ limit: 50 }).catch((err) => { console.error('Resources fetch error:', err); return []; }),
      ]);

      const newMarkers: MapMarker[] = [];

      // Add alerts - API returns array directly
      const alerts = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.alerts || []);
      alerts.forEach((alert: any) => {
        if (alert.location?.coordinates) {
          // Handle both array format [lon, lat] and GeoJSON format
          const coords = Array.isArray(alert.location.coordinates) 
            ? alert.location.coordinates 
            : alert.location.coordinates?.coordinates;
          
          if (coords && coords.length === 2) {
            newMarkers.push({
              id: alert._id,
              type: 'alert',
              title: alert.title || 'Alert',
              description: alert.description,
              severity: alert.severity,
              coordinates: coords as [number, number],
            });
          }
        }
      });

      // Add shelters/resources - API returns array directly
      const resources = Array.isArray(resourcesRes) ? resourcesRes : (resourcesRes?.resources || []);
      resources.forEach((resource: any) => {
        if (resource.location?.coordinates) {
          newMarkers.push({
            id: resource._id,
            type: resource.type === 'shelter' ? 'shelter' : 'resource',
            title: resource.name || 'Resource',
            description: resource.description,
            coordinates: resource.location.coordinates as [number, number],
          });
        }
      });

      // Add reports
      const reports = reportsRes?.reports || reportsRes || [];
      reports.forEach((report: any) => {
        if (report.location?.coordinates) {
          const coords = Array.isArray(report.location.coordinates) 
            ? report.location.coordinates 
            : report.location.coordinates?.coordinates;
          
          if (coords && coords.length === 2) {
            newMarkers.push({
              id: report._id,
              type: 'report',
              title: report.title || 'Report',
              description: report.description,
              severity: report.severity,
              coordinates: coords as [number, number],
            });
          }
        }
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Update markers on map when data or layers change
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter markers based on active layers
    const visibleMarkers = markers.filter(marker => {
      if (marker.type === 'alert') return layers.find(l => l.id === 'alerts')?.active;
      if (marker.type === 'shelter') return layers.find(l => l.id === 'shelters')?.active;
      if (marker.type === 'report') return layers.find(l => l.id === 'reports')?.active;
      if (marker.type === 'resource') return layers.find(l => l.id === 'resources')?.active;
      return false;
    });

    // Add new markers
    visibleMarkers.forEach(markerData => {
      const color = getMarkerColor(markerData.type, markerData.severity);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      el.onmouseenter = () => el.style.transform = 'scale(1.3)';
      el.onmouseleave = () => el.style.transform = 'scale(1)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(markerData.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">${markerData.title}</h4>
                ${markerData.description ? `<p style="font-size: 12px; color: #6b7280; margin: 0;">${markerData.description.substring(0, 100)}...</p>` : ''}
                ${markerData.severity ? `<span style="display: inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 500; background: ${getSeverityColor(markerData.severity)}; color: white;">${markerData.severity.toUpperCase()}</span>` : ''}
              </div>
            `)
        )
        .addTo(map.current!);

      el.onclick = () => setSelectedMarker(markerData);
      markersRef.current.push(marker);
    });
  }, [markers, layers, mapReady]);

  const getMarkerColor = (type: string, severity?: string) => {
    if (type === 'alert') {
      if (severity === 'critical') return '#dc2626';
      if (severity === 'high') return '#ea580c';
      if (severity === 'medium') return '#f59e0b';
      return '#eab308';
    }
    if (type === 'shelter') return '#22c55e';
    if (type === 'report') return '#f59e0b';
    return '#3b82f6';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return '#dc2626';
    if (severity === 'high') return '#ea580c';
    if (severity === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const toggleLayer = (id: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, active: !layer.active } : layer
      )
    );
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (map.current) {
            // Remove existing user marker
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
            }

            // Add user location marker
            const el = document.createElement('div');
            el.style.cssText = `
              width: 20px;
              height: 20px;
              background: #3b82f6;
              border: 4px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
            `;

            userMarkerRef.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
              .addTo(map.current);

            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 12,
              duration: 2000,
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (map.current) {
      const currentZoom = map.current.getZoom();
      map.current.zoomTo(currentZoom + (direction === 'in' ? 1 : -1), { duration: 300 });
    }
  };

  const activeLayerCount = layers.filter(l => l.active).length;
  const visibleMarkerCount = markers.filter(m => {
    if (m.type === 'alert') return layers.find(l => l.id === 'alerts')?.active;
    if (m.type === 'shelter') return layers.find(l => l.id === 'shelters')?.active;
    if (m.type === 'report') return layers.find(l => l.id === 'reports')?.active;
    if (m.type === 'resource') return layers.find(l => l.id === 'resources')?.active;
    return false;
  }).length;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent to-muted/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in">
            Interactive Hazard Map
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-100">
            Real-time visualization of hazards, shelters, and community reports
          </p>
        </div>

        {/* Map Container */}
        <div className="relative animate-fade-slide-in delay-200">
          <GlassCard className="p-0 overflow-hidden">
            {/* Mapbox Map */}
            <div ref={mapContainer} className="relative h-[600px]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Custom Map Controls */}
              <div className="absolute right-4 top-20 flex flex-col gap-2 z-10">
                <Button size="icon" variant="secondary" className="glass w-10 h-10" onClick={() => handleZoom('in')}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="glass w-10 h-10" onClick={() => handleZoom('out')}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="glass w-10 h-10" onClick={handleLocate}>
                  <Locate className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="glass w-10 h-10" onClick={fetchMapData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats overlay */}
              <div className="absolute left-4 top-4 glass-card p-4 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Live Data</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-muted-foreground">Visible Points:</span>
                    <span className="font-medium text-foreground">{visibleMarkerCount}</span>
                  </div>
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-muted-foreground">Active Layers:</span>
                    <span className="font-medium text-foreground">{activeLayerCount}</span>
                  </div>
                  {userLocation && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="absolute left-4 bottom-4 glass-card p-3 z-10">
                <p className="text-xs font-medium text-foreground mb-2">Legend</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Shelters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Resources</span>
                  </div>
                </div>
              </div>

              {/* Selected Marker Info */}
              {selectedMarker && (
                <div className="absolute right-4 bottom-4 glass-card p-4 z-10 max-w-xs">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground">{selectedMarker.title}</h4>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-6 h-6 -mt-1 -mr-1"
                      onClick={() => setSelectedMarker(null)}
                    >
                      ×
                    </Button>
                  </div>
                  {selectedMarker.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedMarker.description.substring(0, 150)}...
                    </p>
                  )}
                  {selectedMarker.severity && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMarker.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      selectedMarker.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedMarker.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Layer Controls */}
            <div className="p-4 border-t border-border/50 bg-card/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Map Layers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{activeLayerCount} active</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {layers.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        layer.active
                          ? "bg-primary text-primary-foreground"
                          : "glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {layer.label}
                      {layer.active && (
                        <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
