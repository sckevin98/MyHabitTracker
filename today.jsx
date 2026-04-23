// MyHabits — Home screen (Today)

function HabitCard({ habit, onTap, onCheck, accent }) {
  const today = todayKey();
  const progress = habit.entries[today] || 0;
  const ratio = Math.min(1, progress / habit.target);
  const done = progress >= habit.target;
  const streak = computeStreak(habit);
  const col = habit.color;

  const label = habit.target === 1
    ? (done ? 'Done today' : 'Tap to complete')
    : `${progress}/${habit.target} ${habit.targetUnit}`;

  return (
    <div
      onClick={onTap}
      style={{
        background: '#17181c', borderRadius: 20, padding: 14,
        border: '1px solid #222429', display: 'flex', flexDirection: 'column',
        gap: 12, cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: col + '26',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
        }}>{habit.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {habit.name}
          </div>
          <div style={{ color: '#8a8d95', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon.Flame size={10} color={col}/>
            <span>{streak} day{streak === 1 ? '' : 's'}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onCheck(); }}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: done ? col : col + '26',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0, position: 'relative',
          }}
        >
          {done ? <Icon.Check size={14} color="#0b0c0e"/> : <Icon.Plus size={14} color={col}/>}
          {!done && habit.target > 1 && progress > 0 && (
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke={col} strokeWidth="2"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - ratio)}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"/>
            </svg>
          )}
        </button>
      </div>

      <Heatmap habit={habit} weeks={15} cellSize={9} gap={3} rounded={2}/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8a8d95', fontSize: 11 }}>{label}</span>
        <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{Math.round(ratio * 100)}%</span>
      </div>
    </div>
  );
}

function TodayHero({ habits, accent }) {
  const today = todayKey();
  const completed = habits.filter((h) => (h.entries[today] || 0) >= h.target).length;
  const total = habits.length || 1;
  const pct = Math.round((completed / total) * 100);
  const msg = completed === total && total > 0
    ? 'All done — incredible day'
    : completed === 0
    ? 'Let\'s start the day'
    : `${total - completed} to go`;

  return (
    <div style={{
      margin: '4px 16px 12px', padding: 16, borderRadius: 20,
      background: `linear-gradient(135deg, ${accent}1f, ${accent}08)`,
      border: `1px solid ${accent}33`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="23" fill="none" stroke="#ffffff14" strokeWidth="5"/>
          <circle cx="28" cy="28" r="23" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 23}
            strokeDashoffset={2 * Math.PI * 23 * (1 - pct / 100)}
            transform="rotate(-90 28 28)"/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f3f4f6', fontWeight: 700, fontSize: 13 }}>{pct}%</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 600 }}>
          {completed} of {total} habit{total === 1 ? '' : 's'} done
        </div>
        <div style={{ color: '#8a8d95', fontSize: 12, marginTop: 2 }}>{msg}</div>
      </div>
    </div>
  );
}

function TodayScreen({ onNavigate, onOpenHabit, onNewHabit }) {
  const { state, checkIn } = useStore();
  const accent = state.settings.accent;
  const [activeCat, setActiveCat] = React.useState('All');

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  const cats = ['All', ...new Set(state.habits.map((h) => h.category))];
  const shown = activeCat === 'All' ? state.habits : state.habits.filter((h) => h.category === activeCat);

  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>{dateLabel}</div>
          <div style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: -0.3 }}>
            Today
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconBtn aria-label="Search"><Icon.Search/></IconBtn>
          <IconBtn aria-label="New habit" primary accent={accent} onClick={onNewHabit}>
            <Icon.Plus size={16} color="#0b0c0e" w={2.5}/>
          </IconBtn>
        </div>
      </div>

      {state.habits.length > 0 && <TodayHero habits={state.habits} accent={accent}/>}

      {state.habits.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
          {cats.map((c) => (
            <Pill key={c} active={c === activeCat} onClick={() => setActiveCat(c)}>{c}</Pill>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState onNewHabit={onNewHabit} accent={accent} hasAny={state.habits.length > 0}/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
          {shown.map((h) => (
            <HabitCard key={h.id} habit={h} accent={accent}
              onTap={() => onOpenHabit(h.id)}
              onCheck={() => checkIn(h.id)}/>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNewHabit, accent, hasAny }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
      <div style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        {hasAny ? 'Nothing in this category' : 'Start your first habit'}
      </div>
      <div style={{ color: '#8a8d95', fontSize: 13, marginBottom: 20, maxWidth: 260, margin: '0 auto 20px' }}>
        {hasAny ? 'Try a different category or add a habit here.' : 'Small, daily actions compound. What do you want to build?'}
      </div>
      <PrimaryButton onClick={onNewHabit} accent={accent}>+ New habit</PrimaryButton>
    </div>
  );
}

function BottomNav({ tab, onChange, accent }) {
  const items = [
    { id: 'today', label: 'Today',    icon: 'Home' },
    { id: 'stats', label: 'Stats',    icon: 'Stats' },
    { id: 'widgets', label: 'Widgets', icon: 'Widget' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 22,
      background: '#17181c', borderRadius: 22, border: '1px solid #222429',
      display: 'flex', padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 5,
    }}>
      {items.map((it) => {
        const active = it.id === tab;
        const IconComp = Icon[it.icon];
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            style={{
              flex: 1, background: active ? accent : 'transparent', border: 'none',
              color: active ? '#0b0c0e' : '#8a8d95', padding: '10px 0', borderRadius: 16,
              fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <IconComp size={18} color={active ? '#0b0c0e' : '#8a8d95'}/>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { TodayScreen, BottomNav });
