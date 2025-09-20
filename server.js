// server.js
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: [/localhost:3000$/], credentials: false }));

const PORT = process.env.PORT || 4000;

// --- Helpers ---------------------------------------------------------------
async function fetchHostawayReviews() {
  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  const baseUrl = process.env.HOSTAWAY_API_URL || 'https://api.hostaway.com/v1';
  if (!accountId || !apiKey) return null;
  try {
    const url = `${baseUrl}/reviews?accountId=${encodeURIComponent(accountId)}`;
    const { data } = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return data;
  } catch (err) {
    console.warn('[hostaway] fetch failed, falling back to mock:', err?.message || err);
    return null;
  }
}

async function loadMockReviews() {
  const mockPath = process.env.MOCK_JSON_PATH || path.join(process.cwd(), 'server', 'mock-reviews.json');
  try {
    const raw = await fs.readFile(mockPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    const bundled = await fs.readFile(path.join(process.cwd(), 'server', 'mock-reviews.json'), 'utf8');
    return JSON.parse(bundled);
  }
}

function normalizeReview(item) {
  const categoriesArr = Array.isArray(item.reviewCategory) ? item.reviewCategory : [];
  const categories = Object.fromEntries(categoriesArr.map(({ category, rating }) => [String(category), Number(rating)]));
  let overall = item.rating;
  if (overall == null && categoriesArr.length) {
    const vals = categoriesArr.map(c => Number(c.rating)).filter(v => Number.isFinite(v));
    if (vals.length) overall = Math.round(((vals.reduce((a,b)=>a+b,0)/vals.length)/2)*10)/10;
  }
  const submittedIso = item.submittedAt ? new Date(item.submittedAt.replace(' ', 'T') + 'Z').toISOString() : null;
  return {
    id: String(item.id),
    channel: 'hostaway',
    type: item.type || 'guest-to-host',
    status: item.status || 'published',
    overallRating: overall ?? null,
    categories,
    text: item.publicReview || '',
    submittedAt: submittedIso,
    guestName: item.guestName || null,
    listingName: item.listingName || 'Unknown',
  };
}

function buildAggregates(normalized) {
  const byListing = new Map();
  const byType = new Map();
  const byMonth = new Map();
  const push = (m, key, v) => { const arr = m.get(key) || []; arr.push(v); m.set(key, arr); };
  for (const r of normalized) {
    push(byListing, r.listingName, r);
    push(byType, r.type, r);
    if (r.submittedAt) push(byMonth, r.submittedAt.slice(0,7), r);
  }
  const avg = arr => {
    const vals = arr.map(x => (x.overallRating ?? 0)).filter(v => typeof v === 'number');
    if (!vals.length) return null;
    return Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10;
  };
  const listingStats = Array.from(byListing.entries()).map(([listing, arr]) => ({
    listing, count: arr.length, avgRating: avg(arr),
  })).sort((a,b)=> b.count - a.count || (b.avgRating ?? 0) - (a.avgRating ?? 0));
  const typeStats = Array.from(byType.entries()).map(([type, arr]) => ({
    type, count: arr.length, avgRating: avg(arr),
  }));
  const monthly = Array.from(byMonth.entries()).map(([month, arr]) => ({
    month, count: arr.length, avgRating: avg(arr),
  })).sort((a,b)=> a.month.localeCompare(b.month));
  return { listingStats, typeStats, monthly };
}

// --- Approvals persistence (file) -----------------------------------------
const approvalsPath = path.join(process.cwd(), 'server', 'data', 'approvals.json');
async function readApprovals() { try { return JSON.parse(await fs.readFile(approvalsPath, 'utf8')); } catch { return {}; } }
async function writeApprovals(obj) { await fs.writeFile(approvalsPath, JSON.stringify(obj, null, 2), 'utf8'); }

// --- Routes ---------------------------------------------------------------
app.get('/api/reviews/hostaway', async (req, res) => {
  try {
    const { source, limit } = req.query;
    let raw = null;
    if (source === 'live') raw = await fetchHostawayReviews();
    if (!raw && source !== 'mock') raw = await fetchHostawayReviews();
    if (!raw) raw = await loadMockReviews();
    const items = Array.isArray(raw?.result) ? raw.result : [];
    const sliced = Number.isFinite(Number(limit)) ? items.slice(0, Number(limit)) : items;
    const normalized = sliced.map(normalizeReview);
    const aggregates = buildAggregates(normalized);
    res.json({ status: 'ok', count: normalized.length, items: normalized, aggregates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err?.message || 'Internal Server Error' });
  }
});

app.get('/api/approvals', async (_req, res) => res.json({ status: 'ok', approvals: await readApprovals() }));

app.post('/api/approvals', async (req, res) => {
  try {
    const { reviewId, approved } = req.body || {};
    if (!reviewId) return res.status(400).json({ status:'error', message:'Missing reviewId' });
    const current = await readApprovals();
    current[String(reviewId)] = Boolean(approved);
    await writeApprovals(current);
    res.json({ status:'ok', approvals: current });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status:'error', message:'Failed to save approval' });
  }
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Express API listening on http://localhost:${PORT}`));
