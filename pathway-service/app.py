"""
Main entry point that runs both Pathway processing and Flask API server
"""

import os
import sys
import logging
import threading
import time
from datetime import datetime

# Import Pathway components
from main import PathwayDisasterProcessor, WeatherDataFetcher, DisasterRiskAnalyzer

# Import Flask API
from api_server import app, update_cache

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
PORT = int(os.getenv("PORT", 8080))


def run_pathway_processor():
    """Run Pathway processing in background thread"""
    logger.info("Starting Pathway processor thread...")
    
    processor = PathwayDisasterProcessor()
    weather_fetcher = WeatherDataFetcher(OPENWEATHER_API_KEY)
    risk_analyzer = DisasterRiskAnalyzer()
    
    while True:
        try:
            # Fetch fresh weather data
            weather_data = weather_fetcher.fetch_weather(processor.monitored_locations)
            
            # Analyze risks
            risk_predictions = []
            for weather in weather_data:
                risk_pred = risk_analyzer.analyze_weather(weather)
                risk_predictions.append(risk_pred)
            
            # Update API cache
            update_cache(weather_data, risk_predictions)
            
            logger.info(f"Updated {len(weather_data)} weather observations, {len(risk_predictions)} risk predictions")
            
            # Log high-risk areas
            high_risk = [p for p in risk_predictions if p['risk_score'] > 0.5]
            if high_risk:
                logger.warning(f"⚠️  {len(high_risk)} HIGH RISK AREAS DETECTED:")
                for risk in high_risk:
                    logger.warning(
                        f"  - {risk['predicted_event_type'].upper()} risk {risk['risk_score']:.2f} "
                        f"at ({risk['latitude']:.2f}, {risk['longitude']:.2f})"
                    )
            
            # Update every 5 minutes (API rate limits)
            time.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in Pathway processor: {e}")
            time.sleep(60)  # Wait 1 minute before retry


def run_api_server():
    """Run Flask API server"""
    logger.info(f"Starting API server on port {PORT}...")
    
    from waitress import serve
    serve(app, host='0.0.0.0', port=PORT, threads=4)


def main():
    """Main entry point"""
    
    # Validate environment
    if not OPENWEATHER_API_KEY:
        logger.error("❌ OPENWEATHER_API_KEY not set!")
        logger.error("Get your API key from: https://openweathermap.org/api")
        sys.exit(1)
    
    logger.info("=" * 70)
    logger.info("🌍 CLIMATE DISASTER RESPONSE - PATHWAY SERVICE")
    logger.info("=" * 70)
    logger.info(f"📡 Service Port: {PORT}")
    logger.info(f"🔑 OpenWeather API: {'✓ Configured' if OPENWEATHER_API_KEY else '✗ Missing'}")
    logger.info(f"⏰ Update Interval: 5 minutes")
    logger.info("=" * 70)
    
    # Start Pathway processor in background thread
    processor_thread = threading.Thread(target=run_pathway_processor, daemon=True)
    processor_thread.start()
    
    # Give processor time to fetch initial data
    logger.info("Fetching initial data...")
    time.sleep(10)
    
    # Start API server (blocking)
    logger.info("🚀 Service ready!")
    logger.info(f"📊 API Docs: http://localhost:{PORT}/health")
    logger.info("=" * 70)
    
    run_api_server()


if __name__ == "__main__":
    main()
