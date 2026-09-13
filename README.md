# 🌸 Our Memories — For Roshani

A photo + video scrapbook with a built-in music player, made with love. Everything is saved directly to this GitHub repo, so it works the same from any device. ♡

## ✦ Features

- **Separate Photo and Video galleries**, each with search + a lightbox viewer
- **Music tab** — upload mp3s and they join a shared playlist with a mini player
- **GitHub-powered storage** — one shared repo, so the gallery looks the same on every device, no local-only data
- **Fast loading everywhere** — reads a small `manifest.json` from GitHub's CDN instead of listing folders one-by-one, which avoids GitHub's 60-requests/hour limit for anonymous visitors

## 🚀 Setup

1. Upload every file in this folder to a GitHub repository.
2. **Repo must be set to Public** (Settings → Danger Zone → Change visibility). This is the #1 cause of "photos won't load on other devices" — viewing the gallery doesn't use a token, so a private repo only ever works on the one device that has a token saved.
3. Open `script.js` and check the top of the file:
   - `REPO` — set to `yourusername/your-repo-name`
   - `PASSWORD` — the secret word for the gallery lock screen
4. Enable **GitHub Pages** (Settings → Pages → `main` branch → `/root`). Your site goes live at `https://yourusername.github.io/repo-name`.
5. To upload memories, you need a **GitHub Personal Access Token** (classic, `repo` scope) from [github.com/settings/tokens/new](https://github.com/settings/tokens/new) — paste it once under "Add Memory" and it's remembered on that device.

## 📁 Where things live in the repo

```
photo-memories/manifest.json   ← photo gallery data
photo-memories/...             ← the actual photo files
video-memories/manifest.json   ← video gallery data
video-memories/...             ← the actual video files
music/manifest.json            ← playlist data
music/...                      ← the actual mp3 files
```

If you had memories uploaded before Photos/Videos were split into separate folders, use the **"One-time sync"** link under "Add Memory" once — it moves the old `memories/` entries into the two new galleries without touching the original files.

## 🔑 Gallery password

Set in `script.js`:

```js
const PASSWORD = 'roshanisarthakforever';
```

Change it to whatever you like. Note this is a front-end-only gate, not real security — the repo has to be public for the site to work, so the raw files are technically reachable by anyone with the exact URL, even without the password. Fine for a casual gift site, just don't upload anything you'd consider truly sensitive.

---

*Made with love 🌸*
