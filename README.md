# 🌍 Climate Disaster Response Platform

<div align="center">

![Climate Disaster Platform](public/architecture.png)

**A comprehensive emergency response and disaster management platform with real-time alerts, evacuation planning, resource location, and AI assistance.**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sharath2004-tech/climate-disaster)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

</div>

---

## 🆕 What's New - Production Ready Features

This platform now includes enterprise-grade features for reliable production deployment:

- ✅ **Backend Health Monitoring** - Automatic detection and recovery from sleeping backends (free-tier hosting)
- ✅ **Smart Retry Logic** - 3-attempt retry with exponential backoff for failed API requests
- ✅ **Enhanced Service Worker** - Intelligent caching that handles GET/POST/PUT/DELETE correctly
- ✅ **Multi-Platform CORS** - Pre-configured for Vercel, Netlify, Render.com deployments
- ✅ **Cold Start Handling** - Adaptive timeouts (60s initial, 10s subsequent) for free-tier hosting
- ✅ **User-Friendly Errors** - Clear error messages with recovery suggestions
- ✅ **Comprehensive Troubleshooting** - Detailed guide for common production issues
- ✅ **Request Timeout Management** - Configurable timeouts prevent hanging requests

---

## 🚀 Features

### 🚨 **Real-time Emergency Alerts**
- Live disaster notifications and warnings
- Severity-based alert classification
- Location-based alert filtering
- Push notifications for critical events

### 🗺️ **Interactive Hazard Mapping**
- Real-time weather visualization
- Danger zone highlighting
- Multi-layered map views
- Live global weather data integration

### 🚶 **Smart Evacuation Planning**
- Optimized evacuation routes
- Shelter location finder
- Capacity tracking
- Safe zone identification

### 📍 **Resource Locator**
- Emergency supplies finder
- Medical facilities locator
- Food and water distribution points
- Real-time availability status

### 📢 **Citizen Reporting**
- Incident reporting system
- Photo/video upload capability
- Severity assessment
- Location-based reporting

### 🤖 **AI Emergency Assistant**
- 24/7 AI-powered guidance
- Emergency procedure information
- Context-aware responses
- Multi-language support

### 👥 **Community Dashboard**
- Community updates and news
- Discussion forums
- Resource sharing
- Volunteer coordination

### 👨‍💼 **Admin Control Panel**
- Alert management
- User management
- Resource allocation
- Analytics and reporting

### 🔧 **Advanced Production Features** 🆕
- **Backend Health Monitoring** - Auto-detect and wake sleeping backends
- **Smart Retry Logic** - Automatic retry with exponential backoff for failed requests
- **Offline Support** - Progressive Web App with service worker caching
- **Cold Start Handling** - Intelligent timeout management for free-tier hosting
- **Enhanced Error Messages** - User-friendly error descriptions and recovery suggestions
- **CORS Auto-Configuration** - Multi-platform deployment support (Vercel, Netlify, Render)
- **Request Timeout Management** - Configurable timeouts for slow network conditions

---

## 🛠️ Tech Stack

### **Frontend**
- ⚡ **Vite** - Lightning-fast build tool
- ⚛️ **React 18** - UI framework
- 📘 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Utility-first styling
- 🎭 **shadcn/ui** - Beautiful component library
- 🗺️ **Mapbox GL** - Interactive maps
- 🔄 **React Router** - Client-side routing
- 📊 **Recharts** - Data visualization

### **Backend**
- 🟢 **Node.js** - Runtime environment
- ⚡ **Express.js** - Web framework
- 🍃 **MongoDB Atlas** - Cloud database
- 🔐 **JWT** - Authentication
- 🛡️ **bcrypt** - Password hashing
- ✅ **Mongoose** - MongoDB ODM

### **APIs & Services**
- 🗺️ **Mapbox API** - Maps and geocoding
- 🌤️ **OpenWeather API** - Weather data
- 🤖 **OpenRouter API** - AI chatbot with multiple LLM models
- 🧠 **Cohere API** - Advanced AI features and embeddings
- 🤗 **Hugging Face API** - Additional AI models
- 📊 **Chart.js** - Data visualization
- 🔄 **Pathway Service** - Real-time data streaming and analytics

