# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

MyHabits is a static, single-page habit-tracker PWA. There is **no build step** — the repo is a flat set of `.jsx` / `.html` / `.js` / `sw.js` files served as-is. JSX is compiled in the browser by Babel Standalone (loaded via `unpkg.com`). Plain JS (`lib.js`) is loaded directly. All data lives in `localStorage` on the device.

## Running and testing it

- Local preview: open `index.html` in a browser, or serve the directory over HTTP (`python -m http.server 8000` works). PWA install + service-worker registration require HTTPS, so they only fully exercise on GitHub Pages — not from `file://` or plain `http://`.
- `MyHabits.html` is a stripped-down desktop-preview variant without PWA/service-worker tags. `index.html` is the production entrypoint that GitHub Pages serves.
- Deploy is just `git push` to `main`; see `DEPLOY.md`.

### Tests

`package.json` has zero dependencies. Tests run via Node's built-in test runner:

```
npm test       # runs tests/*.test.js
npm run check  # node --check lib.js + require() smoke test
```

Tests cover the pure helpers in `lib.js` only — anything React/DOM is not unit-tested. The HabitKit import test loads `habitkit_export.json` from the repo root as a fixture; that file is gitignored (it contains real personal data) and the test is auto-skipped when it's absent. Drop a real export into the repo root to exercise that path.

## Architecture

### Script loading model (the most important thing to know)

There is no module bundler. Files are loaded as separate `<script>` tags from `index.html` in a fixed order, and **everything shares one global scope**. Cross-file sharing is done either by relying on top-level `function`/`const` declarations being globally visible, or by explicit attachment to `window`.

Load order in `index.html`:
1. `lib.js` (plain JS, no JSX) — pure helpers + parsers, loaded first.
2. `.jsx` files in order: `android-frame.jsx` → `store.jsx` → `ui.jsx` → `today.jsx` → `habit-editor.jsx` → `habit-detail.jsx` → `stats-settings.jsx` → `app.jsx`.

`app.jsx` is the entrypoint that calls `ReactDOM.createRoot(...).render(<App/>)`.

When you add a new `.jsx` (or `.js`) file you must:
1. Add a script tag in `index.html` (and `MyHabits.html` if you want it to work there too) in the right position.
2. Add the path to `APP_SHELL` in `sw.js`.
3. Bump `CACHE_VERSION` in `sw.js`.

### lib.js vs store.jsx — the testability split

`lib.js` holds every helper that doesn't touch React or localStorage: date math, derived stats (`computeStreak`, `completionLevel`, etc.), `parseCsv` + `mergeCsvImport`, `parseHabitKit` + its color/icon/category maps, `isNativeBackup`. The file ends with a dual-export shim:

```js
if (typeof window !== 'undefined') Object.assign(window, _exports);
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
```

That lets the browser keep using globals while Node tests `require('../lib.js')`. **Put new pure logic in `lib.js`**, not in `store.jsx`, so it can be unit-tested. `store.jsx` is React-only: provider, hooks, state mutations, and the `importJson`/`importCsv`/`exportJson` thin wrappers that call into `lib.js`.

`tweaks-panel.jsx` is a generic reusable helper not currently wired into the app's script tags; it's only present in the service-worker cache list.

### State

`store.jsx` defines a React context (`StoreProvider` / `useStore`) that wraps the whole app in `app.jsx`. State shape:

```
{ habits: [{ id, name, icon, color, category, target, targetUnit, schedule, entries: {YYYY-MM-DD: count}, createdAt }],
  settings: { accent, weekStart } }
```

- Persisted to `localStorage` under the key `myhabits.v1` on every state change.
- First-run users get an empty state. Old builds shipped demo habits with fixed IDs; `loadState()` strips those on load (see `LEGACY_SEED_HABIT_IDS`). User-created habits use `h_`-prefixed IDs and are never touched.
- Derived helpers (`computeStreak`, `completionLevel`, `completionRatio`, `daysCompleted`) are pure functions exported via `window` so any screen can import them.

### UI structure

`app.jsx` owns tab state (`today` / `stats` / `settings`) and modal state. Modals are full-screen slide-up overlays for `newHabit` / `editHabit` / `detail`. On desktop the app is wrapped in a fake `AndroidDevice` frame (`android-frame.jsx`); on phones / installed PWAs (`useIsPhoneViewport`) it fills the screen. Detection uses `display-mode: standalone/fullscreen` media queries plus `max-width: 500px`.

Screens roughly map 1:1 to files: `today.jsx`, `stats-settings.jsx` (Stats + Settings), `habit-detail.jsx`, `habit-editor.jsx`. Shared primitives (icons, heatmap, buttons) live in `ui.jsx`. Home-screen widgets are a separate concept implemented natively under `android/` — there is no in-app widget designer.

### Date model

Dates are stored as `YYYY-MM-DD` strings keyed in `habit.entries`. The week is Mon=0..Sun=6 (`weekdayIndex`). A habit's `schedule` is an array of those weekday indices — streaks only count "scheduled" days, so an unscheduled day doesn't break a streak.

## Service worker — must update when files change

`sw.js` is cache-first for the app shell + a small CDN allowlist (`unpkg.com`, Google Fonts). Two things matter when you change anything:

1. **Bump `CACHE_VERSION`** (e.g. `v3` → `v4`). Without this, installed clients keep serving the previous cached bundle and won't see your change until they manually clear storage.
2. **Keep `APP_SHELL` in sync** with the actual files referenced by `index.html`. A missing file in `APP_SHELL` won't pre-cache on install, and an entry pointing to a deleted file will fail `cache.addAll(...)` and break the install step.

## Deployment

GitHub Pages serves `main` at `https://sckevin98.github.io/MyHabitTracker/`. `git push` is the entire deploy. After pushing, users only pick up changes when the new `CACHE_VERSION` activates a new service worker — that's why the cache bump matters.
