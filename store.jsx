// MyHabits — React state store: localStorage persistence + provider/hook.
// All pure helpers live in lib.js (which must be loaded before this file).

const STORAGE_KEY = 'myhabits.v1';

function defaultState() {
  return {
    habits: [],
    widgets: [],
    settings: { accent: '#f97316', weekStart: 1 /* 1=Mon */ },
  };
}

// Old builds shipped demo habits/widgets with fixed IDs. Strip them on load
// so users who installed early versions also get a clean slate without
// touching any habits they created themselves (those use 'h_'-prefixed IDs).
const LEGACY_SEED_HABIT_IDS = new Set(['gym', 'journaling', 'water', 'alcohol', 'eating', 'reading']);
const LEGACY_SEED_WIDGET_IDS = new Set(['w1', 'w2', 'w3']);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.habits) return defaultState();
    return {
      ...parsed,
      habits: parsed.habits.filter((h) => !LEGACY_SEED_HABIT_IDS.has(h.id)),
      widgets: (parsed.widgets || []).filter((w) => !LEGACY_SEED_WIDGET_IDS.has(w.id)),
    };
  } catch {
    return defaultState();
  }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
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
        widgets: s.widgets.map((w) => ({
          ...w,
          habitIds: w.habitIds ? w.habitIds.filter((x) => x !== id) : w.habitIds,
        })),
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

    // widgets
    addWidget(w) {
      setState((s) => ({
        ...s,
        widgets: [...s.widgets, { ...w, id: 'w_' + Math.random().toString(36).slice(2, 9) }],
      }));
    },
    updateWidget(id, patch) {
      setState((s) => ({
        ...s,
        widgets: s.widgets.map((w) => w.id === id ? { ...w, ...patch } : w),
      }));
    },
    deleteWidget(id) {
      setState((s) => ({ ...s, widgets: s.widgets.filter((w) => w.id !== id) }));
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
          widgets: Array.isArray(parsed.widgets) ? parsed.widgets : [],
          settings: { ...defaultState().settings, ...(parsed.settings || {}) },
        };
        setState(next);
        return { source: 'native', habits: next.habits.length, widgets: next.widgets.length };
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
