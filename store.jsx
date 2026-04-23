// MyHabits — state store: localStorage-backed habits + completions
// Exposes: useStore() hook and a pure API for components to use.

const STORAGE_KEY = 'myhabits.v1';

const COLORS = [
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber',  value: '#eab308' },
  { name: 'Green',  value: '#22c55e' },
  { name: 'Teal',   value: '#14b8a6' },
  { name: 'Cyan',   value: '#38bdf8' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink',   value: '#ec4899' },
  { name: 'Rose',   value: '#f43f5e' },
  { name: 'Lime',   value: '#84cc16' },
  { name: 'Slate',  value: '#94a3b8' },
  { name: 'Red',    value: '#ef4444' },
];

const ICONS = [
  '🏋','🏃','🚴','🧘','⚽','🏊','🥾',
  '📖','📚','✍','📓','🎓','🧠',
  '💧','🥗','🥦','🍎','🥛','🍵','☕',
  '🚫','🧼','🛁','💊','😴','🌙','☀',
  '🎨','🎸','🎹','🎧','📷','🎮','🎲',
  '💰','💼','📈','📱','💻','🧹','🌱',
];

const CATEGORIES = ['Health','Fitness','Mind','Work','Other'];

const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── date helpers ─────────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return dateKey(d);
}
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function keyToDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function weekdayIndex(d) {
  // Mon=0..Sun=6
  return (d.getDay() + 6) % 7;
}

// ── seed data (for first-run) ────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seedEntries(habitId, seed, density, target) {
  const rand = seededRandom(seed);
  const out = {};
  const today = new Date();
  // populate last 140 days
  for (let i = 140; i >= 1; i--) {
    const d = addDays(today, -i);
    const r = rand();
    const recency = (140 - i) / 140 * 0.15;
    if (r < density + recency) {
      // how many checks?
      const checks = target > 1
        ? Math.min(target, 1 + Math.floor(rand() * target))
        : 1;
      out[dateKey(d)] = checks;
    }
  }
  return out;
}

function defaultHabits() {
  return [
    {
      id: 'gym', name: 'Gym', icon: '🏋', color: '#f97316',
      category: 'Fitness', target: 1, targetUnit: 'times',
      schedule: [0,2,3,5], createdAt: Date.now() - 90*86400000,
      entries: seedEntries('gym', 11, 0.45, 1),
    },
    {
      id: 'journaling', name: 'Journaling', icon: '📓', color: '#a855f7',
      category: 'Mind', target: 1, targetUnit: 'entry',
      schedule: [0,1,2,3,4,5,6], createdAt: Date.now() - 80*86400000,
      entries: seedEntries('journaling', 27, 0.65, 1),
    },
    {
      id: 'water', name: 'Enough Water', icon: '💧', color: '#38bdf8',
      category: 'Health', target: 8, targetUnit: 'glasses',
      schedule: [0,1,2,3,4,5,6], createdAt: Date.now() - 70*86400000,
      entries: seedEntries('water', 43, 0.55, 8),
    },
    {
      id: 'alcohol', name: 'No Alcohol', icon: '🚫', color: '#f43f5e',
      category: 'Health', target: 1, targetUnit: 'day',
      schedule: [0,1,2,3,4,5,6], createdAt: Date.now() - 120*86400000,
      entries: seedEntries('alcohol', 61, 0.85, 1),
    },
    {
      id: 'eating', name: 'Eating Habits', icon: '🥗', color: '#22c55e',
      category: 'Health', target: 3, targetUnit: 'meals',
      schedule: [0,1,2,3,4,5,6], createdAt: Date.now() - 60*86400000,
      entries: seedEntries('eating', 79, 0.6, 3),
    },
    {
      id: 'reading', name: 'Reading', icon: '📖', color: '#eab308',
      category: 'Mind', target: 20, targetUnit: 'min',
      schedule: [0,1,2,3,4,5,6], createdAt: Date.now() - 50*86400000,
      entries: seedEntries('reading', 97, 0.4, 20),
    },
  ];
}

function defaultState() {
  return {
    habits: defaultHabits(),
    widgets: [
      { id: 'w1', type: 'grid',     size: '4x4', habitIds: null, accent: null, bg: 'dark', title: 'MyHabits' },
      { id: 'w2', type: 'single',   size: '2x2', habitIds: ['gym'], accent: null, bg: 'dark' },
      { id: 'w3', type: 'single',   size: '2x2', habitIds: ['alcohol'], accent: null, bg: 'dark' },
    ],
    settings: { accent: '#f97316', weekStart: 1 /* 1=Mon */ },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.habits) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ── store hook ───────────────────────────────────────────────────────────────
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

    resetAll() {
      setState(defaultState());
    },
    wipeAll() {
      setState({ ...defaultState(), habits: [], widgets: [] });
    },
  }), [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function useStore() {
  return React.useContext(StoreContext);
}

// ── derived stats ────────────────────────────────────────────────────────────
function computeStreak(habit) {
  // count consecutive "fulfilled" days up to (and including) today, respecting schedule
  let streak = 0;
  let d = new Date();
  // Don't count today if not yet fulfilled — start from today if fulfilled, else yesterday
  const todayFulfilled = (habit.entries[dateKey(d)] || 0) >= habit.target;
  if (!todayFulfilled) d = addDays(d, -1);

  while (true) {
    const scheduled = habit.schedule.includes(weekdayIndex(d));
    const key = dateKey(d);
    const done = (habit.entries[key] || 0) >= habit.target;
    if (scheduled) {
      if (done) streak++;
      else break;
    }
    d = addDays(d, -1);
    // safety cutoff
    if (streak > 3650) break;
  }
  return streak;
}

function completionLevel(habit, dateKeyStr) {
  const v = habit.entries[dateKeyStr] || 0;
  if (!v) return 0;
  const pct = v / habit.target;
  if (pct >= 1) return 4;
  if (pct >= 0.66) return 3;
  if (pct >= 0.33) return 2;
  return 1;
}

function completionRatio(habit, dateKeyStr) {
  const v = habit.entries[dateKeyStr] || 0;
  return Math.min(1, v / habit.target);
}

function daysCompleted(habit, n = 30) {
  let count = 0;
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const k = dateKey(addDays(today, -i));
    if ((habit.entries[k] || 0) >= habit.target) count++;
  }
  return count;
}

Object.assign(window, {
  StoreProvider, useStore,
  COLORS, ICONS, CATEGORIES, WEEKDAYS,
  todayKey, dateKey, keyToDate, addDays, weekdayIndex,
  computeStreak, completionLevel, completionRatio, daysCompleted,
});
