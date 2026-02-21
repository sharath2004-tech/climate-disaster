# Test SKYNETRA Deployed Services
# Simple version without emojis for PowerShell compatibility

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing SKYNETRA Deployed Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URLs
$PATHWAY = "https://climate-disaster-1.onrender.com"
$BACKEND = "https://climate-disaster.onrender.com"
$FRONTEND = "https://skynetra.vercel.app"

Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:  $FRONTEND" -ForegroundColor White
Write-Host "  Backend:   $BACKEND" -ForegroundColor White
Write-Host "  Pathway:   $PATHWAY" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Pathway Health
Write-Host "[1/6] Testing Pathway Service Health..." -ForegroundColor Yellow
Write-Host "       (may take 60-90s if cold start)" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$PATHWAY/health" -Method GET -TimeoutSec 90
    Write-Host "  SUCCESS - Pathway is ONLINE!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "  Service: $($health.service)" -ForegroundColor Cyan
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Weather Data
Write-Host "[2/6] Testing Weather API..." -ForegroundColor Yellow
try {
    $weather = Invoke-RestMethod -Uri "$PATHWAY/api/v1/weather" -Method GET -TimeoutSec 60
    Write-Host "  SUCCESS - Weather data received!" -ForegroundColor Green
    Write-Host "  Locations: $($weather.count)" -ForegroundColor Cyan
    
    if ($weather.data -and $weather.data.Count -gt 0) {
        Write-Host "  Sample data:" -ForegroundColor Cyan
        $weather.data | Select-Object -First 3 | ForEach-Object {
            $t = [math]::Round($_.temperature, 1)
            Write-Host "    - $($_.location): ${t}C" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Submit Report
Write-Host "[3/6] Testing Weather Report Submission..." -ForegroundColor Yellow
try {
    $ts = Get-Date -Format 'HHmmss'
    $report = @{
        latitude = 28.6139
        longitude = 77.2090
        report_type = "weather_observation"
        severity = 6
        description = "Test from PowerShell - Clear sky, 30C"
        user_id = "test_user_$ts"
    }
    
    $json = $report | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$PATHWAY/api/v1/reports" -Method POST -Body $json -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "  SUCCESS - Report submitted!" -ForegroundColor Green
    Write-Host "  Report ID: $($result.report_id)" -ForegroundColor Cyan
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Risk Predictions
Write-Host "[4/6] Testing Risk Predictions..." -ForegroundColor Yellow
try {
    $risks = Invoke-RestMethod -Uri "$PATHWAY/api/v1/risk-predictions?min_risk=0.3" -Method GET -TimeoutSec 60
    Write-Host "  SUCCESS - Risk data received!" -ForegroundColor Green
    Write-Host "  High-risk areas: $($risks.count)" -ForegroundColor Cyan
    
    if ($risks.data -and $risks.data.Count -gt 0) {
        Write-Host "  Top risks:" -ForegroundColor Cyan
        $risks.data | Select-Object -First 3 | ForEach-Object {
            $pct = [math]::Round($_.risk_score * 100, 0)
            Write-Host "    - $($_.location): ${pct}% $($_.predicted_event_type)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Backend Health
Write-Host "[5/6] Testing Backend Service..." -ForegroundColor Yellow
Write-Host "       (may take 60-90s if cold start)" -ForegroundColor Gray
try {
    $backend = Invoke-RestMethod -Uri "$BACKEND/health" -Method GET -TimeoutSec 90
    Write-Host "  SUCCESS - Backend is ONLINE!" -ForegroundColor Green
    Write-Host "  Status: $($backend.status)" -ForegroundColor Cyan
    if ($backend.mongodb) {
        Write-Host "  MongoDB: $($backend.mongodb)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Frontend
Write-Host "[6/6] Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $FRONTEND -Method GET -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  SUCCESS - Frontend is accessible!" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TESTING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Reference:" -ForegroundColor Yellow
Write-Host ""
Write-Host "To submit current weather data:" -ForegroundColor Cyan
Write-Host ""
Write-Host '$data = @{' -ForegroundColor White
Write-Host '  latitude = 28.6139' -ForegroundColor White
Write-Host '  longitude = 77.2090' -ForegroundColor White
Write-Host '  report_type = "weather"' -ForegroundColor White
Write-Host '  severity = 7' -ForegroundColor White
Write-Host '  description = "Current weather: 32C, Wind 15 m/s"' -ForegroundColor White
Write-Host '} | ConvertTo-Json' -ForegroundColor White
Write-Host ""
Write-Host 'Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/reports" -Method POST -Body $data -ContentType "application/json"' -ForegroundColor White
Write-Host ""
Write-Host "Quick Links:" -ForegroundColor Yellow
Write-Host "  Frontend: $FRONTEND" -ForegroundColor Cyan
Write-Host "  Backend:  $BACKEND/health" -ForegroundColor Cyan
Write-Host "  Pathway:  $PATHWAY/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
