/**
 * Weather Interpretation Utilities
 * 
 * Provides plain-language explanations of weather conditions
 * for citizen understanding. Focused on clarity and safety.
 * 
 * @author SKYNETRA Team
 */

// Types for weather data
export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface NearbyWeatherData {
  windSpeed?: number; // km/h
  windDirection?: string; // N, NE, E, SE, S, SW, W, NW
  precipitation?: number; // mm/h
  cloudCover?: number; // percentage 0-100
  temperature?: number; // Celsius
  pressure?: number; // hPa
  humidity?: number; // percentage 0-100
  visibility?: number; // km
  stormPresent?: boolean;
  stormDistance?: number; // km
  stormDirection?: string; // direction storm is FROM
  stormMovingToward?: boolean;
  cyclonePresent?: boolean;
  cycloneCategory?: number; // 1-5
}

export interface WeatherInterpretation {
  summary: string;
  conditions: string[];
  awareness: string[];
  recommendation: string;
  severity: 'calm' | 'moderate' | 'caution' | 'warning';
}

/**
 * Cardinal direction descriptions for plain language
 */
const DIRECTION_NAMES: Record<string, string> = {
  N: 'from the north',
  NE: 'from the northeast',
  E: 'from the east',
  SE: 'from the southeast',
  S: 'from the south',
  SW: 'from the southwest',
  W: 'from the west',
  NW: 'from the northwest',
};

/**
 * Describes wind conditions in plain language
 */
const describeWind = (speed: number, direction?: string): string => {
  const directionText = direction ? DIRECTION_NAMES[direction] || '' : '';
  
  if (speed < 5) {
    return 'Winds are calm with little to no movement.';
  } else if (speed < 20) {
    return `Light breeze ${directionText} at ${speed} km/h.`;
  } else if (speed < 40) {
    return `Moderate winds ${directionText} at ${speed} km/h. You may notice movement in trees.`;
  } else if (speed < 60) {
    return `Strong winds ${directionText} at ${speed} km/h. Outdoor activities may be affected.`;
  } else if (speed < 90) {
    return `Very strong winds ${directionText} at ${speed} km/h. Walking may be difficult. Secure loose items.`;
  } else {
    return `Dangerous wind speeds ${directionText} at ${speed} km/h. Stay indoors if possible.`;
  }
};

/**
 * Describes precipitation conditions
 */
const describePrecipitation = (mmPerHour: number): string => {
  if (mmPerHour === 0) {
    return 'No rainfall expected in your area.';
  } else if (mmPerHour < 2.5) {
    return 'Light rain is occurring. An umbrella should be sufficient.';
  } else if (mmPerHour < 7.5) {
    return 'Moderate rain is falling. Roads may become wet and slippery.';
  } else if (mmPerHour < 15) {
    return 'Heavy rain in your area. Some water accumulation is possible.';
  } else if (mmPerHour < 30) {
    return 'Very heavy rainfall. Localized flooding may occur in low-lying areas.';
  } else {
    return 'Intense rainfall. Flash flooding is possible. Avoid flood-prone areas.';
  }
};

/**
 * Describes cloud cover
 */
const describeCloudCover = (percentage: number): string => {
  if (percentage < 10) {
    return 'Clear skies with excellent visibility.';
  } else if (percentage < 30) {
    return 'Mostly clear with a few clouds.';
  } else if (percentage < 60) {
    return 'Partly cloudy conditions.';
  } else if (percentage < 85) {
    return 'Mostly cloudy. Reduced sunlight.';
  } else {
    return 'Overcast skies with full cloud coverage.';
  }
};

/**
 * Describes storm proximity and movement
 */
const describeStorm = (
  distance: number,
  direction: string,
  movingToward: boolean
): string => {
  const dirText = DIRECTION_NAMES[direction] || 'nearby';
  
  if (distance < 10) {
    return `A storm system is very close, ${dirText}. Monitor conditions closely.`;
  } else if (distance < 50) {
    const movement = movingToward
      ? 'It appears to be moving in your direction.'
      : 'It does not appear to be heading toward you at this time.';
    return `A storm system is about ${distance} km away, ${dirText}. ${movement}`;
  } else {
    return `A storm system has been detected ${distance} km away, ${dirText}. It is not an immediate concern.`;
  }
};

