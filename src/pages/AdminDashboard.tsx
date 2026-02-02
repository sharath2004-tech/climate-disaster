/**
 * Admin Dashboard Page
 * 
 * Central hub for admin/subadmin operations including:
 * - Platform statistics
 * - Emergency alert management
 * - Sub-admin creation (admin only)
 * - Activity monitoring
 */

import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { adminAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Activity,
    AlertTriangle,
    Bell,
    FileWarning,
    Loader2,
    MapPin,
    Package,
    Send,
    Shield,
    UserPlus,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  totalResources: number;
  totalAlerts: number;
  totalCommunityPosts: number;
  activeEmergencyAlerts: number;
  subAdmins: number;
}

interface ActivityItem {
  type: string;
  data: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-admin form
  const [showSubAdminForm, setShowSubAdminForm] = useState(false);
  const [subAdminForm, setSubAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [isCreatingSubAdmin, setIsCreatingSubAdmin] = useState(false);

  // Emergency alert form
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: "",
    message: "",
    severity: "warning",
    address: "",
    city: "",
    lat: "",
    lon: "",
    radius: "5",
    actionRequired: "prepare",
    instructions: "",
  });
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Detect live location with address
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
          // Reverse geocoding using OpenStreetMap Nominatim API (free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              }
            }
          );
          const data = await response.json();

          const address = data.display_name || '';
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';

          setAlertForm(prev => ({
            ...prev,
            lat: latitude.toFixed(6),
            lon: longitude.toFixed(6),
            address: address,
            city: city + (state ? `, ${state}` : ''),
          }));

          toast({
            title: "Location Detected",
            description: `${city || address.split(',')[0]}`,
          });
        } catch {
          // If geocoding fails, still set coordinates
          setAlertForm(prev => ({
            ...prev,
            lat: latitude.toFixed(6),
            lon: longitude.toFixed(6),
          }));
          toast({
            title: "Location Detected",
            description: "Coordinates set, but couldn't fetch address",
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        toast({
          title: "Location Error",
          description: error.message || "Failed to get location",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAuthenticated, user, navigate, toast]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getActivity(),
        ]);
        setStats(statsData);
        setActivity(activityData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'subadmin')) {
      fetchData();
    }
  }, [isAuthenticated, user, toast]);

  // Create sub-admin
  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSubAdmin(true);

    try {
      await adminAPI.createSubAdmin(subAdminForm);
      toast({
        title: "Success",
        description: "Sub-admin created successfully",
      });
      setSubAdminForm({ name: "", email: "", password: "", phone: "" });
      setShowSubAdminForm(false);
      // Refresh stats
      const newStats = await adminAPI.getStats();
      setStats(newStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-admin",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSubAdmin(false);
    }
  };

  // Send emergency alert
  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingAlert(true);

    try {
      const lat = parseFloat(alertForm.lat) || 19.076;
      const lon = parseFloat(alertForm.lon) || 72.8777;

      await adminAPI.sendEmergencyAlert({
        title: alertForm.title,
        message: alertForm.message,
        severity: alertForm.severity,
        targetLocation: {
          type: "Point", // Required for GeoJSON
          coordinates: [lon, lat],
          address: alertForm.address,
          city: alertForm.city,
        },
        affectedRadius: parseFloat(alertForm.radius) || 5,
        actionRequired: alertForm.actionRequired,
        instructions: alertForm.instructions.split('\n').filter((i: string) => i.trim()),
      });

      toast({
        title: "Alert Sent",
        description: "Emergency alert has been sent to the affected area",
      });

      setAlertForm({
        title: "",
        message: "",
        severity: "warning",
        address: "",
        city: "",
        lat: "",
        lon: "",
        radius: "5",
        actionRequired: "prepare",
        instructions: "",
      });
      setShowAlertForm(false);

      // Refresh stats
      const newStats = await adminAPI.getStats();
      setStats(newStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send alert",
        variant: "destructive",
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report': return <FileWarning className="w-4 h-4" />;
      case 'community_post': return <Users className="w-4 h-4" />;
      case 'emergency_alert': return <AlertTriangle className="w-4 h-4" />;
      case 'new_user': return <UserPlus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'subadmin')) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {user?.name} ({user?.role})
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAlertForm(!showAlertForm)}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Send Emergency Alert
            </Button>
            {user?.role === 'admin' && (
              <Button
                onClick={() => setShowSubAdminForm(!showSubAdminForm)}
                variant="outline"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Sub-Admin
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <GlassCard className="text-center p-4">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <FileWarning className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
              <p className="text-xs text-muted-foreground">Reports</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <Package className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalResources}</p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <Bell className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalAlerts}</p>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalCommunityPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </GlassCard>
            <GlassCard className="text-center p-4 border-red-500/30">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{stats.activeEmergencyAlerts}</p>
              <p className="text-xs text-muted-foreground">Emergency</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.subAdmins}</p>
              <p className="text-xs text-muted-foreground">Sub-Admins</p>
            </GlassCard>
          </div>
        )}

        {/* Emergency Alert Form */}
        {showAlertForm && (
          <GlassCard className="border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-foreground">Send Emergency Alert</h2>
            </div>
            <form onSubmit={handleSendAlert} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Alert Title"
                value={alertForm.title}
                onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                required
              />
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="evacuation">Evacuation</option>
              </select>
              <Textarea
                placeholder="Alert Message"
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                className="md:col-span-2"
                required
              />
              <Input
                placeholder="Address/Area"
                value={alertForm.address}
                onChange={(e) => setAlertForm({ ...alertForm, address: e.target.value })}
              />
              <Input
                placeholder="City"
                value={alertForm.city}
                onChange={(e) => setAlertForm({ ...alertForm, city: e.target.value })}
              />
              <Input
                placeholder="Latitude (e.g., 19.076)"
                value={alertForm.lat}
                onChange={(e) => setAlertForm({ ...alertForm, lat: e.target.value })}
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude (e.g., 72.877)"
                value={alertForm.lon}
                onChange={(e) => setAlertForm({ ...alertForm, lon: e.target.value })}
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
                      <MapPin className="w-4 h-4" />
                      Detect My Location (Auto-fill address)
                    </>
                  )}
                </Button>
              </div>
              <Input
                placeholder="Affected Radius (km)"
                value={alertForm.radius}
                onChange={(e) => setAlertForm({ ...alertForm, radius: e.target.value })}
                type="number"
              />
              <select
                value={alertForm.actionRequired}
                onChange={(e) => setAlertForm({ ...alertForm, actionRequired: e.target.value })}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="prepare">Prepare</option>
                <option value="evacuate">Evacuate</option>
                <option value="shelter-in-place">Shelter in Place</option>
                <option value="avoid-area">Avoid Area</option>
                <option value="standby">Standby</option>
                <option value="all-clear">All Clear</option>
              </select>
              <Textarea
                placeholder="Instructions (one per line)"
                value={alertForm.instructions}
                onChange={(e) => setAlertForm({ ...alertForm, instructions: e.target.value })}
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={isSendingAlert} className="bg-red-600 hover:bg-red-700">
                  {isSendingAlert ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Alert
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAlertForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Sub-Admin Form */}
        {showSubAdminForm && user?.role === 'admin' && (
          <GlassCard className="border-cyan-500/30">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-foreground">Create Sub-Admin</h2>
            </div>
            <form onSubmit={handleCreateSubAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Full Name"
                value={subAdminForm.name}
                onChange={(e) => setSubAdminForm({ ...subAdminForm, name: e.target.value })}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={subAdminForm.email}
                onChange={(e) => setSubAdminForm({ ...subAdminForm, email: e.target.value })}
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={subAdminForm.password}
                onChange={(e) => setSubAdminForm({ ...subAdminForm, password: e.target.value })}
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={subAdminForm.phone}
                onChange={(e) => setSubAdminForm({ ...subAdminForm, phone: e.target.value })}
              />
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={isCreatingSubAdmin}>
                  {isCreatingSubAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Sub-Admin"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSubAdminForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Activity Feed */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.slice(0, 20).map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.type === 'emergency_alert' ? "bg-red-500/20 text-red-400" :
                    item.type === 'report' ? "bg-yellow-500/20 text-yellow-400" :
                    item.type === 'new_user' ? "bg-green-500/20 text-green-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.type === 'new_user' 
                        ? `New user: ${item.data.name}`
                        : item.data.title || item.data.name || 'Activity'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </SidebarLayout>
  );
}
