/**
 * RAG (Retrieval Augmented Generation) Knowledge Base
 * Disaster Management & Weather-Related Information
 * 
 * This knowledge base provides context-aware information
 * for the AI chatbot to give accurate disaster predictions
 * and safety recommendations.
 */

export const disasterKnowledgeBase = {
  // Flood-related knowledge
  flood: {
    triggers: {
      rainfall: {
        low: "20-50mm in 24 hours - Monitor situation",
        medium: "50-100mm in 24 hours - Prepare for possible flooding",
        high: "100mm+ in 24 hours - High flood risk, evacuation may be needed",
      },
      indicators: [
        "Heavy continuous rainfall for 6+ hours",
        "River water levels rising rapidly",
        "Overflowing drains and waterlogging",
        "Weather warnings for heavy rain",
      ],
    },
    safety_measures: {
      before: [
        "Identify higher ground evacuation routes",
        "Store drinking water in clean containers",
        "Keep important documents in waterproof bags",
        "Charge all electronic devices and power banks",
        "Move valuables to upper floors",
        "Stock non-perishable food for 3-5 days",
        "Keep emergency kit with medicines, first aid, flashlight",
      ],
      during: [
        "Move to higher floors immediately",
        "Never walk or drive through flood water (6 inches can knock you down)",
        "Turn off electricity at main switch",
        "Stay away from electrical wires and equipment",
        "If trapped, signal for help from window/roof",
        "Call emergency services: 112 or NDRF: 9711077372",
        "Listen to local authorities for evacuation orders",
      ],
      after: [
        "Return home only when authorities say it's safe",
        "Check for structural damage before entering",
        "Clean and disinfect everything touched by flood water",
        "Boil drinking water for at least 10 minutes",
        "Watch for snakes and other displaced animals",
        "Document damage with photos for insurance",
      ],
    },
    early_warning_signs: [
      "Weather forecast showing 100mm+ rainfall",
      "River/reservoir above danger level",
      "Continuous rain for more than 6 hours",
      "Water entering streets and ground floors",
      "Official flood warnings from meteorological department",
    ],
  },

  // Cyclone/Storm knowledge
  cyclone: {
    triggers: {
      wind_speed: {
        low: "40-60 km/h - Strong winds, minor damage possible",
        medium: "60-90 km/h - Very strong winds, significant damage",
        high: "90+ km/h - Destructive winds, severe cyclone conditions",
      },
      stages: {
        depression: "Wind speed < 62 km/h",
        deep_depression: "Wind speed 62-88 km/h",
        cyclonic_storm: "Wind speed 89-117 km/h",
        severe_cyclone: "Wind speed 118+ km/h",
      },
    },
    safety_measures: {
      before: [
        "Board up windows or close shutters",
        "Secure outdoor furniture, decorations, garbage cans",
        "Trim tree branches that could fall on structures",
        "Stock 7-day supply of water and non-perishable food",
        "Fill bathtub with water for washing/flushing",
        "Charge devices and have battery-powered radio",
        "Know your evacuation route and nearest shelter",
        "Keep vehicle fuel tank full",
      ],
      during: [
        "Stay indoors, away from windows and doors",
        "Take shelter in a small interior room or closet",
        "If eye of cyclone passes, stay inside (winds will return)",
        "Do not go outside to inspect damage",
        "Listen to battery-powered radio for updates",
        "If roof/wall fails, take cover under sturdy furniture",
        "Emergency contact: 112",
      ],
      after: [
        "Stay inside until all-clear is given",
        "Check for structural damage before moving around",
        "Avoid downed power lines and standing water",
        "Use flashlight, not candles (gas leak risk)",
        "Help injured or trapped people if safe to do so",
        "Boil water before drinking",
      ],
    },
    early_warning_signs: [
      "Meteorological cyclone warning issued",
      "Wind speeds increasing rapidly",
      "Heavy rain with strong gusty winds",
      "Rapid drop in atmospheric pressure",
      "Large waves and storm surge in coastal areas",
    ],
  },

  // Heatwave knowledge
  heatwave: {
    triggers: {
      temperature: {
        low: "38-40°C - Heat stress possible",
        medium: "40-45°C - High heat stress, health risk",
        high: "45°C+ - Extreme heat, severe health risk",
      },
      duration: "3+ consecutive days above 40°C",
    },
    safety_measures: {
      before: [
        "Check on elderly, children, and those with chronic illnesses",
        "Ensure air conditioner/cooler is working",
        "Stock up on water and electrolyte drinks",
        "Plan to stay indoors during peak heat (11 AM - 4 PM)",
        "Prepare light, loose-fitting cotton clothes",
      ],
      during: [
        "Drink water every 15-20 minutes even if not thirsty",
        "Stay indoors with fans or AC if possible",
        "Wear loose, light-colored, cotton clothing",
        "Use damp cloth on face, neck, wrists",
        "Avoid alcohol, caffeine, and heavy meals",
        "Never leave children or pets in parked vehicles",
        "If working outdoors, take breaks in shade every 30 min",
      ],
      after: [
        "Continue staying hydrated",
        "Monitor health for heat exhaustion symptoms",
        "Help vulnerable neighbors",
      ],
    },
    heat_illness_signs: {
      heat_exhaustion: [
        "Heavy sweating",
        "Weakness, dizziness",
        "Nausea, headache",
        "Cool, pale, clammy skin",
        "Fast, weak pulse",
      ],
      heat_stroke_emergency: [
        "High body temperature (40°C+)",
        "Hot, red, dry or damp skin",
        "Fast, strong pulse",
        "Confusion, unconsciousness",
        "ACTION: Call 112 immediately, move to cool place, apply ice packs",
      ],
    },
  },

  // Earthquake knowledge
  earthquake: {
    triggers: {
      magnitude: {
        minor: "< 4.0 - Noticeable but rarely causes damage",
        moderate: "4.0-5.9 - Can cause damage to poorly built structures",
        strong: "6.0-6.9 - Can be destructive in populated areas",
        major: "7.0+ - Can cause serious damage over large areas",
      },
    },
    safety_measures: {
      before: [
        "Secure heavy furniture to walls",
        "Keep emergency kit with first aid, water, flashlight",
        "Identify safe spots (under sturdy tables, against interior walls)",
        "Practice DROP, COVER, HOLD ON drill",
        "Know how to turn off gas, water, electricity",
      ],
      during: [
        "DROP to hands and knees",
        "COVER under sturdy desk/table or against interior wall",
        "HOLD ON until shaking stops",
        "Stay inside - do not run outside",
        "If outside, move away from buildings, trees, power lines",
        "If in vehicle, stop safely and stay inside until shaking stops",
      ],
      after: [
        "Check yourself and others for injuries",
        "Exit building if damaged, watch for falling debris",
        "Stay away from damaged structures",
        "Be prepared for aftershocks",
        "Check for gas leaks, turn off gas if you smell it",
        "Use phone only for emergencies",
        "Stay informed via battery-powered radio",
      ],
    },
    myths_vs_facts: {
      myth_doorway: "MYTH: Stand in doorway. FACT: Get under sturdy furniture instead.",
      myth_triangle: "MYTH: 'Triangle of life' near collapsed furniture. FACT: DROP, COVER, HOLD ON is safer.",
      myth_prediction: "MYTH: Earthquakes can be predicted. FACT: No reliable prediction method exists yet.",
    },
  },

  // General disaster preparedness
  general: {
    emergency_kit_essentials: [
      "Water (1 gallon per person per day for 3 days)",
      "Non-perishable food (3-day supply)",
      "Battery-powered or hand-crank radio",
      "Flashlight with extra batteries",
      "First aid kit",
      "7-day supply of medications",
      "Multi-purpose tool",
      "Sanitation and personal hygiene items",
      "Copies of important documents",
      "Cell phone with chargers and backup battery",
      "Cash in small denominations",
      "Emergency blanket",
      "Whistle (to signal for help)",
      "Matches in waterproof container",
    ],
    emergency_contacts_india: {
      national_emergency: "112",
      ndrf_helpline: "9711077372",
      disaster_management: "1078",
      fire: "101",
      ambulance: "102",
      women_helpline: "181",
      child_helpline: "1098",
    },
    family_emergency_plan: [
      "Identify meeting points: one near home, one outside neighborhood",
      "Designate out-of-state contact person",
      "Ensure everyone knows how to text (texts may work when calls don't)",
      "Practice evacuation drills",
      "Keep physical copies of emergency contacts",
      "Know your community's warning systems",
      "Plan for pets",
      "Update plan annually",
    ],
  },

  // Weather interpretation for predictions
  weather_patterns: {
    flood_prediction_factors: [
      "Accumulated rainfall over 72 hours",
      "Soil moisture saturation levels",
      "River basin water levels",
      "Topography and drainage capacity",
      "Historical flood data for region",
      "Upstream dam water release schedules",
    ],
    cyclone_prediction_factors: [
      "Sea surface temperature > 26.5°C",
      "Low atmospheric pressure system",
      "Coriolis force presence (away from equator)",
      "Low wind shear in upper atmosphere",
      "High ocean heat content",
      "Monsoon patterns and jet stream",
    ],
    heatwave_prediction_factors: [
      "High pressure system stalling over region",
      "Clear skies with intense solar radiation",
      "Low humidity levels",
      "Absence of rain for extended period",
      "Urban heat island effect",
      "Historical temperature trends",
    ],
  },
};

