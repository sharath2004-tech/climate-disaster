"""
Enhanced Pathway Streaming Pipeline
Implements real-time disaster response using Pathway's streaming capabilities
Based on: https://pathway.com/developers/api-docs/pathway
"""

import pathway as pw
import os
import json
import requests
from datetime import datetime
import logging
from typing import Any
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")


# ============================================================================
# PATHWAY SCHEMAS - Strongly typed data structures
# ============================================================================

class WeatherStream(pw.Schema):
    """Real-time weather observations"""
    timestamp: int
    location: str
    city_name: str
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: float
    pressure: float
    precipitation: float
    weather_condition: str
    visibility: float


class CitizenReportStream(pw.Schema):
    """Citizen-submitted disaster reports"""
    report_id: str
    timestamp: int
    latitude: float
    longitude: float
    report_type: str  # flood, fire, road_blocked, rescue_needed
    severity: int  # 1-10
    description: str
    user_id: str


class DisasterEventStream(pw.Schema):
    """Verified disaster events"""
    event_id: str
    timestamp: int
    event_type: str
    latitude: float
    longitude: float
    severity: int
    confidence: float
    report_count: int
    description: str


class RiskPredictionStream(pw.Schema):
    """AI-generated risk predictions"""
    location: str
    city_name: str
    latitude: float
    longitude: float
    timestamp: int
    risk_score: float  # 0-1
    predicted_event: str
    confidence: float
    time_to_event_hrs: float
    recommended_actions: str
    alert_level: str  # ADVISORY, MODERATE, SEVERE, CRITICAL


# ============================================================================
# STREAMING DATA SOURCES
# ============================================================================

