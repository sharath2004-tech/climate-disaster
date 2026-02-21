# Check if Pathway Service is using Real or Mock Weather Data

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Weather Data Source Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$PATHWAY = "https://climate-disaster-1.onrender.com"

Write-Host "Fetching weather data..." -ForegroundColor Yellow
Write-Host ""

try {
    $weather = Invoke-RestMethod -Uri "$PATHWAY/api/v1/weather" -TimeoutSec 30
    
    Write-Host "SUCCESS - Data received!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Analysis:" -ForegroundColor Yellow
    Write-Host ""
    
    # Check if data looks real
    $hasRealCities = $false
    $hasVariedTemps = $false
    $hasRealConditions = $false
    
    # Check for Indian cities
    $indianCities = @("Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad")
    foreach ($city in $indianCities) {
        $found = $weather.data | Where-Object { $_.location -eq $city }
        if ($found) {
            $hasRealCities = $true
            break
        }
    }
    
    # Check temperature variance (real data has specific values, not random)
    $temps = $weather.data | ForEach-Object { $_.temperature }
    $uniqueTemps = $temps | Select-Object -Unique
    if ($uniqueTemps.Count -gt 3) {
        $hasVariedTemps = $true
    }
    
    # Check for real weather conditions
    $realConditions = @("Clear", "Clouds", "Mist", "Fog", "Rain", "Smoke", "Haze")
    foreach ($data in $weather.data) {
        if ($realConditions -contains $data.weather_condition) {
            $hasRealConditions = $true
            break
        }
    }
    
    Write-Host "  Monitoring Indian Cities: " -NoNewline
    if ($hasRealCities) {
        Write-Host "YES (Real Data)" -ForegroundColor Green
    } else {
        Write-Host "NO (Mock Data)" -ForegroundColor Red
    }
    
    Write-Host "  Temperature Variance: " -NoNewline
    if ($hasVariedTemps) {
        Write-Host "YES (Real Data)" -ForegroundColor Green
    } else {
        Write-Host "LOW (Possibly Mock)" -ForegroundColor Yellow
    }
    
    Write-Host "  Weather Conditions: " -NoNewline
    if ($hasRealConditions) {
        Write-Host "Valid API Codes (Real Data)" -ForegroundColor Green
    } else {
        Write-Host "Random (Mock Data)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($hasRealCities -and $hasRealConditions) {
        Write-Host "VERDICT: Using REAL Weather Data from OpenWeatherMap API" -ForegroundColor Green
        Write-Host ""
        Write-Host "Current Weather Snapshot:" -ForegroundColor Cyan
        Write-Host "=========================" -ForegroundColor Cyan
        foreach ($loc in $weather.data) {
            $temp = [math]::Round($loc.temperature, 1)
            $time = [DateTimeOffset]::FromUnixTimeSeconds($loc.timestamp).ToLocalTime()
            Write-Host "  $($loc.location): " -NoNewline -ForegroundColor White
            Write-Host "$temp C" -NoNewline -ForegroundColor Yellow
            Write-Host " | $($loc.weather_condition)" -NoNewline -ForegroundColor Cyan
            if ($loc.humidity) {
                Write-Host " | Humidity: $($loc.humidity)%" -NoNewline -ForegroundColor Gray
            }
            if ($loc.wind_speed) {
                Write-Host " | Wind: $([math]::Round($loc.wind_speed, 1)) m/s" -ForegroundColor Gray
            } else {
                Write-Host ""
            }
        }
    } else {
        Write-Host "VERDICT: Using MOCK/Random Data" -ForegroundColor Red
        Write-Host ""
        Write-Host "To enable real weather data:" -ForegroundColor Yellow
        Write-Host "1. Get API key from: https://openweathermap.org/api" -ForegroundColor White
        Write-Host "2. Set environment variable on Render:" -ForegroundColor White
        Write-Host "   OPENWEATHER_API_KEY=your_api_key_here" -ForegroundColor Gray
        Write-Host "3. Restart the service" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Show raw sample
    Write-Host "Sample Raw Data:" -ForegroundColor Yellow
    $weather.data | Select-Object -First 2 | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "FAILED - Could not fetch weather data" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
