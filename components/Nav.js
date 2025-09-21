import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function useOutside(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose])
}

function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutside(ref, () => setOpen(false))
  return (
    <div className={`nav-dd ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="nav-link"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {label} <span className="chev">▾</span>
      </button>
      {open && (
        <div className="nav-menu" role="menu">
          {items.map(({ label, href }, i) =>
            href.startsWith('http') ? (
              <a key={i} className="nav-item" href={href} target="_blank" rel="noreferrer">{label}</a>
            ) : (
              <Link key={i} className="nav-item" href={href}>{label}</Link>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function Nav() {
  return (
    <div className="navbar">
      <div className="nav-inner">
        <Link href="/dashboard" className="brand">
          <span className="brand-text">the flex.</span>
        </Link>

        <div className="nav-right">
          <Link className="nav-link" href="/dashboard">Dashboard</Link>

          <Dropdown
            label="Properties"
            items={[{ label: 'All Properties', href: '/dashboard#properties' }]}
          />

          <Dropdown
            label="Reviews"
            items={[
              { label: 'All Reviews', href: '/dashboard#reviews' },
              { label: 'Approved', href: '/dashboard#approved' },
              { label: 'Needs Attention', href: '/dashboard?q=wifi' },
            ]}
          />

          {/* Keep Analytics as a plain link; styling aligns with dropdown triggers */}
          <Link className="nav-link" href="/dashboard#analytics">Analytics</Link>

          <Dropdown
            label="Approvals"
            items={[
              { label: 'Pending Approval', href: '/dashboard?minRating=4.0#reviews' },
              { label: 'Approved (Live)', href: '/dashboard#approved' },
            ]}
          />

          <Dropdown
            label="Settings"
            items={[
              { label: 'Data Sources', href: '#settings-datasources' },
              { label: 'Channels & Categories', href: '#settings-categories' },
              { label: 'Team & Roles', href: '#settings-team' },
            ]}
          />

          <Dropdown
            label="Help"
            items={[
              { label: 'Docs (README)', href: 'https://localhost/README' },
              { label: 'Keyboard Shortcuts', href: '#help-shortcuts' },
              { label: 'Report an Issue', href: '#help-support' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
