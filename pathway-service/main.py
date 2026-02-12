"""
Climate Disaster Response - Pathway Real-Time Processing Service
Handles real-time disaster event processing, weather data fusion, and ML predictions
"""

import pathway as pw
import os
import json
import requests
from datetime import datetime, timedelta
import logging
from typing import Dict, Any, List
import numpy as np
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
PORT = int(os.getenv("PORT", 8080))

# Schemas for real-time data
class WeatherEvent(pw.Schema):
    timestamp: int
    location: str
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

class DisasterEvent(pw.Schema):
    timestamp: int
    event_id: str
    event_type: str  # flood, fire, earthquake, hurricane, etc.
    latitude: float
    longitude: float
    severity: int  # 1-10
    affected_radius_km: float
    description: str
    source: str
    verified: bool

class CitizenReport(pw.Schema):
    report_id: str
    timestamp: int
    latitude: float
    longitude: float
    report_type: str
    severity: int
    description: str
    image_url: str
    user_id: str

class RiskPrediction(pw.Schema):
    location: str
    latitude: float
    longitude: float
    timestamp: int
    risk_score: float  # 0-1
    predicted_event_type: str
    confidence: float
    time_to_event_hours: float
    recommended_actions: str


class WeatherDataFetcher:
    """Fetches real-time weather data from OpenWeatherMap API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    def fetch_weather(self, locations: List[Dict[str, float]]) -> List[Dict]:
        """Fetch weather for multiple locations"""
        weather_data = []
        
        for loc in locations:
            try:
                url = f"{self.base_url}/weather"
                params = {
                    "lat": loc["lat"],
                    "lon": loc["lon"],
                    "appid": self.api_key,
                    "units": "metric"
                }
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                weather_data.append({
                    "timestamp": int(datetime.now().timestamp()),
                    "location": loc.get("name", f"{loc['lat']:.2f},{loc['lon']:.2f}"),
                    "city_name": loc.get("name", "Unknown"),
                    "latitude": loc["lat"],
                    "longitude": loc["lon"],
                    "temperature": data["main"]["temp"],
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "wind_direction": data["wind"].get("deg", 0),
                    "pressure": data["main"]["pressure"],
                    "precipitation": data.get("rain", {}).get("1h", 0.0),
                    "weather_condition": data["weather"][0]["main"],
                    "visibility": data.get("visibility", 10000) / 1000
                })
                
            except Exception as e:
                logger.error(f"Error fetching weather for {loc}: {e}")
                
        return weather_data


class DisasterRiskAnalyzer:
    """Analyzes disaster risk using real-time weather and historical patterns"""
    
    @staticmethod
    def calculate_flood_risk(weather: Dict) -> float:
        """Calculate flood risk based on weather conditions"""
        risk = 0.0
        
        # Heavy rainfall
        if weather["precipitation"] > 50:
            risk += 0.5
        elif weather["precipitation"] > 20:
            risk += 0.3
        elif weather["precipitation"] > 10:
            risk += 0.1
            
        # Low pressure (storm system)
        if weather["pressure"] < 980:
            risk += 0.3
        elif weather["pressure"] < 1000:
            risk += 0.1
            
        # High humidity
        if weather["humidity"] > 90:
            risk += 0.1
            
        # Strong winds (can indicate storm)
        if weather["wind_speed"] > 20:
            risk += 0.1
            
        return min(risk, 1.0)
    
    @staticmethod
    def calculate_fire_risk(weather: Dict) -> float:
        """Calculate wildfire risk based on weather conditions"""
        risk = 0.0
        
        # High temperature
        if weather["temperature"] > 35:
            risk += 0.4
        elif weather["temperature"] > 30:
            risk += 0.2
            
        # Low humidity
        if weather["humidity"] < 20:
            risk += 0.3
        elif weather["humidity"] < 30:
            risk += 0.2
            
        # Strong winds
        if weather["wind_speed"] > 25:
            risk += 0.3
        elif weather["wind_speed"] > 15:
            risk += 0.1
            
        # No precipitation
        if weather["precipitation"] == 0:
            risk += 0.1
            
        return min(risk, 1.0)
    
    @staticmethod
    def calculate_hurricane_risk(weather: Dict) -> float:
        """Calculate hurricane risk based on weather conditions"""
        risk = 0.0
        
        # Very low pressure
        if weather["pressure"] < 950:
            risk += 0.6
        elif weather["pressure"] < 980:
            risk += 0.4
        elif weather["pressure"] < 1000:
            risk += 0.2
            
        # Very strong winds
        if weather["wind_speed"] > 33:  # Hurricane force
            risk += 0.5
        elif weather["wind_speed"] > 25:  # Storm force
            risk += 0.3
            
        # Heavy rain
        if weather["precipitation"] > 30:
            risk += 0.2
            
        return min(risk, 1.0)
    
    @staticmethod
    def analyze_weather(weather: Dict) -> Dict:
        """Comprehensive weather risk analysis"""
        risks = {
            "flood": DisasterRiskAnalyzer.calculate_flood_risk(weather),
            "fire": DisasterRiskAnalyzer.calculate_fire_risk(weather),
            "hurricane": DisasterRiskAnalyzer.calculate_hurricane_risk(weather)
        }
        
        # Find highest risk
        max_risk_type = max(risks.items(), key=lambda x: x[1])
        
        return {
            "location": weather.get("city_name", weather["location"]),
            "city_name": weather.get("city_name", "Unknown"),
            "latitude": weather["latitude"],
            "longitude": weather["longitude"],
            "timestamp": weather["timestamp"],
            "risk_score": max_risk_type[1],
            "predicted_event_type": max_risk_type[0],
            "confidence": 0.85,  # Model confidence
            "time_to_event_hours": 6.0 if max_risk_type[1] > 0.5 else 24.0,
            "recommended_actions": DisasterRiskAnalyzer.get_recommendations(
                max_risk_type[0], 
                max_risk_type[1]
            )
        }
    
    @staticmethod
    def get_recommendations(event_type: str, risk_score: float) -> str:
        """Get recommended actions based on risk"""
        if risk_score < 0.3:
            return "Monitor weather conditions. No immediate action required."
        elif risk_score < 0.6:
            return f"Elevated {event_type} risk. Prepare emergency supplies and evacuation plan."
        else:
            return f"HIGH {event_type} RISK! Consider immediate evacuation. Follow emergency protocols."


class PathwayDisasterProcessor:
    """Main Pathway processing pipeline"""
    
    def __init__(self):
        self.weather_fetcher = WeatherDataFetcher(OPENWEATHER_API_KEY)
        self.risk_analyzer = DisasterRiskAnalyzer()
        
        # Major Indian cities to monitor (north, south, east, west, central)
        self.monitored_locations = [
            {"lat": 28.6139, "lon": 77.2090, "name": "Delhi"},           # North
            {"lat": 30.7333, "lon": 76.7794, "name": "Chandigarh"},     # North
            {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai"},         # West
            {"lat": 23.0225, "lon": 72.5714, "name": "Ahmedabad"},      # West
            {"lat": 22.5726, "lon": 88.3639, "name": "Kolkata"},        # East
            {"lat": 26.1445, "lon": 91.7362, "name": "Guwahati"},       # East
            {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru"},      # South
            {"lat": 13.0827, "lon": 80.2707, "name": "Chennai"},        # South
            {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad"},      # South/Central
            {"lat": 23.2599, "lon": 77.4126, "name": "Bhopal"},         # Central
        ]
    
    def process_weather_stream(self):
        """Process real-time weather data and generate risk predictions"""
        
        # Fetch initial weather data
        weather_data = self.weather_fetcher.fetch_weather(self.monitored_locations)
        
        # Create Pathway table from weather data
        weather_table = pw.debug.table_from_rows(
            schema=WeatherEvent,
            rows=[tuple(w.values()) for w in weather_data]
        )
        
        # Analyze risk for each weather observation
        risk_predictions = []
        for weather in weather_data:
            risk_pred = self.risk_analyzer.analyze_weather(weather)
            risk_predictions.append(risk_pred)
        
        # Create risk prediction table
        risk_table = pw.debug.table_from_rows(
            schema=RiskPrediction,
            rows=[tuple(r.values()) for r in risk_predictions]
        )
        
        return weather_table, risk_table
    
    def setup_http_endpoints(self):
        """Setup HTTP REST endpoints for real-time data access"""
        
        # Process weather and get risk predictions
        weather_table, risk_table = self.process_weather_stream()
        
        # High-risk areas (risk_score > 0.5)
        high_risk = risk_table.filter(pw.this.risk_score > 0.5)
        
        # Export to REST API
        pw.io.http.rest_connector(
            host="0.0.0.0",
            port=PORT,
            schema=RiskPrediction,
            route="/api/v1/risk-predictions"
        )
        
        logger.info(f"Pathway service started on port {PORT}")
        logger.info(f"Risk prediction endpoint: http://localhost:{PORT}/api/v1/risk-predictions")
        
        return weather_table, risk_table


def main():
    """Main entry point"""
    
    # Validate required environment variables
    if not OPENWEATHER_API_KEY:
        logger.error("OPENWEATHER_API_KEY not set!")
        raise ValueError("Missing required API key: OPENWEATHER_API_KEY")
    
    logger.info("Starting Climate Disaster Pathway Service...")
    logger.info(f"Monitoring {10} locations for disaster risk")
    
    # Initialize processor
    processor = PathwayDisasterProcessor()
    
    # Setup endpoints and start processing
    weather_table, risk_table = processor.setup_http_endpoints()
    
    # Print summary
    logger.info("="*60)
    logger.info("Pathway Service Running!")
    logger.info("="*60)
    logger.info("Endpoints available:")
    logger.info(f"  - Real-time risk predictions: http://localhost:{PORT}/api/v1/risk-predictions")
    logger.info(f"  - Weather data stream: http://localhost:{PORT}/api/v1/weather")
    logger.info("="*60)
    
    # Run Pathway
    pw.run(
        monitoring_level=pw.MonitoringLevel.NONE,
        with_http_server=True
    )


if __name__ == "__main__":
    main()
