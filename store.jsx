// MyHabits — React state store: localStorage persistence + provider/hook.
// All pure helpers live in lib.js (which must be loaded before this file).

const STORAGE_KEY = 'myhabits.v1';

function defaultState() {
  return {
    habits: [],
    settings: { accent: '#f97316', weekStart: 1 /* 1=Mon */ },
  };
}

// Old builds shipped demo habits with fixed IDs. Strip them on load so users
// who installed early versions also get a clean slate without touching any
// habits they created themselves (those use 'h_'-prefixed IDs).
const LEGACY_SEED_HABIT_IDS = new Set(['gym', 'journaling', 'water', 'alcohol', 'eating', 'reading']);

function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Android shell: if localStorage is empty but the bridge has data
    // (e.g. WebView was cleared but SharedPreferences survived), seed from there.
    if (!raw && typeof window !== 'undefined' && window.MyHabitsBridge && window.MyHabitsBridge.getState) {
      try {
        const fromNative = window.MyHabitsBridge.getState();
        if (fromNative) raw = fromNative;
      } catch {}
    }
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.habits) return defaultState();
    return {
      habits: parsed.habits.filter((h) => !LEGACY_SEED_HABIT_IDS.has(h.id)),
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
    };
  } catch {
    return defaultState();
  }
}

function saveState(s) {
  const json = JSON.stringify(s);
  try { localStorage.setItem(STORAGE_KEY, json); } catch {}
  // Android shell: also push to native SharedPreferences so widgets can read it.
  // Absent in plain web — the conditional is a no-op there.
  if (typeof window !== 'undefined' && window.MyHabitsBridge && window.MyHabitsBridge.saveState) {
    try { window.MyHabitsBridge.saveState(json); } catch {}
  }
}

const StoreContext = React.createContext(null);

function StoreProvider({ children }) {
  const [state, setState] = React.useState(loadState);

  React.useEffect(() => { saveState(state); }, [state]);

  const api = React.useMemo(() => ({
    state,

    // habits
    addHabit(h) {
      setState((s) => ({
        ...s,
        habits: [...s.habits, {
          ...h,
          id: h.id || ('h_' + Math.random().toString(36).slice(2, 9)),
          createdAt: Date.now(),
          entries: h.entries || {},
        }],
      }));
    },
    updateHabit(id, patch) {
      setState((s) => ({
        ...s,
        habits: s.habits.map((h) => h.id === id ? { ...h, ...patch } : h),
      }));
    },
    deleteHabit(id) {
      setState((s) => ({
        ...s,
        habits: s.habits.filter((h) => h.id !== id),
      }));
    },
    reorderHabits(ids) {
      setState((s) => ({
        ...s,
        habits: ids.map((id) => s.habits.find((h) => h.id === id)).filter(Boolean),
      }));
    },

    // entries
    checkIn(habitId, date = todayKey(), delta = 1) {
      setState((s) => ({
        ...s,
        habits: s.habits.map((h) => {
          if (h.id !== habitId) return h;
          const cur = h.entries[date] || 0;
          const next = Math.max(0, Math.min(h.target, cur + delta));
          const entries = { ...h.entries };
          if (next === 0) delete entries[date];
          else entries[date] = next;
          return { ...h, entries };
        }),
      }));
    },
    setEntry(habitId, date, value) {
      setState((s) => ({
        ...s,
        habits: s.habits.map((h) => {
          if (h.id !== habitId) return h;
          const entries = { ...h.entries };
          if (!value) delete entries[date];
          else entries[date] = Math.min(h.target, value);
          return { ...h, entries };
        }),
      }));
    },

    // settings
    updateSettings(patch) {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },

    wipeAll() {
      setState(defaultState());
    },

    // backup / restore
    exportJson() {
      return JSON.stringify(state, null, 2);
    },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('JSON is not an object');
      }
      if (isNativeBackup(parsed)) {
        const next = {
          habits: parsed.habits,
          settings: { ...defaultState().settings, ...(parsed.settings || {}) },
        };
        setState(next);
        return { source: 'native', habits: next.habits.length };
      }
      const imported = parseHabitKit(parsed);
      const entryCount = imported.reduce((n, h) => n + Object.keys(h.entries).length, 0);
      const all = imported.flatMap((h) => Object.keys(h.entries));
      const earliest = all.length ? all.reduce((a, b) => a < b ? a : b) : null;
      const latest   = all.length ? all.reduce((a, b) => a > b ? a : b) : null;
      setState((s) => ({ ...s, habits: [...s.habits, ...imported] }));
      return { source: 'habitkit', habits: imported.length, entries: entryCount, earliest, latest };
    },
    importCsv(text) {
      const parsed = parseCsv(text);
      setState((s) => mergeCsvImport(s, parsed));
      return {
        habits: parsed.columns.length,
        entries: parsed.columns.reduce((n, c) => n + Object.keys(c.entries).length, 0),
        earliest: parsed.earliest,
        latest: parsed.latest,
      };
    },
  }), [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function useStore() {
  return React.useContext(StoreContext);
}

Object.assign(window, { StoreProvider, useStore });
