# Pathway AI Chatbot - Real-time Disaster Notifications

## 🎯 Overview

The **Pathway AI Chatbot** is an intelligent assistant that automatically notifies you about disasters and risks in real-time. Unlike traditional chatbots that only respond when you ask, this chatbot proactively alerts you when:

- 🚨 **New disaster alerts** are detected
- 📊 **High-risk predictions** are calculated
- ⚠️ **Dangerous situations** develop
- 🗺️ **Emergency updates** occur

## ✨ Key Features

### 1. **Automatic Notifications**
The chatbot monitors Pathway's real-time data and automatically sends messages when:

- **New Alert Detected**: When Pathway generates a new alert
  ```
  🚨 NEW ALERT - CRITICAL
  📍 Location: Miami, Florida
  ⚠️ Event: Hurricane
  📊 Risk Score: 85%
  ...
  ```

- **High-Risk Prediction**: When risk score exceeds 70%
  ```
  📊 HIGH RISK PREDICTION
  📍 Location: New Orleans
  🔮 Predicted Event: Flood
  📈 Risk Score: 78.5%
  ⏰ Time to Event: 12h
  ...
  ```

### 2. **Voice Notifications**
- Automatically speaks alerts using text-to-speech
- You can enable/disable voice with the speaker icon
- Supports voice input (microphone button) for questions

### 3. **Browser Notifications**
- Sends desktop notifications for critical alerts
- Works even when browser is in background
- Shows alert location and event type

### 4. **Conversational Data Access**
Ask questions and get Pathway data in conversational format:

**Examples:**
- "Show me all current alerts"
- "What are the risk predictions?"
- "Where are safe locations near me?"
- "Is Pathway working?"

### 5. **Quick Actions**
Pre-defined buttons for common queries:
- 📊 Show Current Alerts
- 🔮 Risk Predictions
- 🗺️ Safe Locations
- 🚨 Emergency Help
- 📡 Pathway Status

### 6. **Real-time Status Bar**
Shows live Pathway statistics at bottom:
- Number of active alerts
- Number of risk predictions
- Monitored locations count
- Real-time connection status

## 📱 How to Use

### Basic Chat
1. Type your question in the input box
2. Press Enter or click Send button
3. Get AI-powered responses with real-time data

### Voice Input
1. Click the microphone icon 🎤
2. Speak your question
3. It automatically converts to text
4. Click again to send

### Managing Notifications
- **Volume Icon**: Toggle voice notifications on/off
- **Bell Badge**: Shows number of active alerts
- **Quick Actions**: Click for instant queries

### Understanding Messages

**Message Types:**

1. **Blue Messages (User)**
   - Your questions and input

2. **Gray Messages (Assistant)**
   - AI responses to your questions

3. **Red Messages (Alerts)**
   - Critical disaster alerts from Pathway
   - Automatically appear when detected

4. **Orange Messages (Predictions)**
   - High-risk predictions from ML models
   - Automatically appear when risk > 70%

## 🔔 Enabling Browser Notifications

For desktop notifications:

1. When you first open the chatbot, browser will ask for permission
2. Click "Allow" to enable notifications
3. You'll receive alerts even when tab is in background

**To enable later:**
- Chrome: Click 🔒 in address bar → Site Settings → Notifications → Allow
- Firefox: Click ⓘ in address bar → Permissions → Notifications → Allow
- Edge: Click 🔒 in address bar → Permissions → Notifications → Allow

## 🎨 Visual Indicators

### Alert Levels
- 🔴 **Critical**: Red background, immediate action required
- 🟠 **High**: Orange background, prepare and monitor
- 🟡 **Medium**: Yellow background, stay informed
- 🟢 **Low**: Green background, advisory only

### Connection Status
- 🟢 **Green dot**: Pathway connected and working
- 🔴 **Red dot**: Pathway disconnected
- ⚡ **Lightning icon**: Real-time processing active

## 📊 Example Conversations

### Getting Current Alerts
```
You: Show me current alerts
Bot: Based on Pathway real-time data, there are currently 3 active alerts:

1. 🚨 Miami, FL - Hurricane (Risk: 85%)
   Population affected: 2.5M
   Time to event: 18 hours
   
2. ⚠️ Los Angeles, CA - Wildfire (Risk: 72%)
   Population affected: 500K
   Time to event: 6 hours
   
3. 📍 Houston, TX - Flood (Risk: 65%)
   Population affected: 1.2M
   Time to event: 24 hours
```

