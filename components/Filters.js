export default function Filters({ state, setState, listings }) {
  function applyPreset(val) {
  
    setState(s => ({ ...s, minRating: '', category: '' }));
    if (val === 'top') setState(s => ({ ...s, minRating: '4.5' }));
    if (val === 'solid') setState(s => ({ ...s, minRating: '4.0' }));
    if (val === 'clean') setState(s => ({ ...s, category: 'cleanliness' }));
    if (val === 'wifi') setState(s => ({ ...s, category: 'wifi' }));
  }

  return (
    <div className="card" style={{marginBottom:16}}>
      <div className="controls">
       
        <select onChange={(e)=>applyPreset(e.target.value)} defaultValue="">
          <option value="">Quick filter</option>
          <option value="top">Top Rated (≥ 4.5)</option>
          <option value="solid">Solid (≥ 4.0)</option>
          <option value="clean">Low cleanliness</option>
          <option value="wifi">Wi-Fi issues</option>
        </select>

        <select value={state.listingId} onChange={e=>setState(s=>({...s, listingId: e.target.value }))}>
          <option value="">All listings</option>
          {listings.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={state.channel} onChange={e=>setState(s=>({...s, channel: e.target.value }))}>
          <option value="">All channels</option>
          <option value="hostaway">Hostaway</option>
        </select>
        <select value={state.type} onChange={e=>setState(s=>({...s, type: e.target.value }))}>
          <option value="">All types</option>
          <option value="guest-to-host">Guest → Host</option>
          <option value="host-to-guest">Host → Guest</option>
        </select>
        <select value={state.minRating} onChange={e=>setState(s=>({...s, minRating: e.target.value }))}>
          <option value="">Any rating</option>
          <option value="4.5">≥ 4.5</option>
          <option value="4.0">≥ 4.0</option>
          <option value="3.5">≥ 3.5</option>
        </select>
        <input className="input" placeholder="Category (e.g., cleanliness)" value={state.category} onChange={e=>setState(s=>({...s, category: e.target.value }))} />
        <input className="input" placeholder="Search text..." value={state.q} onChange={e=>setState(s=>({...s, q: e.target.value }))} />
        <input type="date" className="input" value={state.from || ''} onChange={e=>setState(s=>({...s, from: e.target.value}))} />
<input type="date" className="input" value={state.to || ''} onChange={e=>setState(s=>({...s, to: e.target.value}))} />

      </div>
    </div>
  )
}
