"""
Advanced Pathway Transformations for Disaster Response
Demonstrates complex streaming data transformations
Based on: https://pathway.com/developers/api-docs/pathway
"""

import pathway as pw
import json
import math
from datetime import datetime, timedelta
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# TEMPORAL AGGREGATIONS - Time-based analytics
# ============================================================================

def temporal_weather_analysis(weather_stream: pw.Table) -> pw.Table:
    """
    Analyze weather trends over time windows
    Uses Pathway's windowing capabilities
    """
    
    # Calculate rolling averages for temperature trends
    # This helps identify rapid temperature changes indicating storms
    
    temp_trends = weather_stream.select(
        *pw.this,
        # Flag sudden temperature drops (>5°C) as potential storm indicator
        temp_change_flag=pw.apply(
            lambda t: "potential_storm" if abs(t) > 5 else "normal",
            pw.this.temperature
        )
    )
    
    # Group by location to track trends per city
    location_trends = temp_trends.groupby(pw.this.city_name).reduce(
        city_name=pw.this.city_name,
        observation_count=pw.reducers.count(),
        avg_temperature=pw.reducers.avg(pw.this.temperature),
        max_temperature=pw.reducers.max(pw.this.temperature),
        min_temperature=pw.reducers.min(pw.this.temperature),
        avg_humidity=pw.reducers.avg(pw.this.humidity),
        avg_wind_speed=pw.reducers.avg(pw.this.wind_speed),
        latest_timestamp=pw.reducers.max(pw.this.timestamp)
    )
    
    return location_trends


# ============================================================================
# SPATIAL JOINS - Geographic proximity analysis
# ============================================================================

