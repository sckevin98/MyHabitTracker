// MyHabits — Widget rendering + Widget Studio (configure + preview)

const WIDGET_SIZES = {
  '2x2':  { w: 164, h: 164, label: '2×2 · Small' },
  '4x1':  { w: 340, h: 76,  label: '4×1 · Strip' },
  '4x2':  { w: 340, h: 164, label: '4×2 · Medium' },
  '4x4':  { w: 340, h: 340, label: '4×4 · Large' },
};

const WIDGET_TYPES = [
  { id: 'single',   label: 'Single habit',    sizes: ['2x2','4x2'],           needsOne: true },
  { id: 'heatmap',  label: 'Habit heatmap',   sizes: ['4x2','4x4'],           needsOne: true },
  { id: 'grid',     label: 'All habits grid', sizes: ['4x4'],                 needsMany: true },
  { id: 'streaks',  label: 'Streaks row',     sizes: ['4x1','4x2'],           needsMany: true },
];

function bgFor(bg) {
  if (bg === 'light') return { bg: '#ffffff', border: '#e5e7eb', primary: '#111827', secondary: '#6b7280', faint: '#00000014' };
  if (bg === 'translucent') return { bg: 'rgba(23, 24, 28, 0.55)', border: 'rgba(255,255,255,0.12)', primary: '#f3f4f6', secondary: '#c0c3cb', faint: '#ffffff18' };
  return { bg: '#17181c', border: '#2a2c33', primary: '#f3f4f6', secondary: '#8a8d95', faint: '#ffffff14' };
}

function RenderWidget({ widget, habits, scale = 1 }) {
  const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['4x2'];
  const theme = bgFor(widget.bg);

  // Resolve habits
  const pickedHabits = widget.habitIds && widget.habitIds.length
    ? widget.habitIds.map((id) => habits.find((h) => h.id === id)).filter(Boolean)
    : habits;

  const shell = {
    width: size.w, height: size.h,
    borderRadius: 28, background: theme.bg,
    border: `1px solid ${theme.border}`, padding: 14,
    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', transform: `scale(${scale})`, transformOrigin: 'top left',
    boxShadow: widget.bg === 'light' ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
  };

  if (widget.type === 'single') return <SingleWidget widget={widget} habit={pickedHabits[0] || habits[0]} theme={theme} shell={shell}/>;
  if (widget.type === 'heatmap') return <HeatmapWidget widget={widget} habit={pickedHabits[0] || habits[0]} theme={theme} shell={shell}/>;
  if (widget.type === 'grid') return <GridWidget widget={widget} habits={pickedHabits} theme={theme} shell={shell}/>;
  if (widget.type === 'streaks') return <StreaksWidget widget={widget} habits={pickedHabits} theme={theme} shell={shell}/>;
  return <div style={shell}>?</div>;
}

function SingleWidget({ widget, habit, theme, shell }) {
  if (!habit) return <div style={shell}><EmptyWidget theme={theme}/></div>;
  const color = widget.accent || habit.color;
  const today = todayKey();
  const val = habit.entries[today] || 0;
  const progress = Math.min(1, val / habit.target);
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div style={shell}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: color + '33',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{habit.icon}</div>
        <div style={{ color: theme.primary, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.name}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke={theme.faint} strokeWidth="6"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 36 36)"/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: theme.primary, fontSize: 16, fontWeight: 700 }}>{Math.round(progress * 100)}%</div>
          <div style={{ color: theme.secondary, fontSize: 9 }}>{computeStreak(habit)}d streak</div>
        </div>
      </div>
    </div>
  );
}

