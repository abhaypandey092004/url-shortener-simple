# 🏁 Deployment Checklist

Follow these steps before going live to ensure a smooth and secure deployment.

## 1. Database (Supabase)
- [ ] `users`, `urls`, and `url_clicks` tables are created.
- [ ] `increment_click_count` RPC function is created in SQL Editor.
- [ ] Row Level Security (RLS) is configured (or service role key is used securely).

## 2. Backend Environment
- [ ] `NODE_ENV` is set to `production`.
- [ ] `JWT_SECRET` is changed to a strong, random string.
- [ ] `CLIENT_URL` matches your deployed frontend domain (e.g., `https://myapp.vercel.app`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is added (Keep this secret!).

## 3. Frontend Configuration
- [ ] Check `script.js` to ensure `API_BASE` correctly points to your deployed backend.
- [ ] Verify `CSP` (Content Security Policy) doesn't block `Chart.js` or `QR Server` APIs.

## 4. Security Verification
- [ ] Test that you cannot delete another user's link by manually hitting the API.
- [ ] Test that rate limiting is working (try spamming the login button).
- [ ] Verify that 500 errors do not show full stack traces.

## 5. Performance
- [ ] Verify that `useragent` parsing is efficient.
- [ ] Ensure `Chart.js` is loaded from a reliable CDN (already included in `index.html`).

---

## Deployment Platforms Recommendation:
- **Backend:** [Railway](https://railway.app) or [Render](https://render.com).
- **Frontend:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
