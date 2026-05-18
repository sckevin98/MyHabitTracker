# MyHabits Android wrapper

Native Android shell around the existing MyHabits PWA. Adds real home-screen
widgets that read the same habit data the web app produces.

## Architecture

- **WebView shell** (`MainActivity`) loads the PWA from
  `file:///android_asset/web/index.html`. The web files are copied into
  `app/src/main/assets/web/` at build time by the `prepareWebAssets` Gradle
  task, and the CDN `<script>` tags in `index.html` are rewritten to point at
  bundled vendor copies of React + Babel. The app runs fully offline.
- **JS bridge** (`HabitBridge`) exposes `MyHabitsBridge.saveState(json)` and
  `getState()` to the WebView. `store.jsx` calls these alongside its existing
  `localStorage` writes/reads — web behaviour is unchanged.
- **Widgets** read from `SharedPreferences("myhabits", state_v1)` (the same
  JSON the bridge writes) via `HabitStore`. Whenever the bridge receives a
  save it broadcasts `com.myhabits.app.REFRESH_WIDGETS`, which any installed
  widget receiver picks up and re-renders.

Implemented so far:
- `SingleHabitWidget` — 2×2 widget showing one habit's icon, name, today's
  status, and current streak. User picks the habit when adding the widget
  (`HabitPickerActivity` as the appwidget configure activity).

Planned (not yet built):
- Heatmap widget (4×2 / 4×4) — needs Canvas → Bitmap rendering since
  `RemoteViews` has no SVG/Canvas support.
- All-habits grid widget (4×4).
- Streaks row widget (4×1 / 4×2).

## Building

CI builds it automatically — see `.github/workflows/android.yml`. Every push
to `main` publishes a rolling `latest` pre-release with the debug APK.

To build locally on Windows (Android Studio + SDK already installed):

```powershell
cd android
gradle assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

You need Gradle on PATH or a wrapper. If you have Android Studio it ships a
Gradle distribution under `C:/Program Files/Android/Android Studio/plugins/gradle/`.
Easiest: open Android Studio once, point it at the `android/` folder, let it
generate a `gradlew.bat`, then use that.

## Installing on your phone

1. Open the GitHub Actions tab → latest successful run → download the
   `myhabits-debug-apk` artifact. Or grab `app-debug.apk` from the
   `latest` pre-release.
2. On your phone, open the downloaded `.apk`. Android will ask to allow
   "Install from unknown sources" the first time — grant it for the file
   manager / browser you used.
3. After install: **HabitKit import**. Open the app, Settings → Import data,
   pick your `habitkit_export.json`.
4. **Add a widget**: long-press an empty spot on the home screen → Widgets →
   scroll to MyHabits → drag "MyHabits — Single habit". The picker shows
   your habits — tap one.

## Updating

Just push to `main`. CI rebuilds, the `latest` release artifact is replaced,
download and install the new APK. Android keeps your data across reinstalls
of the same `applicationId` as long as you don't uninstall first.
