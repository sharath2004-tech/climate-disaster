import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/useAPI";
import { resourcesAPI } from "@/lib/api";
import {
    AlertCircle, Battery, Clock, Droplets, Hospital, Loader2,
    Locate,
    MapPin,
    Navigation,
    Phone, Plus, Utensils, X
} from "lucide-react";
import { useEffect, useState } from "react";

const categories = [
  { id: "hospital", label: "Hospitals", icon: Hospital, color: "text-destructive" },
  { id: "shelter", label: "Shelters", icon: Hospital, color: "text-primary" },
  { id: "water", label: "Water", icon: Droplets, color: "text-primary" },
  { id: "food", label: "Food", icon: Utensils, color: "text-warning" },
  { id: "power", label: "Power/Charging", icon: Battery, color: "text-success" },
];

interface Resource {
  _id: string;
  name: string;
  type: string;
  location: {
    address?: string;
    city?: string;
    coordinates?: {
      type?: string;
      coordinates: [number, number];
    };
  };
  contact?: {
    phone?: string;
  };
  operatingHours?: string;
  availability: string;
  capacity?: {
    total?: number;
    available?: number;
  };
  description?: string;
}

export function ResourceLocatorSection() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading, refetch } = useResources({ 
    type: activeCategory === "all" ? undefined : activeCategory,
    limit: 50 
  });

  const resources: Resource[] = Array.isArray(data) ? data : (data?.resources || []);

  // Add resource form state
  const [form, setForm] = useState({
    name: "",
    type: "hospital",
    address: "",
    city: "",
    lat: "",
    lon: "",
    phone: "",
    operatingHours: "",
    availability: "available",
    description: "",
    totalCapacity: "",
    availableCapacity: "",
  });

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Mumbai if location not available
          setUserLocation({ lat: 19.076, lng: 72.8777 });
        }
      );
    }
  }, []);

  // Detect location for form
  const detectLocation = async () => {
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

        try {
          // Reverse geocoding using OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();

          const address = data.display_name || '';
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';

          setForm(prev => ({
            ...prev,
            lat: latitude.toFixed(6),
            lon: longitude.toFixed(6),
            address: address,
            city: city,
          }));

          toast({
            title: "Location Detected",
            description: city || address.split(',')[0],
          });
        } catch {
          setForm(prev => ({
            ...prev,
            lat: latitude.toFixed(6),
            lon: longitude.toFixed(6),
          }));
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

  // Submit new resource
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add a resource",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const lat = parseFloat(form.lat) || 19.076;
      const lon = parseFloat(form.lon) || 72.8777;

      // Use suggest endpoint for regular users (will be reviewed by admin)
      await resourcesAPI.suggest({
        name: form.name,
        type: form.type,
        description: form.description || form.operatingHours, // Store hours in description if provided
        location: {
          type: "Point",
          coordinates: [lon, lat],
          address: form.address,
          city: form.city,
        },
        contact: {
          phone: form.phone,
        },
        availability: form.availability,
        capacity: form.totalCapacity ? {
          maximum: parseInt(form.totalCapacity),
          current: parseInt(form.availableCapacity) || parseInt(form.totalCapacity),
        } : undefined,
      });

      toast({
        title: "Resource Submitted",
        description: "Your resource has been submitted for review by admins.",
      });

      // Reset form
      setForm({
        name: "",
        type: "hospital",
        address: "",
        city: "",
        lat: "",
        lon: "",
        phone: "",
        operatingHours: "",
        availability: "open",
        description: "",
        totalCapacity: "",
        availableCapacity: "",
      });
      setShowAddForm(false);
      refetch();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading resources...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent to-muted/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in">
            Resource Locator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-100">
            Find essential services and emergency resources near you
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
            variant={showAddForm ? "destructive" : "default"}
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add Resource"}
          </Button>
          <Button
            onClick={() => setShowMap(!showMap)}
            variant="outline"
            className="gap-2"
          >
            <MapPin className="w-4 h-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        </div>

        {/* Add Resource Form */}
        {showAddForm && (
          <GlassCard className="mb-8 max-w-3xl mx-auto animate-fade-slide-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Resource
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Resource Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="md:col-span-2"
              />

              <Input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              
              <Input
                placeholder="Latitude"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude"
                value={form.lon}
                onChange={(e) => setForm({ ...form, lon: e.target.value })}
                type="number"
                step="any"
              />

              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  className="w-full gap-2"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <Locate className="w-4 h-4" />
                      Detect My Location (Auto-fill address)
                    </>
                  )}
                </Button>
              </div>

              <Input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                placeholder="Operating Hours (e.g., 24/7)"
                value={form.operatingHours}
                onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
              />

              <select
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="available">Open / Available</option>
                <option value="limited">Limited Availability</option>
                <option value="full">Full</option>
                <option value="closed">Closed</option>
              </select>

              <div className="flex gap-2">
                <Input
                  placeholder="Total Capacity"
                  value={form.totalCapacity}
                  onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })}
                  type="number"
                />
                <Input
                  placeholder="Available"
                  value={form.availableCapacity}
                  onChange={(e) => setForm({ ...form, availableCapacity: e.target.value })}
                  type="number"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Resource
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Satellite Map View */}
        {showMap && (
          <div className="mb-8 animate-fade-slide-in">
            <GlassCard className="p-0 overflow-hidden">
              <div className="relative w-full h-[400px]">
                {/* Using OpenStreetMap embed */}
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    (userLocation?.lng || 72.8777) - 0.1
                  }%2C${
                    (userLocation?.lat || 19.076) - 0.1
                  }%2C${
                    (userLocation?.lng || 72.8777) + 0.1
                  }%2C${
                    (userLocation?.lat || 19.076) + 0.1
                  }&layer=mapnik&marker=${userLocation?.lat || 19.076}%2C${userLocation?.lng || 72.8777}`}
                  title="Resources Map"
                />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                  <p className="text-sm font-medium">{resources.length} resources</p>
                </div>
                {/* Resource markers overlay info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <GlassCard className="p-3 flex flex-wrap gap-2">
                    {categories.map(cat => {
                      const count = resources.filter(r => r.type === cat.id).length;
                      if (count === 0) return null;
                      const Icon = cat.icon;
                      return (
                        <span key={cat.id} className="flex items-center gap-1 text-xs">
                          <Icon className={`w-3 h-3 ${cat.color}`} />
                          {count} {cat.label}
                        </span>
                      );
                    })}
                  </GlassCard>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-slide-in delay-200">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            All Resources
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${activeCategory !== cat.id ? cat.color : ""}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Resource Grid */}
        {resources.length === 0 ? (
          <GlassCard className="text-center py-12 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Resources Found</h3>
            <p className="text-muted-foreground mb-4">
              {activeCategory === "all" 
                ? "No resources are available at the moment." 
                : `No ${categories.find(c => c.id === activeCategory)?.label.toLowerCase()} resources found.`}
            </p>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Resource
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => {
              const category = categories.find(c => c.id === resource.type);
              const Icon = category?.icon || Hospital;
              const iconColor = category?.color || "text-primary";

              return (
                <GlassCard
                  key={resource._id}
                  hover
                  className="animate-fade-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-muted/50`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      resource.availability === 'open' 
                        ? 'bg-success/10 text-success' 
                        : resource.availability === 'limited'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {resource.availability}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">{resource.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {resource.location?.address || resource.location?.city || "Location not specified"}
                    </p>
                    {resource.operatingHours && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        {resource.operatingHours}
                      </p>
                    )}
                    {resource.capacity && (
                      <p className="flex items-center gap-2">
                        <span className="text-xs">Capacity: {resource.capacity.available || 0}/{resource.capacity.total || 0}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {resource.contact?.phone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 flex-1"
                        onClick={() => window.open(`tel:${resource.contact?.phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    )}
                    {resource.location?.coordinates?.coordinates && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="gap-1.5 flex-1"
                        onClick={() => {
                          const [lng, lat] = resource.location.coordinates!.coordinates;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                        Directions
                      </Button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
