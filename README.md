# Climate Disaster Response Platform

A comprehensive emergency response and disaster management platform with real-time alerts, evacuation planning, resource location, and AI assistance.

## Technologies

### Frontend
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router
- TanStack Query

### Backend
- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT Authentication

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or bun

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```sh
npm install
```

3. Configure environment variables:
Create `.env` file in the root directory:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

Create `.env.local` in the root directory for frontend:
```
VITE_API_URL=http://localhost:3001/api
```

4. Start the development servers:

Backend:
```sh
npm run server
```

Frontend:
```sh
npm run dev
```

## Features

- **Real-time Alerts**: Live disaster alerts and notifications
- **Hazard Mapping**: Interactive maps showing danger zones
- **Evacuation Planning**: Route planning and shelter locations
- **Resource Locator**: Find nearby emergency resources
- **Citizen Reporting**: Report incidents and hazards
- **AI Assistant**: Get emergency guidance and information
- **Community Updates**: Stay connected with your community

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/alerts` - Get all alerts
- `POST /api/reports` - Submit a report
- `GET /api/resources` - Get resource locations
- `GET /api/evacuation-routes` - Get evacuation routes
- And more...

## License

MIT
