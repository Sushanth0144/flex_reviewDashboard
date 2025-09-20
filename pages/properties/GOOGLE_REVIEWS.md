Google Reviews — Feasibility & Recommendation

## Goal

Assess whether we should ingest and display Google Reviews alongside Hostaway reviews for Flex Living properties.

## TL;DR

- **Feasible for aggregate signals** (rating + total count) via the **Google Places Details API**.
- **Not recommended** to ingest or persist **full review text** due to Terms of Service limits and compliance overhead.
- Recommended approach for this project: **do not ingest review text**; if needed later, surface **rating + count** server-side with ephemeral fetches.

---

## What the API can provide

- **Place rating** (e.g., `4.6`)
- **User ratings total** (e.g., `123`)
- Some responses can include reviews, but **availability varies** and **redistribution/storage is restricted**.

Example (server-side only):
GET https://maps.googleapis.com/maps/api/place/details/json
?place_id=<PLACE_ID>
&fields=rating,user_ratings_total
&key=<API_KEY>

## Constraints & Risks

- **ToS**: Storing, caching, or redistributing Google review _content_ is restricted. Aggregate data is safer but still requires attribution and careful caching.
- **Security**: API key must be **server-side only**.
- **Cost**: Pay-as-you-go; light usage is inexpensive, heavy polling can add up.

## Recommendation

1. For this assessment, **document feasibility only**; do not ingest review text.
2. If product later wants Google signals, add a server endpoint returning only:
   ```json
   { "status": "ok", "placeId": "...", "rating": 4.6, "total": 123 }
   ```
