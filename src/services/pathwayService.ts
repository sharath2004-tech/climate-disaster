/**
 * Frontend service to integrate with Pathway backend
 * Update your existing API calls to use Pathway endpoints
 */

import axios from 'axios';

// Pathway service base URL (update after deployment)
const PATHWAY_API = import.meta.env.VITE_PATHWAY_API_URL || 'http://localhost:8080';

export class PathwayService {
  
  /**
   * Get real-time weather data for all monitored locations
   */
  static async getWeather() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/weather`);
    return response.data;
  }

  /**
   * Get risk predictions with optional minimum risk filtering
   * @param minRisk - Minimum risk score (0-1)
   */
  static async getRiskPredictions(minRisk = 0.0) {
    const response = await axios.get(`${PATHWAY_API}/api/v1/risk-predictions`, {
      params: { min_risk: minRisk }
    });
    return response.data;
  }

  /**
   * Get active disaster alerts
   */
  static async getAlerts() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/alerts`);
    return response.data;
  }

  /**
   * Submit a citizen report
   */
  static async submitReport(report: {
    latitude: number;
    longitude: number;
    report_type: string;
    severity: number;
    description: string;
    image_url?: string;
    user_id?: string;
  }) {
    const response = await axios.post(`${PATHWAY_API}/api/v1/reports`, report);
    return response.data;
  }

  /**
   * Get all citizen reports
   */
  static async getReports() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/reports`);
    return response.data;
  }

  /**
   * Get verified citizen reports (cross-validated)
   */
  static async getVerifiedReports() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/reports/verified`);
    return response.data;
  }

  /**
   * Get available evacuation shelters
   */
  static async getShelters() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/evacuation/shelters`);
    return response.data;
  }

  /**
   * Get optimal evacuation route for a location
   */
  static async getEvacuationRoute(latitude: number, longitude: number) {
    const response = await axios.post(`${PATHWAY_API}/api/v1/evacuation/route`, {
      latitude,
      longitude
    });
    return response.data;
  }

  /**
   * Get resource allocation recommendations
   */
  static async getResourceAllocation() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/resources/allocation`);
    return response.data;
  }

  /**
   * Get overall system statistics
   */
  static async getStats() {
    const response = await axios.get(`${PATHWAY_API}/api/v1/stats`);
    return response.data;
  }

  /**
   * Stream real-time updates using Server-Sent Events
   * @param callback - Function to call when updates received
   */
  static streamEvents(callback: (data: Record<string, unknown>) => void): EventSource {
    const eventSource = new EventSource(`${PATHWAY_API}/api/v1/stream/events`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
    };

    return eventSource;
  }
}

export default PathwayService;
