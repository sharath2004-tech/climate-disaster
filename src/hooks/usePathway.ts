/**
 * React Hook for real-time Pathway data updates
 */

import PathwayService from '@/services/pathwayService';
import { useCallback, useEffect, useState } from 'react';

export interface RiskPrediction {
  location: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  risk_score: number;
  predicted_event_type: string;
  confidence: number;
  time_to_event_hours: number;
  recommended_actions: string;
}

export interface Alert {
  alert_id: string;
  timestamp: number;
  location: string;
  latitude: number;
  longitude: number;
  alert_level: string;
  event_type: string;
  risk_score: number;
  message: string;
  color_code: string;
  expires_at: number;
  population_affected: number;
}

/**
 * Hook to get real-time risk predictions
 */
export const useRiskPredictions = (minRisk = 0.0) => {
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PathwayService.getRiskPredictions(minRisk);
      setPredictions(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  }, [minRisk]);

  useEffect(() => {
    fetchPredictions();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchPredictions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return { predictions, loading, error, refresh: fetchPredictions };
};

/**
 * Hook to get real-time alerts
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PathwayService.getAlerts();
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refresh: fetchAlerts };
};

/**
 * Hook to stream real-time updates
 */
export const useRealtimeStream = () => {
  const [streamData, setStreamData] = useState<Record<string, unknown>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    
    const eventSource = PathwayService.streamEvents((data) => {
      setStreamData(data);
    });

    eventSource.addEventListener('open', () => {
      setIsConnected(true);
    });

    eventSource.addEventListener('error', () => {
      setIsConnected(false);
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return { streamData, isConnected };
};

/**
 * Hook to get system statistics
 */
export const usePathwayStats = () => {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await PathwayService.getStats();
        setStats(response.stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10 * 1000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};
