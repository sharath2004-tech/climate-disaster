# 🌍 Climate Disaster Response Platform

<div align="center">

![Climate Disaster Platform](public/architecture.png)

**A comprehensive emergency response and disaster management platform with real-time alerts, evacuation planning, resource location, and AI assistance.**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sharath2004-tech/climate-disaster)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

</div>

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
- 🤖 **Hugging Face API** - AI chatbot
- 📊 **Chart.js** - Data visualization

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
4. **Hugging Face** (optional for AI) - [Access Tokens](https://huggingface.co/settings/tokens)

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
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_WEATHER_API_KEY=your_weather_api_key_here
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

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
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
- **Render** (Backend) - Free tier available
- **Railway** (Backend) - $5/month free credit
- **MongoDB Atlas** (Database) - Free 512MB tier

---

## 📁 Project Structure

```
climate-disaster/
├── public/                    # Static assets
├── server/                    # Backend application
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth & validation
│   ├── server.js            # Express server
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
│   └── main.tsx            # App entry point
├── .env.example             # Environment template
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

---

## 🔌 API Endpoints

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
| `VITE_HUGGINGFACE_API_KEY` | HuggingFace API key | ❌ | - |

---

## 🐛 Troubleshooting

### **MongoDB Connection Error**
```bash
# Verify your MONGODB_URI is correct
# Ensure IP whitelist includes your current IP in MongoDB Atlas
# Check network connectivity
```

### **CORS Error**
```bash
# Update FRONTEND_URL in .env
# Ensure server is running on correct port
```

### **API Keys Not Working**
```bash
# Verify API keys are valid and active
# Check API rate limits
# Ensure environment variables are loaded
```

### **Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Mapbox** - Mapping services
- **OpenWeather** - Weather data
- **MongoDB Atlas** - Database hosting
- **Hugging Face** - AI models

---

## 📧 Contact & Support

- **GitHub Issues**: [Report a bug](https://github.com/sharath2004-tech/climate-disaster/issues)
- **Repository**: [climate-disaster](https://github.com/sharath2004-tech/climate-disaster)

---

<div align="center">

**Built with ❤️ for disaster preparedness and emergency response**

⭐ Star this repo if you find it helpful!

</div>
