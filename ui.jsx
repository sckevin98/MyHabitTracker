// MyHabits — reusable UI primitives
// Heatmap + icon library + small chrome bits used across screens.

function Heatmap({ habit, weeks = 15, cellSize = 10, gap = 3, rounded = 2, dimEmpty = 0.06 }) {
  const today = new Date();
  const todayWd = weekdayIndex(today); // 0=Mon..6=Sun

  const width = weeks * cellSize + (weeks - 1) * gap;
  const height = 7 * cellSize + 6 * gap;
  const alphaFor = (lvl) => [0, 0.28, 0.5, 0.75, 1][lvl];

  const cells = [];
  // For each cell (w, d): rightmost column (w = weeks-1) holds current week.
  // Today lands at row d = todayWd in that rightmost column.
  // daysFromToday = (weeks-1 - w) * 7 + (todayWd - d)
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const daysFromToday = (weeks - 1 - w) * 7 + (todayWd - d);
      if (daysFromToday < 0) continue; // future — leave blank
      const date = addDays(today, -daysFromToday);
      if (habit.createdAt && date.getTime() < habit.createdAt - 86400000) {
        // before habit creation — leave blank
        continue;
      }
      const lvl = completionLevel(habit, dateKey(date));
      cells.push({ w, d, lvl });
    }
  }

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {cells.map(({ w, d, lvl }) => (
        <rect
          key={`${w}-${d}`}
          x={w * (cellSize + gap)}
          y={d * (cellSize + gap)}
          width={cellSize}
          height={cellSize}
          rx={rounded}
          ry={rounded}
          fill={lvl === 0 ? '#ffffff' : habit.color}
          fillOpacity={lvl === 0 ? dimEmpty : alphaFor(lvl)}
        />
      ))}
    </svg>
  );
}

// ── icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: ({ size = 16, color = '#fff', w = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={color} strokeWidth={w} strokeLinecap="round"/></svg>
  ),
  Check: ({ size = 16, color = '#fff', w = 3 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4 4 10-10" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Minus: ({ size = 16, color = '#fff', w = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke={color} strokeWidth={w} strokeLinecap="round"/></svg>
  ),
  Back: ({ size = 20, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Close: ({ size = 20, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  Search: ({ size = 18, color = '#d1d5db' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  Flame: ({ size = 12, color = '#fb923c' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 2s1.5 3 1.5 5.5c0 1.5-1 2.5-1 2.5s-2-1-2-3c0 0-4 3-4 8a5.5 5.5 0 0 0 11 0c0-2.5-1.5-4-1.5-4s0 1-1 1c0 0 1-2 0-4s-3-6-3-6z" fill={color}/></svg>
  ),
  Edit: ({ size = 18, color = '#d1d5db' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Trash: ({ size = 18, color = '#f87171' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Chevron: ({ size = 18, color = '#8a8d95' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Widget: ({ size = 18, color = '#d1d5db' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/></svg>
  ),
  Home: ({ size = 18, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
  ),
  Stats: ({ size = 18, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Settings: ({ size = 18, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

function IconBtn({ children, onClick, primary, accent, size = 36, 'aria-label': label }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: primary ? accent : '#17181c',
        border: primary ? 'none' : '1px solid #222429',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, accent = '#f97316', disabled, full }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#2a2c33' : accent,
        color: disabled ? '#6b6e76' : '#0b0c0e',
        border: 'none', borderRadius: 14, padding: '13px 18px',
        fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, full }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#17181c', color: '#e5e7eb',
        border: '1px solid #2a2c33', borderRadius: 14, padding: '12px 18px',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        width: full ? '100%' : 'auto', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ color: '#6b6e76', fontSize: 11 }}>{hint}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: '#17181c', border: '1px solid #2a2c33', borderRadius: 12,
        color: '#f3f4f6', fontSize: 14, padding: '12px 14px', fontFamily: 'inherit',
        outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  );
}

function NumberStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <IconBtn onClick={() => onChange(Math.max(min, value - 1))} size={34} aria-label="minus">
        <Icon.Minus color="#e5e7eb" size={14}/>
      </IconBtn>
      <div style={{ minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#f3f4f6' }}>{value}</div>
      <IconBtn onClick={() => onChange(Math.min(max, value + 1))} size={34} aria-label="plus">
        <Icon.Plus color="#e5e7eb" size={14}/>
      </IconBtn>
    </div>
  );
}

function Pill({ active, onClick, children, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (accent || '#23252b') : 'transparent',
        border: '1px solid ' + (active ? (accent || '#2e3138') : '#2a2c33'),
        color: active ? (accent ? '#0b0c0e' : '#f3f4f6') : '#8a8d95',
        padding: '8px 14px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

Object.assign(window, { Heatmap, Icon, IconBtn, PrimaryButton, GhostButton, Field, TextInput, NumberStepper, Pill });
