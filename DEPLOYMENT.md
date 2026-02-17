# 🚀 Deployment Guide - ChatApp

## Architecture Overview

Your app is now split into **two deployable parts**:

| Component | What it does | Deploy to |
|-----------|-------------|-----------|
| **Next.js App** (frontend + API) | Pages, auth, API routes, UI | **Vercel** (Free) |
| **Socket.IO Server** (real-time) | Chat, video calls, online status | **Render** (Free) |

---

## Step 1: Deploy Socket.IO Server to Render (FREE)

### 1.1 Create a Render Account
- Go to [https://render.com](https://render.com) and sign up (free)

### 1.2 Create a New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `chatapp-socket` |
| **Root Directory** | `socket-server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### 1.3 Set Environment Variables on Render
Go to **Environment** tab and add:

```
MONGODB_URI = mongodb+srv://arjunanil2114_db_user:...your-connection-string...
NEXT_PUBLIC_BASE_URL = https://your-app.vercel.app
```

> ⚠️ **Note:** Render will automatically set `PORT` for you. Don't set it manually.

### 1.4 Deploy
- Click **"Create Web Service"**
- Wait for the deployment to complete
- Copy the URL (e.g., `https://chatapp-socket.onrender.com`)

---

## Step 2: Deploy Next.js App to Vercel

### 2.1 Push your code to GitHub
```bash
git add .
git commit -m "Split socket server for deployment"
git push
```

### 2.2 Configure Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set the **Root Directory** to `.` (root, NOT socket-server)
4. Vercel will auto-detect Next.js

### 2.3 Set Environment Variables on Vercel
Go to **Settings** → **Environment Variables** and add:

```
MONGODB_URI = mongodb+srv://...your-connection-string...
NEXTAUTH_SECRET = MXMxewki+HOwrbt9pNzM83Ue38AdzMBpyzAiQfkoP20=
NEXTAUTH_URL = https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME = dizvgiwm9
CLOUDINARY_API_KEY = 666458683762254
CLOUDINARY_API_SECRET = ASAE61yaxAcFr5o9PZSEplYrqNg
NEXT_PUBLIC_SOCKET_URL = https://chatapp-socket.onrender.com   ← YOUR RENDER URL HERE
NEXT_PUBLIC_BASE_URL = https://your-app.vercel.app
EMAIL_USER = arjunanil2114@gmail.com
EMAIL_PASS = aklr guop nzhq meow
```

> ⚠️ **IMPORTANT:** Set `NEXT_PUBLIC_SOCKET_URL` to your **Render Socket Server URL** from Step 1.4

### 2.4 Deploy
- Click **Deploy**
- Your app should be live!

---

## Step 3: Update Render with Vercel URL

After deploying to Vercel, go back to Render and update:
```
NEXT_PUBLIC_BASE_URL = https://your-app.vercel.app
```

This ensures the Socket.IO server allows CORS requests from your Vercel app.

---

## Local Development

To run everything locally:

### Option A: Run both together (recommended)
```bash
npm run dev:all
```
This starts:
- Next.js on `http://localhost:3000`
- Socket.IO server on `http://localhost:4000`

### Option B: Run separately
```bash
# Terminal 1 - Next.js
npm run dev

# Terminal 2 - Socket.IO server
npm run dev:socket
```

---

## Troubleshooting

### Socket not connecting in production
1. Check that `NEXT_PUBLIC_SOCKET_URL` in Vercel matches your Render URL
2. Check that `NEXT_PUBLIC_BASE_URL` in Render matches your Vercel URL
3. Check Render logs for any errors

### Render free tier cold starts
- Free tier services on Render spin down after 15 minutes of inactivity
- First connection after inactivity may take 30-60 seconds
- Consider upgrading to a paid plan ($7/month) for always-on service

### CORS errors
- Make sure the Vercel URL is in the `ALLOWED_ORIGINS` array in `socket-server/server.js`
- The server automatically reads `NEXT_PUBLIC_BASE_URL` for CORS

---

## File Structure After Changes

```
chatapp/
├── app/                    # Next.js pages & components
├── lib/
│   └── socket.js          # Updated socket client (uses env var)
├── models/                # Mongoose models (shared)
├── socket-server/         # ← NEW: Standalone socket server
│   ├── server.js          # Socket.IO server code
│   ├── package.json       # Socket server dependencies
│   └── .env               # Socket server env vars
├── server.js              # Old combined server (kept as backup)
├── package.json           # Updated with new scripts
└── .env.local             # Updated socket URL
```
