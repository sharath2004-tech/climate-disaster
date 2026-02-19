# Test Production Endpoints
Write-Host "`n=== Testing Climate Disaster Production Services ===" -ForegroundColor Cyan

# Test 1: Pathway Service Health
Write-Host "`n[1/4] Testing Pathway Service Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/health" -TimeoutSec 10
    Write-Host "✅ Pathway Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Weather Locations: $($health.weather_locations)" -ForegroundColor Gray
    Write-Host "   Risk Predictions: $($health.risk_predictions)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Pathway service error: $_" -ForegroundColor Red
}

# Test 2: Pathway AI Chat (LLM)
Write-Host "`n[2/4] Testing Pathway AI Chat..." -ForegroundColor Yellow
try {
    $body = @{message="What should I do during an earthquake?"} | ConvertTo-Json
    $chat = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/chat" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
    Write-Host "✅ Pathway AI Chat: Working" -ForegroundColor Green
    Write-Host "   Provider: $($chat.provider)" -ForegroundColor Gray
    Write-Host "   Response Preview: $($chat.response.Substring(0, [Math]::Min(100, $chat.response.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Pathway chat error: $_" -ForegroundColor Red
}

# Test 3: Backend Health
Write-Host "`n[3/4] Testing Backend Health..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "https://climate-disaster.onrender.com/api/health" -TimeoutSec 10
    Write-Host "✅ Backend Health: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend error: $_" -ForegroundColor Red
}

# Test 4: Backend AI Chat
Write-Host "`n[4/4] Testing Backend AI Chat..." -ForegroundColor Yellow
try {
    $body = @{message="Hello!"} | ConvertTo-Json
    $backendAI = Invoke-RestMethod -Uri "https://climate-disaster.onrender.com/api/ai/chat" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
    Write-Host "✅ Backend AI Chat: Working" -ForegroundColor Green
    Write-Host "   Response Preview: $($backendAI.response.Substring(0, [Math]::Min(100, $backendAI.response.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend AI error: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nFrontend: https://skynetra.vercel.app" -ForegroundColor Magenta
Write-Host "Backend:  https://climate-disaster.onrender.com" -ForegroundColor Magenta
Write-Host "Pathway:  https://climate-disaster-1.onrender.com`n" -ForegroundColor Magenta
