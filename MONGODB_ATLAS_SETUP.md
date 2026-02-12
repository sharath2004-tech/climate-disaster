# 🔧 MongoDB Atlas Configuration for Pathway

Your Pathway service is now configured to use the **same MongoDB Atlas database** as your main project!

## Quick Setup

### Step 1: Copy Your MongoDB URI

1. Open MongoDB Compass
2. Copy your connection string (it looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/climate_disaster
   ```

### Step 2: Update Environment Variables

Create/update `.env` in the **project root** with your MongoDB URI:

```bash
# Copy from your MongoDB Compass connection string
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/climate_disaster?retryWrites=true&w=majority

# Add your OpenWeatherMap API key
OPENWEATHER_API_KEY=your_openweather_key_here

# Optional: Add JWT secret if not already set
JWT_SECRET=your-super-secret-jwt-key
```

### Step 3: Update Pathway Service .env

Create `.env` in `pathway-service/` directory:

```bash
cd pathway-service
cp .env.example .env
```

Then edit `pathway-service/.env` with:

```bash
# Same MongoDB URI as main project
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/climate_disaster?retryWrites=true&w=majority

# OpenWeatherMap API key
OPENWEATHER_API_KEY=your_openweather_key_here

PORT=8080
NODE_ENV=production
```

## Option 1: Run with Docker (Recommended)

Since you're using MongoDB Atlas, you don't need the local MongoDB container!

```bash
# Make sure .env has your MongoDB Atlas URI
docker-compose up --build pathway-service backend frontend

# Note: MongoDB service is commented out since you're using Atlas
```

## Option 2: Run Pathway Service Standalone

```bash
cd pathway-service

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Make sure .env has your MongoDB Atlas URI
# Then run:
python app.py
```

## Verify Connection

After starting the service, test it:

```bash
# Health check
curl http://localhost:8080/health

# Weather data
curl http://localhost:8080/api/v1/weather

# Check logs for MongoDB connection
# Should see: "Connected to MongoDB Atlas" or "MongoDB connection successful"
```

## Troubleshooting

### "Authentication failed" Error
- Check username and password in MongoDB URI
- Make sure you're using the correct database name
- Verify credentials in MongoDB Atlas dashboard

### "Network timeout" Error
- In MongoDB Atlas, go to Network Access
- Add your IP address: `0.0.0.0/0` (allow from anywhere)
- Or add your specific IP address

### "Database not found"
- The database will be created automatically when first data is written
- Make sure database name matches in both project and Pathway service

## Database Collections Created

The Pathway service will create these collections in your MongoDB Atlas:

- `weather_data` - Real-time weather observations
- `risk_predictions` - ML-generated disaster predictions  
- `citizen_reports` - User-submitted reports
- `verified_incidents` - Cross-validated incidents
- `alerts` - Generated disaster alerts

You can view all these in MongoDB Compass!

## Security Notes

**IMPORTANT**: Never commit your `.env` file to Git!

```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore
echo "pathway-service/.env" >> .gitignore
```

## Next Steps

1. ✅ Update MongoDB URI in both `.env` files
2. ✅ Start services: `docker-compose up pathway-service backend`
3. ✅ Open MongoDB Compass and connect to your Atlas cluster
4. ✅ Watch real-time data populate in your collections!
5. ✅ Test Pathway APIs: http://localhost:8080/api/v1/weather

---

**Your Pathway service is now connected to the same MongoDB Atlas database as your main project!** 🎉
