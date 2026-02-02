import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEvacuationRoutes } from "@/hooks/useAPI";
import { resourcesAPI } from "@/lib/api";
import { AlertCircle, Building, Loader2, Locate, MapPin, Navigation, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Shelter {
  _id: string;
  name: string;
  location: {
    address?: string;
    city?: string;
    coordinates?: {
      coordinates: [number, number];
    };
  };
  contact?: {
    phone?: string;
  };
  capacity?: {
    total?: number;
    available?: number;
  };
  facilities?: string[];
  type: string;
}

export function EvacuationSection() {
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { data, isLoading } = useEvacuationRoutes({ active: true });
  
  // Also fetch shelters from resources
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(true);

  // Fetch shelters on mount
  useEffect(() => {
    resourcesAPI.getAll({ type: 'shelter' })
      .then((data: unknown) => {
        const result = data as { resources?: Shelter[] } | Shelter[];
        setShelters(Array.isArray(result) ? result : result?.resources || []);
        setLoadingShelters(false);
      })
      .catch(() => setLoadingShelters(false));
  }, []);

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            const state = data.address?.state || '';
            setSearchLocation(`${city}${state ? ', ' + state : ''}`);
          } catch {
            setSearchLocation("Current Location");
          }
        },
        () => {
          // Default to Mumbai if location not available
          setUserLocation({ lat: 19.076, lng: 72.8777 });
          setSearchLocation("Mumbai, Maharashtra");
        }
      );
    }
  }, []);

  const evacuationRoutes = data?.routes || data || [];

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          setSearchLocation(`${city}${state ? ', ' + state : ''}`);
          
          toast({
            title: "Location Detected",
            description: `${city}${state ? ', ' + state : ''}`,
          });
        } catch {
          setSearchLocation("Current Location");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoading || loadingShelters) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading evacuation information...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Emergency Services</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
            Evacuation & Shelter Finder
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-200">
            Find the nearest safe shelters and evacuation routes
          </p>
        </div>

        {/* Location Input */}
        <div className="max-w-xl mx-auto mb-12 animate-fade-slide-in delay-300">
          <GlassCard className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-grow relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your current location..."
                    className="pl-10 h-12 bg-background/50 border-border/50"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <Button 
                  className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
              >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Locate className="w-4 h-4" />
                      Detect Location
                    </>
                  )}
              </Button>
              </div>
              {userLocation && (
                <p className="text-xs text-muted-foreground text-center">
                  📍 Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shelter List */}
          <div className="space-y-4">
            {shelters.length === 0 ? (
              <GlassCard className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Shelters Found</h3>
                <p className="text-muted-foreground">No emergency shelters are currently registered in the system.</p>
              </GlassCard>
            ) : (
              shelters.map((shelter, index) => {
                const availabilityPercent = shelter.capacity 
                  ? ((shelter.capacity.available || 0) / (shelter.capacity.total || 1)) * 100 
                  : 50;
                const isLowCapacity = availabilityPercent < 20;

                return (
                  <GlassCard
                    key={shelter._id}
                    hover
                    className={`animate-fade-slide-in ${index === 0 ? "ring-2 ring-primary/30" : ""}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                              Nearest
                            </span>
                          )}
                          <h3 className="text-lg font-semibold text-foreground">{shelter.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {shelter.location?.address || shelter.location?.city || "Location not specified"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">Nearby</p>
                        <p className="text-xs text-muted-foreground">shelter</p>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    {shelter.capacity && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Available Capacity
                          </span>
                          <span className={`font-medium ${isLowCapacity ? "text-destructive" : "text-success"}`}>
                            {shelter.capacity.available || 0} / {shelter.capacity.total || 0}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLowCapacity ? "bg-destructive" : "bg-success"
                            }`}
                            style={{ width: `${availabilityPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Facilities */}
                    {shelter.facilities && shelter.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {shelter.facilities.map((facility) => (
                          <span
                            key={facility}
                            className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {shelter.contact?.phone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1.5 flex-1"
                          onClick={() => window.open(`tel:${shelter.contact?.phone}`)}
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="gap-1.5 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => {
                          if (shelter.location?.coordinates) {
                            const [lng, lat] = shelter.location.coordinates.coordinates;
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                          }
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                      </Button>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>

          {/* Map Preview - Satellite View */}
          <div className="animate-fade-slide-in delay-400">
            <GlassCard className="h-full min-h-[500px] p-0 overflow-hidden">
              <div className="relative h-full">
                {/* OpenStreetMap Satellite View */}
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "500px" }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    (userLocation?.lng || 72.8777) - 0.05
                  }%2C${
                    (userLocation?.lat || 19.076) - 0.05
                  }%2C${
                    (userLocation?.lng || 72.8777) + 0.05
                  }%2C${
                    (userLocation?.lat || 19.076) + 0.05
                  }&layer=mapnik&marker=${userLocation?.lat || 19.076}%2C${userLocation?.lng || 72.8777}`}
                  title="Evacuation Map"
                />
                
                {/* Overlay Info */}
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    {shelters.length} shelters
                  </p>
                </div>

                {/* Shelter Legend */}
                <div className="absolute bottom-4 left-4 right-4">
                  <GlassCard className="p-3">
                    <p className="text-xs text-muted-foreground mb-2">Nearby Shelters:</p>
                    <div className="flex flex-wrap gap-2">
                      {shelters.slice(0, 4).map((shelter) => (
                        <Button
                          key={shelter._id}
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => {
                            if (shelter.location?.coordinates) {
                              const [lng, lat] = shelter.location.coordinates.coordinates;
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                            }
                          }}
                        >
                          <Building className="w-3 h-3" />
                          {shelter.name.slice(0, 20)}
                        </Button>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