/**
 * Describes cyclone/hurricane conditions
 */
const describeCyclone = (category: number, distance?: number): string => {
  const categoryDescriptions: Record<number, string> = {
    1: 'Category 1 - Minimal damage potential',
    2: 'Category 2 - Moderate damage potential',
    3: 'Category 3 - Significant damage potential',
    4: 'Category 4 - Severe damage potential',
    5: 'Category 5 - Catastrophic damage potential',
  };

  const catDesc = categoryDescriptions[category] || `Category ${category}`;
  
  if (distance && distance < 100) {
    return `A tropical cyclone (${catDesc}) is within 100 km of your location. Follow official evacuation guidance if issued.`;
  } else if (distance && distance < 300) {
    return `A tropical cyclone (${catDesc}) has been detected ${distance} km away. Stay informed through official channels.`;
  } else {
    return `A tropical cyclone (${catDesc}) is in your region. Monitor official weather bulletins.`;
  }
};

/**
 * Determines overall severity based on conditions
 */
const determineSeverity = (data: NearbyWeatherData): WeatherInterpretation['severity'] => {
  if (data.cyclonePresent && data.cycloneCategory && data.cycloneCategory >= 3) {
    return 'warning';
  }
  if (data.stormPresent && data.stormDistance && data.stormDistance < 20) {
    return 'warning';
  }
  if (data.windSpeed && data.windSpeed > 80) {
    return 'warning';
  }
  if (data.precipitation && data.precipitation > 20) {
    return 'caution';
  }
  if (data.cyclonePresent || (data.stormPresent && data.stormMovingToward)) {
    return 'caution';
  }
  if (data.windSpeed && data.windSpeed > 40) {
    return 'moderate';
  }
  if (data.precipitation && data.precipitation > 7) {
    return 'moderate';
  }
  return 'calm';
};

/**
 * Main interpretation function
 * 
 * Takes user location, current weather layer, and nearby weather data
 * Returns a plain-language explanation suitable for citizens
 * 
 * @param location - User's latitude and longitude
 * @param currentLayer - Currently selected weather visualization layer
 * @param weatherData - Nearby weather conditions (can be real or mocked)
 * @returns WeatherInterpretation object with summary, conditions, awareness, and recommendation
 */