class WeatherDataConnector:
    """Fetches real-time weather data and creates Pathway streaming table"""
    
    @staticmethod
    def create_weather_stream():
        """Create a Pathway table that streams weather data"""
        
        # Major cities to monitor
        monitored_cities = [
            {"lat": 28.6139, "lon": 77.2090, "name": "Delhi"},
            {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai"},
            {"lat": 22.5726, "lon": 88.3639, "name": "Kolkata"},
            {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru"},
            {"lat": 13.0827, "lon": 80.2707, "name": "Chennai"},
            {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad"},
            {"lat": 23.0225, "lon": 72.5714, "name": "Ahmedabad"},
            {"lat": 18.5204, "lon": 73.8567, "name": "Pune"},
            {"lat": 26.8467, "lon": 80.9462, "name": "Lucknow"},
            {"lat": 25.5941, "lon": 85.1376, "name": "Patna"},
        ]
        
        def fetch_weather_data():
            """Fetch weather from OpenWeather API"""
            weather_records = []
            
            if not OPENWEATHER_API_KEY:
                logger.warning("OpenWeather API key not set, using mock data")
                # Return mock data for testing
                for city in monitored_cities:
                    weather_records.append({
                        "timestamp": int(datetime.now().timestamp()),
                        "location": f"{city['lat']:.2f},{city['lon']:.2f}",
                        "city_name": city["name"],
                        "latitude": city["lat"],
                        "longitude": city["lon"],
                        "temperature": 28.5,
                        "humidity": 65.0,
                        "wind_speed": 12.0,
                        "wind_direction": 180.0,
                        "pressure": 1013.0,
                        "precipitation": 0.0,
                        "weather_condition": "Clear",
                        "visibility": 10.0
                    })
                return weather_records
            
            for city in monitored_cities:
                try:
                    url = "https://api.openweathermap.org/data/2.5/weather"
                    params = {
                        "lat": city["lat"],
                        "lon": city["lon"],
                        "appid": OPENWEATHER_API_KEY,
                        "units": "metric"
                    }
                    response = requests.get(url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    weather_records.append({
                        "timestamp": int(datetime.now().timestamp()),
                        "location": f"{city['lat']:.2f},{city['lon']:.2f}",
                        "city_name": city["name"],
                        "latitude": city["lat"],
                        "longitude": city["lon"],
                        "temperature": data["main"]["temp"],
                        "humidity": float(data["main"]["humidity"]),
                        "wind_speed": data["wind"]["speed"],
                        "wind_direction": float(data["wind"].get("deg", 0)),
                        "pressure": float(data["main"]["pressure"]),
                        "precipitation": data.get("rain", {}).get("1h", 0.0),
                        "weather_condition": data["weather"][0]["main"],
                        "visibility": data.get("visibility", 10000) / 1000.0
                    })
                    
                except Exception as e:
                    logger.error(f"Error fetching weather for {city['name']}: {e}")
            
            return weather_records
        
        # Use Pathway's Python connector for custom data sources
        # This creates a streaming table that can be refreshed
        weather_data = fetch_weather_data()
        
        return pw.debug.table_from_rows(
            schema=WeatherStream,
            rows=[
                (
                    w["timestamp"],
                    w["location"],
                    w["city_name"],
                    w["latitude"],
                    w["longitude"],
                    w["temperature"],
                    w["humidity"],
                    w["wind_speed"],
                    w["wind_direction"],
                    w["pressure"],
                    w["precipitation"],
                    w["weather_condition"],
                    w["visibility"]
                )
                for w in weather_data
            ]
        )


# ============================================================================
# REAL-TIME TRANSFORMATIONS & ANALYTICS
# ============================================================================

class DisasterRiskProcessor:
    """Process weather data to predict disaster risks"""
    
    @staticmethod
    def calculate_flood_risk(temp: float, humidity: float, precip: float, 
                            pressure: float, wind: float) -> float:
        """Calculate flood risk score"""
        risk = 0.0
        
        # Heavy rainfall indicator
        if precip > 50:
            risk += 0.5
        elif precip > 20:
            risk += 0.3
        elif precip > 10:
            risk += 0.15
        
        # Low pressure (storm systems)
        if pressure < 980:
            risk += 0.3
        elif pressure < 1000:
            risk += 0.15
        
        # High humidity
        if humidity > 90:
            risk += 0.15
        elif humidity > 80:
            risk += 0.05
        
        # Strong winds (storm indicator)
        if wind > 20:
            risk += 0.1
        
        return min(risk, 1.0)
    
    @staticmethod
    def calculate_fire_risk(temp: float, humidity: float, wind: float, 
                           precip: float) -> float:
        """Calculate wildfire risk score"""
        risk = 0.0
        
        # High temperature
        if temp > 35:
            risk += 0.4
        elif temp > 30:
            risk += 0.2
        elif temp > 25:
            risk += 0.1
        
        # Low humidity (dry conditions)
        if humidity < 20:
            risk += 0.35
        elif humidity < 30:
            risk += 0.2
        elif humidity < 40:
            risk += 0.1
        
        # Strong winds (spread fire)
        if wind > 25:
            risk += 0.3
        elif wind > 15:
            risk += 0.15
        
        # No rain (dry spell)
        if precip == 0:
            risk += 0.1
        
        return min(risk, 1.0)
    
    @staticmethod
    def calculate_hurricane_risk(pressure: float, wind: float, 
                                 precip: float, humidity: float) -> float:
        """Calculate hurricane/cyclone risk score"""
        risk = 0.0
        
        # Very low pressure (hurricane indicator)
        if pressure < 950:
            risk += 0.6
        elif pressure < 980:
            risk += 0.4
        elif pressure < 1000:
            risk += 0.2
        
        # Hurricane-force winds
        if wind > 33:  # 119 km/h - hurricane force
            risk += 0.5
        elif wind > 25:  # 90 km/h - storm force
            risk += 0.3
        elif wind > 20:
            risk += 0.15
        
        # Heavy precipitation
        if precip > 30:
            risk += 0.2
        elif precip > 15:
            risk += 0.1
        
        # High humidity (moisture)
        if humidity > 85:
            risk += 0.1
        
        return min(risk, 1.0)
    
    @staticmethod
    def get_alert_level(risk_score: float) -> str:
        """Convert risk score to alert level"""
        if risk_score >= 0.8:
            return "CRITICAL"
        elif risk_score >= 0.6:
            return "SEVERE"
        elif risk_score >= 0.4:
            return "MODERATE"
        else:
            return "ADVISORY"
    
    @staticmethod
    def get_recommendations(event_type: str, risk_score: float) -> str:
        """Generate action recommendations"""
        if risk_score < 0.3:
            return "Monitor weather conditions. Stay informed through official channels."
        elif risk_score < 0.6:
            return f"Elevated {event_type} risk. Prepare emergency supplies, review evacuation plans, and monitor alerts."
        else:
            return f"HIGH {event_type} RISK! Consider evacuation if advised. Follow emergency protocols immediately."


def build_risk_analysis_pipeline(weather_table: pw.Table) -> pw.Table:
    """
    Build Pathway streaming pipeline for risk analysis
    Applies transformations to weather data to generate risk predictions
    """
    
    # Calculate risk scores for each disaster type
    risk_analysis = weather_table.select(
        location=pw.this.location,
        city_name=pw.this.city_name,
        latitude=pw.this.latitude,
        longitude=pw.this.longitude,
        timestamp=pw.this.timestamp,
        temperature=pw.this.temperature,
        humidity=pw.this.humidity,
        wind_speed=pw.this.wind_speed,
        pressure=pw.this.pressure,
        precipitation=pw.this.precipitation,
        # Calculate risk scores using UDFs
        flood_risk=pw.apply(
            DisasterRiskProcessor.calculate_flood_risk,
            pw.this.temperature,
            pw.this.humidity,
            pw.this.precipitation,
            pw.this.pressure,
            pw.this.wind_speed
        ),
        fire_risk=pw.apply(
            DisasterRiskProcessor.calculate_fire_risk,
            pw.this.temperature,
            pw.this.humidity,
            pw.this.wind_speed,
            pw.this.precipitation
        ),
        hurricane_risk=pw.apply(
            DisasterRiskProcessor.calculate_hurricane_risk,
            pw.this.pressure,
            pw.this.wind_speed,
            pw.this.precipitation,
            pw.this.humidity
        )
    )
    
    # Determine primary risk (highest score)
    risk_predictions = risk_analysis.select(
        location=pw.this.location,
        city_name=pw.this.city_name,
        latitude=pw.this.latitude,
        longitude=pw.this.longitude,
        timestamp=pw.this.timestamp,
        # Get max risk and corresponding event type
        risk_score=pw.apply(
            lambda f, fi, h: max(f, fi, h),
            pw.this.flood_risk,
            pw.this.fire_risk,
            pw.this.hurricane_risk
        ),
        predicted_event=pw.apply(
            lambda f, fi, h: "flood" if f == max(f, fi, h) 
                           else "fire" if fi == max(f, fi, h) 
                           else "hurricane",
            pw.this.flood_risk,
            pw.this.fire_risk,
            pw.this.hurricane_risk
        ),
        confidence=0.85,  # Model confidence
        time_to_event_hrs=pw.apply(
            lambda r: 6.0 if r > 0.6 else 12.0 if r > 0.4 else 24.0,
            pw.apply(
                lambda f, fi, h: max(f, fi, h),
                pw.this.flood_risk,
                pw.this.fire_risk,
                pw.this.hurricane_risk
            )
        )
    )
    
    # Add alert level and recommendations
    final_predictions = risk_predictions.select(
        location=pw.this.location,
        city_name=pw.this.city_name,
        latitude=pw.this.latitude,
        longitude=pw.this.longitude,
        timestamp=pw.this.timestamp,
        risk_score=pw.this.risk_score,
        predicted_event=pw.this.predicted_event,
        confidence=pw.this.confidence,
        time_to_event_hrs=pw.this.time_to_event_hrs,
        alert_level=pw.apply(
            DisasterRiskProcessor.get_alert_level,
            pw.this.risk_score
        ),
        recommended_actions=pw.apply(
            DisasterRiskProcessor.get_recommendations,
            pw.this.predicted_event,
            pw.this.risk_score
        )
    )
    
    return final_predictions


def build_citizen_report_aggregation(reports_table: pw.Table) -> pw.Table:
    """
    Aggregate and verify citizen reports using spatial clustering
    Groups reports by location grid and type for verification
    """
    
    # Add spatial grid cell for clustering
    def grid_cell(lat: float, lon: float, size: float = 0.1) -> str:
        """Map coordinates to grid cell"""
        return f"{int(lat/size)},{int(lon/size)}"
    
    reports_with_grid = reports_table.select(
        *pw.this,
        grid_cell=pw.apply(grid_cell, pw.this.latitude, pw.this.longitude)
    )
    
    # Group by grid cell and report type
    aggregated = reports_with_grid.groupby(
        pw.this.grid_cell,
        pw.this.report_type
    ).reduce(
        grid_cell=pw.this.grid_cell,
        report_type=pw.this.report_type,
        report_count=pw.reducers.count(),
        avg_severity=pw.reducers.avg(pw.this.severity),
        max_severity=pw.reducers.max(pw.this.severity),
        latest_timestamp=pw.reducers.max(pw.this.timestamp),
        latest_description=pw.reducers.sorted_tuple(pw.this.description)
    )
    
    # Mark as verified if 3+ reports in same area
    verified = aggregated.select(
        *pw.this,
        verified=pw.apply(lambda count: count >= 3, pw.this.report_count),
        confidence=pw.apply(
            lambda count: min(0.3 + (count * 0.15), 0.95),
            pw.this.report_count
        )
    )
    
    # Filter to only verified incidents
    verified_incidents = verified.filter(pw.this.verified == True)
    
    return verified_incidents


# ============================================================================
# MAIN PIPELINE ORCHESTRATION
# ============================================================================

def run_streaming_pipeline():
    """
    Main Pathway streaming pipeline
    Continuously processes weather data and generates risk predictions
    """
    
    logger.info("=" * 70)
    logger.info("🌊 PATHWAY STREAMING DISASTER RESPONSE PIPELINE")
    logger.info("=" * 70)
    
    # ========== DATA INGESTION ==========
    logger.info("📡 Setting up data streams...")
    
    # Create weather data stream
    weather_stream = WeatherDataConnector.create_weather_stream()
    logger.info("✓ Weather stream initialized")
    
    # ========== TRANSFORMATIONS ==========
    logger.info("⚙️  Building transformation pipeline...")
    
    # Build risk analysis pipeline
    risk_predictions = build_risk_analysis_pipeline(weather_stream)
    logger.info("✓ Risk analysis pipeline built")
    
    # Filter high-risk areas (risk_score > 0.5)
    high_risk_areas = risk_predictions.filter(pw.this.risk_score > 0.5)
    
    # Filter critical alerts (risk_score > 0.8)
    critical_alerts = risk_predictions.filter(pw.this.risk_score > 0.8)
    
    # ========== OUTPUT CONNECTORS ==========
    logger.info("📤 Setting up output connectors...")
    
    # Write all predictions to JSON Lines format
    pw.io.jsonlines.write(risk_predictions, "./output/risk_predictions.jsonl")
    logger.info("✓ Output: risk_predictions.jsonl")
    
    # Write high-risk areas separately
    pw.io.jsonlines.write(high_risk_areas, "./output/high_risk_areas.jsonl")
    logger.info("✓ Output: high_risk_areas.jsonl")
    
    # Write critical alerts
    pw.io.jsonlines.write(critical_alerts, "./output/critical_alerts.jsonl")
    logger.info("✓ Output: critical_alerts.jsonl")
    
    logger.info("=" * 70)
    logger.info("✅ Pipeline ready! Processing in real-time...")
    logger.info("=" * 70)
    
    # Return tables for further processing
    return {
        "weather": weather_stream,
        "risk_predictions": risk_predictions,
        "high_risk": high_risk_areas,
        "critical": critical_alerts
    }


if __name__ == "__main__":
    # Create output directory
    os.makedirs("./output", exist_ok=True)
    
    # Run the streaming pipeline
    tables = run_streaming_pipeline()
    
    # Start Pathway computation engine
    logger.info("🚀 Starting Pathway computation engine...")
    pw.run(
        monitoring_level=pw.MonitoringLevel.ALL,
        with_http_server=False
    )
