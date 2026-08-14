# HallBooker — Hall Booking Management System

A full-stack multi-hall booking system with real-time updates.

## Stack

- **Backend**: Java 17 · Spring Boot 3 · Spring Security + JWT · Spring WebSocket (STOMP) · PostgreSQL
- **Frontend**: React 18 · Vite · TypeScript · Tailwind CSS · STOMP/SockJS

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

On first start, check backend logs for the Super Admin credentials:
```bash
docker-compose logs backend | grep -A 5 "SUPER ADMIN"
```

## Local Dev (without Docker)

### Backend
```bash
cd backend
mvn spring-boot:run
```
Requires PostgreSQL running on `localhost:5432`. Set env vars or edit `application.properties`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions (Render + Vercel).

## Features

- 7 halls with distinct capacities (30–300 seats)
- Role-based access: Admin + Super Admin
- Race-condition-safe booking (pessimistic DB lock)
- Real-time hall grid updates via STOMP WebSocket
- Per-user cancellation notifications
- Notification bell with unread count
- Responsive design (mobile + tablet + desktop)
