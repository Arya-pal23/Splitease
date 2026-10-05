# 🌐 Hosting & Sharing Guide for SplitEase

You have two main ways to share SplitEase with friends or family:

---

## ⚡ Option 1: Instant Public Link (Running Right Now!)

Your application is currently live on an instant public tunnel URL:

🔗 **Public Live URL**: `https://chubby-cameras-yawn.loca.lt`

> **Note**: When opening a `localtunnel` link for the first time in a browser, click **"Click to Continue"** (or submit your IPv4 address if prompted) to access the app.

---

## 🚀 Option 2: Permanent 24/7 Cloud Hosting (Recommended & 100% Free)

To keep SplitEase online 24/7 on a permanent custom domain (e.g. `splitease.onrender.com`), deploy it to **Render.com** or **Railway.app**:

### Deploying to Render.com (Free Web Service)

1. **Push to GitHub**:
   - Create a free GitHub repository (e.g., `splitease`).
   - Run these commands in your project folder `C:\Users\aryap\.gemini\antigravity\scratch\splitease`:
     ```bash
     git init
     git add .
     git commit -m "Initial SplitEase commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/splitease.git
     git push -u origin main
     ```

2. **Deploy on Render**:
   - Sign up at [Render.com](https://render.com) (Free account).
   - Click **New +** → **Web Service**.
   - Connect your `splitease` GitHub repository.
   - Configure:
     - **Name**: `splitease`
     - **Environment**: `Node`
     - **Build Command**: `npm run install:all && cd client && npm run build`
     - **Start Command**: `node server/index.js`
   - Click **Create Web Service**.

Render will automatically build and publish your app to `https://splitease.onrender.com`!

---

### Deploying to Railway.app (Free Alternative)

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `splitease` repository.
4. Set Start Command: `node server/index.js`.
5. Railway will give you a public URL (e.g., `https://splitease.up.railway.app`).
