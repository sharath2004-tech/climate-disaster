# =====================================================
# Test Pathway Service - Weather & Current Data
# =====================================================
Write-Host "🌤️  Testing Pathway Service - Weather Integration" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Use local or deployed URL
$BASE_URL = "http://localhost:8080"  # Change to your deployed URL if needed
# $BASE_URL = "https://climate-disaster-1.onrender.com"

# =====================================================
# Test 1: Check if Service is Running
# =====================================================
Write-Host "1️⃣  Checking Service Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" `
        -Method GET `
        -TimeoutSec 30 `
        -ContentType "application/json"
    
    Write-Host "✅ Service is RUNNING!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "   Service: $($health.service)" -ForegroundColor Cyan
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Service is NOT RUNNING!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 To start the service locally:" -ForegroundColor Yellow
    Write-Host "   cd pathway-service" -ForegroundColor White
    Write-Host "   python simple_api_server.py" -ForegroundColor White
    Write-Host ""
    exit 1
}

# =====================================================
# Test 2: Get Current Weather Data
# =====================================================
Write-Host "2️⃣  Fetching Current Weather Data..." -ForegroundColor Yellow
try {
    $weatherResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/weather" `
        -Method GET `
        -TimeoutSec 30 `
        -ContentType "application/json"
    
    Write-Host "✅ Weather data received!" -ForegroundColor Green
    Write-Host "   Status: $($weatherResponse.status)" -ForegroundColor Cyan
    Write-Host "   Locations: $($weatherResponse.count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($weatherResponse.data -and $weatherResponse.data.Count -gt 0) {
        Write-Host "📍 Weather by Location:" -ForegroundColor Cyan
        Write-Host "   =====================" -ForegroundColor Cyan
        foreach ($location in $weatherResponse.data) {
            $tempColor = if ($location.temperature -gt 35) { "Red" } elseif ($location.temperature -gt 30) { "Yellow" } else { "Green" }
            Write-Host "   🌡️  $($location.location)" -ForegroundColor White
            Write-Host "      Temperature: $([math]::Round($location.temperature, 1))°C" -ForegroundColor $tempColor
            Write-Host "      Humidity: $([math]::Round($location.humidity, 0))%" -ForegroundColor Cyan
            Write-Host "      Wind Speed: $([math]::Round($location.wind_speed, 1)) m/s" -ForegroundColor Cyan
            Write-Host "      Pressure: $([math]::Round($location.pressure, 0)) hPa" -ForegroundColor Cyan
            if ($location.description) {
                Write-Host "      Condition: $($location.description)" -ForegroundColor Cyan
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  No weather data available (may need OpenWeather API key)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to fetch weather data" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 3: Submit Weather Report (Simulating Current Weather)
# =====================================================
Write-Host "3️⃣  Submitting a Weather/Disaster Report..." -ForegroundColor Yellow
try {
    # Sample weather report - modify these values with your current data
    $currentWeatherReport = @{
        latitude = 40.7128      # Your location latitude
        longitude = -74.0060    # Your location longitude
        report_type = "weather_observation"
        severity = 7            # 1-10 scale
        description = "Heavy rainfall observed. Temperature: 28°C, Wind speed: 15 m/s, Humidity: 85%"
        user_id = "test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json

    $reportResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/reports" `
        -Method POST `
        -Body $currentWeatherReport `
        -ContentType "application/json" `
        -TimeoutSec 30
    
    Write-Host "✅ Weather report submitted successfully!" -ForegroundColor Green
    Write-Host "   Status: $($reportResponse.status)" -ForegroundColor Cyan
    Write-Host "   Report ID: $($reportResponse.report_id)" -ForegroundColor Cyan
    Write-Host "   Message: $($reportResponse.message)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Failed to submit report" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 4: Get Risk Predictions
# =====================================================
Write-Host "4️⃣  Fetching Risk Predictions..." -ForegroundColor Yellow
try {
    $riskResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/risk-predictions?min_risk=0.3" `
        -Method GET `
        -TimeoutSec 30 `
        -ContentType "application/json"
    
    Write-Host "✅ Risk predictions received!" -ForegroundColor Green
    Write-Host "   High-risk areas: $($riskResponse.count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($riskResponse.data -and $riskResponse.data.Count -gt 0) {
        Write-Host "⚠️  Risk Predictions:" -ForegroundColor Yellow
        Write-Host "   ==================" -ForegroundColor Yellow
        foreach ($risk in $riskResponse.data) {
            $riskColor = if ($risk.risk_score -gt 0.7) { "Red" } elseif ($risk.risk_score -gt 0.5) { "Yellow" } else { "Green" }
            $riskLevel = if ($risk.risk_score -gt 0.7) { "HIGH" } elseif ($risk.risk_score -gt 0.5) { "MEDIUM" } else { "LOW" }
            
            Write-Host "   📍 $($risk.location)" -ForegroundColor White
            Write-Host "      Risk Score: $([math]::Round($risk.risk_score * 100, 0))% ($riskLevel)" -ForegroundColor $riskColor
            Write-Host "      Event Type: $($risk.predicted_event_type)" -ForegroundColor Cyan
            if ($risk.recommended_actions -and $risk.recommended_actions.Count -gt 0) {
                Write-Host "      Actions:" -ForegroundColor Cyan
                foreach ($action in $risk.recommended_actions) {
                    Write-Host "        • $action" -ForegroundColor Gray
                }
            }
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Failed to fetch risk predictions" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 5: Get Submitted Reports
# =====================================================
Write-Host "5️⃣  Fetching All Citizen Reports..." -ForegroundColor Yellow
try {
    $reportsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/reports" `
        -Method GET `
        -TimeoutSec 30 `
        -ContentType "application/json"
    
    Write-Host "✅ Reports retrieved!" -ForegroundColor Green
    Write-Host "   Total reports: $($reportsResponse.count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($reportsResponse.data -and $reportsResponse.data.Count -gt 0) {
        Write-Host "📋 Recent Reports:" -ForegroundColor Cyan
        Write-Host "   ===============" -ForegroundColor Cyan
        $recentReports = $reportsResponse.data | Select-Object -Last 5
        foreach ($report in $recentReports) {
            Write-Host "   🔹 ID: $($report.report_id)" -ForegroundColor White
            Write-Host "      Type: $($report.report_type)" -ForegroundColor Cyan
            Write-Host "      Severity: $($report.severity)/10" -ForegroundColor Yellow
            Write-Host "      Description: $($report.description)" -ForegroundColor Gray
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Failed to fetch reports" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Summary and Examples
# =====================================================
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 How to Send Current Weather via API:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using PowerShell:" -ForegroundColor Yellow
Write-Host @"
`$weatherData = @{
    latitude = 28.6139        # Your latitude
    longitude = 77.2090       # Your longitude
    report_type = 'weather'
    severity = 5              # 1-10 scale
    description = 'Temp: 32°C, Humidity: 70%, Wind: 12 m/s'
} | ConvertTo-Json

Invoke-RestMethod -Uri '$BASE_URL/api/v1/reports' ``
    -Method POST ``
    -Body `$weatherData ``
    -ContentType 'application/json'
"@ -ForegroundColor White

Write-Host ""
Write-Host "Using cURL:" -ForegroundColor Yellow
Write-Host @"
curl -X POST $BASE_URL/api/v1/reports \
  -H 'Content-Type: application/json' \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "report_type": "weather",
    "severity": 5,
    "description": "Temp: 32°C, Humidity: 70%, Wind: 12 m/s"
  }'
"@ -ForegroundColor White

Write-Host ""
Write-Host "Using JavaScript/TypeScript:" -ForegroundColor Yellow
Write-Host @"
import axios from 'axios';

const weatherData = {
  latitude: 28.6139,
  longitude: 77.2090,
  report_type: 'weather',
  severity: 5,
  description: 'Temp: 32°C, Humidity: 70%, Wind: 12 m/s'
};

const response = await axios.post(
  '$BASE_URL/api/v1/reports',
  weatherData
);
console.log(response.data);
"@ -ForegroundColor White

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🔗 Available Endpoints:" -ForegroundColor Cyan
Write-Host ""
Write-Host "GET  /health                        - Service health check" -ForegroundColor Gray
Write-Host "GET  /api/v1/weather                - Get current weather data" -ForegroundColor Gray
Write-Host "GET  /api/v1/risk-predictions       - Get risk predictions" -ForegroundColor Gray
Write-Host "GET  /api/v1/alerts                 - Get active alerts" -ForegroundColor Gray
Write-Host "POST /api/v1/reports                - Submit weather/disaster report" -ForegroundColor Gray
Write-Host "GET  /api/v1/reports                - Get all reports" -ForegroundColor Gray
Write-Host "GET  /api/v1/reports/verified       - Get verified reports" -ForegroundColor Gray
Write-Host "GET  /api/v1/shelters               - Get emergency shelters" -ForegroundColor Gray
Write-Host "POST /api/v1/evacuation/route       - Get evacuation route" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
