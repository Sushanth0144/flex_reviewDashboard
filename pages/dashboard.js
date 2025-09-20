
import { useEffect, useMemo, useState } from 'react'
import Stars, { RatingBadge } from '../components/Stars'
import Filters from '../components/Filters'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || '' // e.g. http://localhost:4000

export default function Dashboard() {
  const [reviews, setReviews] = useState(null) // null => loading; [] => loaded
  const [approvals, setApprovals] = useState({})
  const [state, setState] = useState({
    listingId: '',
    channel: '',
    type: '',
    minRating: '',
    category: '',
    q: '',
    from: '', // optional date (yyyy-mm-dd)
    to: '',   // optional date (yyyy-mm-dd)
  })
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })

  // Load data
  useEffect(() => {
    fetch(`${API}/api/reviews/hostaway`)
      .then(r => r.json())
      .then(j => setReviews(j.items || []))
      .catch(() => setReviews([]))

    fetch(`${API}/api/approvals`)
      .then(r => r.json())
      .then(j => setApprovals(j.approvals || {}))
      .catch(() => setApprovals({}))
  }, [])

  const listings = useMemo(
    () => Array.from(new Set((reviews || []).map(r => r.listingName))),
    [reviews]
  )

  // Apply all filters (including optional date range)
  const filtered = useMemo(() => {
    if (!reviews) return []
    return reviews.filter(r => {
      if (state.listingId) {
        const needle = String(state.listingId).toLowerCase()
        if (!String(r.listingName).toLowerCase().includes(needle)) return false
      }
      if (state.channel && r.channel !== state.channel) return false
      if (state.type && r.type !== state.type) return false
      if (state.minRating && (r.overallRating ?? 0) < Number(state.minRating)) return false
      if (state.category) {
        const hit = Object.keys(r.categories || {}).some(c =>
          c.toLowerCase().includes(state.category.toLowerCase())
        )
        if (!hit) return false
      }
      if (state.q) {
        const blob = [r.text, r.guestName, r.listingName].join(' ').toLowerCase()
        if (!blob.includes(state.q.toLowerCase())) return false
      }
      // time filter (inclusive)
      if (state.from) {
        const fromTs = +new Date(state.from)
        if (+new Date(r.submittedAt) < fromTs) return false
      }
      if (state.to) {
        const toTs = +new Date(state.to) + 24 * 60 * 60 * 1000 - 1
        if (+new Date(r.submittedAt) > toTs) return false
      }
      return true
    })
  }, [reviews, state])

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const { key, dir } = sort
    arr.sort((a, b) => {
      let av, bv
      if (key === 'date') { av = +new Date(a.submittedAt); bv = +new Date(b.submittedAt) }
      else if (key === 'rating') { av = a.overallRating ?? 0; bv = b.overallRating ?? 0 }
      else { av = String(a.listingName).toLowerCase(); bv = String(b.listingName).toLowerCase() }
      const cmp = av > bv ? 1 : av < bv ? -1 : 0
      return dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort])

  function toggleApprove(id, approved) {
    fetch(`${API}/api/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: id, approved }),
    })
      .then(r => r.json())
      .then(j => setApprovals(j.approvals || {}))
  }

  function setSortKey(key) {
    setSort(s =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    )
  }

  const loading = reviews === null
  const empty = !loading && sorted.length === 0

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="mono">the flex. · Hostaway reviews</div>
          <h1 className="h1">Reviews Dashboard</h1>
          <div className="lead">
            Filter, spot trends, and approve the best guest feedback to showcase on property pages.
          </div>
        </div>
      </div>

      {/* KPIs — show numbers even while loading */}
      <div className="kpi" style={{ marginBottom: 12 }}>
        <div className="box">
          <div className="mono">Total Reviews</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{loading ? 0 : sorted.length}</div>
        </div>
        <div className="box">
          <div className="mono">Listings</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{loading ? 0 : listings.length}</div>
        </div>
        <div className="box">
          <div className="mono">Approved</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {Object.values(approvals).filter(Boolean).length}
          </div>
        </div>
      </div>

      {/* Filters bar — your Filters.js includes "Quick filter" and can include From/To dates */}
      <Filters state={state} setState={setState} listings={listings} />

      {/* Per-Property Performance */}
      <div className="card" style={{ marginBottom: 12 }} id="properties">
        <h3 style={{ marginTop: 0 }}>Per-Property Performance</h3>
        {!reviews ? (
          <div className="grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="card" key={i}>
                <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 16, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid">
            {Array.from(new Set(sorted.map(r => r.listingName))).map(listing => {
              const arr = sorted.filter(r => r.listingName === listing)
              const avg = arr.length
                ? arr.reduce((s, x) => s + (x.overallRating || 0), 0) / arr.length
                : 0
              const avgRounded = Math.round(avg * 10) / 10

              // Count low-scoring categories (<=6 on 0–10 channel scale)
              const issues = Object.entries(
                arr.reduce((acc, r) => {
                  Object.entries(r.categories || {}).forEach(([k, v]) => {
                    acc[k] = (acc[k] || 0) + (v <= 6 ? 1 : 0)
                  })
                  return acc
                }, {})
              )
                .filter(([_, v]) => v > 0)
                .map(([k, v]) => ({ k, v }))

              return (
                <div className="card" key={listing}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{listing}</div>
                      <div className="mono">
                        {arr.length} reviews • avg <RatingBadge value={avgRounded} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Stars value={avgRounded} />
                    </div>
                  </div>
                  {!!issues.length && (
                    <>
                      <hr />
                      <div>
                        {issues.map(({ k, v }) => (
                          <span className="badge" key={k}>
                            {k}: {v} low
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <Link
                      href={`/properties/${encodeURIComponent(
                        listing.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      )}`}
                    >
                      <button className="button">Open Property Page</button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* All Reviews */}
      <div className="card" id="reviews">
        <h3 style={{ marginTop: 0 }}>All Reviews</h3>
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8 }} />
            ))}
          </div>
        ) : !sorted.length ? (
          <div className="mono">
            No reviews match your filters. Try clearing the search or changing the rating threshold.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Approve</th>
                <th className="th-sort" onClick={() => setSortKey('listingName')}>
                  Listing {sort.key === 'listingName' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Guest</th>
                <th className="th-sort" onClick={() => setSortKey('rating')}>
                  Rating {sort.key === 'rating' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Categories</th>
                <th className="th-sort" onClick={() => setSortKey('date')}>
                  Date {sort.key === 'date' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(approvals[r.id])}
                      onChange={e => toggleApprove(r.id, e.target.checked)}
                    />
                  </td>
                  <td>{r.listingName}</td>
                  <td>{r.guestName || ''}</td>
                  <td>
                    <RatingBadge value={r.overallRating || 0} />
                  </td>
                  <td>
                    {Object.entries(r.categories || {}).map(([k, v]) => (
                      <span key={k} className="badge">
                        {k}:{v}
                      </span>
                    ))}
                  </td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ''}</td>
                  <td>{r.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="footer">Built for the Flex Living Assessment — Express API + Next.js UI</div>
    </div>
  )
}