/**
 * RAG Query Function
 * Retrieves relevant knowledge based on query and context
 */
export function queryKnowledgeBase(query, weatherContext = {}) {
  const results = [];
  const queryLower = query.toLowerCase();

  // Detect disaster types mentioned
  const disasterTypes = {
    flood: ['flood', 'flooding', 'water', 'rain', 'rainfall', 'monsoon', 'deluge'],
    cyclone: ['cyclone', 'storm', 'hurricane', 'wind', 'tornado', 'gale'],
    heatwave: ['heat', 'heatwave', 'hot', 'temperature', 'summer'],
    earthquake: ['earthquake', 'quake', 'tremor', 'seismic'],
  };

  // Find relevant disaster types
  const relevantTypes = [];
  for (const [type, keywords] of Object.entries(disasterTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      relevantTypes.push(type);
    }
  }

  // Add weather-predicted risks
  if (weatherContext.predictions) {
    const risks = weatherContext.predictions.flatMap(p => p.risks || []);
    risks.forEach(risk => {
      if (!relevantTypes.includes(risk.type)) {
        relevantTypes.push(risk.type);
      }
    });
  }

  // If no specific type detected, use general information
  if (relevantTypes.length === 0) {
    relevantTypes.push('general');
  }

  // Retrieve knowledge for each relevant type
  relevantTypes.forEach(type => {
    if (disasterKnowledgeBase[type]) {
      results.push({
        type,
        knowledge: disasterKnowledgeBase[type],
      });
    }
  });

  // Add general knowledge if specific disaster types found
  if (relevantTypes.length > 0 && !relevantTypes.includes('general')) {
    results.push({
      type: 'general',
      knowledge: {
        emergency_contacts: disasterKnowledgeBase.general.emergency_contacts_india,
        emergency_kit: disasterKnowledgeBase.general.emergency_kit_essentials,
      },
    });
  }

  return results;
}