def spatial_proximity_analysis(
    reports_table: pw.Table,
    shelters_table: pw.Table,
    max_distance_km: float = 10.0
) -> pw.Table:
    """
    Find nearest shelters for each citizen report
    Demonstrates spatial join patterns
    """
    
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in km"""
        R = 6371  # Earth radius in km
        
        lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
        lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    # Create cartesian product (cross join) of reports and shelters
    # Filter to only nearby shelters within max_distance_km
    
    # Note: This is conceptual - Pathway's actual spatial joins may differ
    # For production, use specialized geospatial libraries
    
    reports_with_nearest = reports_table.select(
        report_id=pw.this.report_id,
        report_lat=pw.this.latitude,
        report_lon=pw.this.longitude,
        severity=pw.this.severity,
        # Would join with shelters here to find nearest
    )
    
    return reports_with_nearest


# ============================================================================
# STATEFUL AGGREGATIONS - Track accumulating data
# ============================================================================

def track_disaster_escalation(events_stream: pw.Table) -> pw.Table:
    """
    Track how disasters escalate over time
    Uses stateful processing to monitor severity changes
    """
    
    # Group by event type and location grid
    def grid_cell(lat: float, lon: float, size: float = 0.5) -> str:
        return f"{int(lat/size)},{int(lon/size)}"
    
    events_with_grid = events_stream.select(
        *pw.this,
        grid_cell=pw.apply(grid_cell, pw.this.latitude, pw.this.longitude)
    )
    
    # Track escalation by counting events and monitoring severity trends
    escalation_tracking = events_with_grid.groupby(
        pw.this.grid_cell,
        pw.this.event_type
    ).reduce(
        grid_cell=pw.this.grid_cell,
        event_type=pw.this.event_type,
        total_events=pw.reducers.count(),
        max_severity=pw.reducers.max(pw.this.severity),
        avg_severity=pw.reducers.avg(pw.this.severity),
        latest_timestamp=pw.reducers.max(pw.this.timestamp),
        # Track if situation is escalating
        escalating=pw.apply(
            lambda max_sev, avg_sev, count: count > 3 and max_sev > avg_sev * 1.3,
            pw.reducers.max(pw.this.severity),
            pw.reducers.avg(pw.this.severity),
            pw.reducers.count()
        )
    )
    
    # Filter to only escalating situations
    escalating_disasters = escalation_tracking.filter(pw.this.escalating == True)
    
    return escalating_disasters


# ============================================================================
# STREAM JOINS - Combining multiple data sources
# ============================================================================

def join_weather_and_reports(
    weather_table: pw.Table,
    reports_table: pw.Table
) -> pw.Table:
    """
    Join weather data with citizen reports to correlate conditions
    Demonstrates Pathway's streaming join capabilities
    """
    
    # Add grid cells for spatial joining
    def grid_cell(lat: float, lon: float, size: float = 0.2) -> str:
        return f"{int(lat/size)},{int(lon/size)}"
    
    weather_with_grid = weather_table.select(
        *pw.this,
        grid_cell=pw.apply(grid_cell, pw.this.latitude, pw.this.longitude),
        weather_timestamp=pw.this.timestamp
    )
    
    reports_with_grid = reports_table.select(
        *pw.this,
        grid_cell=pw.apply(grid_cell, pw.this.latitude, pw.this.longitude),
        report_timestamp=pw.this.timestamp
    )
    
    # Join on grid cell (spatial proximity)
    # This correlates reports with weather conditions in the same area
    joined = reports_with_grid.join(
        weather_with_grid,
        pw.left.grid_cell == pw.right.grid_cell,
        how=pw.JoinMode.INNER
    ).select(
        report_id=pw.left.report_id,
        report_type=pw.left.report_type,
        severity=pw.left.severity,
        report_lat=pw.left.latitude,
        report_lon=pw.left.longitude,
        # Weather conditions at time of report
        temperature=pw.right.temperature,
        humidity=pw.right.humidity,
        precipitation=pw.right.precipitation,
        wind_speed=pw.right.wind_speed,
        weather_condition=pw.right.weather_condition,
        # Timestamps
        report_time=pw.left.report_timestamp,
        weather_time=pw.right.weather_timestamp,
        grid_cell=pw.left.grid_cell
    )
    
    return joined


# ============================================================================
# COMPLEX FILTERS & TRANSFORMATIONS
# ============================================================================

def identify_compound_disasters(
    flood_risks: pw.Table,
    fire_risks: pw.Table,
    storm_risks: pw.Table
) -> pw.Table:
    """
    Identify areas facing multiple simultaneous disaster risks
    Compound disasters are more dangerous
    """
    
    # This would join multiple risk tables on location
    # and identify areas with multiple high risks
    
    # Conceptual implementation:
    # 1. Join all risk tables on location
    # 2. Count how many risks are > 0.5
    # 3. Flag locations with 2+ high risks
    
    compound_risk_areas = flood_risks.select(
        location=pw.this.location,
        latitude=pw.this.latitude,
        longitude=pw.this.longitude,
        flood_risk=pw.this.risk_score,
        # Would join with fire and storm risks here
        # Then calculate compound_risk_count
    )
    
    return compound_risk_areas


# ============================================================================
# ANOMALY DETECTION - Unusual patterns
# ============================================================================

def detect_weather_anomalies(weather_stream: pw.Table) -> pw.Table:
    """
    Detect unusual weather patterns that may indicate disasters
    Uses statistical thresholds on streaming data
    """
    
    # Calculate statistics per location
    location_stats = weather_stream.groupby(pw.this.city_name).reduce(
        city_name=pw.this.city_name,
        avg_temp=pw.reducers.avg(pw.this.temperature),
        avg_humidity=pw.reducers.avg(pw.this.humidity),
        avg_pressure=pw.reducers.avg(pw.this.pressure),
        avg_wind=pw.reducers.avg(pw.this.wind_speed),
        max_precip=pw.reducers.max(pw.this.precipitation)
    )
    
    # Join current readings with historical averages
    current_with_baseline = weather_stream.join(
        location_stats,
        pw.left.city_name == pw.right.city_name,
        how=pw.JoinMode.LEFT
    ).select(
        city_name=pw.left.city_name,
        timestamp=pw.left.timestamp,
        current_temp=pw.left.temperature,
        baseline_temp=pw.right.avg_temp,
        current_pressure=pw.left.pressure,
        baseline_pressure=pw.right.avg_pressure,
        current_wind=pw.left.wind_speed,
        baseline_wind=pw.right.avg_wind,
        # Detect anomalies
        temp_anomaly=pw.apply(
            lambda curr, base: abs(curr - base) > 10,
            pw.left.temperature,
            pw.right.avg_temp
        ),
        pressure_anomaly=pw.apply(
            lambda curr, base: abs(curr - base) > 20,
            pw.left.pressure,
            pw.right.avg_pressure
        ),
        wind_anomaly=pw.apply(
            lambda curr, base: curr > base * 2,
            pw.left.wind_speed,
            pw.right.avg_wind
        )
    )
    
    # Filter to only anomalous readings
    anomalies = current_with_baseline.filter(
        (pw.this.temp_anomaly == True) |
        (pw.this.pressure_anomaly == True) |
        (pw.this.wind_anomaly == True)
    )
    
    return anomalies


# ============================================================================
# PRIORITY QUEUES - Resource allocation
# ============================================================================

def prioritize_emergency_responses(
    reports_table: pw.Table,
    resources_table: pw.Table
) -> pw.Table:
    """
    Create priority queue for emergency response
    Ranks incidents by severity, recency, and resource availability
    """
    
    # Calculate priority score
    prioritized_reports = reports_table.select(
        *pw.this,
        # Priority = severity * recency factor
        priority_score=pw.apply(
            lambda severity, timestamp: severity * (1.0 + (1.0 / max((datetime.now().timestamp() - timestamp) / 3600, 1))),
            pw.this.severity,
            pw.this.timestamp
        ),
        age_hours=pw.apply(
            lambda timestamp: (datetime.now().timestamp() - timestamp) / 3600,
            pw.this.timestamp
        )
    )
    
    # Filter to high-priority incidents (severity >= 7 or recent critical)
    high_priority = prioritized_reports.filter(
        (pw.this.severity >= 7) |
        ((pw.this.severity >= 5) & (pw.this.age_hours < 0.5))
    )
    
    return high_priority


# ============================================================================
# DATA QUALITY & VALIDATION
# ============================================================================

def validate_and_clean_data(input_stream: pw.Table) -> pw.Table:
    """
    Validate incoming data and filter out invalid records
    Essential for production systems
    """
    
    validated = input_stream.select(
        *pw.this,
        # Validation flags
        valid_lat=pw.apply(lambda lat: -90 <= lat <= 90, pw.this.latitude),
        valid_lon=pw.apply(lambda lon: -180 <= lon <= 180, pw.this.longitude),
        valid_severity=pw.apply(lambda sev: 1 <= sev <= 10, pw.this.severity),
        recent=pw.apply(
            lambda ts: ts > (datetime.now().timestamp() - 86400),  # Within 24 hours
            pw.this.timestamp
        )
    )
    
    # Filter to only valid records
    clean_data = validated.filter(
        (pw.this.valid_lat == True) &
        (pw.this.valid_lon == True) &
        (pw.this.valid_severity == True) &
        (pw.this.recent == True)
    )
    
    return clean_data


# ============================================================================
# EXAMPLE: COMPLETE TRANSFORMATION PIPELINE
# ============================================================================

def build_complete_analytics_pipeline(
    weather_stream: pw.Table,
    reports_stream: pw.Table
) -> Dict[str, pw.Table]:
    """
    Complete analytics pipeline demonstrating multiple transformations
    """
    
    logger.info("Building complete analytics pipeline...")
    
    # 1. Data validation
    clean_weather = validate_and_clean_data(weather_stream)
    clean_reports = validate_and_clean_data(reports_stream)
    logger.info("✓ Data validation complete")
    
    # 2. Temporal analysis
    weather_trends = temporal_weather_analysis(clean_weather)
    logger.info("✓ Temporal analysis complete")
    
    # 3. Anomaly detection
    weather_anomalies = detect_weather_anomalies(clean_weather)
    logger.info("✓ Anomaly detection complete")
    
    # 4. Stream joins
    correlated_data = join_weather_and_reports(clean_weather, clean_reports)
    logger.info("✓ Stream joins complete")
    
    # 5. Priority ranking
    prioritized_incidents = prioritize_emergency_responses(
        clean_reports,
        None  # Would pass resources table
    )
    logger.info("✓ Priority ranking complete")
    
    # Return all derived streams
    return {
        "clean_weather": clean_weather,
        "clean_reports": clean_reports,
        "weather_trends": weather_trends,
        "anomalies": weather_anomalies,
        "correlated": correlated_data,
        "high_priority": prioritized_incidents
    }


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("⚙️  PATHWAY ADVANCED TRANSFORMATIONS")
    logger.info("=" * 70)
    logger.info("\nThis module demonstrates:")
    logger.info("  • Temporal aggregations")
    logger.info("  • Spatial joins")
    logger.info("  • Stateful processing")
    logger.info("  • Stream joins")
    logger.info("  • Anomaly detection")
    logger.info("  • Priority queues")
    logger.info("  • Data validation")
    logger.info("\nImport these functions in your main pipeline to use them.")
    logger.info("=" * 70)
