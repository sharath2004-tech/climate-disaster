# Free Deployment Guide

## 🚀 Quick Deploy

### Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

#### 1. Deploy Backend to Render (FREE)
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` config
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `FRONTEND_URL`: Will be your Vercel URL (add later)
6. Click **"Create Web Service"**
7. Copy your backend URL (e.g., `https://your-app.onrender.com`)

#### 2. Deploy Frontend to Vercel (FREE)
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Vite
5. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL
6. Click **"Deploy"**
7. Copy your Vercel URL

#### 3. Update CORS Settings
Go back to Render dashboard and update:
- `FRONTEND_URL`: Your Vercel URL

---

### Option 2: Netlify (Frontend) + Render (Backend)

#### 1. Deploy Backend (same as above)

#### 2. Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop your project folder OR connect GitHub
3. Build settings are auto-detected from `netlify.toml`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL
5. Click **"Deploy"**

---

## 📋 Environment Variables Needed

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/disaster?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-change-this
PORT=10000
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🎯 Alternative FREE Options

### Railway (Backend alternative to Render)
1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Add same environment variables as Render
5. Railway gives you a free $5/month credit

### Fly.io (Backend alternative)
1. Install flyctl: `npm install -g flyctl`
2. Run `flyctl launch` in server directory
3. Follow prompts
4. Free tier: 3 shared-cpu-1x VMs

---

## ⚡ One-Click Deploy Buttons

### Deploy Backend to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Deploy Frontend to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/yourrepo)

### Deploy Frontend to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

---

## 🔍 Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is running on Vercel/Netlify
- [ ] MongoDB Atlas is connected
- [ ] CORS is configured with frontend URL
- [ ] API calls are working (check browser console)
- [ ] Environment variables are set correctly
- [ ] Test user registration/login
- [ ] Test map functionality
- [ ] Test alerts system

---

## 💡 Tips

1. **Render Free Tier**: Spins down after 15 min of inactivity (first request will be slow)
2. **Vercel Free Tier**: Unlimited bandwidth, 100GB/month
3. **MongoDB Atlas Free Tier**: 512MB storage, shared cluster
4. **Keep your app active**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 5 minutes

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify MongoDB URI is correct
- Ensure all dependencies are in server/package.json

### Frontend can't connect to backend
- Check VITE_API_URL environment variable
- Verify CORS is configured with correct frontend URL
- Check browser console for errors

### Map not loading
- Verify VITE_MAPBOX_TOKEN is set
- Check Mapbox dashboard for API limits

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Free Tier](https://www.mongodb.com/pricing)
