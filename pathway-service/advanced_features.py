"""
Advanced Pathway features for disaster response:
- Citizen report aggregation and verification
- Evacuation route optimization
- Resource allocation
- Social media monitoring
"""

import pathway as pw
import requests
from typing import List, Dict, Tuple
import math
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CitizenReportAggregator:
    """Aggregates and verifies citizen reports using spatial-temporal clustering"""
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in km (Haversine formula)"""
        R = 6371  # Earth radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    @staticmethod
    def grid_cell(lat: float, lon: float, grid_size: float = 0.1) -> str:
        """Convert lat/lon to grid cell identifier"""
        lat_cell = int(lat / grid_size)
        lon_cell = int(lon / grid_size)
        return f"{lat_cell},{lon_cell}"
    
    @staticmethod
    def verify_reports(reports: List[Dict]) -> Dict:
        """Cross-verify multiple reports in the same area"""
        if len(reports) < 2:
            return {
                "verified": False,
                "confidence": 0.3,
                "report_count": len(reports),
                "consensus_severity": reports[0].get("severity", 5) if reports else 5
            }
        
        # Calculate average severity
        avg_severity = sum(r.get("severity", 5) for r in reports) / len(reports)
        
        # Check report consistency
        severity_variance = sum((r.get("severity", 5) - avg_severity)**2 for r in reports) / len(reports)
        
        # Calculate verification confidence
        confidence = min(0.3 + (len(reports) * 0.15), 0.95)
        
        # Reduce confidence if reports are inconsistent
        if severity_variance > 9:  # High variance
            confidence *= 0.7
        
        return {
            "verified": len(reports) >= 3 and confidence > 0.6,
            "confidence": confidence,
            "report_count": len(reports),
            "consensus_severity": int(avg_severity),
            "variance": severity_variance
        }


class EvacuationRouteOptimizer:
    """Optimizes evacuation routes based on real-time conditions"""
    
    @staticmethod
    def calculate_route_safety(
        start_lat: float,
        start_lon: float,
        shelter_lat: float,
        shelter_lon: float,
        disaster_zones: List[Dict],
        blocked_roads: List[Dict]
    ) -> Dict:
        """Calculate safety score for a route"""
        
        distance = CitizenReportAggregator.calculate_distance(
            start_lat, start_lon, shelter_lat, shelter_lon
        )
        
        # Base travel time (assuming 40 km/h average speed in emergency)
        base_time_minutes = (distance / 40) * 60
        
        # Check proximity to disaster zones
        min_disaster_distance = float('inf')
        for zone in disaster_zones:
            d = CitizenReportAggregator.calculate_distance(
                start_lat, start_lon,
                zone["latitude"], zone["longitude"]
            )
            min_disaster_distance = min(min_disaster_distance, d)
        
        # Safety score (0-1, higher is safer)
        if min_disaster_distance < 2:  # Within 2km of disaster
            safety_score = 0.2
            base_time_minutes *= 1.5  # Slower due to congestion
        elif min_disaster_distance < 5:
            safety_score = 0.5
            base_time_minutes *= 1.2
        elif min_disaster_distance < 10:
            safety_score = 0.7
        else:
            safety_score = 0.95
        
        # Factor in blocked roads
        road_penalty = len(blocked_roads) * 0.05
        safety_score = max(0.1, safety_score - road_penalty)
        base_time_minutes += len(blocked_roads) * 10  # Detour time
        
        return {
            "distance_km": round(distance, 2),
            "estimated_time_minutes": int(base_time_minutes),
            "safety_score": round(safety_score, 2),
            "disaster_distance_km": round(min_disaster_distance, 2),
            "recommended": safety_score > 0.6
        }
    
    @staticmethod
    def find_best_shelter(
        user_lat: float,
        user_lon: float,
        shelters: List[Dict],
        disaster_zones: List[Dict],
        max_shelters: int = 3
    ) -> List[Dict]:
        """Find the best evacuation shelters for a user"""
        
        ranked_shelters = []
        
        for shelter in shelters:
            route_info = EvacuationRouteOptimizer.calculate_route_safety(
                user_lat, user_lon,
                shelter["latitude"], shelter["longitude"],
                disaster_zones,
                []  # No blocked roads info yet
            )
            
            # Calculate capacity score
            capacity_available = shelter.get("capacity", 0) - shelter.get("current_occupancy", 0)
            capacity_score = min(1.0, capacity_available / max(shelter.get("capacity", 1), 1))
            
            # Combined score
            combined_score = (route_info["safety_score"] * 0.6) + (capacity_score * 0.4)
            
            ranked_shelters.append({
                "shelter_id": shelter.get("id", "unknown"),
                "name": shelter.get("name", "Emergency Shelter"),
                "latitude": shelter["latitude"],
                "longitude": shelter["longitude"],
                "distance_km": route_info["distance_km"],
                "estimated_time_minutes": route_info["estimated_time_minutes"],
                "safety_score": route_info["safety_score"],
                "capacity_available": capacity_available,
                "combined_score": round(combined_score, 2)
            })
        
        # Sort by combined score
        ranked_shelters.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return ranked_shelters[:max_shelters]


class ResourceAllocator:
    """Optimizes resource allocation across disaster zones"""
    
    @staticmethod
    def calculate_resource_priority(disaster_event: Dict, population: int) -> float:
        """Calculate priority score for resource allocation"""
        
        severity = disaster_event.get("severity", 5)
        affected_radius = disaster_event.get("affected_radius_km", 5)
        
        # Estimate affected population
        # Rough estimate: population density * affected area
        affected_area_km2 = math.pi * (affected_radius ** 2)
        estimated_affected = population * (affected_area_km2 / 100)  # Normalize
        
        # Priority formula
        priority = (severity / 10) * 0.5 + (min(estimated_affected, 10000) / 10000) * 0.5
        
        return min(1.0, priority)
    
    @staticmethod
    def allocate_resources(
        disasters: List[Dict],
        available_resources: List[Dict]
    ) -> List[Dict]:
        """Allocate resources to disaster zones based on priority"""
        
        # Calculate priorities
        prioritized_disasters = []
        for disaster in disasters:
            priority = ResourceAllocator.calculate_resource_priority(
                disaster,
                disaster.get("population", 50000)
            )
            prioritized_disasters.append({
                **disaster,
                "priority": priority
            })
        
        # Sort by priority
        prioritized_disasters.sort(key=lambda x: x["priority"], reverse=True)
        
        # Allocation results
        allocations = []
        
        for disaster in prioritized_disasters:
            # Allocate resources based on severity
            needed_resources = {
                "medical_teams": int(disaster["severity"] * 2),
                "water_supplies": int(disaster["severity"] * 100),
                "food_supplies": int(disaster["severity"] * 150),
                "rescue_vehicles": int(disaster["severity"] * 1.5)
            }
            
            allocations.append({
                "disaster_id": disaster.get("event_id", "unknown"),
                "location": f"{disaster['latitude']:.2f},{disaster['longitude']:.2f}",
                "priority": disaster["priority"],
                "severity": disaster["severity"],
                "needed_resources": needed_resources,
                "dispatch_urgency": "IMMEDIATE" if disaster["priority"] > 0.7 else "HIGH" if disaster["priority"] > 0.5 else "NORMAL"
            })
        
        return allocations


class AlertGenerator:
    """Generates automated alerts based on risk predictions"""
    
    @staticmethod
    def generate_alert(risk_prediction: Dict, population_affected: int) -> Dict:
        """Generate alert from risk prediction"""
        
        risk_score = risk_prediction.get("risk_score", 0)
        event_type = risk_prediction.get("predicted_event_type", "unknown")
        
        # Determine alert level
        if risk_score >= 0.8:
            alert_level = "CRITICAL"
            color_code = "red"
        elif risk_score >= 0.6:
            alert_level = "SEVERE"
            color_code = "orange"
        elif risk_score >= 0.4:
            alert_level = "MODERATE"
            color_code = "yellow"
        else:
            alert_level = "ADVISORY"
            color_code = "blue"
        
        # Generate message
        time_to_event = risk_prediction.get("time_to_event_hours", 24)
        
        message = f"{alert_level} {event_type.upper()} ALERT\n"
        message += f"Expected within {int(time_to_event)} hours\n"
        message += f"Risk Score: {risk_score:.2f}\n"
        message += f"Estimated Affected: {population_affected:,} people\n"
        message += f"Actions: {risk_prediction.get('recommended_actions', 'Monitor conditions')}"
        
        return {
            "alert_id": f"ALERT-{int(datetime.now().timestamp())}",
            "timestamp": int(datetime.now().timestamp()),
            "location": risk_prediction.get("location", "Unknown"),
            "latitude": risk_prediction.get("latitude", 0),
            "longitude": risk_prediction.get("longitude", 0),
            "alert_level": alert_level,
            "event_type": event_type,
            "risk_score": risk_score,
            "message": message,
            "color_code": color_code,
            "expires_at": int(datetime.now().timestamp()) + (int(time_to_event) * 3600),
            "population_affected": population_affected
        }


def process_citizen_reports_stream(reports_table):
    """Process citizen reports with Pathway"""
    
    # Add grid cell for spatial grouping
    reports_with_grid = reports_table.select(
        *pw.this,
        grid_cell=pw.apply(
            lambda lat, lon: CitizenReportAggregator.grid_cell(lat, lon),
            pw.this.latitude,
            pw.this.longitude
        )
    )
    
    # Group by grid cell and aggregate
    aggregated_reports = reports_with_grid.groupby(
        reports_with_grid.grid_cell,
        reports_with_grid.report_type
    ).reduce(
        grid_cell=pw.this.grid_cell,
        report_type=pw.this.report_type,
        report_count=pw.reducers.count(),
        avg_severity=pw.reducers.avg(pw.this.severity),
        latest_report_time=pw.reducers.max(pw.this.timestamp)
    )
    
    # Filter for verified incidents (3+ reports in same area)
    verified_incidents = aggregated_reports.filter(
        pw.this.report_count >= 3
    )
    
    return verified_incidents


def optimize_evacuation_routes(users_table, shelters_table, disasters_table):
    """Optimize evacuation routes using Pathway"""
    
    # Cross join users with shelters to evaluate all possible routes
    # (In production, you'd limit this to nearby shelters only)
    
    # For each user, find best shelters
    # This is a simplified version - full implementation would use more complex joins
    
    optimized_routes = users_table.select(
        user_id=pw.this.user_id,
        user_lat=pw.this.latitude,
        user_lon=pw.this.longitude,
        # In real implementation, you'd join with shelters and disasters
        # and calculate optimal routes
    )
    
    return optimized_routes
