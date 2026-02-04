import express from 'express';

const router = express.Router();

/**
 * Weather API Route with Real-time + 7-day Forecast
 * Uses Open-Meteo API (free, no API key required)
 * Provides comprehensive weather data for disaster prediction
 */

// GET /api/weather/current?lat=LAT&lon=LON
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Open-Meteo API - Real-time weather
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
      `precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,` +
      `wind_speed_10m,wind_direction_10m,wind_gusts_10m&` +
      `timezone=auto`
    );

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    
    res.json({
      success: true,
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      current: data.current,
      timezone: data.timezone,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// GET /api/weather/forecast?lat=LAT&lon=LON&days=7
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon, days = 7 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const forecastDays = Math.min(parseInt(days), 16); // Max 16 days

    // Open-Meteo API - 7-day forecast with comprehensive data
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `daily=weather_code,temperature_2m_max,temperature_2m_min,` +
      `apparent_temperature_max,apparent_temperature_min,sunrise,sunset,` +
      `precipitation_sum,rain_sum,precipitation_hours,precipitation_probability_max,` +
      `wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,` +
      `uv_index_max&` +
      `forecast_days=${forecastDays}&` +
      `timezone=auto`
    );

    if (!response.ok) {
      throw new Error('Forecast API failed');
    }

    const data = await response.json();

    // Process and format forecast data
    const forecast = data.daily.time.map((date, index) => ({
      date,
      weather_code: data.daily.weather_code[index],
      temp_max: data.daily.temperature_2m_max[index],
      temp_min: data.daily.temperature_2m_min[index],
      precipitation_sum: data.daily.precipitation_sum[index],
      precipitation_probability: data.daily.precipitation_probability_max[index],
      rain_sum: data.daily.rain_sum[index],
      wind_speed_max: data.daily.wind_speed_10m_max[index],
      wind_gusts_max: data.daily.wind_gusts_10m_max[index],
      wind_direction: data.daily.wind_direction_10m_dominant[index],
      uv_index: data.daily.uv_index_max[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
    }));

    res.json({
      success: true,
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      forecast,
      timezone: data.timezone,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Forecast API error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// GET /api/weather/alerts?lat=LAT&lon=LON
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Fetch current + forecast to analyze disaster risks
    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `daily=weather_code,temperature_2m_max,precipitation_sum,` +
      `rain_sum,wind_speed_10m_max,wind_gusts_10m_max&` +
      `forecast_days=7&timezone=auto`
    );

    const data = await forecastResponse.json();
    const alerts = [];

    // Analyze weather patterns for disaster risks
    data.daily.time.forEach((date, index) => {
      const rainSum = data.daily.rain_sum[index];
      const windSpeed = data.daily.wind_speed_10m_max[index];
      const windGusts = data.daily.wind_gusts_10m_max[index];
      const temp = data.daily.temperature_2m_max[index];

      // Heavy rainfall alert (flood risk)
      if (rainSum > 50) {
        alerts.push({
          type: 'flood',
          severity: rainSum > 100 ? 'severe' : 'moderate',
          date,
          message: `Heavy rainfall expected: ${rainSum.toFixed(1)}mm. Flood risk.`,
          recommendation: 'Monitor flood warnings, prepare emergency kit, avoid low-lying areas.',
        });
      }

      // Strong wind alert (cyclone/storm risk)
      if (windGusts > 60 || windSpeed > 40) {
        alerts.push({
          type: 'storm',
          severity: windGusts > 90 ? 'severe' : 'moderate',
          date,
          message: `Strong winds expected: gusts up to ${windGusts.toFixed(0)} km/h.`,
          recommendation: 'Secure loose objects, stay indoors, avoid coastal areas.',
        });
      }

      // Extreme heat alert
      if (temp > 40) {
        alerts.push({
          type: 'heatwave',
          severity: temp > 45 ? 'severe' : 'moderate',
          date,
          message: `Extreme heat expected: ${temp.toFixed(1)}°C.`,
          recommendation: 'Stay hydrated, avoid outdoor activities, check on elderly.',
        });
      }
    });

    res.json({
      success: true,
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      alerts,
      alert_count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
});

// GET /api/weather/disaster-prediction?lat=LAT&lon=LON
router.get('/disaster-prediction', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Fetch comprehensive weather data
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `daily=weather_code,temperature_2m_max,temperature_2m_min,` +
      `precipitation_sum,rain_sum,precipitation_probability_max,` +
      `wind_speed_10m_max,wind_gusts_10m_max&` +
      `current=temperature_2m,relative_humidity_2m,precipitation,` +
      `wind_speed_10m,wind_gusts_10m,pressure_msl&` +
      `forecast_days=7&timezone=auto`
    );

    const data = await response.json();
    const predictions = [];
    let overallRisk = 'low';

    // Analyze each day for disaster risks
    data.daily.time.forEach((date, index) => {
      const dayPrediction = {
        date,
        risks: [],
        risk_level: 'low',
        weather_summary: getWeatherDescription(data.daily.weather_code[index]),
      };

      const rainSum = data.daily.rain_sum[index];
      const windGusts = data.daily.wind_gusts_10m_max[index];
      const temp = data.daily.temperature_2m_max[index];
      const precipProb = data.daily.precipitation_probability_max[index];

      // Flood Risk Analysis
      if (rainSum > 30 || precipProb > 70) {
        const severity = rainSum > 100 ? 'high' : rainSum > 50 ? 'medium' : 'low';
        dayPrediction.risks.push({
          type: 'flood',
          severity,
          probability: precipProb,
          indicators: `${rainSum.toFixed(1)}mm rainfall expected`,
          actions: [
            'Monitor local flood warnings',
            'Prepare emergency evacuation kit',
            'Avoid low-lying areas and river banks',
            'Keep important documents in waterproof bags',
          ],
        });
        
        if (severity === 'high') {
          dayPrediction.risk_level = 'high';
          overallRisk = 'high';
        }
      }

      // Cyclone/Storm Risk Analysis
      if (windGusts > 50) {
        const severity = windGusts > 90 ? 'high' : windGusts > 60 ? 'medium' : 'low';
        dayPrediction.risks.push({
          type: 'cyclone',
          severity,
          indicators: `Wind gusts up to ${windGusts.toFixed(0)} km/h`,
          actions: [
            'Secure outdoor furniture and objects',
            'Stay indoors during peak winds',
            'Avoid coastal areas and beaches',
            'Charge electronic devices',
            'Store drinking water',
          ],
        });
        
        if (severity === 'high' && overallRisk !== 'high') {
          dayPrediction.risk_level = 'high';
          overallRisk = 'high';
        }
      }

      // Heatwave Risk Analysis
      if (temp > 38) {
        const severity = temp > 45 ? 'high' : temp > 40 ? 'medium' : 'low';
        dayPrediction.risks.push({
          type: 'heatwave',
          severity,
          indicators: `Temperature ${temp.toFixed(1)}°C`,
          actions: [
            'Stay hydrated - drink water every hour',
            'Avoid outdoor activities 11 AM - 4 PM',
            'Wear light, loose-fitting clothes',
            'Check on elderly neighbors',
            'Never leave children/pets in vehicles',
          ],
        });
      }

      if (dayPrediction.risks.length > 0 && dayPrediction.risk_level === 'low') {
        dayPrediction.risk_level = 'medium';
        if (overallRisk === 'low') overallRisk = 'medium';
      }

      predictions.push(dayPrediction);
    });

    // Generate AI-ready context for chatbot
    const aiContext = generateAIContext(predictions, data.current);

    res.json({
      success: true,
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      overall_risk: overallRisk,
      current_conditions: {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        wind_speed: data.current.wind_speed_10m,
        pressure: data.current.pressure_msl,
      },
      predictions,
      ai_context: aiContext,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Disaster prediction error:', error);
    res.status(500).json({ error: 'Failed to generate disaster predictions' });
  }
});

// Helper function to describe weather codes
function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

// Generate AI-ready context from predictions
function generateAIContext(predictions, current) {
  const risks = predictions.flatMap(p => p.risks);
  const highRisks = risks.filter(r => r.severity === 'high');
  const mediumRisks = risks.filter(r => r.severity === 'medium');

  return {
    summary: `Weather analysis for next 7 days shows ${risks.length} potential disaster risks. ` +
             `Current temperature: ${current.temperature_2m}°C, Humidity: ${current.relative_humidity_2m}%. ` +
             `${highRisks.length > 0 ? `HIGH ALERT: ${highRisks[0].type} risk detected.` : ''}`,
    high_priority_risks: highRisks.map(r => r.type),
    medium_priority_risks: mediumRisks.map(r => r.type),
    recommended_actions: highRisks.length > 0 
      ? highRisks[0].actions 
      : mediumRisks.length > 0 
        ? mediumRisks[0].actions 
        : ['Monitor weather updates', 'Keep emergency kit ready'],
  };
}

export default router;
