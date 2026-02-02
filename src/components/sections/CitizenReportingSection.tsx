import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/hooks/useAPI";
import { reportsAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Camera, CheckCircle, FileWarning, Loader2, MapPin, Send } from "lucide-react";
import { useState } from "react";

const incidentTypes = [
  { value: "flood", label: "Flooding" },
  { value: "road_blockage", label: "Road Blockage" },
  { value: "power_outage", label: "Power Outage" },
  { value: "structural_damage", label: "Damaged Structure" },
  { value: "fire", label: "Fire" },
  { value: "landslide", label: "Landslide" },
  { value: "other", label: "Other" },
];

export function CitizenReportingSection() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    location: "",
    severity: "medium",
    photo: null as File | null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: reportsData } = useReports({ limit: 5 });

  // Get user location
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setFormData(prev => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          }));
          toast({
            title: "Location detected",
            description: "Your current location has been added.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not detect your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const reportData = {
        type: formData.type,
        title: `${incidentTypes.find(t => t.value === formData.type)?.label || formData.type} Report`,
        description: formData.description,
        severity: formData.severity,
        location: {
          address: formData.location,
          ...(userLocation && {
            coordinates: {
              type: "Point",
              coordinates: [userLocation.lng, userLocation.lat],
            },
          }),
        },
      };

      await reportsAPI.create(reportData);
      
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      setSubmitted(true);
      toast({
        title: "Report submitted!",
        description: "Thank you for helping keep your community safe.",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          type: "",
          description: "",
          location: "",
          severity: "medium",
          photo: null,
        });
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Could not submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recentReports = reportsData?.reports || reportsData || [];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
            <FileWarning className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Community Reports</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
            Citizen Reporting
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-slide-in delay-200">
            Report incidents to help your community stay safe
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <GlassCard className="animate-fade-slide-in delay-300">
              {submitted ? (
                <div className="text-center py-12 animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Report Submitted!</h3>
                  <p className="text-muted-foreground">Thank you for helping keep your community safe.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Incident Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-foreground">Incident Type</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="h-12 bg-background/50 border-border/50">
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the incident..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="min-h-[120px] bg-background/50 border-border/50"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-foreground">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="Auto-detect or enter location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="pl-10 h-12 bg-background/50 border-border/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                        onClick={detectLocation}
                      >
                        Auto-detect
                      </Button>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Upload Photo (Optional)</Label>
                    <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setFormData({ ...formData, photo: file });
                        }}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formData.photo ? formData.photo.name : "Click to upload or drag and drop"}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading || !formData.type || !formData.description}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Recent Reports Preview */}
          <div className="lg:col-span-2 animate-fade-slide-in delay-400">
            <GlassCard className="h-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reports Nearby</h3>
              {recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reports yet. Be the first to report!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReports.slice(0, 5).map((report: any, index: number) => (
                    <div key={report._id || index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        report.verified ? "bg-success" : "bg-warning"
                      }`} />
                      <div className="flex-grow">
                        <p className="font-medium text-foreground text-sm">
                          {incidentTypes.find(t => t.value === report.type)?.label || report.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.location?.address || "Unknown location"} • {formatTimeAgo(report.createdAt)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        report.verified 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      }`}>
                        {report.verified ? "verified" : report.status || "pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}
