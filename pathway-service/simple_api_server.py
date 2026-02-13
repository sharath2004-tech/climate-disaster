"""
Simplified HTTP REST API Server for Pathway Service (Windows Compatible)
Provides RESTful endpoints for the frontend without Pathway dependency
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
import requests
from datetime import datetime, timedelta
import random
import json

app = Flask(__name__)
# Enable CORS for frontend with explicit configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://skynetra.vercel.app",
            "https://*.vercel.app",
            "http://localhost:*",
            "https://climate-disaster.vercel.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600
    }
})
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
PORT = int(os.getenv("PORT", 8080))

# Sample monitored locations
monitored_locations = [
    {"name": "New York", "lat": 40.7128, "lon": -74.0060},
    {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
    {"name": "Chicago", "lat": 41.8781, "lon": -87.6298},
    {"name": "Miami", "lat": 25.7617, "lon": -80.1918},
]

# In-memory cache
weather_cache = []
risk_predictions_cache = []
citizen_reports = []

# Sample shelters
shelters = [
    {
        "id": "shelter_001",
        "name": "Central Emergency Shelter",
        "latitude": 40.7580,
        "longitude": -73.9855,
        "capacity": 500,
        "current_occupancy": 120,
        "facilities": ["medical", "food", "water", "power"]
    },
    {
        "id": "shelter_002", 
        "name": "Community Sports Complex",
        "latitude": 40.7489,
        "longitude": -73.9680,
        "capacity": 800,
        "current_occupancy": 200,
        "facilities": ["food", "water", "power"]
    },
    {
        "id": "shelter_003",
        "name": "High School Gymnasium",
        "latitude": 40.7789,
        "longitude": -73.9750,
        "capacity": 350,
        "current_occupancy": 80,
        "facilities": ["medical", "food", "water"]
    }
]


def fetch_weather_data():
    """Fetch weather data from OpenWeatherMap API"""
    global weather_cache
    weather_cache = []
    
    if not OPENWEATHER_API_KEY:
        logger.warning("OPENWEATHER_API_KEY not set, using mock data")
        # Generate mock weather data
        for loc in monitored_locations:
            weather_cache.append({
                "location": loc["name"],
                "latitude": loc["lat"],
                "longitude": loc["lon"],
                "temperature": random.uniform(15, 35),
                "humidity": random.uniform(40, 90),
                "wind_speed": random.uniform(0, 25),
                "pressure": random.uniform(990, 1020),
                "weather_condition": random.choice(["Clear", "Cloudy", "Rain", "Storm"]),
                "timestamp": int(datetime.now().timestamp())
            })
        return
    
    for loc in monitored_locations:
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": loc["lat"],
                "lon": loc["lon"],
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            weather_cache.append({
                "location": loc["name"],
                "latitude": loc["lat"],
                "longitude": loc["lon"],
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"]["speed"],
                "pressure": data["main"]["pressure"],
                "weather_condition": data["weather"][0]["main"],
                "timestamp": int(datetime.now().timestamp())
            })
        except Exception as e:
            logger.error(f"Error fetching weather for {loc['name']}: {e}")


def analyze_risks():
    """Analyze weather data and generate risk predictions"""
    global risk_predictions_cache
    risk_predictions_cache = []
    
    for weather in weather_cache:
        risk_score = 0.0
        predicted_event = "Low Risk"
        
        # Simple risk analysis based on weather conditions
        if weather["weather_condition"] in ["Storm", "Thunderstorm"]:
            risk_score = random.uniform(0.7, 0.95)
            predicted_event = "Severe Storm"
        elif weather["weather_condition"] == "Rain" and weather["wind_speed"] > 20:
            risk_score = random.uniform(0.5, 0.8)
            predicted_event = "Heavy Rain & Wind"
        elif weather["temperature"] > 35:
            risk_score = random.uniform(0.4, 0.7)
            predicted_event = "Heat Wave"
        elif weather["temperature"] < 0:
            risk_score = random.uniform(0.3, 0.6)
            predicted_event = "Freezing Conditions"
        else:
            risk_score = random.uniform(0.1, 0.3)
            predicted_event = "Normal Conditions"
        
        risk_predictions_cache.append({
            "location": weather["location"],
            "latitude": weather["latitude"],
            "longitude": weather["longitude"],
            "risk_score": risk_score,
            "predicted_event_type": predicted_event,
            "confidence": random.uniform(0.6, 0.95),
            "time_to_event_hours": random.uniform(1, 24) if risk_score > 0.5 else 999,
            "recommended_actions": get_recommendations(predicted_event, risk_score),
            "timestamp": int(datetime.now().timestamp())
        })


def get_recommendations(event_type, risk_score):
    """Generate recommendations based on event type and risk score"""
    if risk_score < 0.3:
        return "No immediate action required. Stay informed."
    elif risk_score < 0.6:
        return "Monitor situation closely. Prepare emergency supplies."
    else:
        return f"High risk of {event_type}. Consider evacuation. Seek shelter immediately."


# ============================================================================
# AI CHAT FUNCTIONS
# ============================================================================

def build_system_prompt(weather_context=None):
    """Build context-aware system prompt for LLM"""
    base_prompt = """You are SKYNETRA, an AI disaster response assistant for India. You provide:
