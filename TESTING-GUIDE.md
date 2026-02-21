# 🧪 Testing SKYNETRA Deployed Services

## 📍 Your Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://skynetra.vercel.app | Main web application |
| **Backend** | https://climate-disaster.onrender.com | MongoDB & REST API |
| **Pathway** | https://climate-disaster-1.onrender.com | AI & Weather Analytics |

---

## 🚀 Quick Test (Windows PowerShell)

Run the automated test script:

```powershell
.\test-deployed-services.ps1
```

This will:
- ✅ Check all services are online
- 📊 Fetch weather data
- 📝 Submit a test weather report
- ⚠️ Get risk predictions
- 🌐 Verify frontend accessibility

---

## 🔍 Manual Testing

### 1️⃣ **Test Pathway Service Health**

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/health"
```

**cURL:**
```bash
curl https://climate-disaster-1.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": 1708531200,
  "service": "pathway-disaster-response-simplified"
}
```

---

### 2️⃣ **Get Current Weather Data**

**PowerShell:**
```powershell
$weather = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/weather"
$weather.data | Format-Table
```

**cURL:**
```bash
curl https://climate-disaster-1.onrender.com/api/v1/weather
```

**Response Structure:**
```json
{
  "status": "success",
  "count": 4,
  "data": [
    {
      "location": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "temperature": 25.5,
      "humidity": 65,
      "wind_speed": 5.2,
      "pressure": 1013,
      "description": "Clear sky"
    }
  ]
}
```

---

### 3️⃣ **Submit Current Weather Report**

This is how you send your own weather observations:

**PowerShell:**
```powershell
$currentWeather = @{
    latitude = 28.6139        # Your location
    longitude = 77.2090
    report_type = "weather_observation"
    severity = 7              # 1-10 scale
    description = "Heavy rain. Temp: 28°C, Wind: 15 m/s, Humidity: 85%"
    user_id = "your_user_id"  # Optional
} | ConvertTo-Json

$result = Invoke-RestMethod `
    -Uri "https://climate-disaster-1.onrender.com/api/v1/reports" `
    -Method POST `
    -Body $currentWeather `
    -ContentType "application/json"

Write-Host "Report ID: $($result.report_id)" -ForegroundColor Green
```

**cURL:**
```bash
curl -X POST https://climate-disaster-1.onrender.com/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "report_type": "weather_observation",
    "severity": 7,
    "description": "Heavy rain. Temp: 28°C, Wind: 15 m/s"
  }'
```

**JavaScript/TypeScript (in your React app):**
```typescript
import axios from 'axios';

const submitCurrentWeather = async () => {
  const response = await axios.post(
    'https://climate-disaster-1.onrender.com/api/v1/reports',
    {
      latitude: 28.6139,
      longitude: 77.2090,
      report_type: 'weather_observation',
      severity: 7,
      description: 'Current weather: 28°C, Clear, Wind 5 m/s'
    }
  );
  
  console.log('Report submitted:', response.data.report_id);
};
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Report submitted successfully",
  "report_id": "REP-1708531234"
}
```

---

### 4️⃣ **Get Risk Predictions**

**PowerShell:**
```powershell
$risks = Invoke-RestMethod -Uri "https://climate-disaster-1.onrender.com/api/v1/risk-predictions?min_risk=0.3"

foreach ($risk in $risks.data) {
    $score = [math]::Round($risk.risk_score * 100, 0)
    Write-Host "$($risk.location): $score% - $($risk.predicted_event_type)" -ForegroundColor Yellow
}
```

**cURL:**
```bash
curl "https://climate-disaster-1.onrender.com/api/v1/risk-predictions?min_risk=0.3"
```

---

### 5️⃣ **Test Backend Service**

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://climate-disaster.onrender.com/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "mongodb": "connected"
}
```

---

### 6️⃣ **Verify Frontend**

Simply open in browser:
```
https://skynetra.vercel.app
```

Or test with PowerShell:
```powershell
$response = Invoke-WebRequest -Uri "https://skynetra.vercel.app" -UseBasicParsing
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
```

---

## 📊 All Available API Endpoints

