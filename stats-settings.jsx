// MyHabits — Stats + Settings

function StatsScreen() {
  const { state } = useStore();
  const accent = state.settings.accent;
  const habits = state.habits;

  // Last 7 days completion
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const k = dateKey(d);
    const scheduledCount = habits.filter((h) => h.schedule.includes(weekdayIndex(d))).length;
    const doneCount = habits.filter((h) => (h.entries[k] || 0) >= h.target && h.schedule.includes(weekdayIndex(d))).length;
    last7.push({ d, doneCount, scheduledCount });
  }

  const totalCheckins = habits.reduce((a, h) => a + Object.values(h.entries).reduce((x, y) => x + y, 0), 0);
  const bestStreak = Math.max(0, ...habits.map((h) => computeStreak(h)));

  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>OVERVIEW</div>
        <div style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, marginTop: 2 }}>Stats</div>
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Total check-ins" value={totalCheckins} accent={accent}/>
        <StatCard label="Best streak" value={bestStreak} unit="days" accent={accent}/>
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16 }}>
          <div style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Last 7 days</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
            {last7.map((d, i) => {
              const ratio = d.scheduledCount ? d.doneCount / d.scheduledCount : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, width: '100%', background: '#1f2025', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${ratio * 100}%`, background: accent, borderRadius: 6 }}/>
                  </div>
                  <div style={{ color: '#6b6e76', fontSize: 10, fontWeight: 600 }}>
                    {d.d.toLocaleDateString(undefined, { weekday: 'short' })[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
          Per habit
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habits.map((h) => {
            const streak = computeStreak(h);
            const last30 = daysCompleted(h, 30);
            return (
              <div key={h.id} style={{
                background: '#17181c', border: '1px solid #222429', borderRadius: 16,
                padding: 12, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: h.color + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{h.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                  <div style={{ color: '#8a8d95', fontSize: 11, marginTop: 1, display: 'flex', gap: 8 }}>
                    <span><Icon.Flame size={10} color={h.color}/> {streak}d</span>
                    <span>{last30}/30 days</span>
                  </div>
                </div>
                <div style={{ width: 70 }}>
                  <Heatmap habit={h} weeks={10} cellSize={6} gap={2} rounded={1.5}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{
      background: '#17181c', border: '1px solid #222429', borderRadius: 16, padding: 14,
    }}>
      <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#f3f4f6', fontSize: 26, fontWeight: 700, marginTop: 6 }}>
        {value}
        {unit && <span style={{ color: '#8a8d95', fontSize: 12, fontWeight: 500, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function SettingsScreen() {
  const { state, updateSettings, wipeAll } = useStore();
  const accent = state.settings.accent;
  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>PREFERENCES</div>
        <div style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, marginTop: 2 }}>Settings</div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16 }}>
          <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 12 }}>
            App accent
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLORS.map((c) => (
              <button key={c.value} onClick={() => updateSettings({ accent: c.value })} aria-label={c.name}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c.value,
                  border: accent === c.value ? '2px solid #f3f4f6' : '2px solid transparent',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)', cursor: 'pointer', padding: 0,
                }}/>
            ))}
          </div>
          <div style={{ color: '#6b6e76', fontSize: 11, marginTop: 10 }}>Used for today's progress ring and nav highlight.</div>
        </div>

        <div style={{ background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16 }}>
          <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 12 }}>
            Week starts on
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Pill active={state.settings.weekStart === 1} onClick={() => updateSettings({ weekStart: 1 })} accent={accent}>Monday</Pill>
            <Pill active={state.settings.weekStart === 0} onClick={() => updateSettings({ weekStart: 0 })} accent={accent}>Sunday</Pill>
          </div>
        </div>

        <div style={{ background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16 }}>
          <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 12 }}>
            Data
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => {
              if (confirm('Delete ALL habits and widgets? This cannot be undone.')) wipeAll();
            }} style={{
              background: 'transparent', border: '1px solid #3a1f24', color: '#f87171',
              padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Wipe everything</button>
          </div>
        </div>

        <div style={{ color: '#6b6e76', fontSize: 11, textAlign: 'center', padding: 12 }}>
          MyHabits · v1.0 · Data stored on device
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatsScreen, SettingsScreen });