/**
 * Generate context-aware prompt for LLM
 */
export function buildRAGPrompt(userQuery, weatherContext, location) {
  const knowledge = queryKnowledgeBase(userQuery, weatherContext);
  
  let contextPrompt = `You are SKYNETRA, an AI disaster response assistant for India.\n\n`;
  
  // Add weather context
  if (weatherContext.current_conditions) {
    contextPrompt += `CURRENT WEATHER (${location}):\n`;
    contextPrompt += `- Temperature: ${weatherContext.current_conditions.temperature}°C\n`;
    contextPrompt += `- Humidity: ${weatherContext.current_conditions.humidity}%\n`;
    contextPrompt += `- Wind: ${weatherContext.current_conditions.wind_speed} km/h\n`;
    contextPrompt += `- Risk Level: ${weatherContext.overall_risk || 'low'}\n\n`;
  }

  // Add predictions
  if (weatherContext.predictions && weatherContext.predictions.length > 0) {
    contextPrompt += `7-DAY DISASTER PREDICTIONS:\n`;
    weatherContext.predictions.slice(0, 3).forEach((pred, i) => {
      if (pred.risks.length > 0) {
        contextPrompt += `Day ${i + 1} (${pred.date}): ${pred.risks.map(r => 
          `${r.type.toUpperCase()} risk (${r.severity})`
        ).join(', ')}\n`;
      }
    });
    contextPrompt += `\n`;
  }

  // Add relevant knowledge
  if (knowledge.length > 0) {
    contextPrompt += `DISASTER SAFETY KNOWLEDGE:\n`;
    knowledge.forEach(k => {
      if (k.knowledge.safety_measures) {
        contextPrompt += `\n${k.type.toUpperCase()} SAFETY:\n`;
        if (k.knowledge.safety_measures.before) {
          contextPrompt += `Before: ${k.knowledge.safety_measures.before.slice(0, 3).join('; ')}\n`;
        }
        if (k.knowledge.safety_measures.during) {
          contextPrompt += `During: ${k.knowledge.safety_measures.during.slice(0, 3).join('; ')}\n`;
        }
      }
      if (k.knowledge.emergency_contacts) {
        contextPrompt += `\nEMERGENCY CONTACTS:\n`;
        contextPrompt += `National Emergency: ${k.knowledge.emergency_contacts.national_emergency}\n`;
        contextPrompt += `NDRF Helpline: ${k.knowledge.emergency_contacts.ndrf_helpline}\n`;
      }
    });
  }

  contextPrompt += `\nUSER QUESTION: ${userQuery}\n\n`;
  contextPrompt += `INSTRUCTIONS:\n`;
  contextPrompt += `1. Provide specific, actionable safety advice based on weather predictions\n`;
  contextPrompt += `2. If high-risk weather detected, prioritize immediate safety actions\n`;
  contextPrompt += `3. Include relevant emergency contact numbers\n`;
  contextPrompt += `4. Be concise but thorough (max 200 words)\n`;
  contextPrompt += `5. Use simple language that non-technical citizens can understand\n\n`;
  contextPrompt += `Respond with helpful disaster safety guidance:`;

  return contextPrompt;
}

export default {
  disasterKnowledgeBase,
  queryKnowledgeBase,
  buildRAGPrompt,
};
