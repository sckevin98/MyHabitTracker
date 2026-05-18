const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const lib = require('../lib.js');

const FIXTURE = path.join(__dirname, '..', 'habitkit_export.json');
const hasFixture = fs.existsSync(FIXTURE);

test('habitKitDateKey shifts UTC + offset to local YYYY-MM-DD', () => {
  // "2025-06-15T22:00:00.000Z" with offset +120 minutes (CEST) → 2025-06-16 local
  assert.equal(lib.habitKitDateKey('2025-06-15T22:00:00.000Z', 120), '2025-06-16');
  // Same UTC, offset 0 → 2025-06-15
  assert.equal(lib.habitKitDateKey('2025-06-15T22:00:00.000Z', 0), '2025-06-15');
  // Negative offset (e.g. US East -240) at noon UTC → previous day if before 4 a.m. local
  assert.equal(lib.habitKitDateKey('2025-06-16T02:00:00.000Z', -240), '2025-06-15');
});

test('mapHabitKitColor knows Tailwind tokens and falls back to null', () => {
  assert.equal(lib.mapHabitKitColor('emerald'), '#10b981');
  assert.equal(lib.mapHabitKitColor('Indigo'), '#6366f1');
  assert.equal(lib.mapHabitKitColor('#abcdef'), '#abcdef');
  assert.equal(lib.mapHabitKitColor('mauve'), null);
  assert.equal(lib.mapHabitKitColor(undefined), null);
});

test('mapHabitKitIcon prefers emoji, then known Lucide names, else null', () => {
  assert.equal(lib.mapHabitKitIcon({ emoji: '🔥', icon: 'activity' }), '🔥');
  assert.equal(lib.mapHabitKitIcon({ icon: 'dumbbell' }), '🏋️');
  assert.equal(lib.mapHabitKitIcon({ icon: 'something-weird' }), null);
});

test('mapHabitKitCategory normalizes to MyHabits enum', () => {
  assert.equal(lib.mapHabitKitCategory('Fitness'), 'Fitness');
  assert.equal(lib.mapHabitKitCategory('studium'), 'Mind');
  assert.equal(lib.mapHabitKitCategory('Gesundheit'), 'Health');
  assert.equal(lib.mapHabitKitCategory('Unknown'), 'Other');
  assert.equal(lib.mapHabitKitCategory(null), 'Other');
});

test('parseHabitKit drops amountOfCompletions=0 marker rows', () => {
  const obj = {
    habits: [{ id: 'a', name: 'Test', orderIndex: 0 }],
    completions: [
      { habitId: 'a', date: '2025-06-15T22:00:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 1 },
      { habitId: 'a', date: '2025-06-16T22:00:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 0 },
    ],
    intervals: [],
    categories: [],
    categoryMappings: [],
  };
  const habits = lib.parseHabitKit(obj);
  assert.equal(habits.length, 1);
  assert.deepEqual(Object.keys(habits[0].entries), ['2025-06-16']);
});

test('parseHabitKit pulls target from intervals.requiredNumberOfCompletionsPerDay', () => {
  const obj = {
    habits: [{ id: 'a', name: 'Water', orderIndex: 0 }],
    completions: [
      { habitId: 'a', date: '2025-06-15T22:00:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 1 },
      { habitId: 'a', date: '2025-06-15T22:30:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 1 },
    ],
    intervals: [{ habitId: 'a', requiredNumberOfCompletionsPerDay: 4 }],
  };
  const [h] = lib.parseHabitKit(obj);
  assert.equal(h.target, 4);
  // both completions sum to 2 (same local day after offset shift)
  assert.equal(h.entries['2025-06-16'], 2);
});

test('parseHabitKit resolves categories through categoryMappings', () => {
  const obj = {
    habits: [{ id: 'a', name: 'Gym', orderIndex: 0 }],
    completions: [{ habitId: 'a', date: '2025-06-15T22:00:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 1 }],
    intervals: [],
    categories: [{ id: 'c1', name: 'Fitness' }],
    categoryMappings: [{ habitId: 'a', categoryId: 'c1' }],
  };
  const [h] = lib.parseHabitKit(obj);
  assert.equal(h.category, 'Fitness');
});

test('parseHabitKit skips empty habits by default', () => {
  const obj = {
    habits: [
      { id: 'a', name: 'Active', orderIndex: 0 },
      { id: 'b', name: 'Empty',  orderIndex: 1 },
    ],
    completions: [
      { habitId: 'a', date: '2025-06-15T22:00:00.000Z', timezoneOffsetInMinutes: 120, amountOfCompletions: 1 },
    ],
    intervals: [],
  };
  const out = lib.parseHabitKit(obj);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Active');
});

test('parseHabitKit rejects garbage input', () => {
  assert.throws(() => lib.parseHabitKit({}));
  assert.throws(() => lib.parseHabitKit({ habits: [] }));
  assert.throws(() => lib.parseHabitKit({ habits: [{}] }));
});

test('isNativeBackup distinguishes our backup from HabitKit', () => {
  assert.equal(lib.isNativeBackup({ habits: [{ entries: {} }] }), true);
  assert.equal(lib.isNativeBackup({ habits: [{ id: 'a' }], completions: [] }), false);
  assert.equal(lib.isNativeBackup({}), false);
});

test('real HabitKit fixture imports the expected habits and entries', { skip: !hasFixture }, () => {
  const obj = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const habits = lib.parseHabitKit(obj);

  // 2 of the 10 raw habits have 0 completions and should be skipped
  // ("Gym" archived dupe, "Lernen 2"). The other 8 are kept including the
  // archived "Gym" (2 entries) and archived "Lernen" (1 entry) duplicates.
  assert.equal(habits.length, 8);

  // Each kept habit has at least one entry.
  for (const h of habits) {
    assert.ok(Object.keys(h.entries).length > 0, `${h.name} has no entries`);
  }

  // 555 completions total, but 23 are amount=0 markers → 532 effective entries.
  const totalEntries = habits.reduce((n, h) => n + Object.keys(h.entries).length, 0);
  // Some completions land on the same local day (after offset shift) and dedupe,
  // so the count is at most 532 — assert a reasonable lower bound.
  assert.ok(totalEntries >= 500 && totalEntries <= 532, `unexpected entry total: ${totalEntries}`);

  // Color tokens get mapped to hex
  const lernen = habits.find((h) => h.name === 'Lernen' && Object.keys(h.entries).length > 100);
  assert.ok(lernen, 'expected active Lernen habit');
  assert.equal(lernen.color, '#ef4444'); // red
  assert.equal(lernen.icon, '🎓');       // graduation
  assert.equal(lernen.category, 'Mind'); // mapped from Studium via categoryMappings

  // Earliest local entry should be 2025-06-15 (UTC 22:00 + CEST offset → 2025-06-16);
  // the earliest UTC string in the fixture is 2025-06-14T22:00 → 2025-06-15 local.
  const allDates = habits.flatMap((h) => Object.keys(h.entries));
  const earliest = allDates.reduce((a, b) => a < b ? a : b);
  assert.equal(earliest, '2025-06-15');

  // No future-shifted dates (would indicate timezone bugs)
  const latest = allDates.reduce((a, b) => a > b ? a : b);
  assert.ok(latest <= '2026-05-16', `latest entry suspiciously far in future: ${latest}`);
});
