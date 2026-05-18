// MyHabits — pure JS helpers (no React, no DOM, no localStorage).
// Loaded as a plain <script> in the browser and required() from Node tests.
// Anything that touches React or storage lives in store.jsx.

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
  return dateKey(new Date());
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

// ── derived stats ────────────────────────────────────────────────────────────
function computeStreak(habit, now) {
  let streak = 0;
  let d = now ? new Date(now) : new Date();
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

function daysCompleted(habit, n = 30, now) {
  let count = 0;
  const today = now ? new Date(now) : new Date();
  for (let i = 0; i < n; i++) {
    const k = dateKey(addDays(today, -i));
    if ((habit.entries[k] || 0) >= habit.target) count++;
  }
  return count;
}

// ── HabitKit JSON import ─────────────────────────────────────────────────────
// Reverse-engineered from a real HabitKit (iOS) export. Shape:
//   {
//     habits:           [{id,name,color,icon,emoji,description,archived,createdAt,isInverse,orderIndex}],
//     completions:      [{id,habitId,date,amountOfCompletions,timezoneOffsetInMinutes,note}],
//     intervals:        [{habitId,type,unitType,requiredNumberOfCompletionsPerDay,streakType,allowExceedingGoal,startDate,endDate}],
//     reminders:        [...],
//     categories:       [{id,name,icon,orderIndex,createdAt}],
//     categoryMappings: [{habitId,categoryId,orderIndex,createdAt}],
//   }
// HabitKit color tokens follow Tailwind palette naming.
const HABITKIT_COLORS = {
  red:     '#ef4444',
  orange:  '#f97316',
  amber:   '#f59e0b',
  yellow:  '#eab308',
  lime:    '#84cc16',
  green:   '#22c55e',
  emerald: '#10b981',
  teal:    '#14b8a6',
  cyan:    '#06b6d4',
  sky:     '#0ea5e9',
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  purple:  '#a855f7',
  fuchsia: '#d946ef',
  pink:    '#ec4899',
  rose:    '#f43f5e',
  slate:   '#94a3b8',
  gray:    '#9ca3af',
  zinc:    '#a1a1aa',
  neutral: '#a3a3a3',
  stone:   '#a8a29e',
};

// Lucide icon name → emoji (covers the icons in the seed export plus common ones).
// Unknown names fall back to a category-based default, then 🌱.
const HABITKIT_ICONS = {
  activity:    '🏃',
  dumbbell:    '🏋️',
  bike:        '🚴',
  run:         '🏃',
  yoga:        '🧘',
  swim:        '🏊',
  hiking:      '🥾',
  graduation:  '🎓',
  book:        '📖',
  edit:        '✍️',
  brain:       '🧠',
  glass:       '💧',
  water:       '💧',
  apple:       '🍎',
  utensils:    '🍽️',
  coffee:      '☕',
  tea:         '🍵',
  beer:        '🍺',
  wine:        '🍷',
  pill:        '💊',
  sleep:       '😴',
  moon:        '🌙',
  sun:         '☀️',
  cloud_sun:   '⛅',
  palette:     '🎨',
  music:       '🎧',
  guitar:      '🎸',
  camera:      '📷',
  gamepad:     '🎮',
  moneybill:   '💰',
  briefcase:   '💼',
  chart:       '📈',
  phone:       '📱',
  laptop:      '💻',
  broom:       '🧹',
  plant:       '🌱',
  heart:       '❤️',
  socialize:   '🗣️',
  diamond:     '💎',
};

const OUR_CATEGORIES_LOWER = new Map(CATEGORIES.map((c) => [c.toLowerCase(), c]));
// Map of common HabitKit category names (DE + EN) → our category enum.
const HABITKIT_CATEGORY_MAP = {
  fitness: 'Fitness',
  sport: 'Fitness',
  health: 'Health',
  gesundheit: 'Health',
  ernährung: 'Health',
  ernaehrung: 'Health',
  nutrition: 'Health',
  mind: 'Mind',
  studium: 'Mind',
  study: 'Mind',
  learn: 'Mind',
  lernen: 'Mind',
  kunst: 'Mind',
  art: 'Mind',
  arbeit: 'Work',
  work: 'Work',
  finanzen: 'Work',
  finance: 'Work',
};

function mapHabitKitColor(token) {
  if (typeof token !== 'string') return null;
  if (/^#[0-9a-f]{6}$/i.test(token)) return token.toLowerCase();
  return HABITKIT_COLORS[token.toLowerCase()] || null;
}

function mapHabitKitIcon(habit) {
  if (habit.emoji) return habit.emoji;
  const name = (habit.icon || '').toLowerCase();
  if (HABITKIT_ICONS[name]) return HABITKIT_ICONS[name];
  return null;
}

function mapHabitKitCategory(name) {
  if (!name) return 'Other';
  const lower = String(name).toLowerCase();
  return HABITKIT_CATEGORY_MAP[lower] || OUR_CATEGORIES_LOWER.get(lower) || 'Other';
}

// Convert a HabitKit completion `date` to a local YYYY-MM-DD using the
// timezone offset HabitKit recorded with the row. HabitKit writes UTC in
// `date` and the user's offset (minutes) at log time in
// `timezoneOffsetInMinutes`. JS `getTimezoneOffset()` returns positive for
// zones west of UTC; HabitKit stores the opposite sign (CEST=120). Adjust by
// adding the offset to the UTC ms before extracting Y/M/D in UTC.
function habitKitDateKey(rawDate, offsetMin) {
  const t = Date.parse(rawDate);
  if (Number.isNaN(t)) return null;
  const off = Number.isFinite(offsetMin) ? offsetMin : 0;
  const shifted = new Date(t + off * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseHabitKit(obj, options = {}) {
  const opts = { idPrefix: 'h_', skipEmpty: true, ...options };
  if (!obj || typeof obj !== 'object') throw new Error('HabitKit: not an object');
  const habits = obj.habits;
  if (!Array.isArray(habits) || !habits.length) {
    throw new Error('HabitKit: missing habits array');
  }
  const completions = obj.completions;
  if (!Array.isArray(completions)) {
    throw new Error('HabitKit: missing completions array');
  }

  const intervals = Array.isArray(obj.intervals) ? obj.intervals : [];
  const categories = Array.isArray(obj.categories) ? obj.categories : [];
  const categoryMappings = Array.isArray(obj.categoryMappings) ? obj.categoryMappings : [];

  // habitId → daily target from intervals.requiredNumberOfCompletionsPerDay
  const targetByHabit = new Map();
  for (const iv of intervals) {
    const t = iv.requiredNumberOfCompletionsPerDay;
    if (iv.habitId && Number.isFinite(t) && t > 0) {
      targetByHabit.set(iv.habitId, Math.max(targetByHabit.get(iv.habitId) || 0, t));
    }
  }

  // habitId → category name (first mapping wins, matches HabitKit's orderIndex)
  const catNameById = new Map(categories.map((c) => [c.id, c.name]));
  const habitCategory = new Map();
  for (const m of categoryMappings) {
    if (!habitCategory.has(m.habitId) && catNameById.has(m.categoryId)) {
      habitCategory.set(m.habitId, catNameById.get(m.categoryId));
    }
  }

  // Bucket completions by habit, summing amountOfCompletions per local day.
  // Rows with amountOfCompletions === 0 are HabitKit's "no, didn't do it" marker
  // and are intentionally dropped.
  const byHabit = new Map();
  for (const c of completions) {
    if (!c.habitId || !c.date) continue;
    const amt = Number.isFinite(c.amountOfCompletions) ? c.amountOfCompletions : 1;
    if (amt <= 0) continue;
    const dk = habitKitDateKey(c.date, c.timezoneOffsetInMinutes);
    if (!dk) continue;
    const map = byHabit.get(c.habitId) || {};
    map[dk] = (map[dk] || 0) + amt;
    byHabit.set(c.habitId, map);
  }

  const palette = ['#f97316','#22c55e','#38bdf8','#a855f7','#ec4899','#84cc16','#eab308','#14b8a6','#6366f1','#f43f5e'];
  const out = [];
  let paletteCursor = 0;

  // Stable order by HabitKit's orderIndex, then by name
  const ordered = [...habits].sort((a, b) => {
    const ai = Number.isFinite(a.orderIndex) ? a.orderIndex : 9999;
    const bi = Number.isFinite(b.orderIndex) ? b.orderIndex : 9999;
    if (ai !== bi) return ai - bi;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  for (const h of ordered) {
    const map = byHabit.get(h.id) || {};
    const dates = Object.keys(map);
    if (opts.skipEmpty && dates.length === 0) continue;

    const target = Math.max(1, targetByHabit.get(h.id) || 1);
    const entries = {};
    for (const dk of dates) {
      // HabitKit lets users tap multiple times per day for counted habits;
      // clamp to the target so streak math doesn't surprise the user.
      entries[dk] = Math.min(target, map[dk]);
    }
    const earliestTs = dates.length
      ? Math.min(...dates.map((k) => keyToDate(k).getTime()))
      : (h.createdAt ? Date.parse(h.createdAt) : Date.now());

    out.push({
      id: opts.idPrefix + Math.random().toString(36).slice(2, 9),
      name: h.name || 'Imported habit',
      icon: mapHabitKitIcon(h) || '🌱',
      color: mapHabitKitColor(h.color) || palette[paletteCursor++ % palette.length],
      category: mapHabitKitCategory(habitCategory.get(h.id)),
      target,
      targetUnit: target === 1 ? 'times' : 'count',
      schedule: [0,1,2,3,4,5,6],
      entries,
      createdAt: earliestTs,
      // Keep HabitKit's `archived` flag visible for the UI / user-side cleanup.
      ...(h.archived ? { archived: true } : {}),
    });
  }

  return out;
}

// Native MyHabits backups have habits[].entries as an object map.
// HabitKit / CSV imports don't.
function isNativeBackup(obj) {
  return obj && Array.isArray(obj.habits) && obj.habits.length > 0
    && typeof obj.habits[0].entries === 'object' && !Array.isArray(obj.habits[0].entries);
}

// ── CSV import ───────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('CSV is empty');

  const split = (line) => {
    const sep = line.indexOf(';') >= 0 && line.indexOf(',') < 0 ? ';' : ',';
    return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
  };

  const header = split(lines[0]);
  if (header.length < 2) throw new Error('CSV needs a date column and at least one habit column');

  const columns = header.slice(1).map((name) => ({ name, entries: {}, max: 0 }));
  let earliest = null, latest = null;

  const truthy = new Set(['yes','y','true','t','x','✓','done']);
  const falsy = new Set(['','no','n','false','f','-']);

  for (let i = 1; i < lines.length; i++) {
    const row = split(lines[i]);
    const dateRaw = row[0];
    if (!dateRaw) continue;
    let dk;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      dk = dateRaw;
    } else {
      const d = new Date(dateRaw);
      if (Number.isNaN(d.getTime())) continue;
      dk = dateKey(d);
    }
    if (!earliest || dk < earliest) earliest = dk;
    if (!latest || dk > latest) latest = dk;

    for (let c = 0; c < columns.length; c++) {
      const raw = (row[c + 1] || '').toLowerCase();
      let val = 0;
      if (truthy.has(raw)) val = 1;
      else if (falsy.has(raw)) val = 0;
      else {
        const n = Number(raw.replace(',', '.'));
        if (!Number.isNaN(n)) val = Math.max(0, Math.round(n));
      }
      if (val > 0) {
        columns[c].entries[dk] = val;
        if (val > columns[c].max) columns[c].max = val;
      }
    }
  }

  return { columns: columns.filter((c) => Object.keys(c.entries).length > 0), earliest, latest };
}

function mergeCsvImport(s, parsed) {
  const palette = ['#f97316','#22c55e','#38bdf8','#a855f7','#ec4899','#84cc16','#eab308','#14b8a6','#6366f1','#f43f5e'];
  const byName = new Map(s.habits.map((h) => [h.name.trim().toLowerCase(), h]));
  let habits = s.habits.map((h) => ({ ...h, entries: { ...h.entries } }));
  let colorCursor = habits.length;

  for (const col of parsed.columns) {
    const key = col.name.trim().toLowerCase();
    const existing = byName.get(key);
    const earliestTs = Math.min(...Object.keys(col.entries).map((k) => keyToDate(k).getTime()));

    if (existing) {
      const target = existing.target;
      const h = habits.find((x) => x.id === existing.id);
      for (const [dk, v] of Object.entries(col.entries)) {
        h.entries[dk] = Math.min(target, Math.max(h.entries[dk] || 0, v));
      }
      h.createdAt = Math.min(h.createdAt || Date.now(), earliestTs);
    } else {
      const target = Math.max(1, col.max);
      habits.push({
        id: 'h_' + Math.random().toString(36).slice(2, 9),
        name: col.name,
        icon: '🌱',
        color: palette[colorCursor++ % palette.length],
        category: 'Other',
        target,
        targetUnit: target === 1 ? 'times' : 'count',
        schedule: [0,1,2,3,4,5,6],
        entries: { ...col.entries },
        createdAt: earliestTs,
      });
    }
  }
  return { ...s, habits };
}

// ── dual export: browser globals + CommonJS for Node tests ───────────────────
const _exports = {
  COLORS, ICONS, CATEGORIES, WEEKDAYS,
  todayKey, dateKey, keyToDate, addDays, weekdayIndex,
  computeStreak, completionLevel, completionRatio, daysCompleted,
  parseCsv, mergeCsvImport,
  parseHabitKit, isNativeBackup, habitKitDateKey,
  mapHabitKitColor, mapHabitKitIcon, mapHabitKitCategory,
  HABITKIT_COLORS, HABITKIT_ICONS,
};
if (typeof window !== 'undefined') Object.assign(window, _exports);
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