### Pathway Service (AI & Weather)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/weather` | Current weather data |
| `GET` | `/api/v1/risk-predictions` | Risk analysis |
| `GET` | `/api/v1/alerts` | Active disaster alerts |
| `POST` | `/api/v1/reports` | Submit weather/disaster report |
| `GET` | `/api/v1/reports` | Get all reports |
| `GET` | `/api/v1/reports/verified` | Get verified reports |
| `GET` | `/api/v1/shelters` | Emergency shelters |
| `POST` | `/api/v1/evacuation/route` | Get evacuation route |
| `POST` | `/api/v1/chat` | AI chatbot |

### Backend Service (MongoDB API)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/alerts` | Get alerts |
| `POST` | `/api/reports` | Submit report |
| `GET` | `/api/resources` | Get resources |
| `GET` | `/api/community/posts` | Community posts |

---

## 🎯 Complete Testing Flow

### Step 1: Run Automated Test
```powershell
.\test-deployed-services.ps1
```

### Step 2: Check Each Service Individually

```powershell
# Pathway
Invoke-RestMethod "https://climate-disaster-1.onrender.com/health"

# Backend  
Invoke-RestMethod "https://climate-disaster.onrender.com/health"

# Frontend (in browser)
start https://skynetra.vercel.app
```

### Step 3: Submit Test Weather Data

```powershell
$weather = @{
    latitude = 28.6139
    longitude = 77.2090
    report_type = "weather"
    severity = 5
    description = "Test: Clear sky, 25C"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "https://climate-disaster-1.onrender.com/api/v1/reports" `
    -Method POST `
    -Body $weather `
    -ContentType "application/json"
```

### Step 4: Verify Submission

```powershell
$reports = Invoke-RestMethod "https://climate-disaster-1.onrender.com/api/v1/reports"
$reports.data | Select-Object -Last 5 | Format-Table
```

---

## ⚠️ Important Notes

### Cold Start Warning
Render.com services may take **60-90 seconds** to wake up on first request if they've been idle.

**Solutions:**
- Wait for the first request to complete
- Use a service like UptimeRobot to keep services warm
- Be patient on first test

### CORS Configuration
Your Pathway service is configured to accept requests from:
- `https://skynetra.vercel.app`
- `https://*.vercel.app`
- `https://climate-disaster.vercel.app`
- `http://localhost:*` (for development)

### Rate Limits
Free tier services may have rate limits. Don't spam the APIs excessively.

---

## 🔧 Troubleshooting

### Service Not Responding
```powershell
# Check if service is sleeping (cold start)
# Wait 60-90 seconds and try again
Start-Sleep -Seconds 90
Invoke-RestMethod "https://climate-disaster-1.onrender.com/health"
```

### CORS Errors
Check that your frontend URL is whitelisted in the Pathway service CORS configuration.

### 502/503 Errors
Service may be restarting or experiencing issues. Check Render.com dashboard.

---

## 📱 Integration with Your Frontend

Add this to your React app to submit weather:

```typescript
// src/services/weatherSubmission.ts
import axios from 'axios';

const PATHWAY_API = 'https://climate-disaster-1.onrender.com';

export async function submitWeatherObservation(data: {
  lat: number;
  lon: number;
  temp: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}) {
  const response = await axios.post(`${PATHWAY_API}/api/v1/reports`, {
    latitude: data.lat,
    longitude: data.lon,
    report_type: 'weather_observation',
    severity: calculateSeverity(data),
    description: `Weather: ${data.temp}°C, ${data.condition}, Wind: ${data.windSpeed} m/s, Humidity: ${data.humidity}%`
  });
  
  return response.data;
}

function calculateSeverity(data: any): number {
  let severity = 1;
  if (data.temp > 40) severity += 3;
  if (data.windSpeed > 20) severity += 3;
  if (data.humidity > 90) severity += 1;
  return Math.min(severity, 10);
}
```

---

## ✅ Success Indicators

All services working correctly when you see:

```
✅ Pathway Service: status: "healthy"
✅ Backend Service: status: "healthy", mongodb: "connected"
✅ Frontend: HTTP 200, loads correctly
✅ Weather API: Returns location data
✅ Report Submission: Returns report_id
```

---

## 📞 Need Help?

If services aren't responding:
1. Check Render.com dashboard for service status
2. Check Vercel dashboard for deployment status
3. Wait 90 seconds for cold start
4. Review service logs on Render.com

---

**Happy Testing! 🚀**