### **DevOps & Reliability** 🆕
- 🐳 **Docker** - Containerization
- 🔄 **Service Workers** - Offline functionality & smart caching
- 📡 **Health Checks** - Backend monitoring and auto-recovery
- 🔁 **Retry Mechanisms** - Automatic request retry with backoff
- 🌐 **Multi-Platform CORS** - Vercel, Netlify, Render.com support
- ⚡ **Performance Optimization** - Request batching and response caching

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas** account - [Sign up](https://www.mongodb.com/cloud/atlas)
- **npm** or **bun** package manager
- **Git** - [Download](https://git-scm.com/)

### API Keys Required

You'll need to obtain free API keys from:

1. **MongoDB Atlas** - [Get Started](https://www.mongodb.com/cloud/atlas/register)
2. **Mapbox** - [Sign up](https://account.mapbox.com/auth/signup/)
3. **OpenWeather** - [API Keys](https://home.openweathermap.org/api_keys)
4. **OpenRouter** (for AI chatbot) - [Get API Key](https://openrouter.ai/keys)
5. **Cohere** (for AI features) - [API Keys](https://dashboard.cohere.com/api-keys)
6. **Hugging Face** (optional for AI) - [Access Tokens](https://huggingface.co/settings/tokens)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sharath2004-tech/climate-disaster.git
cd climate-disaster
```

### 2️⃣ Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the **root directory**:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/disaster?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# AI & API Keys
# Get OpenRouter key from: https://openrouter.ai/keys
# Get Cohere key from: https://dashboard.cohere.com/api-keys
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_COHERE_API_KEY=your_cohere_api_key_here
COHERE_API_KEY=your_cohere_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_WEATHER_API_KEY=your_weather_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

> ⚠️ **Security Note**: Never commit your `.env` file to version control!

### 4️⃣ Seed Database (Optional)

```bash
cd server
node seed.js
cd ..
```

### 5️⃣ Start Development Servers

**Option A: Run both servers concurrently**
```bash
npm run dev
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

### 6️⃣ Access the Application

- **Frontend**: https://skynetra.vercel.app
- **Backend API**: https://climate-disaster.onrender.com/
- **API Documentation**: http://localhost:3001/api

---

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Build

**Backend:**
```bash
cd server
docker build -t climate-backend .
docker run -p 3001:3001 --env-file ../.env climate-backend
```

**Frontend:**
```bash
docker build -t climate-frontend .
docker run -p 5173:5173 climate-frontend
```

---

## 🌐 Free Deployment Options

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides:

- **Vercel** (Frontend) - Zero config deployment
- **Netlify** (Frontend) - Drag & drop deployment  
- **Render** (Backend) - Free tier available ⚠️ *Cold starts: 30-60s*
- **Railway** (Backend) - $5/month free credit
- **MongoDB Atlas** (Database) - Free 512MB tier

### ⚡ Production Optimizations
This platform includes built-in features to handle free-tier hosting limitations:

- **Auto-Retry Logic**: Automatically retries failed requests up to 3 times with exponential backoff
- **Backend Health Monitoring**: Built-in health checks at `/health` endpoint
- **Cold Start Handling**: Smart timeout management (60s initial, 10s subsequent)
- **Service Worker Caching**: Intelligent GET request caching for offline support
- **CORS Pre-configured**: Works with Vercel (`.vercel.app`), Netlify (`.netlify.app`), and Render (`.onrender.com`)

### 🔄 Keep Backend Alive (Optional)
Free tier backends sleep after 15 minutes of inactivity:

```bash
# Use a cron service to ping every 10 minutes:
# UptimeRobot.com (free) or cron-job.org
curl https://your-backend.onrender.com/health
```

---

## 📁 Project Structure

```
climate-disaster/
├── public/                    # Static assets
│   ├── service-worker.js    # PWA service worker (smart caching)
│   ├── offline.html         # Offline fallback page
│   └── manifest.json        # PWA manifest
├── server/                    # Backend application
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth & validation
│   ├── server.js            # Express server (CORS, retry logic)
│   └── package.json         # Backend dependencies
├── src/                      # Frontend application
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── sections/       # Page sections
│   │   ├── layout/         # Layout components
│   │   └── weather/        # Weather components
│   ├── pages/              # Route pages
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client (retry logic)
│   │   ├── backendHealth.ts  # 🆕 Backend health monitoring
│   │   └── utils.ts        # Helper functions
│   └── main.tsx            # App entry point
├── .env.example             # Environment template
├── DEPLOYMENT.md            # Deployment guide
├── TROUBLESHOOTING.md       # 🆕 Troubleshooting guide
└── README.md               # This file
```

---

## 🔌 API Endpoints

### **System Health** 🆕
- `GET /health` - Backend health check (uptime, status)
  ```json
  {
    "status": "OK",
    "uptime": 123.45,
    "timestamp": "2026-02-20T..."
  }
  ```

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Alerts**
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert (admin)
- `PUT /api/alerts/:id` - Update alert (admin)
- `DELETE /api/alerts/:id` - Delete alert (admin)

### **Reports**
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Submit incident report
- `PUT /api/reports/:id/status` - Update report status (admin)

### **Resources**
- `GET /api/resources` - Get resource locations
- `POST /api/resources` - Add resource (admin)
- `PUT /api/resources/:id` - Update resource (admin)

### **Evacuation**
- `GET /api/evacuation/routes` - Get evacuation routes
- `GET /api/evacuation/shelters` - Get shelter locations
- `POST /api/evacuation/routes` - Create route (admin)

### **Community**
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create post
- `POST /api/community/posts/:id/comments` - Add comment

### **Admin**
- `GET /api/admin/users` - Get all users
- `POST /api/admin/sub-admin` - Create sub-admin
- `GET /api/admin/analytics` - Get platform analytics

---

## 👥 User Roles

### 🟢 **Citizen**
- View alerts and resources
- Report incidents
- Access evacuation routes
- Use AI assistant
- Participate in community

### 🔵 **Sub-Admin**
- All citizen privileges
- Manage alerts
- Review reports
- Update resources
- Moderate community

### 🔴 **Admin**
- Full system access
- User management
- Create sub-admins
- Platform analytics
- System configuration

---

## 🔧 Troubleshooting

Experiencing issues? Check our comprehensive troubleshooting guide:

📖 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Detailed solutions for common issues:

- ❌ **Failed to Fetch / Network Errors** - Backend cold starts, CORS issues
- 🔐 **401 Unauthorized** - Token expiration and authentication
- 🔄 **Service Worker Cache Errors** - POST request caching issues
- 🌐 **CORS Policy Errors** - Cross-origin configuration
- ⚡ **Slow Backend Performance** - Free tier cold starts
- 🗄️ **MongoDB Connection Issues** - Database connectivity
- 📱 **Push Notifications** - Service worker registration

### Quick Fixes:
```javascript
// Clear cache and service worker (in browser console)
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
caches.keys().then(keys => 
  Promise.all(keys.map(key => caches.delete(key)))
);
localStorage.clear();
location.reload(true);
```

### Backend Health Check:
```bash
# Check if backend is awake
curl https://your-backend.onrender.com/health

# Should return: {"status":"OK","uptime":123.45,"timestamp":"..."}
```

---

## 🔌 Pathway Service API Endpoints

The Pathway service provides real-time data streaming and analytics through RESTful API endpoints.

### Base URL
```
Local: http://localhost:8080
Production: https://your-pathway-service.onrender.com
```

### Available Endpoints

#### 📡 **Weather Data**
```http
GET /api/v1/weather
```
Returns real-time weather data for monitored locations.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "location": "Delhi",
      "temperature": 28.5,
      "humidity": 65,
      "conditions": "Clear",
      "timestamp": "2026-02-21T10:30:00Z"
    }
  ]
}
```

#### ⚠️ **Risk Predictions**
```http
GET /api/v1/risk-predictions
```
Returns AI-powered disaster risk predictions.

#### 🚨 **Emergency Alerts**
```http
GET /api/v1/alerts
```
Returns active emergency alerts and warnings.

#### 🏥 **Evacuation Shelters**
```http
GET /api/v1/shelters
GET /api/v1/evacuation/shelters
```
Returns available emergency shelters and their capacity.

#### 🗺️ **Evacuation Routes**
```http
POST /api/v1/evacuation-route
POST /api/v1/evacuation/route
```
Calculates optimal evacuation route from current to destination.

**Request Body:**
```json
{
  "start": {"lat": 40.7580, "lon": -73.9855},
  "end": {"lat": 40.7489, "lon": -73.9680}
}
```

#### 📢 **Citizen Reports**
```http
GET  /api/v1/citizen-reports
POST /api/v1/citizen-reports
GET  /api/v1/reports
POST /api/v1/reports
```
Submit and retrieve citizen-reported incidents.

#### 💬 **AI Chat**
```http
POST /api/v1/chat
```
AI-powered emergency assistance chatbot.

**Request Body:**
```json
{
  "message": "What should I do during an earthquake?",
  "context": {"location": "Delhi"}
}
```

#### 📊 **System Statistics**
```http
GET /api/v1/stats
```
Returns platform statistics and metrics.

#### 🔄 **Refresh Data**
```http
POST /api/v1/refresh
```
Manually trigger data refresh for weather and predictions.

### Starting the Pathway Service

```bash
# Navigate to pathway service directory
cd pathway-service

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENWEATHER_API_KEY=your_key_here
export OPENROUTER_API_KEY=your_key_here
export COHERE_API_KEY=your_key_here

# Start the service
python simple_api_server.py
# Or with advanced features (requires Pathway)
python api_server.py
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | ✅ | - |
| `JWT_SECRET` | JWT signing secret | ✅ | - |
| `PORT` | Backend server port | ❌ | 3001 |
| `NODE_ENV` | Environment mode | ❌ | development |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ | http://localhost:5173 |
| `VITE_MAPBOX_TOKEN` | Mapbox API token | ✅ | - |
| `VITE_WEATHER_API_KEY` | OpenWeather API key | ✅ | - |
| `OPENWEATHER_API_KEY` | OpenWeather API key (backend) | ✅ | - |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key (frontend) | ✅ | - |
| `OPENROUTER_API_KEY` | OpenRouter API key (backend) | ✅ | - |
| `VITE_COHERE_API_KEY` | Cohere API key (frontend) | ✅ | - |
| `COHERE_API_KEY` | Cohere API key (backend) | ✅ | - |

- Failed to fetch / Network errors
- 401 Unauthorized / Authentication issues
- Service Worker cache problems
- CORS configuration issues
- MongoDB connection errors
- Backend cold start delays (free tier)
- And much more!

**Quick Debug Commands:**
```bash
# Check backend health
curl https://your-backend.onrender.com/health

# Test MongoDB connection
node server/test-connection.js

# Clear browser cache (in console)
localStorage.clear(); caches.keys().then(k => k.forEach(c => caches.delete(c)));
```

---

## ⚡ Production Features & Utilities

### Backend Health Monitoring
```typescript
import { checkBackendHealth, wakeUpBackend } from '@/lib/backendHealth';

// Check if backend is healthy
const status = await checkBackendHealth();
console.log(status.isHealthy); // true/false

// Wake up sleeping backend (free tier)
await wakeUpBackend();
```

### Smart API Retry Logic
```typescript
import { callWithWakeup } from '@/lib/backendHealth';

// Automatically retries on failure with backend wake-up
const data = await callWithWakeup(() => alertsAPI.getAll());
```

### Service Worker Features
- ✅ **Smart Caching**: GET requests cached, POST/PUT/DELETE bypass cache
- ✅ **Offline Support**: Graceful degradation when network unavailable
- ✅ **Push Notifications**: Real-time emergency alerts
- ✅ **Background Sync**: Queue requests when offline

### Error Handling
- Automatic retry (3 attempts with exponential backoff)
- User-friendly error messages
- Invalid token auto-clearing
- Network timeout management (60s initial, 10s subsequent)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Mapbox** - Mapping services & geocoding
- **OpenWeather** - Real-time weather data
- **MongoDB Atlas** - Cloud database hosting
- **Hugging Face** - AI language models
- **Vercel/Netlify/Render** - Deployment platforms
- **React & Vite** - Modern web development tools
- **Docker** - Containerization platform

### Special Thanks
This platform incorporates production-ready features and best practices for:
- Resilient API retry mechanisms
- Progressive Web App (PWA) capabilities
- Service Worker intelligent caching
- Multi-platform CORS configuration
- Backend health monitoring utilities

---

## 📧 Contact & Support

- **GitHub Issues**: [Report a bug](https://github.com/sharath2004-tech/climate-disaster/issues)
- **Repository**: [climate-disaster](https://github.com/sharath2004-tech/climate-disaster)

### 📚 Documentation

- 📖 [README.md](README.md) - Main documentation (you are here)
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guides for various platforms
- 🔧 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- 📝 [.env.example](.env.example) - Environment variables template

### 🔗 Quick Links

- **Live Demo**: [Coming Soon]
- **API Documentation**: `/health` endpoint for status checks
- **Health Check**: `curl https://your-backend.onrender.com/health`

---

<div align="center">

**Built with ❤️ for disaster preparedness and emergency response**

🌍 **Saving lives through technology** 🌍

⭐ Star this repo if you find it helpful!

**Production Ready | PWA Enabled | Enterprise Grade**

</div>
