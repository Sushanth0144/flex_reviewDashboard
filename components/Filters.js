// components/Filters.js
import dynamic from "next/dynamic";
import { useMemo } from "react";

// Client-only datepicker (avoids SSR build errors)
const DatePicker = dynamic(
  () => import("react-datepicker").then((m) => m.default),
  { ssr: false }
);

export default function Filters({ state, setState, listings }) {
  function applyPreset(val) {
    setState((s) => ({ ...s, minRating: "", category: "" }));
    if (val === "top")   setState((s) => ({ ...s, minRating: "4.5" }));
    if (val === "solid") setState((s) => ({ ...s, minRating: "4.0" }));
    if (val === "clean") setState((s) => ({ ...s, category: "cleanliness" }));
    if (val === "wifi")  setState((s) => ({ ...s, category: "wifi" }));
  }

  // ISO (yyyy-mm-dd) <-> Date
  const fromDate = useMemo(
    () => (state.from ? new Date(state.from + "T00:00:00Z") : null),
    [state.from]
  );
  const toDate = useMemo(
    () => (state.to ? new Date(state.to + "T00:00:00Z") : null),
    [state.to]
  );

  const onPickFrom = (d) =>
    setState((s) => ({ ...s, from: d ? d.toISOString().slice(0, 10) : "" }));
  const onPickTo = (d) =>
    setState((s) => ({ ...s, to: d ? d.toISOString().slice(0, 10) : "" }));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="controls">
        <select onChange={(e) => applyPreset(e.target.value)} defaultValue="">
          <option value="">Quick filter</option>
          <option value="top">Top Rated (≥ 4.5)</option>
          <option value="solid">Solid (≥ 4.0)</option>
          <option value="clean">Low cleanliness</option>
          <option value="wifi">Wi-Fi issues</option>
        </select>

        <select
          value={state.listingId}
          onChange={(e) => setState((s) => ({ ...s, listingId: e.target.value }))}
        >
          <option value="">All listings</option>
          {listings.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select
          value={state.channel}
          onChange={(e) => setState((s) => ({ ...s, channel: e.target.value }))}
        >
          <option value="">All channels</option>
          <option value="hostaway">Hostaway</option>
        </select>

        <select
          value={state.type}
          onChange={(e) => setState((s) => ({ ...s, type: e.target.value }))}
        >
          <option value="">All types</option>
          <option value="guest-to-host">Guest → Host</option>
          <option value="host-to-guest">Host → Guest</option>
        </select>

        <select
          value={state.minRating}
          onChange={(e) => setState((s) => ({ ...s, minRating: e.target.value }))}
        >
          <option value="">Any rating</option>
          <option value="4.5">≥ 4.5</option>
          <option value="4.0">≥ 4.0</option>
          <option value="3.5">≥ 3.5</option>
        </select>

        <input
          className="input"
          placeholder="Category (e.g., cleanliness)"
          value={state.category}
          onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
        />

        <input
          className="input"
          placeholder="Search text..."
          value={state.q}
          onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
        />

        {/* Date range (labels + icons) */}
        <div className="date-range">
          <label className="label">From</label>
          <div className="input-icon">
            <svg className="icon-calendar" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2v3M17 2v3M3 9h18M4 7h16a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1z"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <DatePicker
              selected={fromDate}
              onChange={onPickFrom}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              className="input with-icon"
              isClearable
              autoComplete="off"
              name="filter-from-date"
            />
          </div>

          <label className="label">To</label>
          <div className="input-icon">
            <svg className="icon-calendar" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2v3M17 2v3M3 9h18M4 7h16a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1z"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <DatePicker
              selected={toDate}
              onChange={onPickTo}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              className="input with-icon"
              isClearable
              autoComplete="off"
              name="filter-to-date"
              minDate={fromDate || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
