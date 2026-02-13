/**
 * EmergencyAlertsBanner Component
 * 
 * Displays active emergency alerts from admins/subadmins
 * at the top of the page for citizen visibility.
 */

import { emergencyAlertsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, MapPin, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EmergencyAlert {
  _id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'evacuation';
  targetLocation: {
    address?: string;
    city?: string;
  };
  actionRequired: string;
  instructions: string[];
  issuedBy: {
    name: string;
  };
  createdAt: string;
}

export function EmergencyAlertsBanner() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    
    const fetchAlerts = async () => {
      try {
        const data = await emergencyAlertsAPI.getActive();
        setAlerts(data || []);
        setRetryCount(0); // Reset retry count on success
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch emergency alerts:', error);
        
        // Retry logic for cold starts (Render free tier)
        if (retryCount < 3) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff: 1s, 2s, 4s
          console.log(`Retrying emergency alerts fetch in ${retryDelay}ms... (attempt ${retryCount + 1}/3)`);
          
          retryTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        } else {
          setIsLoading(false);
        }
      }
    };

    fetchAlerts();
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [retryCount]);

  // Periodic refresh after initial load
  useEffect(() => {
    if (isLoading || retryCount > 0) return;
    
    const interval = setInterval(async () => {
      try {
        const data = await emergencyAlertsAPI.getActive();
        setAlerts(data || []);
      } catch (error) {
        console.error('Failed to refresh emergency alerts:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isLoading, retryCount]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a._id));

  if (isLoading || visibleAlerts.length === 0) {
    return null;
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'evacuation':
        return 'bg-red-600 border-red-700 text-white';
      case 'critical':
        return 'bg-red-500/90 border-red-600 text-white';
      case 'warning':
        return 'bg-amber-500/90 border-amber-600 text-white';
      case 'info':
      default:
        return 'bg-blue-500/90 border-blue-600 text-white';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'prepare': 'PREPARE',
      'evacuate': 'EVACUATE NOW',
      'shelter-in-place': 'SHELTER IN PLACE',
      'avoid-area': 'AVOID AREA',
      'standby': 'STANDBY',
      'all-clear': 'ALL CLEAR',
    };
    return labels[action] || action.toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert._id}
          className={cn(
            'relative px-4 py-3 border-b',
            getSeverityStyles(alert.severity)
          )}
        >
          <div className="container mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm uppercase tracking-wide px-2 py-0.5 bg-white/20 rounded">
                    {getActionLabel(alert.actionRequired)}
                  </span>
                  <span className="font-semibold">{alert.title}</span>
                </div>
                
                <p className="text-sm opacity-90 mt-1">{alert.message}</p>
                
                {alert.instructions && alert.instructions.length > 0 && (
                  <ul className="text-sm mt-2 space-y-1">
                    {alert.instructions.slice(0, 3).map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="opacity-60">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs opacity-80">
                  {alert.targetLocation?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alert.targetLocation.address || alert.targetLocation.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(alert.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {alert.issuedBy?.name || 'SKYNETRA Admin'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => dismissAlert(alert._id)}
                className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmergencyAlertsBanner;
