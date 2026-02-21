# =====================================================
# Test Deployed Services - SKYNETRA Platform
# =====================================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Testing SKYNETRA Deployed Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Service URLs
$PATHWAY_URL = "https://climate-disaster-1.onrender.com"
$BACKEND_URL = "https://climate-disaster.onrender.com"
$FRONTEND_URL = "https://skynetra.vercel.app"

Write-Host "📍 Service Endpoints:" -ForegroundColor Yellow
Write-Host "   Frontend:  $FRONTEND_URL" -ForegroundColor White
Write-Host "   Backend:   $BACKEND_URL" -ForegroundColor White
Write-Host "   Pathway:   $PATHWAY_URL" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# =====================================================
# Test 1: Pathway Service Health
# =====================================================
Write-Host "1️⃣  Testing Pathway Service (AI/Weather)" -ForegroundColor Yellow
Write-Host "   URL: $PATHWAY_URL" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "   Checking health... (may take 60s if cold start)" -ForegroundColor Gray
    $pathwayHealth = Invoke-RestMethod -Uri "$PATHWAY_URL/health" -Method GET -TimeoutSec 90
    
    Write-Host "   ✅ Pathway Service is ONLINE!" -ForegroundColor Green
    Write-Host "      Status: $($pathwayHealth.status)" -ForegroundColor Cyan
    Write-Host "      Service: $($pathwayHealth.service)" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "   ❌ Pathway Service FAILED" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 2: Pathway Weather Data
# =====================================================
Write-Host "2️⃣  Testing Pathway Weather API" -ForegroundColor Yellow
try {
    $weather = Invoke-RestMethod -Uri "$PATHWAY_URL/api/v1/weather" -Method GET -TimeoutSec 60
    
    Write-Host "   ✅ Weather API Working!" -ForegroundColor Green
    Write-Host "      Locations monitored: $($weather.count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($weather.data -and $weather.data.Count -gt 0) {
        Write-Host "   📊 Weather Data:" -ForegroundColor Cyan
        foreach ($loc in $weather.data | Select-Object -First 3) {
            $temp = [math]::Round($loc.temperature, 1)
            Write-Host "      • $($loc.location): $temp°C" -ForegroundColor White
        }
        Write-Host ""
    }
}
catch {
    Write-Host "   ❌ Weather API Failed" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 3: Submit Weather Report to Pathway
# =====================================================
Write-Host "3  Testing Weather Report Submission" -ForegroundColor Yellow
try {
    $timestamp = Get-Date -Format 'HHmmss'
    $reportData = @{
        latitude = 28.6139
        longitude = 77.2090
        report_type = "weather_observation"
        severity = 6
        description = "Test report from PowerShell - Temperature: 30C, Clear sky"
        user_id = "test_user_$timestamp"
    }
    
    $reportJson = $reportData | ConvertTo-Json
    $reportResult = Invoke-RestMethod -Uri "$PATHWAY_URL/api/v1/reports" -Method POST -Body $reportJson -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "   SUCCESS Report Submitted Successfully!" -ForegroundColor Green
    Write-Host "      Report ID: $($reportResult.report_id)" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "   FAILED Report Submission Failed" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 4: Backend Service Health
# =====================================================
Write-Host "4️⃣  Testing Backend Service (MongoDB/API)" -ForegroundColor Yellow
Write-Host "   URL: $BACKEND_URL" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "   Checking health... (may take 60s if cold start)" -ForegroundColor Gray
    $backendHealth = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 90
    
    Write-Host "   ✅ Backend Service is ONLINE!" -ForegroundColor Green
    Write-Host "      Status: $($backendHealth.status)" -ForegroundColor Cyan
    if ($backendHealth.mongodb) {
        Write-Host "      MongoDB: $($backendHealth.mongodb)" -ForegroundColor Cyan
    }
    Write-Host ""
}
catch {
    Write-Host "   ❌ Backend Service FAILED" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 5: Frontend Accessibility
# =====================================================
Write-Host "5️⃣  Testing Frontend (Vercel)" -ForegroundColor Yellow
Write-Host "   URL: $FRONTEND_URL" -ForegroundColor Gray
Write-Host ""

try {
    $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -Method GET -TimeoutSec 30 -UseBasicParsing
    
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is ACCESSIBLE!" -ForegroundColor Green
        Write-Host "      Status: $($frontendResponse.StatusCode)" -ForegroundColor Cyan
        Write-Host "      Content Length: $($frontendResponse.Content.Length) bytes" -ForegroundColor Cyan
        Write-Host ""
    }
}
catch {
    Write-Host "   ❌ Frontend NOT Accessible" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Test 6: Risk Predictions
# =====================================================
Write-Host "6️⃣  Testing Risk Predictions API" -ForegroundColor Yellow
try {
    $risks = Invoke-RestMethod -Uri "$PATHWAY_URL/api/v1/risk-predictions?min_risk=0.3" -Method GET -TimeoutSec 60
    
    Write-Host "   ✅ Risk Predictions Working!" -ForegroundColor Green
    Write-Host "      High-risk areas detected: $($risks.count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($risks.data -and $risks.data.Count -gt 0) {
        Write-Host "   ⚠️  Top Risks:" -ForegroundColor Yellow
        foreach ($risk in $risks.data | Select-Object -First 3) {
            $riskPercent = [math]::Round($risk.risk_score * 100, 0)
            Write-Host "      • $($risk.location): $riskPercent% - $($risk.predicted_event_type)" -ForegroundColor White
        }
        Write-Host ""
    }
}
catch {
    Write-Host "   ❌ Risk Predictions Failed" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# =====================================================
# Summary
# =====================================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service Status Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Pathway Service: Check results above" -ForegroundColor White
Write-Host "2. Backend Service: Check results above" -ForegroundColor White
Write-Host "3. Frontend: Check results above" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 How to Submit Current Weather Data:" -ForegroundColor Yellow
Write-Host ""
Write-Host "PowerShell Command:" -ForegroundColor Cyan
Write-Host ""
Write-Host '$weatherData = @{' -ForegroundColor White
Write-Host '    latitude = 28.6139' -ForegroundColor White
Write-Host '    longitude = 77.2090' -ForegroundColor White
Write-Host '    report_type = "weather"' -ForegroundColor White
Write-Host '    severity = 7' -ForegroundColor White
Write-Host '    description = "Current: 32C, Humid 85%, Wind 15 m/s"' -ForegroundColor White
Write-Host '} | ConvertTo-Json' -ForegroundColor White
Write-Host ""
Write-Host 'Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/reports" -Method POST -Body $weatherData -ContentType "application/json"' -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Quick Access Links:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend App:        $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend API Health:  $BACKEND_URL/health" -ForegroundColor Cyan
Write-Host "Pathway Health:      $PATHWAY_URL/health" -ForegroundColor Cyan
Write-Host "Weather Data:        $PATHWAY_URL/api/v1/weather" -ForegroundColor Cyan
Write-Host "Risk Predictions:    $PATHWAY_URL/api/v1/risk-predictions" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
