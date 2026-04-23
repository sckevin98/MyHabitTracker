// MyHabits — main app shell: nav + modal management

const { useState, useEffect } = React;

// Fullscreen on real phones / installed PWA; fake Android frame on desktop.
function useIsPhoneViewport() {
  const query = () =>
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(max-width: 500px)').matches
    );
  const [isPhone, setIsPhone] = useState(query);
  useEffect(() => {
    const mqs = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(max-width: 500px)'),
    ];
    const update = () => setIsPhone(mqs.some((m) => m.matches));
    mqs.forEach((m) => m.addEventListener('change', update));
    return () => mqs.forEach((m) => m.removeEventListener('change', update));
  }, []);
  return isPhone;
}

function App() {
  const [tab, setTab] = useState('today');
  const [modal, setModal] = useState(null); // { kind: 'newHabit' | 'editHabit' | 'detail' | 'newWidget' | 'editWidget', id?: string }

  return (
    <StoreProvider>
      <AppInner tab={tab} setTab={setTab} modal={modal} setModal={setModal}/>
    </StoreProvider>
  );
}

function AppInner({ tab, setTab, modal, setModal }) {
  const { state, addHabit, updateHabit, deleteHabit } = useStore();
  const accent = state.settings.accent;
  const isPhone = useIsPhoneViewport();

  let content;
  if (tab === 'today')     content = <TodayScreen onNewHabit={() => setModal({ kind: 'newHabit' })} onOpenHabit={(id) => setModal({ kind: 'detail', id })}/>;
  else if (tab === 'stats')    content = <StatsScreen/>;
  else if (tab === 'widgets')  content = <WidgetsScreen onOpen={(id) => setModal({ kind: 'editWidget', id })} onNew={() => setModal({ kind: 'newWidget' })}/>;
  else if (tab === 'settings') content = <SettingsScreen/>;

  const inner = (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0b0c0e', overflow: 'hidden' }}>
      {content}
      <BottomNav tab={tab} onChange={setTab} accent={accent}/>

      {modal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: '#0b0c0e',
          animation: 'slideUp 240ms cubic-bezier(.2,.8,.2,1)',
        }}>
          {modal.kind === 'newHabit' && (
            <HabitEditor
              onCancel={() => setModal(null)}
              onSave={(h) => { addHabit(h); setModal(null); }}
            />
          )}
          {modal.kind === 'editHabit' && (
            <HabitEditor
              existing={state.habits.find((h) => h.id === modal.id)}
              onCancel={() => setModal({ kind: 'detail', id: modal.id })}
              onSave={(patch) => { updateHabit(modal.id, patch); setModal({ kind: 'detail', id: modal.id }); }}
              onDelete={() => {
                if (confirm('Delete this habit? Its history will be lost.')) {
                  deleteHabit(modal.id); setModal(null);
                }
              }}
            />
          )}
          {modal.kind === 'detail' && (
            <HabitDetail habitId={modal.id}
              onBack={() => setModal(null)}
              onEdit={() => setModal({ kind: 'editHabit', id: modal.id })}/>
          )}
          {modal.kind === 'newWidget' && (
            <WidgetStudio onClose={() => setModal(null)}/>
          )}
          {modal.kind === 'editWidget' && (
            <WidgetStudio widgetId={modal.id} onClose={() => setModal(null)}/>
          )}
        </div>
      )}
    </div>
  );

  if (isPhone) {
    // Installed PWA / real phone: fill the screen, no fake frame.
    return (
      <div style={{ width: '100%', height: '100%', background: '#0b0c0e' }}>
        {inner}
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a' }}>
      <AndroidDevice width={412} height={892} dark={true}>
        {inner}
      </AndroidDevice>
    </div>
  );
}

// slide-up keyframe injected once
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes slideUp {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
