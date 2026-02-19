# Test Pathway Service
Write-Host "🧪 Testing Pathway Service..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/health" -TimeoutSec 60
    Write-Host "✅ Service is alive!" -ForegroundColor Green
    Write-Host $health
} catch {
    Write-Host "❌ Service may be sleeping (cold start). Wait 60s and try again." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Test 2: Weather Data
Write-Host "2️⃣ Fetching Weather Data..." -ForegroundColor Yellow
try {
    $weather = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/weather" -TimeoutSec 60
    Write-Host "✅ Weather data received!" -ForegroundColor Green
    Write-Host "Monitoring $($weather.data.count) locations"
    $weather.data | ForEach-Object {
        Write-Host "  📍 $($_.city_name): $($_.temperature)°C, $($_.weather_condition)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to fetch weather" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Test 3: Risk Predictions
Write-Host "3️⃣ Fetching Risk Predictions..." -ForegroundColor Yellow
try {
    $risks = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/risk-predictions?min_risk=0.3" -TimeoutSec 60
    Write-Host "✅ Risk predictions received!" -ForegroundColor Green
    Write-Host "Found $($risks.data.count) moderate-to-high risk areas"
    $risks.data | ForEach-Object {
        $color = if ($_.risk_score -gt 0.6) { "Red" } elseif ($_.risk_score -gt 0.4) { "Yellow" } else { "Green" }
        Write-Host "  ⚠️  $($_.city_name): $($_.predicted_event_type) risk $($_.risk_score) - $($_.recommended_actions)" -ForegroundColor $color
    }
} catch {
    Write-Host "❌ Failed to fetch predictions" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Test 4: Active Alerts
Write-Host "4️⃣ Checking Active Alerts..." -ForegroundColor Yellow
try {
    $alerts = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/alerts" -TimeoutSec 60
    Write-Host "✅ Alerts received!" -ForegroundColor Green
    if ($alerts.data.count -gt 0) {
        Write-Host "🚨 $($alerts.data.count) active alerts!" -ForegroundColor Red
        $alerts.data | ForEach-Object {
            Write-Host "  🔔 $($_.event_type): $($_.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ℹ️  No active alerts (all clear)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to fetch alerts" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