- Real-time weather analysis and disaster predictions
- Emergency safety guidelines
- Evacuation recommendations
- Resource location information

Guidelines:
1. Be concise but comprehensive
2. Always include emergency numbers when relevant
3. Prioritize safety above all
4. Use emojis for better readability
5. If asked about current conditions, use the provided real-time data

Emergency Numbers (India):
- Emergency: 112
- NDRF: 9711077372
- Fire: 101
- Ambulance: 108
- Police: 100
"""
    
    if weather_context:
        base_prompt += f"\n\nCurrent Real-time Data from Pathway:\n{json.dumps(weather_context, indent=2)}"
    
    return base_prompt


def call_openrouter(system_prompt, user_message):
    """Call OpenRouter API with Llama 3.3 70B"""
    if not OPENROUTER_API_KEY:
        raise Exception("OpenRouter API key not configured")
    
    response = requests.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://skynetra.vercel.app',
            'X-Title': 'SKYNETRA Disaster Assistant',
        },
        json={
            'model': 'meta-llama/llama-3.3-70b-instruct:free',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': 500,
            'temperature': 0.7,
        },
        timeout=30
    )
    
    if response.status_code != 200:
        raise Exception(f"OpenRouter error: {response.status_code}")
    
    data = response.json()
    return data.get('choices', [{}])[0].get('message', {}).get('content', '')


def call_groq(system_prompt, user_message):
    """Call Groq API with Llama"""
    if not GROQ_API_KEY:
        raise Exception("Groq API key not configured")
    
    response = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': 500,
            'temperature': 0.7,
        },
        timeout=30
    )
    
    if response.status_code != 200:
        raise Exception(f"Groq error: {response.status_code}")
    
    data = response.json()
    return data.get('choices', [{}])[0].get('message', {}).get('content', '')


def generate_fallback_response(query):
    """Generate rule-based fallback response"""
    query_lower = query.lower()
    
    if 'flood' in query_lower or 'water' in query_lower:
        return """🌊 **Flood Safety Guidelines:**

1. Move to higher ground immediately
2. Never walk or drive through flood water
3. Turn off electricity at main switch
4. Keep emergency supplies ready
5. Stay away from electrical equipment

📞 Emergency: 112 | NDRF: 9711077372"""

    if 'cyclone' in query_lower or 'storm' in query_lower:
        return """🌪️ **Cyclone Safety Guidelines:**

1. Stay indoors, away from windows
2. Secure all outdoor objects
3. Stock up on water and food
4. Charge all devices
5. Follow official evacuation orders

📞 Emergency: 112"""

    if 'earthquake' in query_lower:
        return """🏠 **Earthquake Safety:**

1. DROP, COVER, and HOLD ON
2. Get under sturdy furniture
3. Stay away from windows and heavy objects
4. Don't run outside during shaking
5. After shaking stops, evacuate if needed

