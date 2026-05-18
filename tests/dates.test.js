const { test } = require('node:test');
const assert = require('node:assert/strict');
const lib = require('../lib.js');

test('dateKey formats a Date as YYYY-MM-DD in local time', () => {
  assert.equal(lib.dateKey(new Date(2025, 0, 5)), '2025-01-05');
  assert.equal(lib.dateKey(new Date(2026, 11, 31)), '2026-12-31');
});

test('keyToDate ↔ dateKey roundtrip', () => {
  const d = lib.keyToDate('2025-06-15');
  assert.equal(lib.dateKey(d), '2025-06-15');
});

test('addDays handles month + year boundaries', () => {
  assert.equal(lib.dateKey(lib.addDays(new Date(2025, 0, 31), 1)), '2025-02-01');
  assert.equal(lib.dateKey(lib.addDays(new Date(2025, 11, 31), 1)), '2026-01-01');
  assert.equal(lib.dateKey(lib.addDays(new Date(2025, 0, 1), -1)), '2024-12-31');
});

test('weekdayIndex returns Mon=0..Sun=6', () => {
  // 2025-06-16 was a Monday
  assert.equal(lib.weekdayIndex(new Date(2025, 5, 16)), 0);
  // 2025-06-22 was a Sunday
  assert.equal(lib.weekdayIndex(new Date(2025, 5, 22)), 6);
});

test('computeStreak counts back from today including yesterday when today not done', () => {
  const habit = {
    target: 1,
    schedule: [0,1,2,3,4,5,6],
    entries: {
      '2026-05-15': 1,
      '2026-05-16': 1,
      '2026-05-17': 1,
      // 2026-05-18 missing
    },
  };
  const now = new Date(2026, 4, 18, 10, 0, 0);
  assert.equal(lib.computeStreak(habit, now), 3);
});

test('computeStreak skips unscheduled days (no break)', () => {
  const habit = {
    target: 1,
    schedule: [0, 1, 2, 3, 4], // weekdays only
    entries: {
      '2026-05-15': 1, // Fri
      // Sat/Sun not scheduled, ignored
      '2026-05-18': 1, // Mon
    },
  };
  const now = new Date(2026, 4, 18, 12, 0, 0);
  assert.equal(lib.computeStreak(habit, now), 2);
});

test('completionLevel buckets correctly', () => {
  const h = { target: 4, entries: { '2026-05-01': 0, '2026-05-02': 1, '2026-05-03': 2, '2026-05-04': 3, '2026-05-05': 4 } };
  assert.equal(lib.completionLevel(h, '2026-05-01'), 0);
  assert.equal(lib.completionLevel(h, '2026-05-02'), 1);
  assert.equal(lib.completionLevel(h, '2026-05-03'), 2);
  assert.equal(lib.completionLevel(h, '2026-05-04'), 3);
  assert.equal(lib.completionLevel(h, '2026-05-05'), 4);
});
