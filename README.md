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

## Env (optional)

HOSTAWAY_ACCOUNT_ID=...
HOSTAWAY_API_KEY=...
HOSTAWAY_API_URL=https://api.hostaway.com/v1
MOCK_JSON_PATH=/abs/path/to/mock.json
PORT=4000
API_BASE_URL=http://localhost:4000

## What’s inside

- Express `server.js` serving:
  - `GET /api/reviews/hostaway` (normalized reviews + aggregates)
  - `GET/POST /api/approvals` (file persistence)
- Next.js UI:
  - `/dashboard` (filters, sort, per-property KPIs, approvals)
  - `/properties/[listingId]` (approved reviews only)
- Styling approximates the Flex brand (cream, deep green, Inter).

## Google Reviews (Feasibility)

See [GOOGLE_REVIEWS.md](./GOOGLE_REVIEWS.md) for exploration, ToS constraints, cost, and our recommendation.
