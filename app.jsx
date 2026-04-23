// MyHabits — main app shell: nav + modal management

const { useState } = React;

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

  let content;
  if (tab === 'today')     content = <TodayScreen onNewHabit={() => setModal({ kind: 'newHabit' })} onOpenHabit={(id) => setModal({ kind: 'detail', id })}/>;
  else if (tab === 'stats')    content = <StatsScreen/>;
  else if (tab === 'widgets')  content = <WidgetsScreen onOpen={(id) => setModal({ kind: 'editWidget', id })} onNew={() => setModal({ kind: 'newWidget' })}/>;
  else if (tab === 'settings') content = <SettingsScreen/>;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a' }}>
      <AndroidDevice width={412} height={892} dark={true}>
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