function HeatmapWidget({ widget, habit, theme, shell }) {
  if (!habit) return <div style={shell}><EmptyWidget theme={theme}/></div>;
  const color = widget.accent || habit.color;
  const weeks = widget.size === '4x4' ? 22 : 22;
  const cellSize = widget.size === '4x4' ? 12 : 10;
  const today = todayKey();
  const done = (habit.entries[today] || 0) >= habit.target;
  const displayHabit = { ...habit, color };
  return (
    <div style={shell}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: color + '33',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{habit.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: theme.primary, fontSize: 13, fontWeight: 600 }}>{habit.name}</div>
          <div style={{ color: theme.secondary, fontSize: 10, marginTop: 1 }}>{computeStreak(habit)} day streak</div>
        </div>
        <div style={{ width: 26, height: 26, borderRadius: '50%',
          background: done ? color : color + '33',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {done ? <Icon.Check size={12} color="#0b0c0e"/> : <Icon.Plus size={12} color={color}/>}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Heatmap habit={displayHabit} weeks={weeks} cellSize={cellSize} gap={3} rounded={2} dimEmpty={widget.bg === 'light' ? 0.12 : 0.06}/>
      </div>
    </div>
  );
}

function GridWidget({ widget, habits, theme, shell }) {
  const shown = habits.slice(0, 4);
  return (
    <div style={{ ...shell, gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ color: theme.primary, fontSize: 13, fontWeight: 700 }}>{widget.title || 'MyHabits'}</div>
        <div style={{ color: theme.secondary, fontSize: 10 }}>
          {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {shown.map((habit) => {
          const color = widget.accent || habit.color;
          const displayHabit = { ...habit, color };
          return (
            <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: color + '33',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{habit.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: theme.primary, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{habit.name}</div>
                <Heatmap habit={displayHabit} weeks={20} cellSize={7} gap={2} rounded={1.5} dimEmpty={widget.bg === 'light' ? 0.12 : 0.06}/>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <EmptyWidget theme={theme}/>}
      </div>
    </div>
  );
}

function StreaksWidget({ widget, habits, theme, shell }) {
  const shown = habits.slice(0, 4);
  return (
    <div style={{ ...shell, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {shown.map((habit, i) => {
        const color = widget.accent || habit.color;
        const today = todayKey();
        const done = (habit.entries[today] || 0) >= habit.target;
        return (
          <React.Fragment key={habit.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%',
                background: done ? color : color + '33',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{habit.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: theme.primary, fontSize: 10, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {habit.name.split(' ')[0]}
                </div>
                <div style={{ color: color, fontSize: 9, fontWeight: 700 }}>{computeStreak(habit)}d</div>
              </div>
            </div>
            {i < shown.length - 1 && <div style={{ width: 1, alignSelf: 'stretch', background: theme.border }}/>}
          </React.Fragment>
        );
      })}
      {shown.length === 0 && <EmptyWidget theme={theme}/>}
    </div>
  );
}

function EmptyWidget({ theme }) {
  return <div style={{ color: theme.secondary, fontSize: 11, margin: 'auto' }}>No habits</div>;
}

// ── Widgets list + studio ───────────────────────────────────────────────────
function WidgetsScreen({ onOpen, onNew }) {
  const { state, deleteWidget } = useStore();
  const accent = state.settings.accent;
  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#8a8d95', fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>CUSTOMIZE</div>
          <div style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, marginTop: 2 }}>Widgets</div>
        </div>
        <IconBtn primary accent={accent} onClick={onNew} aria-label="New widget">
          <Icon.Plus size={16} color="#0b0c0e"/>
        </IconBtn>
      </div>

      <div style={{ padding: '0 16px 16px', color: '#8a8d95', fontSize: 12 }}>
        Configure widgets here, then add them to your home screen through Android's widget picker.
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {state.widgets.length === 0 && (
          <div style={{
            background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 32,
            textAlign: 'center',
          }}>
            <Icon.Widget size={28} color="#8a8d95"/>
            <div style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 600, marginTop: 10 }}>No widgets yet</div>
            <div style={{ color: '#8a8d95', fontSize: 12, marginTop: 4 }}>Create one to see it in the picker.</div>
          </div>
        )}
        {state.widgets.map((w) => (
          <WidgetRow key={w.id} widget={w} habits={state.habits} onOpen={() => onOpen(w.id)} onDelete={() => deleteWidget(w.id)}/>
        ))}
      </div>
    </div>
  );
}

function WidgetRow({ widget, habits, onOpen, onDelete }) {
  const size = WIDGET_SIZES[widget.size];
  const type = WIDGET_TYPES.find((t) => t.id === widget.type);
  // scale widget to fit the preview area (max 120 tall, 150 wide)
  const maxW = 150, maxH = 120;
  const scale = Math.min(maxW / size.w, maxH / size.h, 1);
  return (
    <div onClick={onOpen} style={{
      background: '#17181c', border: '1px solid #222429', borderRadius: 20, padding: 14,
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
    }}>
      <div style={{ width: size.w * scale, height: size.h * scale, flexShrink: 0 }}>
        <RenderWidget widget={widget} habits={habits} scale={scale}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 600 }}>{type?.label || widget.type}</div>
        <div style={{ color: '#8a8d95', fontSize: 12, marginTop: 2 }}>{size.label}</div>
        <div style={{ color: '#6b6e76', fontSize: 11, marginTop: 2 }}>
          {widget.habitIds?.length ? `${widget.habitIds.length} habit${widget.habitIds.length === 1 ? '' : 's'}` : 'All habits'}
        </div>
      </div>
      <Icon.Chevron color="#4b4e55"/>
    </div>
  );
}

function WidgetStudio({ widgetId, onClose }) {
  const { state, addWidget, updateWidget, deleteWidget } = useStore();
  const accent = state.settings.accent;
  const existing = widgetId ? state.widgets.find((w) => w.id === widgetId) : null;

  const [w, setW] = React.useState(existing || {
    type: 'single', size: '2x2', habitIds: state.habits[0] ? [state.habits[0].id] : [],
    accent: null, bg: 'dark', title: 'MyHabits',
  });

  const type = WIDGET_TYPES.find((t) => t.id === w.type);

  // when type changes, reset size to allowed
  const setType = (newType) => {
    const tDef = WIDGET_TYPES.find((t) => t.id === newType);
    setW((s) => ({
      ...s, type: newType,
      size: tDef.sizes.includes(s.size) ? s.size : tDef.sizes[0],
      habitIds: tDef.needsOne && s.habitIds && s.habitIds.length > 1 ? [s.habitIds[0]] : s.habitIds,
    }));
  };

  const toggleHabit = (id) => {
    setW((s) => {
      if (type.needsOne) return { ...s, habitIds: [id] };
      const cur = s.habitIds || [];
      return { ...s, habitIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  };

  const save = () => {
    if (existing) updateWidget(existing.id, w);
    else addWidget(w);
    onClose();
  };

  const size = WIDGET_SIZES[w.size];
  const previewScale = Math.min(280 / size.w, 280 / size.h, 1);

  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn onClick={onClose} aria-label="Close"><Icon.Close size={18}/></IconBtn>
        <div style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 700 }}>{existing ? 'Edit widget' : 'New widget'}</div>
        <button onClick={save}
          style={{ background: 'transparent', border: 'none', color: accent,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 8, fontFamily: 'inherit' }}>Save</button>
      </div>

      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        {/* Preview */}
        <div style={{
          padding: 24,
          borderRadius: 20,
          background: w.bg === 'light'
            ? 'linear-gradient(135deg, #3a4f8e, #2a3a5e)'
            : 'linear-gradient(135deg, #23252b, #0f1014)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 180,
        }}>
          <div style={{ width: size.w * previewScale, height: size.h * previewScale }}>
            <RenderWidget widget={w} habits={state.habits} scale={previewScale}/>
          </div>
        </div>

        <Field label="Type">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {WIDGET_TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)}
                style={{
                  background: w.type === t.id ? accent + '22' : '#17181c',
                  border: '1px solid ' + (w.type === t.id ? accent : '#222429'),
                  color: '#f3f4f6', padding: '12px 10px', borderRadius: 12,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit',
                }}>{t.label}</button>
            ))}
          </div>
        </Field>

        <Field label="Size">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {type.sizes.map((s) => (
              <Pill key={s} active={s === w.size} onClick={() => setW((x) => ({ ...x, size: s }))} accent={accent}>
                {WIDGET_SIZES[s].label}
              </Pill>
            ))}
          </div>
        </Field>

        <Field label={type.needsOne ? 'Habit' : 'Habits (leave empty for all)'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflow: 'auto' }}>
            {state.habits.map((h) => {
              const selected = w.habitIds?.includes(h.id);
              return (
                <button key={h.id} onClick={() => toggleHabit(h.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: selected ? h.color + '22' : '#17181c',
                    border: '1px solid ' + (selected ? h.color : '#222429'),
                    borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: h.color + '33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  }}>{h.icon}</div>
                  <div style={{ flex: 1, color: '#f3f4f6', fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                  {selected && <Icon.Check size={14} color={h.color}/>}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Background">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'dark', label: 'Dark' },
              { id: 'light', label: 'Light' },
              { id: 'translucent', label: 'Translucent' },
            ].map((b) => (
              <Pill key={b.id} active={w.bg === b.id} onClick={() => setW((x) => ({ ...x, bg: b.id }))} accent={accent}>{b.label}</Pill>
            ))}
          </div>
        </Field>

        <Field label="Accent color" hint={w.accent ? 'Overrides each habit\'s color' : 'Using each habit\'s own color'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setW((x) => ({ ...x, accent: null }))}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #f97316, #eab308, #22c55e, #38bdf8, #a855f7, #f43f5e, #f97316)',
                border: w.accent === null ? '2px solid #f3f4f6' : '2px solid transparent',
                cursor: 'pointer', padding: 0,
              }} title="Rainbow — per-habit colors"/>
            {COLORS.map((c) => (
              <button key={c.value} onClick={() => setW((x) => ({ ...x, accent: c.value }))}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c.value,
                  border: w.accent === c.value ? '2px solid #f3f4f6' : '2px solid transparent',
                  cursor: 'pointer', padding: 0,
                }}/>
            ))}
          </div>
        </Field>

        {w.type === 'grid' && (
          <Field label="Title">
            <TextInput value={w.title || ''} onChange={(v) => setW((x) => ({ ...x, title: v }))} placeholder="MyHabits"/>
          </Field>
        )}

        {existing && (
          <button onClick={() => { deleteWidget(existing.id); onClose(); }}
            style={{
              background: 'transparent', border: '1px solid #3a1f24', color: '#f87171',
              padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 600, marginTop: 8,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
            <Icon.Trash size={16}/> Delete widget
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { RenderWidget, WidgetsScreen, WidgetStudio, WIDGET_SIZES, WIDGET_TYPES });
