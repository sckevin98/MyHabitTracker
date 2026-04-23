# Deploy MyHabits as an installable Android web app

MyHabits is a static site, so "deploying" is just hosting the files over HTTPS.
With the added PWA manifest + service worker, Android Chrome will let users
install it to the home screen and run it offline.

## 1. Enable GitHub Pages (one-time, free)

1. Commit and push the new files:

   ```bash
   git add -A
   git commit -m "Add PWA manifest, service worker, and mobile layout"
   git push origin main
   ```

2. On GitHub, open the repository → **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source:** *Deploy from a branch*
   - **Branch:** `main` / `/ (root)`
   - Save.
4. Wait ~1 minute. GitHub shows the live URL at the top of the Pages tab.

Your URL will be:

```
https://sckevin98.github.io/MyHabitTracker/
```

GitHub Pages serves `index.html` automatically — the original
`MyHabits.html` still works as a direct link for desktop previewing.

## 2. Install on an Android phone

1. On the phone, open **Chrome** and go to the URL above.
2. Chrome shows an **"Install app"** prompt (or open the ⋮ menu →
   **Install app** / **Add to Home screen**).
3. The app appears on the home screen with the MyHabits icon and opens
   full-screen without browser chrome.
4. After the first load, all files are cached by the service worker,
   so the app works completely offline.

Data is stored in `localStorage` on the phone — it never leaves the device.

## 3. Generate a QR code

The simplest path (no extra tooling): paste your URL into any QR
generator such as <https://www.qr-code-generator.com/> or
<https://qrcode.tec-it.com/>. Print or share the resulting PNG.

If you prefer a local offline option, install Python and run:

```bash
pip install qrcode[pil]
python -c "import qrcode; qrcode.make('https://sckevin98.github.io/MyHabitTracker/').save('myhabits-qr.png')"
```

Scanning the QR with the phone camera opens the install URL in Chrome.

## 4. Updating the app later

1. Edit the `.jsx` / `.html` files as usual.
2. Bump `CACHE_VERSION` in `sw.js` (e.g. `v1` → `v2`) so phones pick up
   the new code on next launch. Otherwise the service worker keeps
   serving the cached version.
3. `git push`. GitHub Pages redeploys automatically.

## Notes / trade-offs

- This is a **home-screen PWA**, not a Play Store APK. For personal /
  private use it is functionally the same: icon, full-screen, offline.
- The app uses **Babel Standalone** to compile JSX in the browser.
  That means a ~2 MB first download; after that everything is cached
  and startup is fast. If you later want to trim startup time, a small
  Vite build step would pre-compile the JSX to a single JS bundle —
  not required for it to work.
- HTTPS is required for PWA install and service workers. GitHub Pages
  provides HTTPS automatically; do not use plain `http://` hosts.
