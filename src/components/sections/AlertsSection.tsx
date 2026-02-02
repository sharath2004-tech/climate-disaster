import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAlerts } from "@/hooks/useAPI";
import { AlertCircle, AlertTriangle, Bell, Check, Clock, Info, Loader2, MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Alert {
  _id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location: {
    address?: string;
    city?: string;
  };
  createdAt: string;
  isRead?: boolean;
}

const alertStyles = {
  critical: {
    icon: AlertCircle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
  },
  high: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    iconColor: "text-warning",
  },
  medium: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    iconColor: "text-warning",
  },
  low: {
    icon: Info,
    bg: "bg-primary/10",
    border: "border-primary/30",
    iconColor: "text-primary",
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export function AlertsSection() {
  const { data, isLoading, error, refetch, isFetching } = useAlerts({ limit: 20 });
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [previousAlertCount, setPreviousAlertCount] = useState(0);
  const { toast } = useToast();

  // Auto-refresh alerts every 30 seconds
  const handleRefresh = useCallback(async () => {
    await refetch();
    setLastUpdated(new Date());
  }, [refetch]);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh, handleRefresh]);

  // Check for new alerts and notify user
  useEffect(() => {
    // API returns array directly, not wrapped in object
    const alerts: Alert[] = Array.isArray(data) ? data : (data?.alerts || []);
    const unreadCount = alerts.filter(a => !readAlerts.has(a._id)).length;
    
    // Detect new alerts
    if (previousAlertCount > 0 && alerts.length > previousAlertCount) {
      const newAlertsCount = alerts.length - previousAlertCount;
      toast({
        title: `🔔 ${newAlertsCount} New Alert${newAlertsCount > 1 ? 's' : ''}`,
        description: "Check the latest disaster alerts below",
      });
    }
    
    setPreviousAlertCount(alerts.length);
    
    if (unreadCount > 0 && alerts.length > 0) {
      // Check if any critical alerts
      const criticalAlerts = alerts.filter(a => 
        a.severity === 'critical' && !readAlerts.has(a._id)
      );
      
      if (criticalAlerts.length > 0) {
        toast({
          title: "⚠️ Critical Alert!",
          description: criticalAlerts[0].title,
          variant: "destructive",
        });
      }
    }
  }, [data, readAlerts, toast, previousAlertCount]);

  const markAsRead = (id: string) => {
    setReadAlerts(prev => new Set([...prev, id]));
    toast({
      title: "Alert marked as read",
      description: "This alert has been marked as read.",
    });
  };

  if (isLoading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading alerts...</span>
          </div>
        </div>
      </section>
    );
  }

  const alerts: Alert[] = Array.isArray(data) ? data : (data?.alerts || []);

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Live Updates</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
            Alerts & Notifications
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-slide-in delay-200">
            Stay informed with the latest disaster alerts in your area
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isAutoRefresh ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className="gap-2"
            >
              {isAutoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isAutoRefresh ? "Live" : "Paused"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="gap-2"
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alert Timeline */}
        {alerts.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">There are no active alerts in your area at the moment.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const style = alertStyles[alert.severity as keyof typeof alertStyles] || alertStyles.low;
              const Icon = style.icon;
              const isRead = readAlerts.has(alert._id);

              return (
                <GlassCard
                  key={alert._id}
                  hover
                  className={`animate-slide-right border-l-4 ${style.border} ${!isRead ? "ring-2 ring-primary/20" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-3 rounded-xl ${style.bg} h-fit`}>
                      <Icon className={`w-6 h-6 ${style.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{alert.title}</h3>
                        {!isRead && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{alert.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.location?.address || alert.location?.city || "Unknown location"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant={isRead ? "ghost" : "outline"}
                        className="gap-1.5"
                        onClick={() => markAsRead(alert._id)}
                        disabled={isRead}
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">{isRead ? "Read" : "Mark Read"}</span>
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {alerts.length > 0 && (
          <div className="text-center mt-8 animate-fade-in delay-500">
            <Button variant="outline" className="glass" onClick={() => refetch()}>
              Refresh Alerts
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
