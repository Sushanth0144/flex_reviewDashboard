
export async function getServerSideProps(context) {
  const { listingId } = context.params;

  
  const apiBase =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:4000';

  // fetch in parallel
  const [reviewsRes, approvalsRes] = await Promise.all([
    fetch(`${apiBase}/api/reviews/hostaway`),
    fetch(`${apiBase}/api/approvals`),
  ]);

  let reviewsJson = { items: [] };
  let approvalsJson = { approvals: {} };
  try { reviewsJson = await reviewsRes.json(); } catch {}
  try { approvalsJson = await approvalsRes.json(); } catch {}

  const all = Array.isArray(reviewsJson.items) ? reviewsJson.items : [];
  const approvals = approvalsJson.approvals || {};

 
  const canonical = listingId.replace(/-/g, ' ').toLowerCase().trim();
  const listingReviews = all.filter(r =>
    (r.listingName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .includes(canonical)
  );

  // only approved reviews for the public page
  const approved = listingReviews.filter(r => approvals[String(r.id)]);

  const listingName =
    approved[0]?.listingName ||
    listingReviews[0]?.listingName ||
    listingId.replace(/-/g, ' ');

  return {
    props: {
      listingId,
      listingName,
      reviews: approved,
    },
  };
}

import Link from 'next/link';
import Stars from '../../components/Stars';


export default function Property({ listingId, listingName, reviews }) {
  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="mono">
            <Link href="/dashboard">← Dashboard</Link> · Property details
          </div>
          <h1 className="h1">{listingName}</h1>
          <div className="lead">Only manager-approved reviews are shown below.</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Guest Reviews</h3>
        {reviews.length === 0 && (
          <div className="mono">No approved reviews yet.</div>
        )}

        <div className="grid">
          {reviews.map(r => (
            <div className="card" key={r.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{r.guestName || 'Guest'}</div>
                  <div className="mono">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleDateString()
                      : ''}
                  </div>
                </div>
                <Stars value={r.overallRating || 0} />
              </div>

              <p style={{ whiteSpace: 'pre-wrap' }}>{r.text}</p>

              <div>
                {Object.entries(r.categories || {}).map(([k, v]) => (
                  <span key={k} className="badge">
                    {k}:{v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">the flex. — Property Page (Mocked)</div>
    </div>
  );
}
