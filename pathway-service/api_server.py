"""
HTTP REST API Server for Pathway Service
Provides RESTful endpoints for the frontend to consume real-time data
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import json
import logging
from datetime import datetime
from advanced_features import (
    CitizenReportAggregator,
    EvacuationRouteOptimizer,
    ResourceAllocator,
    AlertGenerator
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend
logger = logging.getLogger(__name__)

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
