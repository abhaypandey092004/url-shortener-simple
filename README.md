# URL Shortener & Analytics Dashboard (Production Ready)

A premium full-stack URL shortener with real-time analytics, user authentication, QR code generation, and link expiry features.

## 🚀 Quick Start (VS Code)

### 1. Backend Setup
1.  Open the `backend` folder in your terminal.
2.  Install dependencies: `npm install`
3.  Copy `.env.example` to `.env` and fill in your Supabase credentials.
4.  Run the server: `npm run dev`
    -   *Terminal Output:* `✅ Server [development] running on http://localhost:5000`

### 2. Frontend Setup
1.  Open the `frontend` folder.
2.  Run with **Live Server** (VS Code Extension) or any static server:
    -   If using `serve`: `npx serve .`
3.  Open `http://localhost:5500` (or the port provided by your server).

---

## 🛠 Features
-   **Secure Auth**: JWT-based login/signup with bcrypt hashing (12 rounds).
-   **Smart Tracking**: Captures IP, Device, Browser, OS, and Referrer.
-   **Visual Analytics**: Interactive charts (Chart.js) for engagement breakdown.
-   **Management**: Search, Filter, Delete, and CSV Export.
-   **Security**: Rate limiting, Helmet headers, CORS protection, and input validation.

---

## 🔒 Security Audit & Hardening
-   **CORS**: Only allowed origins can access the API.
-   **XSS Prevention**: Frontend uses `textContent` and `safeText` helpers for dynamic content.
-   **Rate Limiting**: Prevents brute-force on login/signup and DOS on shortening.
-   **Atomic Updates**: Click increments use PostgreSQL RPC functions to prevent race conditions.
-   **Production Errors**: Stack traces are hidden in production mode.

---

## 🔌 Port Conflict Fix (Permanent)
If you see `EADDRINUSE: port 5000`:
1.  The `npm run dev` script automatically tries to kill the process on port 5000 using `kill-port`.
2.  If it fails, you can manually change the `PORT` in `.env`.
3.  The frontend automatically detects the port change if running on localhost.

---

## 📤 Deployment Guide

### Backend (Render / Railway)
1.  Push your code to GitHub.
2.  Connect your repo to Render/Railway.
3.  **Build Command:** `npm install`
4.  **Start Command:** `npm start`
5.  **Environment Variables:** Add all variables from `.env` (ensure `NODE_ENV=production`).

### Frontend (Vercel / Netlify)
1.  Connect your repo to Vercel/Netlify.
2.  Set the `API_BASE` in your script or ensure the frontend is deployed on the same domain/relative path as the backend.

---

## 🗄 Database Schema (Supabase)
Import the `supabase/schema.sql` into your Supabase SQL Editor to set up the required tables and functions.
