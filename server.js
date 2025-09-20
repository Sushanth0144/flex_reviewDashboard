
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); 
dotenv.config(); // fallback to .env if present

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;


const allowedOrigins = [
  /^http:\/\/localhost:3000$/,
  "https://flex-review-dashboard-six.vercel.app", 
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      cb(ok ? null : new Error("Not allowed by CORS"), ok);
    },
    credentials: false,
  })
);

app.use(express.json());

// Quick env check
console.log("[env]", {
  HOSTAWAY_ACCOUNT_ID: process.env.HOSTAWAY_ACCOUNT_ID,
  HOSTAWAY_API_KEY_PRESENT: !!process.env.HOSTAWAY_API_KEY,
});

// ---------- Helpers ----------
async function fetchHostawayReviews() {
  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  const baseUrl = process.env.HOSTAWAY_API_URL || "https://api.hostaway.com/v1";

  if (!accountId || !apiKey) {
    console.log("[live] missing envs (accountId/apiKey)");
    return { data: null, reason: "missing_envs" };
  }

  try {
    const url = `${baseUrl}/reviews?accountId=${encodeURIComponent(accountId)}`;
    console.log("[live] GET", url);

    // If your tenant needs header keys instead of bearer, switch to X-Hostaway-* headers.
    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (resp.status >= 200 && resp.status < 300) {
      const len = Array.isArray(resp.data?.result) ? resp.data.result.length : "n/a";
      console.log("[live] ok, result length:", len);
      return { data: resp.data, reason: null };
    }

    console.warn("[live]", resp.status, "from Hostaway", resp.data || "");
    return { data: null, reason: `http_${resp.status}` };
  } catch (err) {
    console.warn("[hostaway] fetch failed:", err?.message || err);
    return { data: null, reason: "network_error" };
  }
}

async function loadMockReviews() {
  const candidates = [
    process.env.MOCK_JSON_PATH,
    path.join(process.cwd(), "server", "data", "mock-reviews.json"),
    path.join(process.cwd(), "server", "mock-reviews.json"),
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      console.log("[mock] loaded from:", p);
      return JSON.parse(raw);
    } catch {}
  }
  throw new Error(
    "mock-reviews.json not found. Place it at server/data/mock-reviews.json or set MOCK_JSON_PATH."
  );
}

function normalizeReview(item) {
  const categoriesArr = Array.isArray(item.reviewCategory) ? item.reviewCategory : [];
  const categories = Object.fromEntries(
    categoriesArr.map(({ category, rating }) => [String(category), Number(rating)])
  );

  let overall = item.rating;
  if (overall == null && categoriesArr.length) {
    const vals = categoriesArr
      .map((c) => Number(c.rating))
      .filter((v) => Number.isFinite(v));
    if (vals.length) {
      overall = Math.round(((vals.reduce((a, b) => a + b, 0) / vals.length) / 2) * 10) / 10;
    }
  }

  const submittedIso = item.submittedAt
    ? new Date(item.submittedAt.replace(" ", "T") + "Z").toISOString()
    : null;

  return {
    id: String(item.id),
    channel: "hostaway",
    type: item.type || "guest-to-host",
    status: item.status || "published",
    overallRating: overall ?? null,
    categories,
    text: item.publicReview || "",
    submittedAt: submittedIso,
    guestName: item.guestName || null,
    listingName: item.listingName || "Unknown",
  };
}

function buildAggregates(normalized) {
  const byListing = new Map();
  const byType = new Map();
  const byMonth = new Map();
  const push = (m, key, v) => {
    const arr = m.get(key) || [];
    arr.push(v);
    m.set(key, arr);
  };

  for (const r of normalized) {
    push(byListing, r.listingName, r);
    push(byType, r.type, r);
    if (r.submittedAt) push(byMonth, r.submittedAt.slice(0, 7), r);
  }

  const avg = (arr) => {
    const vals = arr
      .map((x) => x.overallRating ?? 0)
      .filter((v) => typeof v === "number");
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const listingStats = Array.from(byListing.entries())
    .map(([listing, arr]) => ({ listing, count: arr.length, avgRating: avg(arr) }))
    .sort((a, b) => b.count - a.count || (b.avgRating ?? 0) - (a.avgRating ?? 0));
  const typeStats = Array.from(byType.entries()).map(([type, arr]) => ({
    type,
    count: arr.length,
    avgRating: avg(arr),
  }));
  const monthly = Array.from(byMonth.entries())
    .map(([month, arr]) => ({ month, count: arr.length, avgRating: avg(arr) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { listingStats, typeStats, monthly };
}

// ----- Approvals persistence (file) -----
const approvalsDir = path.join(process.cwd(), "server", "data");
const approvalsPath = path.join(approvalsDir, "approvals.json");

async function ensureDataDir() {
  if (!fssync.existsSync(approvalsDir)) {
    fssync.mkdirSync(approvalsDir, { recursive: true });
  }
  if (!fssync.existsSync(approvalsPath)) {
    fssync.writeFileSync(approvalsPath, "{}");
  }
}
await ensureDataDir();

async function readApprovals() {
  try {
    return JSON.parse(await fs.readFile(approvalsPath, "utf8"));
  } catch {
    return {};
  }
}
async function writeApprovals(obj) {
  await fs.writeFile(approvalsPath, JSON.stringify(obj, null, 2), "utf8");
}

// ----- Routes -----
app.get("/api/reviews/hostaway", async (req, res) => {
  try {
    const { source, limit } = req.query;
    const forceMock = String(process.env.FORCE_MOCK || "").toLowerCase() === "true";

    let raw = null;
    let used = "mock";
    let fallbackReason = null;

    const tryLive = async () => {
      const { data, reason } = await fetchHostawayReviews();
      if (!data) fallbackReason = fallbackReason || reason || "live_fetch_failed";
      return data;
    };

    if (!forceMock) {
      if (source === "live") raw = await tryLive();
      if (!raw && source !== "mock") raw = await tryLive();
    }
    if (!raw) {
      raw = await loadMockReviews();
      used = "mock";
    } else {
      used = "live";
    }

    const items = Array.isArray(raw?.result) ? raw.result : [];
    const sliced = Number.isFinite(Number(limit)) ? items.slice(0, Number(limit)) : items;
    const normalized = sliced.map(normalizeReview);
    const aggregates = buildAggregates(normalized);

    res.json({
      status: "ok",
      source: used,
      fallbackReason,
      count: normalized.length,
      items: normalized,
      aggregates,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err?.message || "Internal Server Error" });
  }
});

app.get("/api/approvals", async (_req, res) => {
  res.json({ status: "ok", approvals: await readApprovals() });
});

app.post("/api/approvals", async (req, res) => {
  try {
    const { reviewId, approved } = req.body || {};
    if (!reviewId) return res.status(400).json({ status: "error", message: "Missing reviewId" });
    const current = await readApprovals();
    current[String(reviewId)] = Boolean(approved);
    await writeApprovals(current);
    res.json({ status: "ok", approvals: current });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", message: "Failed to save approval" });
  }
});

app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) =>
  res.send("FlexLiving Reviews API • Try /healthz and /api/reviews/hostaway")
);

// ---- Start server ----
app.listen(PORT, () =>
  console.log(`Express API listening on http://localhost:${PORT}`)
);
