#!/bin/bash

# =====================================================
# Test SKYNETRA Deployed Services (Bash/cURL version)
# =====================================================

echo ""
echo "=========================================="
echo "🚀 Testing SKYNETRA Deployed Services"
echo "=========================================="
echo ""

# Service URLs
PATHWAY_URL="https://climate-disaster-1.onrender.com"
BACKEND_URL="https://climate-disaster.onrender.com"
FRONTEND_URL="https://skynetra.vercel.app"

echo "📍 Service Endpoints:"
echo "   Frontend:  $FRONTEND_URL"
echo "   Backend:   $BACKEND_URL"
echo "   Pathway:   $PATHWAY_URL"
echo ""
echo "=========================================="
echo ""

# =====================================================
# Test 1: Pathway Service Health
# =====================================================
echo "1️⃣  Testing Pathway Service"
echo ""

response=$(curl -s -w "\n%{http_code}" "$PATHWAY_URL/health" --max-time 90)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "   ✅ Pathway Service is ONLINE!"
    echo "   Response: $body"
else
    echo "   ❌ Pathway Service FAILED (HTTP $http_code)"
fi
echo ""

# =====================================================
# Test 2: Weather Data
# =====================================================
echo "2️⃣  Testing Weather API"
echo ""

weather_response=$(curl -s "$PATHWAY_URL/api/v1/weather" --max-time 60)
if [ $? -eq 0 ]; then
    echo "   ✅ Weather API Working!"
    echo "   Data: $weather_response" | head -c 200
    echo "..."
else
    echo "   ❌ Weather API Failed"
fi
echo ""

# =====================================================
# Test 3: Submit Weather Report
# =====================================================
echo "3️⃣  Testing Weather Report Submission"
echo ""

report_response=$(curl -s -X POST "$PATHWAY_URL/api/v1/reports" \
    -H "Content-Type: application/json" \
    -d '{
        "latitude": 28.6139,
        "longitude": 77.2090,
        "report_type": "weather",
        "severity": 6,
        "description": "Test from bash - Clear sky, 30C"
    }' \
    --max-time 60)

if [ $? -eq 0 ]; then
    echo "   ✅ Report Submitted!"
    echo "   Response: $report_response"
else
    echo "   ❌ Report Submission Failed"
fi
echo ""

# =====================================================
# Test 4: Backend Health
# =====================================================
echo "4️⃣  Testing Backend Service"
echo ""

backend_response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health" --max-time 90)
backend_code=$(echo "$backend_response" | tail -n1)
backend_body=$(echo "$backend_response" | head -n-1)

if [ "$backend_code" = "200" ]; then
    echo "   ✅ Backend Service is ONLINE!"
    echo "   Response: $backend_body"
else
    echo "   ❌ Backend Service FAILED (HTTP $backend_code)"
fi
echo ""

# =====================================================
# Test 5: Frontend
# =====================================================
echo "5️⃣  Testing Frontend"
echo ""

frontend_response=$(curl -s -w "\n%{http_code}" "$FRONTEND_URL" --max-time 30)
frontend_code=$(echo "$frontend_response" | tail -n1)

if [ "$frontend_code" = "200" ]; then
    echo "   ✅ Frontend is ACCESSIBLE!"
else
    echo "   ❌ Frontend NOT Accessible (HTTP $frontend_code)"
fi
echo ""

# =====================================================
# Summary
# =====================================================
echo ""
echo "=========================================="
echo "✅ Testing Complete!"
echo "=========================================="
echo ""
echo "📝 To submit current weather:"
echo ""
echo 'curl -X POST https://climate-disaster-1.onrender.com/api/v1/reports \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "latitude": 28.6139,'
echo '    "longitude": 77.2090,'
echo '    "report_type": "weather",'
echo '    "severity": 7,'
echo '    "description": "Current: 32C, Humid, Wind 15 m/s"'
echo '  }'"'"
echo ""
echo "=========================================="
echo ""
