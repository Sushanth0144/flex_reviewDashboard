# Flex Living — Reviews Dashboard (Express API + Next.js UI)

Run both API and UI together with one command.

## Quick start

```bash
npm install
npm run dev
```

# UI: http://localhost:3000/dashboard

# API: http://localhost:4000/api/reviews/hostaway

# HC: http://localhost:4000/healthz

## Env Variables

HOSTAWAY_ACCOUNT_ID=...
HOSTAWAY_API_KEY=...
HOSTAWAY_API_URL=https://api.hostaway.com/v1
MOCK_JSON_PATH=/abs/path/to/mock.json
PORT=4000
API_BASE_URL=http://localhost:4000

## What’s inside

Backend (Express API)

- `server.js` with Node.js + Express
- Endpoints:
  - `GET /api/reviews/hostaway` → Fetch + normalize Hostaway reviews, aggregates (listing stats, monthly, type-based)
  - `GET /api/approvals` → Fetch persisted approval decisions
  - `POST /api/approvals` → Save approval decisions (JSON file persistence)
  - `GET /healthz` → Health check endpoint
- Supports **mock data fallback** if live Hostaway API is unavailable

Frontend (Next.js UI)

- `/dashboard`
  - Interactive filters (ratings, categories, listings, channel, type, date range)
  - Sorting by date / rating
  - KPI cards per property
  - Approvals workflow (approve / pending / needs attention)
- `/properties/[listingId]`
  - Per-property review page (shows approved reviews only)
- Responsive top navigation bar with dropdown menus (Properties, Reviews, Approvals, Settings, Help)

Styling

- Custom global CSS (Flex brand palette: cream, deep green, muted ink)
- Inter font loaded via Google Fonts
- Card-based UI with hover effects, rounded corners, shadows
- Sticky navbar with dropdown menus

Persistence

- Approval states stored in a JSON file (`server/data/approvals.json`)
- Automatically created on first run if not present

Deployment

- API deployed on Render (`node server.js`)
- UI deployed on Vercel (Next.js build)
- Environment variables control API keys and base URLs

## Google Reviews (Feasibility)

See [GOOGLE_REVIEWS.md](./GOOGLE_REVIEWS.md) for exploration, ToS constraints, cost, and our recommendation.

## Server Deployment

API on Render
1.Push your code to GitHub.
2.In Render, create a new Web Service:
Connect your GitHub repo
Set Root Directory to / (project root)
Set Build Command → npm install
Set Start Command → node server.js
3.Add Environment Variables in Render Dashboard:
HOSTAWAY_ACCOUNT_ID,
HOSTAWAY_API_KEY,
HOSTAWAY_API_URL,
MOCK_JSON_PATH,
PORT=4000

## UI on Vercel

1.In Vercel, import from GitHub repo.
2.Set Framework Preset → Next.js
3.Add Environment Variable in Vercel:
API_BASE_URL=https://<your-api>.onrender.com
My dashboard will be available at: "https://flex-review-dashboard-six.vercel.app/dashboard"
