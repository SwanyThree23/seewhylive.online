# SeeWhy LIVE — Deployment Guide

## Quick Deploy Options

### ▶ Vercel (Recommended — free tier)
```bash
npm i -g vercel
vercel --prod
```
`vercel.json` is already configured with SPA rewrites and security headers.

---

### ▶ Railway
1. Push to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Railway auto-detects `railway.toml` — no further config needed
4. Set any env vars in Railway dashboard

---

### ▶ Render
1. Push to GitHub
2. New Render service → "New Static Site" or use `render.yaml` (Blueprint)
3. `render.yaml` auto-configures build + SPA rewrites

---

### ▶ Netlify
`public/_redirects` already handles SPA routing:
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

### ▶ Docker / Self-hosted
```bash
docker build -t seewhy-live .
docker run -p 3000:3000 seewhy-live
```
Multi-stage `Dockerfile` builds then serves with `serve`.

---

### ▶ PWA Install
The app is PWA-ready:
- `public/manifest.json` defines app metadata and icons
- `public/sw.js` caches assets and provides offline SPA fallback
- Users can "Add to Home Screen" on iOS/Android

---

## Environment Variables
All config is managed via the Base44 SDK — no `.env` file required for deployment.
The app connects to Base44 backend automatically.

## Build Command
```bash
npm run build   # outputs to /dist
``