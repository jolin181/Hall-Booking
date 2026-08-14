# Deployment Guide — HallBooker

This guide walks you through deploying the Hall Booking System with:
- **Backend**: Render (Docker deploy) + Render PostgreSQL
- **Frontend**: Vercel

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed locally
- [Git](https://git-scm.com/) installed
- GitHub account
- [Render account](https://render.com) (free tier works)
- [Vercel account](https://vercel.com) (free tier works)

---

## Step 1: Push to GitHub

```bash
cd DemoBooking
git init
git add .
git commit -m "Initial commit: Hall Booking System"
git remote add origin https://github.com/<your-username>/hall-booking.git
git push -u origin main
```

---

## Step 2: Test Locally with Docker Compose

```bash
# Copy and fill in your env file
cp .env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up --build

# Verify:
# Backend health: http://localhost:8080/api/health
# Frontend:       http://localhost:3000
```

> On first startup, watch the backend logs for the Super Admin password:
> ```
> docker-compose logs backend | grep "SUPER ADMIN"
> ```

---

## Step 3: Deploy Backend to Render

### 3a. Create a PostgreSQL database on Render
1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Set name: `hallbooking-db`, region of your choice, free tier
3. After creation, copy the **Internal Database URL** (format: `postgresql://...`)

### 3b. Create a Web Service for the backend
1. **New** → **Web Service** → **Connect a repository** → select your GitHub repo
2. Settings:
   - **Root directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile path**: `./Dockerfile`
3. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `jdbc:postgresql://...` (from Render Postgres, replace `postgresql://` with `jdbc:postgresql://`) |
| `DB_USERNAME` | from Render Postgres dashboard |
| `DB_PASSWORD` | from Render Postgres dashboard |
| `JWT_SECRET` | a random 40+ char string |
| `JWT_EXPIRATION` | `86400000` |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (fill in after Step 4) |
| `DDL_AUTO` | `update` |

4. Click **Create Web Service**. Render will build and deploy.

> **Note on DATABASE_URL format**: Render gives you a URL like `postgresql://user:pass@host/db`.
> Prepend `jdbc:` so it becomes `jdbc:postgresql://user:pass@host/db`.

### 3c. Verify backend
- Visit `https://your-backend.onrender.com/api/health` — should return `{"status":"UP"}`
- Check logs for the Super Admin password (only printed on first deploy)

---

## Step 4: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com) → **New Project** → import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` |
| `VITE_WS_URL` | `https://your-backend.onrender.com` |

5. Click **Deploy**. Vercel builds and serves the React app.

> **Important**: After getting your Vercel URL (e.g. `https://hall-booking.vercel.app`),
> go back to your Render backend service → Environment → update `CORS_ALLOWED_ORIGINS` to that URL.
> Then click **Manual Deploy** to apply.

---

## Step 5: First-Deploy Verification Checklist

Run these in sequence on the live deployment:

1. **Health check**: `GET https://your-backend.onrender.com/api/health` → `{"status":"UP"}`
2. **Login**: Open `https://your-app.vercel.app` → use `super@hallbooker.com` + password from logs
3. **Hall grid**: All 7 halls appear on the Dashboard ✓
4. **Create admin**: Super Admin panel → Create Admin → create `admin@test.com`
5. **Booking flow**: Log in as admin → Search availability → Book a hall → confirm on Dashboard
6. **Real-time test**:
   - Open two browser tabs (or different browsers), log in on both
   - Create a booking in Tab 1 → Tab 2 should update the hall grid instantly without refresh
7. **Cancellation**: Super Admin cancels a booking → Admin sees notification bell update live
8. **Double-booking**: Try booking the same hall/time twice → expect 409 Conflict message

---

## Database Notes

- `DDL_AUTO=update` creates/updates tables automatically on startup (safe for production — never drops data)
- Seeding runs once on first startup: if tables are empty, halls and Super Admin are created
- To reset and re-seed: delete all rows in `users` and `halls` tables, then restart the backend

---

## Updating the Live App

```bash
git add .
git commit -m "Update: ..."
git push origin main
```

Render and Vercel auto-deploy on push to `main`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend returns 401 on all requests | Check `JWT_SECRET` is identical in env vars |
| CORS error in browser | Update `CORS_ALLOWED_ORIGINS` to match exact frontend URL |
| WebSocket not connecting | Ensure `VITE_WS_URL` points to backend; Render may require wss:// for WebSocket upgrades — test with polling fallback first |
| Super Admin password not in logs | Means it was already created; check DB or reset the `users` table |
| Render free tier cold start | First request after inactivity takes ~30s; consider upgrading to paid or using a keep-alive ping |