📞 Emergency: 112"""

    if 'heat' in query_lower or 'hot' in query_lower:
        return """🌡️ **Heatwave Safety:**

1. Stay indoors 11 AM - 4 PM
2. Drink water every 15-20 minutes
3. Wear light, loose cotton clothes
4. Check on elderly neighbors
5. Never leave children/pets in vehicles

📞 Emergency: 112"""

    if 'help' in query_lower or 'emergency' in query_lower:
        return """🆘 **Emergency Contacts (India):**

📞 Universal Emergency: 112
📞 NDRF: 9711077372
🚒 Fire: 101
🚑 Ambulance: 108
👮 Police: 100

Stay calm and provide your location clearly."""

    return """👋 I'm SKYNETRA, your AI disaster assistant!

I can help you with:
• Real-time weather alerts 🌤️
• Disaster predictions 🔮
• Safety guidelines 🛡️
• Evacuation routes 🗺️
• Emergency contacts 📞

What would you like to know?

📞 Emergency: 112 | NDRF: 9711077372"""


@app.route('/api/v1/chat', methods=['POST'])
def ai_chat():
    """AI Chat endpoint with LLM integration"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Message is required"
            }), 400
        
        # Build context from current Pathway data
        weather_context = {
            "weather_locations": len(weather_cache),
            "risk_predictions": len(risk_predictions_cache),
            "high_risk_areas": len([p for p in risk_predictions_cache if p.get('risk_score', 0) > 0.7]),
            "active_alerts": len([p for p in risk_predictions_cache if p.get('risk_score', 0) > 0.5])
        }
        
        # Add sample weather data if available
        if weather_cache:
            weather_context["sample_weather"] = weather_cache[:3]
        if risk_predictions_cache:
            weather_context["top_risks"] = sorted(
                risk_predictions_cache, 
                key=lambda x: x.get('risk_score', 0), 
                reverse=True
            )[:3]
        
        system_prompt = build_system_prompt(weather_context)
        response_text = None
        provider_used = None
        
        # Try LLM providers with fallback chain
        try:
            logger.info("Trying OpenRouter...")
            response_text = call_openrouter(system_prompt, message)
            provider_used = "openrouter"
        except Exception as e:
            logger.warning(f"OpenRouter failed: {e}")
            try:
                logger.info("Trying Groq...")
                response_text = call_groq(system_prompt, message)
                provider_used = "groq"
            except Exception as e2:
                logger.warning(f"Groq failed: {e2}")
                logger.info("Using fallback response...")
                response_text = generate_fallback_response(message)
                provider_used = "fallback"
        
        return jsonify({
            "success": True,
            "response": response_text,
            "provider": provider_used,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "response": generate_fallback_response(data.get('message', ''))
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(datetime.now().timestamp()),
        "service": "pathway-disaster-response-simplified"
    })


@app.route('/api/v1/weather', methods=['GET'])
def get_weather():
    """Get current weather data for all monitored locations"""
    if not weather_cache:
        fetch_weather_data()
    
    return jsonify({
        "status": "success",
        "count": len(weather_cache),
        "data": weather_cache
    })


@app.route('/api/v1/risk-predictions', methods=['GET'])
def get_risk_predictions():
    """Get real-time risk predictions"""
    if not risk_predictions_cache:
        fetch_weather_data()
        analyze_risks()
    
    min_risk = float(request.args.get('min_risk', 0.0))
    
    filtered_predictions = [
        pred for pred in risk_predictions_cache
        if pred.get('risk_score', 0) >= min_risk
    ]
    
    return jsonify({
        "status": "success",
        "count": len(filtered_predictions),
        "timestamp": int(datetime.now().timestamp()),
        "data": filtered_predictions
    })


