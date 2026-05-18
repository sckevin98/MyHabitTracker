const { test } = require('node:test');
const assert = require('node:assert/strict');
const lib = require('../lib.js');

test('parseCsv reads numeric counts', () => {
  const csv = [
    'Date,Gym,Water',
    '2025-01-01,1,8',
    '2025-01-02,0,6',
    '2025-01-03,1,7',
  ].join('\n');
  const r = lib.parseCsv(csv);
  assert.equal(r.columns.length, 2);
  assert.equal(r.earliest, '2025-01-01');
  assert.equal(r.latest, '2025-01-03');
  const gym = r.columns.find((c) => c.name === 'Gym');
  assert.deepEqual(gym.entries, { '2025-01-01': 1, '2025-01-03': 1 });
  const water = r.columns.find((c) => c.name === 'Water');
  assert.equal(water.entries['2025-01-02'], 6);
  assert.equal(water.max, 8);
});

test('parseCsv accepts yes/no/x/true/false aliases', () => {
  const csv = [
    'Date,Read',
    '2025-01-01,yes',
    '2025-01-02,no',
    '2025-01-03,x',
    '2025-01-04,true',
    '2025-01-05,false',
  ].join('\n');
  const r = lib.parseCsv(csv);
  const col = r.columns[0];
  assert.deepEqual(Object.keys(col.entries).sort(), ['2025-01-01','2025-01-03','2025-01-04']);
});

test('parseCsv handles semicolon separator (DE Excel)', () => {
  const csv = 'Date;Gym;Water\n2025-01-01;1;8\n';
  const r = lib.parseCsv(csv);
  assert.equal(r.columns.length, 2);
  assert.equal(r.columns[0].entries['2025-01-01'], 1);
});

test('parseCsv drops empty columns and empty rows', () => {
  const csv = 'Date,A,B\n2025-01-01,,1\n2025-01-02,,0\n';
  const r = lib.parseCsv(csv);
  assert.equal(r.columns.length, 1);
  assert.equal(r.columns[0].name, 'B');
});

test('parseCsv rejects empty / malformed input', () => {
  assert.throws(() => lib.parseCsv(''));
  assert.throws(() => lib.parseCsv('Date\n2025-01-01\n'));
});

test('mergeCsvImport merges into existing habits by name, case-insensitive', () => {
  const state = {
    habits: [
      { id: 'h_old', name: 'Gym', icon: '🏋️', color: '#fff', category: 'Fitness',
        target: 1, schedule: [0,1,2,3,4,5,6], entries: { '2025-12-01': 1 }, createdAt: Date.parse('2025-12-01') },
    ],
  };
  const parsed = lib.parseCsv('Date,gym,Reading\n2025-01-01,1,30\n2025-01-02,1,20\n');
  const next = lib.mergeCsvImport(state, parsed);
  const gym = next.habits.find((h) => h.name === 'Gym');
  // existing entries kept + new ones merged
  assert.equal(gym.entries['2025-12-01'], 1);
  assert.equal(gym.entries['2025-01-01'], 1);
  // createdAt rewound
  assert.equal(gym.createdAt, lib.keyToDate('2025-01-01').getTime());
  // unmatched column creates new habit with target = max
  const reading = next.habits.find((h) => h.name === 'Reading');
  assert.ok(reading);
  assert.equal(reading.target, 30);
  assert.equal(reading.entries['2025-01-01'], 30);
});
