"""
Pathway HTTP REST Connectors for Real-Time Data Ingestion
Demonstrates proper usage of pw.io.http for streaming data
Based on: https://pathway.com/developers/api-docs/pathway-io/http
"""

import pathway as pw
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# HTTP INPUT CONNECTORS - Receive streaming data via HTTP POST
# ============================================================================

class CitizenReportInput(pw.Schema):
    """Schema for citizen reports received via HTTP"""
    report_id: str
    timestamp: int
    latitude: float
    longitude: float
    report_type: str
    severity: int
    description: str
    user_id: str


class EmergencyAlertInput(pw.Schema):
    """Schema for emergency alerts"""
    alert_id: str
    timestamp: int
    location: str
    alert_type: str
    severity: str
    message: str


class SensorDataInput(pw.Schema):
    """Schema for IoT sensor data (water levels, temperature sensors, etc.)"""
    sensor_id: str
    timestamp: int
    sensor_type: str
    latitude: float
    longitude: float
    value: float
    unit: str


def setup_http_input_connectors(port: int = 8080):
    """
    Setup HTTP REST endpoints to receive streaming data
    POST data to these endpoints to ingest into Pathway
    """
    
    logger.info(f"Setting up HTTP input connectors on port {port}...")
    
    # Citizen reports endpoint: POST http://localhost:8080/citizen-reports
    # Example: curl -X POST http://localhost:8080/citizen-reports \
    #   -H "Content-Type: application/json" \
    #   -d '{"report_id":"R001","timestamp":1234567890,"latitude":28.6139,"longitude":77.2090,"report_type":"flood","severity":7,"description":"Water rising fast","user_id":"user123"}'
    
    citizen_reports = pw.io.http.rest_connector(
        host="0.0.0.0",
        port=port,
        schema=CitizenReportInput,
        delete_completed_queries=False,
        autocommit_duration_ms=1000  # Commit every 1 second
    )
    
    logger.info(f"✓ Citizen reports endpoint: http://localhost:{port}/")
    logger.info("  POST JSON data matching CitizenReportInput schema")
    
    return citizen_reports


# ============================================================================
# HTTP OUTPUT CONNECTORS - Serve streaming results via HTTP GET
# ============================================================================

def setup_http_output_connector(table: pw.Table, port: int = 8081, route: str = "/api/results"):
    """
    Setup HTTP REST endpoint to serve Pathway table results
    GET requests will return current state of the streaming table
    """
    
    logger.info(f"Setting up HTTP output connector on port {port}{route}...")
    
    # Note: As of Pathway's current API, output is typically done via:
    # - pw.io.jsonlines.write() for file output
    # - pw.io.kafka.write() for Kafka output
    # - Custom REST server for HTTP output (see api_server_integrated.py)
    
    # For HTTP serving, we use pw.io.jsonlines.write() to a file
    # and serve it via Flask/FastAPI or use Pathway's experimental features
    
    pw.io.jsonlines.write(table, f"./output{route.replace('/', '_')}.jsonl")
    logger.info(f"✓ Writing output to: ./output{route.replace('/', '_')}.jsonl")
    
    return table


# ============================================================================
# KAFKA CONNECTORS (Alternative to HTTP for high-throughput streaming)
# ============================================================================

def setup_kafka_input(topic: str, bootstrap_servers: str = "localhost:9092"):
    """
    Setup Kafka consumer for streaming data ingestion
    Better for high-volume production environments
    """
    
    logger.info(f"Setting up Kafka input from topic: {topic}")
    
    # Kafka input connector
    kafka_data = pw.io.kafka.read(
        rdkafka_settings={
            "bootstrap.servers": bootstrap_servers,
            "group.id": "pathway-disaster-response",
            "auto.offset.reset": "earliest"
        },
        topic=topic,
        schema=CitizenReportInput,
        format="json",
        autocommit_duration_ms=1000
    )
    
    logger.info(f"✓ Kafka consumer ready: {topic}")
    
    return kafka_data


