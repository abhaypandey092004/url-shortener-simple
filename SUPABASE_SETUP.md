# Supabase Setup Guide

Follow these steps to set up your Supabase project for the URL Shortener.

## 1. Create a Supabase Project
1. Go to [Supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Enter a Name (e.g., `URL Shortener`).
4. Set a secure Database Password.
5. Select a Region close to you.
6. Click **Create New Project**.

## 2. Get API Credentials
Once the project is ready (it takes about 2 mins):
1. Go to **Project Settings** (gear icon) in the sidebar.
2. Click on **API**.
3. Under **Project API keys**, you will find:
   - `anon public`: (We don't need this for backend)
   - `service_role secret`: This is your **SUPABASE_SERVICE_ROLE_KEY**. **DO NOT share this!**
4. Under **Project URL**, you will find your **SUPABASE_URL**.

## 3. Configure .env
Update your `backend/.env` with the values you found:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret
CLIENT_URL=http://localhost:5500
APP_BASE_URL=http://localhost:5000
```

## 4. Run the SQL Schema
1. Go to **SQL Editor** in the Supabase sidebar.
2. Click **New Query**.
3. Copy the entire contents of `supabase/schema.sql` from this project.
4. Paste it into the editor.
5. Click **Run**.
6. You should see "Success. No rows returned."

## 5. Verify Tables
1. Go to **Table Editor** in the sidebar.
2. You should see three tables: `users`, `urls`, and `url_clicks`.
3. They should be empty initially.

## 6. Verification
Start your backend (`npm run dev`) and try to sign up from the frontend. If successful, a new row will appear in the `users` table.

## Common Errors & Fixes
- **401 Unauthorized**: You likely missed the `Bearer ` prefix in the Authorization header or the `JWT_SECRET` doesn't match.
- **Connection Refused**: Check if your `SUPABASE_URL` is correct.
- **Schema Errors**: Make sure you ran the SQL script in the SQL Editor before trying to use the app.
