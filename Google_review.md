FlexLiving Reviews Dashboard – Documentation

## Tech Stack

- **Frontend:** Next.js 14, React, TailwindCSS
- **Backend:** Express.js (Node.js)
- **Database/Storage:** JSON file persistence for approvals
- **Other:** dotenv for env management, axios for API calls, mock JSON for Hostaway reviews

## Key Design & Logic Decisions

- API route `/api/reviews/hostaway` normalizes Hostaway data and falls back to local mock reviews if sandbox fails.
- Review data is normalized into `{ id, channel, type, status, overallRating, categories, text, submittedAt, guestName, listingName }`.
- Aggregates are computed server-side (per listing, per type, monthly trends).
- Approvals are persisted in `server/data/approvals.json` and surfaced via GET/POST endpoints.
- Dashboard UI supports filtering, sorting, and per-property performance cards.

## API Behaviors

`GET /api/reviews/hostaway?source=live|mock`  
 Returns normalized reviews and aggregates.
`GET /api/approvals`  
 Returns current approvals state.
`POST /api/approvals`  
 Persists manager approval decisions.
Health check: `/healthz`.

## Google Reviews – Exploration Findings

As part of the assessment, I explored integrating **Google Reviews** into the FlexLiving Reviews Dashboard.

### 1. API Options Considered

- **Google Places API (Place Details endpoint)**
  - Provides `user_ratings_total`, `rating`, and up to 5 most relevant reviews.
  - Requires a valid **Google Cloud project**, **API key**, and **billing enabled**.
- **Google Business Profile API**
  - Full access to all business reviews, replies, and ratings.
  - Requires ownership/manager access to the business’s Google Business Profile.
  - More appropriate for production but not feasible in a sandbox.

### 2. Technical Constraints

- Each request needs a **Place ID** (retrieved via Google’s Places Search API).
- Reviews are subject to Google’s **API quota and pricing model** (after free tier).
- Data returned cannot exceed Google’s allowed usage policies (must attribute Google, cannot fully re-host without terms compliance).
- Sandbox assignment context does not provide real **business Place IDs** or a Google API key with billing enabled.

### 3. Prototype Attempt

- Tested the Places API with a sample request:

## Setup Instructions

1. Clone the repo
2. Install dependencies: `npm install`
3. Add `.env.local` with keys:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
API_BASE_URL=http://localhost:4000
HOSTAWAY_ACCOUNT_ID=61148
HOSTAWAY_API_KEY=...
HOSTAWAY_API_URL=https://api.hostaway.com/v1

Run: `npm run dev`  
This starts Express on `:4000` and Next.js on `:3000`.