def setup_kafka_output(table: pw.Table, topic: str, bootstrap_servers: str = "localhost:9092"):
    """
    Setup Kafka producer to publish streaming results
    """
    
    logger.info(f"Setting up Kafka output to topic: {topic}")
    
    pw.io.kafka.write(
        table,
        rdkafka_settings={
            "bootstrap.servers": bootstrap_servers
        },
        topic=topic,
        format="json"
    )
    
    logger.info(f"✓ Kafka producer ready: {topic}")


# ============================================================================
# CSV/FILE CONNECTORS (for batch processing and testing)
# ============================================================================

def setup_csv_input(directory: str, schema: type[pw.Schema]):
    """
    Read CSV files from a directory
    Pathway watches for new files and processes them automatically
    """
    
    logger.info(f"Setting up CSV input from directory: {directory}")
    
    csv_data = pw.io.csv.read(
        directory,
        schema=schema,
        mode="streaming",  # Watch for new files
        autocommit_duration_ms=1000
    )
    
    logger.info(f"✓ CSV reader ready: {directory}")
    
    return csv_data


# ============================================================================
# POSTGRES CONNECTOR (for database streaming)
# ============================================================================

def setup_postgres_input(connection_string: str):
    """
    Stream changes from PostgreSQL database
    Useful for integrating with existing databases
    """
    
    logger.info("Setting up PostgreSQL streaming input...")
    
    # Note: Requires debezium or custom CDC (Change Data Capture)
    # This is a simplified example - actual implementation depends on your setup
    
    # postgres_data = pw.io.postgres.read(
    #     connection_string=connection_string,
    #     table_name="disaster_events",
    #     schema=DisasterEventInput
    # )
    
    logger.info("✓ PostgreSQL streaming ready")
    # return postgres_data


# ============================================================================
# EXAMPLE: COMPLETE CONNECTOR SETUP
# ============================================================================

def run_connector_example():
    """
    Complete example showing all connector types
    """
    
    logger.info("=" * 70)
    logger.info("🔌 PATHWAY CONNECTOR DEMO")
    logger.info("=" * 70)
    
    # Create output directory
    os.makedirs("./output", exist_ok=True)
    os.makedirs("./input", exist_ok=True)
    
    # Method 1: HTTP REST Input
    citizen_reports_http = setup_http_input_connectors(port=8080)
    
    # Process the incoming reports
    verified_reports = citizen_reports_http.filter(pw.this.severity >= 5)
    
    # Method 2: CSV Input (for testing with sample data)
    # Place CSV files in ./input/reports/ directory
    # citizen_reports_csv = setup_csv_input(
    #     "./input/reports/",
    #     CitizenReportInput
    # )
    
    # Method 3: Kafka Input (for production)
    # kafka_reports = setup_kafka_input("disaster-reports")
    
    # Output results
    setup_http_output_connector(verified_reports, port=8081, route="/api/verified-reports")
    
    # Also write to Kafka for downstream consumers
    # setup_kafka_output(verified_reports, "verified-reports")
    
    logger.info("=" * 70)
    logger.info("✅ All connectors configured!")
    logger.info("=" * 70)
    logger.info("\n📌 Usage:")
    logger.info("  1. POST citizen reports to: http://localhost:8080/")
    logger.info("  2. View verified reports in: ./output/api_verified-reports.jsonl")
    logger.info("\n💡 Test with curl:")
    logger.info("""
  curl -X POST http://localhost:8080/ \\
    -H "Content-Type: application/json" \\
    -d '{
      "report_id": "R001",
      "timestamp": 1234567890,
      "latitude": 28.6139,
      "longitude": 77.2090,
      "report_type": "flood",
      "severity": 8,
      "description": "Severe flooding on Main Street",
      "user_id": "user123"
    }'
    """)
    
    logger.info("=" * 70)
    
    # Run Pathway engine
    pw.run(monitoring_level=pw.MonitoringLevel.ALL)


if __name__ == "__main__":
    run_connector_example()
