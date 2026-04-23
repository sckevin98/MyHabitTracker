// MyHabits — Habit detail screen

function HabitDetail({ habitId, onBack, onEdit }) {
  const { state, setEntry, checkIn } = useStore();
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return null;

  const today = todayKey();
  const todayVal = habit.entries[today] || 0;
  const streak = computeStreak(habit);
  const last30 = daysCompleted(habit, 30);
  const totalDays = Object.values(habit.entries).filter((v) => v >= habit.target).length;
  const totalCheckins = Object.values(habit.entries).reduce((a, b) => a + b, 0);

  // calendar for current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startPad = weekdayIndex(firstOfMonth);

  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(new Date(now.getFullYear(), now.getMonth(), d));
  }

  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', paddingBottom: 30 }}>
      <div style={{
        padding: '12px 12px 16px',
        background: `linear-gradient(180deg, ${habit.color}22, transparent 80%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn onClick={onBack} aria-label="Back"><Icon.Back size={18}/></IconBtn>
          <IconBtn onClick={onEdit} aria-label="Edit"><Icon.Edit size={16}/></IconBtn>
        </div>
        <div style={{ padding: '16px 4px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: habit.color + '33',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>{habit.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{habit.name}</div>
            <div style={{ color: '#8a8d95', fontSize: 12, marginTop: 2 }}>
              {habit.category} · {habit.target} {habit.targetUnit}/day
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Today control */}
        <div style={{
          background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16,
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Today</div>
            <div style={{ color: '#f3f4f6', fontSize: 20, fontWeight: 700, marginTop: 2 }}>
              {todayVal}/{habit.target} <span style={{ color: '#8a8d95', fontSize: 13, fontWeight: 500 }}>{habit.targetUnit}</span>
            </div>
          </div>
          {habit.target > 1 ? (
            <NumberStepper value={todayVal} onChange={(v) => setEntry(habit.id, today, v)} min={0} max={habit.target}/>
          ) : (
            <button onClick={() => checkIn(habit.id)}
              style={{
                background: todayVal ? habit.color : habit.color + '26', border: 'none',
                color: todayVal ? '#0b0c0e' : habit.color, borderRadius: 14, padding: '10px 16px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {todayVal ? <><Icon.Check size={14} color="#0b0c0e"/> Done</> : <><Icon.Plus size={14} color={habit.color}/> Complete</>}
            </button>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Streak', value: streak, unit: 'days', icon: <Icon.Flame size={14} color={habit.color}/> },
            { label: 'Last 30d', value: last30, unit: 'days' },
            { label: 'Total', value: totalDays, unit: 'days' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#17181c', border: '1px solid #222429', borderRadius: 16, padding: 12,
            }}>
              <div style={{ color: '#8a8d95', fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.icon} {s.label}
              </div>
              <div style={{ color: '#f3f4f6', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {s.value}
                <span style={{ color: '#8a8d95', fontSize: 11, fontWeight: 500, marginLeft: 4 }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{
          background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16, marginBottom: 16,
        }}>
          <div style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>History</div>
          <Heatmap habit={habit} weeks={22} cellSize={11} gap={3} rounded={2}/>
        </div>

        {/* Calendar */}
        <div style={{
          background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 16,
        }}>
          <div style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ color: '#6b6e76', fontSize: 10, textAlign: 'center', fontWeight: 600 }}>{d[0]}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map((d, i) => {
              if (!d) return <div key={i}/>;
              const key = dateKey(d);
              const ratio = completionRatio(habit, key);
              const isToday = key === today;
              const isFuture = d > now;
              return (
                <button key={i} disabled={isFuture}
                  onClick={() => {
                    if (isFuture) return;
                    const cur = habit.entries[key] || 0;
                    const next = habit.target === 1 ? (cur ? 0 : 1) : Math.min(habit.target, cur + 1);
                    setEntry(habit.id, key, next);
                  }}
                  style={{
                    aspectRatio: '1', background: ratio > 0 ? habit.color : '#1f2025',
                    opacity: ratio > 0 ? (0.3 + ratio * 0.7) : (isFuture ? 0.3 : 1),
                    border: isToday ? '1.5px solid #f3f4f6' : '1px solid transparent',
                    borderRadius: 8, color: ratio > 0.5 ? '#0b0c0e' : '#e5e7eb',
                    fontSize: 11, fontWeight: 600, cursor: isFuture ? 'default' : 'pointer',
                    fontFamily: 'inherit', padding: 0,
                  }}>{d.getDate()}</button>
              );
            })}
          </div>
          <div style={{ color: '#6b6e76', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
            Tap a day to log it · {totalCheckins} total check-in{totalCheckins === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HabitDetail });
