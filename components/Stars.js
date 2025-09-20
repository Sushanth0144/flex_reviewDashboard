export default function Stars({ value = 0, size = 16 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div title={`${value} / 5`} style={{display:'inline-flex', gap:2}}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.168L12 18.902l-7.336 3.862 1.402-8.168L.132 9.21l8.2-1.192z"
              fill={filled ? '#fbbf24' : 'none'} stroke="#fbbf24" strokeWidth="1.5"/>
          </svg>
        );
      })}
    </div>
  );
}
export function RatingBadge({ value }) {
  const cls = value >= 4.5 ? 'good' : value >= 4.0 ? 'warn' : 'bad';
  return <span className={`rating ${cls}`}>{(value ?? 0).toFixed(1)}</span>;
}