@app.route('/api/v1/alerts', methods=['GET'])
def get_alerts():
    """Get active alerts based on risk predictions"""
    if not risk_predictions_cache:
        fetch_weather_data()
        analyze_risks()
    
    alerts = []
    for pred in risk_predictions_cache:
        if pred['risk_score'] >= 0.6:
            alerts.append({
                "alert_id": f"alert_{int(datetime.now().timestamp())}_{pred['location'].replace(' ', '_')}",
                "location": pred['location'],
                "latitude": pred['latitude'],
                "longitude": pred['longitude'],
                "severity": "high" if pred['risk_score'] >= 0.8 else "medium",
                "event_type": pred['predicted_event_type'],
                "message": f"{pred['predicted_event_type']} warning for {pred['location']}",
                "recommended_actions": pred['recommended_actions'],
                "timestamp": pred['timestamp']
            })
    
    return jsonify({
        "status": "success",
        "count": len(alerts),
        "data": alerts
    })


@app.route('/api/v1/shelters', methods=['GET'])
def get_shelters():
    """Get available emergency shelters"""
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    # If coordinates provided, sort by distance (simplified)
    sorted_shelters = shelters
    if lat and lon:
        # Simple distance calculation (for demo purposes)
        for shelter in sorted_shelters:
            dist = ((shelter['latitude'] - lat)**2 + (shelter['longitude'] - lon)**2)**0.5
            shelter['distance_km'] = round(dist * 111, 2)  # Rough km conversion
        sorted_shelters = sorted(sorted_shelters, key=lambda x: x.get('distance_km', 999))
    
    return jsonify({
        "status": "success",
        "count": len(sorted_shelters),
        "data": sorted_shelters
    })


@app.route('/api/v1/evacuation-route', methods=['POST'])
def get_evacuation_route():
    """Calculate optimal evacuation route"""
    data = request.get_json()
    start_lat = data.get('start_lat')
    start_lon = data.get('start_lon')
    
    # Find nearest shelter
    nearest_shelter = min(shelters, 
                         key=lambda s: ((s['latitude'] - start_lat)**2 + 
                                       (s['longitude'] - start_lon)**2)**0.5)
    
    return jsonify({
        "status": "success",
        "route": {
            "start": {"latitude": start_lat, "longitude": start_lon},
            "end": {
                "latitude": nearest_shelter['latitude'], 
                "longitude": nearest_shelter['longitude']
            },
            "shelter": nearest_shelter,
            "estimated_time_minutes": random.randint(10, 45),
            "distance_km": round(random.uniform(2, 15), 2),
            "route_status": "clear",
            "waypoints": [
                {"latitude": start_lat, "longitude": start_lon},
                {"latitude": nearest_shelter['latitude'], "longitude": nearest_shelter['longitude']}
            ]
        }
    })


@app.route('/api/v1/citizen-reports', methods=['GET', 'POST'])
def handle_citizen_reports():
    """Handle citizen disaster reports"""
    if request.method == 'POST':
        data = request.get_json()
        report = {
            "report_id": f"report_{int(datetime.now().timestamp())}",
            "timestamp": int(datetime.now().timestamp()),
            "latitude": data.get('latitude'),
            "longitude": data.get('longitude'),
            "report_type": data.get('report_type'),
            "severity": data.get('severity', 5),
            "description": data.get('description'),
            "verified": False,
            "verification_count": 1
        }
        citizen_reports.append(report)
        return jsonify({"status": "success", "report": report})
    
    return jsonify({
        "status": "success",
        "count": len(citizen_reports),
        "data": citizen_reports
    })


@app.route('/api/v1/refresh', methods=['POST'])
def refresh_data():
    """Manually refresh weather data and risk analysis"""
    fetch_weather_data()
    analyze_risks()
    return jsonify({
        "status": "success",
        "message": "Data refreshed successfully",
        "timestamp": int(datetime.now().timestamp())
    })


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting Simplified Pathway Service (Windows Compatible)")
    logger.info("=" * 60)
    logger.info(f"Port: {PORT}")
    logger.info(f"OpenWeather API Key: {'Configured' if OPENWEATHER_API_KEY else 'Not configured (using mock data)'}")
    logger.info("=" * 60)
    
    # Initial data fetch
    fetch_weather_data()
    analyze_risks()
    
    # Run Flask app
    from waitress import serve
    logger.info(f"Server running on http://localhost:{PORT}")
    serve(app, host='0.0.0.0', port=PORT)