export const interpretWeatherConditions = (
  location: UserLocation,
  currentLayer: string,
  weatherData: NearbyWeatherData
): WeatherInterpretation => {
  const conditions: string[] = [];
  const awareness: string[] = [];
  let recommendation = 'Conditions are favorable for normal activities.';
  
  // Describe wind if present
  if (weatherData.windSpeed !== undefined) {
    conditions.push(describeWind(weatherData.windSpeed, weatherData.windDirection));
    
    if (weatherData.windSpeed > 40) {
      awareness.push('Strong winds may affect travel and outdoor activities.');
    }
  }

  // Describe precipitation if present
  if (weatherData.precipitation !== undefined) {
    conditions.push(describePrecipitation(weatherData.precipitation));
    
    if (weatherData.precipitation > 10) {
      awareness.push('Heavy rain may cause road hazards and reduced visibility.');
    }
  }

  // Describe cloud cover
  if (weatherData.cloudCover !== undefined) {
    conditions.push(describeCloudCover(weatherData.cloudCover));
  }

  // Describe temperature if available
  if (weatherData.temperature !== undefined) {
    if (weatherData.temperature > 35) {
      conditions.push(`Temperature is high at ${weatherData.temperature}°C. Stay hydrated.`);
      awareness.push('Heat advisory: Take precautions against heat-related illness.');
    } else if (weatherData.temperature < 5) {
      conditions.push(`Temperature is cold at ${weatherData.temperature}°C. Dress warmly.`);
      awareness.push('Cold weather: Protect against hypothermia if outdoors for extended periods.');
    } else {
      conditions.push(`Temperature is ${weatherData.temperature}°C.`);
    }
  }

  // Describe storm if present
  if (weatherData.stormPresent && weatherData.stormDistance !== undefined && weatherData.stormDirection) {
    conditions.push(
      describeStorm(
        weatherData.stormDistance,
        weatherData.stormDirection,
        weatherData.stormMovingToward || false
      )
    );
    
    if (weatherData.stormDistance < 30) {
      awareness.push('Storm activity detected nearby. Have an emergency plan ready.');
    }
  }

  // Describe cyclone if present
  if (weatherData.cyclonePresent && weatherData.cycloneCategory !== undefined) {
    conditions.push(describeCyclone(weatherData.cycloneCategory, weatherData.stormDistance));
    awareness.push('Follow all official guidance from emergency services.');
  }

  // Determine severity and set recommendation
  const severity = determineSeverity(weatherData);
  
  switch (severity) {
    case 'warning':
      recommendation = 'Significant weather is affecting your area. Stay indoors if possible and monitor official updates.';
      break;
    case 'caution':
      recommendation = 'Be cautious with outdoor activities. Keep an eye on changing conditions.';
      break;
    case 'moderate':
      recommendation = 'Conditions are manageable but may require extra care during travel or outdoor activities.';
      break;
    case 'calm':
    default:
      recommendation = 'Weather conditions are calm. No significant concerns at this time.';
  }

  // Generate summary based on current layer focus
  let summary = '';
  switch (currentLayer) {
    case 'wind':
      summary = weatherData.windSpeed !== undefined
        ? `Wind conditions at your location: ${weatherData.windSpeed} km/h ${weatherData.windDirection ? DIRECTION_NAMES[weatherData.windDirection] : ''}.`
        : 'Wind data is being loaded for your area.';
      break;
    case 'rain':
      summary = weatherData.precipitation !== undefined
        ? `Precipitation at your location: ${weatherData.precipitation > 0 ? `${weatherData.precipitation} mm/h` : 'None'}.`
        : 'Precipitation data is being loaded for your area.';
      break;
    case 'clouds':
      summary = weatherData.cloudCover !== undefined
        ? `Cloud coverage at your location: ${weatherData.cloudCover}%.`
        : 'Cloud data is being loaded for your area.';
      break;
    case 'temp':
      summary = weatherData.temperature !== undefined
        ? `Temperature at your location: ${weatherData.temperature}°C.`
        : 'Temperature data is being loaded for your area.';
      break;
    default:
      summary = 'Weather conditions are being analyzed for your location.';
  }

  // Ensure we have at least one condition
  if (conditions.length === 0) {
    conditions.push('Weather data is currently being updated. Please check back shortly.');
  }

  return {
    summary,
    conditions,
    awareness: awareness.length > 0 ? awareness : ['No immediate weather concerns for your area.'],
    recommendation,
    severity,
  };
};

/**
 * Mock weather data generator for testing
 * In production, this would be replaced with real API data
 */
export const getMockWeatherData = (lat: number, lon: number): NearbyWeatherData => {
  // Generate somewhat realistic mock data based on location
  // Tropical regions get more precipitation, coastal areas more wind, etc.
  
  const isTropical = Math.abs(lat) < 23.5;
  const isCoastal = Math.abs(lon) > 100 || Math.abs(lon) < 30;
  
  // Base wind speed with some randomness
  const baseWind = isCoastal ? 25 : 15;
  const windVariance = Math.random() * 20 - 10;
  
  // Precipitation more likely in tropics
  const basePrecip = isTropical ? 5 : 2;
  const precipVariance = Math.random() * 10;
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  return {
    windSpeed: Math.max(0, Math.round(baseWind + windVariance)),
    windDirection: directions[Math.floor(Math.random() * directions.length)],
    precipitation: Math.max(0, Math.round((basePrecip + precipVariance) * 10) / 10),
    cloudCover: Math.round(Math.random() * 100),
    temperature: Math.round(15 + (isTropical ? 10 : 0) + Math.random() * 15),
    pressure: Math.round(1000 + Math.random() * 30),
    humidity: Math.round(40 + Math.random() * 50),
    visibility: Math.round(5 + Math.random() * 15),
    stormPresent: Math.random() < 0.2, // 20% chance of nearby storm
    stormDistance: Math.round(20 + Math.random() * 100),
    stormDirection: directions[Math.floor(Math.random() * directions.length)],
    stormMovingToward: Math.random() < 0.3,
    cyclonePresent: isTropical && Math.random() < 0.05, // 5% chance in tropics
    cycloneCategory: Math.ceil(Math.random() * 3),
  };
};

export default interpretWeatherConditions;
