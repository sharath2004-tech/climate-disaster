#!/bin/bash

# ===================================================================
# Climate Disaster Response - Local Development Startup Script
# ===================================================================

set -e  # Exit on error

echo "🌍 Starting Climate Disaster Response - Pathway Project"
echo "============================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env file and add your OPENWEATHER_API_KEY${NC}"
    echo -e "   Get it from: https://openweathermap.org/api"
    exit 1
fi

# Check if OPENWEATHER_API_KEY is set
source .env
if [ -z "$OPENWEATHER_API_KEY" ] || [ "$OPENWEATHER_API_KEY" = "your_openweather_api_key_here" ]; then
    echo -e "${RED}❌ OPENWEATHER_API_KEY not configured in .env${NC}"
    echo -e "   Get your free API key from: https://openweathermap.org/api"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Build and start services
echo ""
echo "🏗️  Building and starting services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check MongoDB
if docker-compose ps mongodb | grep -q "Up"; then
    echo -e "${GREEN}✅ MongoDB: Running${NC}"
else
    echo -e "${RED}❌ MongoDB: Not running${NC}"
fi

# Check Pathway Service
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pathway Service: Running on http://localhost:8080${NC}"
else
    echo -e "${YELLOW}⏳ Pathway Service: Starting... (may take 30-60 seconds)${NC}"
fi

# Check Backend
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API: Running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⏳ Backend API: Starting...${NC}"
fi

# Check Frontend
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: Running on http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⏳ Frontend: Starting...${NC}"
fi

echo ""
echo "============================================================"
echo -e "${GREEN}🚀 Climate Disaster Response is starting!${NC}"
echo "============================================================"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:        http://localhost:3001"
echo "   Backend API:     http://localhost:3000"
echo "   Pathway Service: http://localhost:8080"
echo "   MongoDB:         localhost:27017"
echo ""
echo "📚 API Documentation:"
echo "   Pathway Health:  http://localhost:8080/health"
echo "   Risk Predictions: http://localhost:8080/api/v1/risk-predictions"
echo "   Weather Data:    http://localhost:8080/api/v1/weather"
echo "   Alerts:          http://localhost:8080/api/v1/alerts"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart"
echo "   View status:     docker-compose ps"
echo ""
echo "============================================================"
echo -e "${GREEN}✨ Happy disaster response development!${NC}"
echo "============================================================"

# Follow logs
echo ""
echo "📋 Showing service logs (Ctrl+C to exit logs, services keep running):"
echo ""
sleep 2
docker-compose logs -f
