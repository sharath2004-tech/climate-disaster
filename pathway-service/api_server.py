"""
HTTP REST API Server for Pathway Service
Provides RESTful endpoints for the frontend to consume real-time data
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import json
import logging
import os
import requests as http_requests
from datetime import datetime
from advanced_features import (
    CitizenReportAggregator,
    EvacuationRouteOptimizer,
    ResourceAllocator,
    AlertGenerator
)

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
logger = logging.getLogger(__name__)

# Environment variables for LLM
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

# In-memory storage (in production, connect to MongoDB/Redis)
weather_cache = []
risk_predictions_cache = []
citizen_reports = []
active_disasters = []
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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(datetime.now().timestamp()),
        "service": "pathway-disaster-response"
    })


# ============================================================================
# AI CHAT ENDPOINT WITH LLM INTEGRATION
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
    
    response = http_requests.post(
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
    
    response = http_requests.post(
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


def call_cohere(system_prompt, user_message):
    """Call Cohere API"""
    if not COHERE_API_KEY:
        raise Exception("Cohere API key not configured")
    
    response = http_requests.post(
        'https://api.cohere.ai/v1/chat',
        headers={
            'Authorization': f'Bearer {COHERE_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'command',
            'message': user_message,
            'preamble': system_prompt,
            'temperature': 0.7,
        },
        timeout=30
    )
    
    if response.status_code != 200:
        raise Exception(f"Cohere error: {response.status_code}")
    
    data = response.json()
    return data.get('text', '')


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
                try:
                    logger.info("Trying Cohere...")
                    response_text = call_cohere(system_prompt, message)
                    provider_used = "cohere"
                except Exception as e3:
                    logger.warning(f"Cohere failed: {e3}")
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


@app.route('/api/v1/weather', methods=['GET'])
def get_weather():
    """Get current weather data for all monitored locations"""
    return jsonify({
        "status": "success",
        "count": len(weather_cache),
        "data": weather_cache
    })


@app.route('/api/v1/risk-predictions', methods=['GET'])
def get_risk_predictions():
    """Get real-time risk predictions"""
    
    # Optional filtering by risk level
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
    
    alerts = []
    for prediction in risk_predictions_cache:
        if prediction.get('risk_score', 0) > 0.5:
            alert = AlertGenerator.generate_alert(prediction, 50000)
            alerts.append(alert)
    
    return jsonify({
        "status": "success",
        "count": len(alerts),
        "data": alerts
    })


@app.route('/api/v1/reports', methods=['GET', 'POST'])
def handle_citizen_reports():
    """Handle citizen reports submission and retrieval"""
    
    if request.method == 'POST':
        # Submit new citizen report
        data = request.json
        
        report = {
            "report_id": f"REP-{int(datetime.now().timestamp())}",
            "timestamp": int(datetime.now().timestamp()),
            "latitude": data.get('latitude'),
            "longitude": data.get('longitude'),
            "report_type": data.get('report_type'),
            "severity": data.get('severity', 5),
            "description": data.get('description', ''),
            "image_url": data.get('image_url', ''),
            "user_id": data.get('user_id', 'anonymous')
        }
        
        citizen_reports.append(report)
        
        return jsonify({
            "status": "success",
            "message": "Report submitted successfully",
            "report_id": report['report_id']
        }), 201
    
    else:
        # Get all reports
        return jsonify({
            "status": "success",
            "count": len(citizen_reports),
            "data": citizen_reports
        })


@app.route('/api/v1/reports/verified', methods=['GET'])
def get_verified_reports():
    """Get verified citizen reports (clustered and cross-verified)"""
    
    # Group reports by location grid
    grid_groups = {}
    for report in citizen_reports:
        grid_cell = CitizenReportAggregator.grid_cell(
            report['latitude'],
            report['longitude']
        )
        if grid_cell not in grid_groups:
            grid_groups[grid_cell] = []
        grid_groups[grid_cell].append(report)
    
    # Verify each group
    verified_incidents = []
    for grid_cell, reports in grid_groups.items():
        if len(reports) >= 2:  # At least 2 reports to verify
            verification = CitizenReportAggregator.verify_reports(reports)
            
            if verification['verified'] or verification['report_count'] >= 3:
                # Calculate center point
                avg_lat = sum(r['latitude'] for r in reports) / len(reports)
                avg_lon = sum(r['longitude'] for r in reports) / len(reports)
                
                verified_incidents.append({
                    "incident_id": f"INC-{grid_cell}",
                    "grid_cell": grid_cell,
                    "latitude": avg_lat,
                    "longitude": avg_lon,
                    "report_count": len(reports),
                    "verified": verification['verified'],
                    "confidence": verification['confidence'],
                    "severity": verification['consensus_severity'],
                    "reports": reports
                })
    
    return jsonify({
        "status": "success",
        "count": len(verified_incidents),
        "data": verified_incidents
    })


@app.route('/api/v1/evacuation/shelters', methods=['GET'])
def get_shelters():
    """Get available evacuation shelters"""
    return jsonify({
        "status": "success",
        "count": len(shelters),
        "data": shelters
    })


@app.route('/api/v1/evacuation/route', methods=['POST'])
def get_evacuation_route():
    """Get optimal evacuation route for a user"""
    
    data = request.json
    user_lat = data.get('latitude')
    user_lon = data.get('longitude')
    
    if not user_lat or not user_lon:
        return jsonify({
            "status": "error",
            "message": "Latitude and longitude required"
        }), 400
    
    # Find best shelters
    disaster_zones = [
        {
            "latitude": pred['latitude'],
            "longitude": pred['longitude'],
            "severity": pred['risk_score'] * 10
        }
        for pred in risk_predictions_cache
        if pred.get('risk_score', 0) > 0.5
    ]
    
    best_shelters = EvacuationRouteOptimizer.find_best_shelter(
        user_lat,
        user_lon,
        shelters,
        disaster_zones,
        max_shelters=3
    )
    
    return jsonify({
        "status": "success",
        "user_location": {
            "latitude": user_lat,
            "longitude": user_lon
        },
        "recommended_shelters": best_shelters,
        "disaster_zones_nearby": len(disaster_zones)
    })


@app.route('/api/v1/resources/allocation', methods=['GET'])
def get_resource_allocation():
    """Get resource allocation recommendations"""
    
    # Use high-risk predictions as disasters
    disasters = [
        {
            "event_id": f"DIS-{i}",
            "latitude": pred['latitude'],
            "longitude": pred['longitude'],
            "severity": int(pred['risk_score'] * 10),
            "affected_radius_km": 5 + (pred['risk_score'] * 10),
            "population": 50000
        }
        for i, pred in enumerate(risk_predictions_cache)
        if pred.get('risk_score', 0) > 0.5
    ]
    
    allocations = ResourceAllocator.allocate_resources(disasters, [])
    
    return jsonify({
        "status": "success",
        "count": len(allocations),
        "data": allocations
    })


@app.route('/api/v1/stream/events', methods=['GET'])
def stream_events():
    """Server-Sent Events stream for real-time updates"""
    
    def generate():
        while True:
            # Send latest data every 5 seconds
            import time
            time.sleep(5)
            
            data = {
                "timestamp": int(datetime.now().timestamp()),
                "weather_updates": len(weather_cache),
                "risk_predictions": len(risk_predictions_cache),
                "active_alerts": len([p for p in risk_predictions_cache if p.get('risk_score', 0) > 0.5]),
                "citizen_reports": len(citizen_reports)
            }
            
            yield f"data: {json.dumps(data)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/v1/stats', methods=['GET'])
def get_stats():
    """Get overall system statistics"""
    
    high_risk_count = len([p for p in risk_predictions_cache if p.get('risk_score', 0) > 0.7])
    moderate_risk_count = len([p for p in risk_predictions_cache if 0.4 <= p.get('risk_score', 0) < 0.7])
    
    verified_reports = len([r for r in citizen_reports if True])  # Simplified
    
    total_shelter_capacity = sum(s['capacity'] for s in shelters)
    total_shelter_occupancy = sum(s['current_occupancy'] for s in shelters)
    
    return jsonify({
        "status": "success",
        "stats": {
            "monitored_locations": len(weather_cache),
            "high_risk_zones": high_risk_count,
            "moderate_risk_zones": moderate_risk_count,
            "total_citizen_reports": len(citizen_reports),
            "verified_incidents": verified_reports,
            "available_shelters": len(shelters),
            "total_shelter_capacity": total_shelter_capacity,
            "current_shelter_occupancy": total_shelter_occupancy,
            "shelter_availability_percent": int(((total_shelter_capacity - total_shelter_occupancy) / total_shelter_capacity) * 100) if total_shelter_capacity > 0 else 0
        },
        "timestamp": int(datetime.now().timestamp())
    })


def update_cache(weather_data, risk_data):
    """Update in-memory cache with latest data"""
    global weather_cache, risk_predictions_cache
    weather_cache = weather_data
    risk_predictions_cache = risk_data


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
