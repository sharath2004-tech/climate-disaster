/**
 * Example: How to Send Current Weather Data to Pathway Service
 * 
 * This demonstrates various ways to submit weather/disaster reports
 * to the Pathway backend API
 */

import axios from 'axios';
import { PathwayService } from '../services/pathwayService';

// ============================================
// Method 1: Using PathwayService class
// ============================================
export async function submitCurrentWeather(currentWeather: {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}) {
  try {
    const response = await PathwayService.submitReport({
      latitude: currentWeather.latitude,
      longitude: currentWeather.longitude,
      report_type: 'weather_observation',
      severity: calculateSeverity(currentWeather),
      description: `Weather Report: Temp ${currentWeather.temperature}°C, Humidity ${currentWeather.humidity}%, Wind ${currentWeather.windSpeed} m/s, Condition: ${currentWeather.condition}`,
      user_id: 'current_user_id' // Get from auth context
    });

    console.log('Weather report submitted:', response);
    return response;
  } catch (error) {
    console.error('Failed to submit weather report:', error);
    throw error;
  }
}

// Helper function to calculate severity based on weather conditions
function calculateSeverity(weather: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}): number {
  let severity = 1; // Base severity

  // Temperature factors
  if (weather.temperature > 40) severity += 3;
  else if (weather.temperature > 35) severity += 2;
  else if (weather.temperature < 0) severity += 2;

  // Humidity factors
  if (weather.humidity > 90) severity += 1;

  // Wind speed factors
  if (weather.windSpeed > 20) severity += 3;
  else if (weather.windSpeed > 15) severity += 2;
  else if (weather.windSpeed > 10) severity += 1;

  // Condition factors
  const dangerousConditions = ['thunderstorm', 'tornado', 'hurricane', 'flood'];
  if (dangerousConditions.some(cond => weather.condition.toLowerCase().includes(cond))) {
    severity += 3;
  }

  return Math.min(severity, 10); // Cap at 10
}

// ============================================
// Method 2: Direct API call with axios
// ============================================
export async function submitWeatherReport(data: {
  lat: number;
  lon: number;
  weather: any;
}) {
  const PATHWAY_API = import.meta.env.VITE_PATHWAY_API_URL || 'http://localhost:8080';

  try {
    const response = await axios.post(`${PATHWAY_API}/api/v1/reports`, {
      latitude: data.lat,
      longitude: data.lon,
      report_type: 'weather',
      severity: 5,
      description: JSON.stringify(data.weather),
      timestamp: Date.now()
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting weather report:', error);
    throw error;
  }
}

// ============================================
// Method 3: Batch submit multiple weather observations
// ============================================
export async function submitMultipleWeatherReports(locations: Array<{
  name: string;
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}>) {
  const PATHWAY_API = import.meta.env.VITE_PATHWAY_API_URL || 'http://localhost:8080';

  const promises = locations.map(location => 
    axios.post(`${PATHWAY_API}/api/v1/reports`, {
      latitude: location.lat,
      longitude: location.lon,
      report_type: 'weather_observation',
      severity: calculateSeverity({
        temperature: location.temp,
        humidity: location.humidity,
        windSpeed: location.windSpeed,
        condition: location.condition
      }),
      description: `${location.name}: ${location.temp}°C, ${location.humidity}% humidity, ${location.windSpeed} m/s wind, ${location.condition}`
    })
  );

  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Submitted ${successful} weather reports, ${failed} failed`);
    return { successful, failed, results };
  } catch (error) {
    console.error('Error in batch submission:', error);
    throw error;
  }
}

// ============================================
// Method 4: Real-time weather monitoring
// ============================================
export class WeatherMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  
  /**
   * Start monitoring and sending weather data every interval
   * @param getCurrentWeather - Function that returns current weather data
   * @param intervalMs - How often to send data (default: 5 minutes)
   */
  startMonitoring(
    getCurrentWeather: () => Promise<{
      lat: number;
      lon: number;
      temp: number;
      humidity: number;
      windSpeed: number;
      condition: string;
    }>,
    intervalMs: number = 5 * 60 * 1000 // 5 minutes
  ) {
    // Send immediately
    this.sendWeatherUpdate(getCurrentWeather);

    // Then send at intervals
    this.intervalId = setInterval(async () => {
      await this.sendWeatherUpdate(getCurrentWeather);
    }, intervalMs);

    console.log(`Weather monitoring started (interval: ${intervalMs}ms)`);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Weather monitoring stopped');
    }
  }

  private async sendWeatherUpdate(
    getCurrentWeather: () => Promise<{
      lat: number;
      lon: number;
      temp: number;
      humidity: number;
      windSpeed: number;
      condition: string;
    }>
  ) {
    try {
      const weather = await getCurrentWeather();
      await submitCurrentWeather({
        latitude: weather.lat,
        longitude: weather.lon,
        temperature: weather.temp,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        condition: weather.condition
      });
      console.log('Weather update sent successfully');
    } catch (error) {
      console.error('Failed to send weather update:', error);
    }
  }
}

// ============================================
// Example Usage in React Component
// ============================================
export function ExampleWeatherReportComponent() {
  const handleSubmitWeather = async () => {
    // Get current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // Example: Fetch weather from your weather API
      const weatherData = {
        latitude,
        longitude,
        temperature: 28.5,
        humidity: 75,
        windSpeed: 12.5,
        condition: 'Cloudy'
      };

      // Submit to Pathway service
      try {
        const result = await submitCurrentWeather(weatherData);
        console.log('Weather submitted:', result);
        // Show success notification to user
      } catch (error) {
        console.error('Failed to submit:', error);
        // Show error notification to user
      }
    });
  };

  return (
    <button onClick={handleSubmitWeather}>
      Report Current Weather
    </button>
  );
}

// ============================================
// Testing the Pathway Service
// ============================================
export async function testPathwayService() {
  const PATHWAY_API = import.meta.env.VITE_PATHWAY_API_URL || 'http://localhost:8080';

  console.log('🧪 Testing Pathway Service...');

  // 1. Health check
  try {
    const health = await axios.get(`${PATHWAY_API}/health`);
    console.log('✅ Service is running:', health.data);
  } catch (error) {
    console.error('❌ Service is not accessible:', error);
    return false;
  }

  // 2. Get current weather data
  try {
    const weather = await PathwayService.getWeather();
    console.log('✅ Weather data received:', weather);
  } catch (error) {
    console.error('❌ Failed to get weather:', error);
  }

  // 3. Submit test weather report
  try {
    const testReport = await PathwayService.submitReport({
      latitude: 40.7128,
      longitude: -74.0060,
      report_type: 'weather',
      severity: 5,
      description: 'Test weather report: 25°C, clear sky'
    });
    console.log('✅ Test report submitted:', testReport);
  } catch (error) {
    console.error('❌ Failed to submit report:', error);
  }

  // 4. Get risk predictions
  try {
    const risks = await PathwayService.getRiskPredictions(0.3);
    console.log('✅ Risk predictions:', risks);
  } catch (error) {
    console.error('❌ Failed to get risks:', error);
  }

  return true;
}