### Querying Risk Predictions
```
You: What areas are at risk?
Bot: Pathway's ML model predicts these high-risk areas:

🔮 New Orleans - Flood
   Risk Score: 78.5%
   Confidence: 92%
   Time to Event: 12 hours
   Actions: Move to higher ground, prepare emergency kit
   
🔮 Denver - Wildfire
   Risk Score: 71.2%
   Confidence: 88%
   Time to Event: 8 hours
   Actions: Check evacuation routes, monitor local news
```

### Emergency Help
```
You: I need emergency help
Bot: 🚨 EMERGENCY ASSISTANCE

Immediate Actions:
1. Call 911 if in immediate danger
2. Check current alerts for your area
3. Follow evacuation routes if advised
4. Go to nearest shelter if needed

Current Active Alerts: 3
Nearest Safe Location: [Shows based on your location]
Emergency Contacts: [Shows local emergency services]
```

## 🛠️ Technical Details

### Data Sources
- **Pathway Service**: Real-time weather monitoring (10 US cities)
- **ML Risk Engine**: Predicts floods, fires, hurricanes
- **OpenWeatherMap API**: Live weather data
- **MongoDB Atlas**: Alert and report storage

### Update Frequency
- **Alerts**: Refresh every 2 minutes
- **Predictions**: Refresh every 5 minutes
- **Weather**: Refresh every 5 minutes
- **Real-time Stream**: Continuous SSE connection

### Message Context
When you ask questions, the bot automatically includes:
- 3 most recent alerts
- 3 highest risk predictions
- Current Pathway system status

This ensures responses are always based on latest real-time data.

## 🐛 Troubleshooting

### Not Receiving Notifications?

**Check:**
1. ✅ Notifications enabled in browser settings
2. ✅ Volume icon shows speaker (not muted)
3. ✅ Bell badge shows active alerts count
4. ✅ Green status dot at top (Pathway connected)

### Voice Not Working?

**Browser Support:**
- ✅ Chrome/Edge: Full support
- ✅ Safari: Partial support
- ❌ Firefox: Limited support

**Fix:**
1. Check microphone permissions
2. Ensure HTTPS connection
3. Try different browser

### No Real-time Updates?

**Verify:**
1. Check Pathway status at bottom
2. Look for "Real-time Active" badge
3. Open browser console (F12) and check for errors
4. Verify `VITE_PATHWAY_API_URL` is set correctly

### Chatbot Not Responding?

**Check:**
1. Backend API is running
2. OpenRouter API key is valid
3. Network connection is stable
4. Check browser console for errors

## 🎯 Best Practices

### For Citizens
- Keep chatbot open during emergencies
- Enable browser notifications
- Turn on voice alerts for hands-free monitoring
- Use quick actions for fast information

### For Emergency Responders
- Monitor alert frequency and severity
- Track prediction accuracy
- Use for real-time situation awareness
- Share critical information with teams

### For Administrators
- Monitor Pathway connection status
- Check alert delivery rates
- Review prediction accuracy
- Ensure API endpoints are healthy

## 📈 Advanced Features

### Pathway Integration Points

1. **Alert Monitoring** (`useAlerts` hook)
   - Polls every 2 minutes
   - Auto-displays new alerts
   - Tracks by alert_id to avoid duplicates

2. **Risk Predictions** (`useRiskPredictions` hook)
   - Polls every 5 minutes
   - Filters risk > 60%
   - Shows high-risk (>70%) automatically

3. **Context Inclusion**
   - Automatically adds Pathway data to queries
   - Detects disaster-related questions
   - Provides real-time context to AI

4. **Voice Synthesis**
   - Speaks alert messages
   - Summarizes key information
   - Can be toggled on/off

## 🔮 Coming Soon

- [ ] Multi-language support (Hindi, Spanish, etc.)
- [ ] Location-based filtering (show only alerts near you)
- [ ] Custom alert thresholds
- [ ] Historical alert timeline
- [ ] Export chat history
- [ ] Integration with SMS/email notifications

## 📞 Support

If you encounter issues:

1. **Check Documentation**: Review this guide
2. **Browser Console**: Press F12 and check for errors
3. **Pathway Service Logs**: Check Render/Railway logs
4. **GitHub Issues**: Report bugs on repository

## 🎓 Learn More

- [Pathway Framework Documentation](https://pathway.com/developers/documentation)
- [API Documentation](../API_KEYS_GUIDE.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Main README](../README.md)

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
