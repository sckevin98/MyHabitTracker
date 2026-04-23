// MyHabits — Create / Edit habit sheet

function HabitEditor({ existing, onSave, onCancel, onDelete }) {
  const { state } = useStore();
  const accent = state.settings.accent;

  const [name, setName] = React.useState(existing?.name || '');
  const [icon, setIcon] = React.useState(existing?.icon || '🌱');
  const [color, setColor] = React.useState(existing?.color || COLORS[0].value);
  const [category, setCategory] = React.useState(existing?.category || 'Health');
  const [target, setTarget] = React.useState(existing?.target || 1);
  const [targetUnit, setTargetUnit] = React.useState(existing?.targetUnit || 'times');
  const [schedule, setSchedule] = React.useState(existing?.schedule || [0,1,2,3,4,5,6]);

  const canSave = name.trim().length > 0 && schedule.length > 0;

  const toggleDay = (i) => {
    setSchedule((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort());
  };

  return (
    <div style={{ background: '#0b0c0e', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn onClick={onCancel} aria-label="Close"><Icon.Close size={18} color="#e5e7eb"/></IconBtn>
        <div style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 700 }}>{existing ? 'Edit habit' : 'New habit'}</div>
        <button onClick={() => canSave && onSave({
          name: name.trim(), icon, color, category, target, targetUnit, schedule,
        })} disabled={!canSave}
          style={{
            background: 'transparent', border: 'none', color: canSave ? accent : '#4b4e55',
            fontSize: 14, fontWeight: 700, cursor: canSave ? 'pointer' : 'default', padding: 8, fontFamily: 'inherit',
          }}>Save</button>
      </div>

      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        {/* Preview */}
        <div style={{
          background: '#17181c', borderRadius: 20, padding: 14, border: '1px solid #222429',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: color + '26',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600 }}>{name || 'Habit name'}</div>
            <div style={{ color: '#8a8d95', fontSize: 12, marginTop: 2 }}>
              {target} {targetUnit} · {schedule.length === 7 ? 'Every day' : `${schedule.length} day${schedule.length === 1 ? '' : 's'}/week`}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Check size={16} color="#0b0c0e"/>
          </div>
        </div>

        <Field label="Name">
          <TextInput value={name} onChange={setName} placeholder="e.g. Morning stretch"/>
        </Field>

        <Field label="Icon">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)}
                style={{
                  aspectRatio: '1', background: icon === ic ? color + '33' : '#17181c',
                  border: '1px solid ' + (icon === ic ? color : '#222429'),
                  borderRadius: 10, fontSize: 18, cursor: 'pointer', padding: 0,
                }}>{ic}</button>
            ))}
          </div>
        </Field>

        <Field label="Color">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLORS.map((c) => (
              <button key={c.value} onClick={() => setColor(c.value)} aria-label={c.name}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c.value,
                  border: color === c.value ? '2px solid #f3f4f6' : '2px solid transparent',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)', cursor: 'pointer', padding: 0,
                }}/>
            ))}
          </div>
        </Field>

        <Field label="Category">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <Pill key={c} active={c === category} onClick={() => setCategory(c)} accent={color}>{c}</Pill>
            ))}
          </div>
        </Field>

        <Field label="Daily target" hint={target === 1 ? 'One check-in a day' : 'Tap the button multiple times per day'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <NumberStepper value={target} onChange={setTarget} min={1} max={99}/>
            <input value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} placeholder="unit"
              style={{
                background: '#17181c', border: '1px solid #2a2c33', borderRadius: 12,
                color: '#f3f4f6', fontSize: 14, padding: '10px 12px', fontFamily: 'inherit',
                outline: 'none', flex: 1,
              }}/>
          </div>
        </Field>

        <Field label="Schedule">
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {WEEKDAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: schedule.includes(i) ? color + '33' : '#17181c',
                  border: '1px solid ' + (schedule.includes(i) ? color : '#222429'),
                  color: schedule.includes(i) ? '#f3f4f6' : '#8a8d95',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{d}</button>
            ))}
          </div>
        </Field>

        {existing && onDelete && (
          <button onClick={onDelete}
            style={{
              marginTop: 12, background: 'transparent', border: '1px solid #3a1f24',
              color: '#f87171', padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
            <Icon.Trash size={16}/> Delete habit
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { HabitEditor });
