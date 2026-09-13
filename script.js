/* ═══════════════════════════════════════════
   ROSHANI'S MEMORIES — script.js
   ═══════════════════════════════════════════ */

const SETTINGS_KEY  = 'roshani_memories_settings';
const GALLERY_AUTH  = 'roshani_gallery_unlocked';
const PASSWORD      = 'roshanisarthakforever'; // change this to whatever secret word you like

// The repo everyone's gallery reads from, regardless of device/browser.
// ⚠️ Set this to your real repo, exactly as it appears on GitHub.
const REPO = 'Sarthak-r-1209/ROSHU';
const MEDIA_FOLDER = 'memories';
const MANIFEST_PATH = 'memories/manifest.json';
const MUSIC_FOLDER = 'music';
const MUSIC_MANIFEST_PATH = 'music/manifest.json';
const MAX_FILE_SIZE_MB = 45; // GitHub's Contents API + browser memory get unreliable past this

// Reliable UTF-8 <-> base64 helpers (handles emoji/hearts correctly, unlike the
// deprecated escape()/unescape() trick, which could silently corrupt manifest.json).
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes  = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ═══════════════════════════════════════════
// CANVAS — floating hearts, stars, flowers
// ═══════════════════════════════════════════
const canvas = document.getElementById('floatCanvas');
const ctx    = canvas.getContext('2d');

const SYMBOLS = ['♡','♥','✦','✿','❀','·','˚','*'];
const COLORS  = ['#f48fb1','#e91e8c','#fce4ec','#f9c6d8','#f5c842','#ffb3d1','#ff80ab','#ffd6e7'];
const COUNT   = 50;
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
function makePart(yStart) {
  return {
    x:      Math.random() * canvas.width,
    y:      yStart ?? canvas.height + Math.random() * 80,
    sym:    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    col:    COLORS[Math.floor(Math.random() * COLORS.length)],
    size:   9 + Math.random() * 15,
    vy:     0.3 + Math.random() * 0.6,
    vx:     (Math.random() - 0.5) * 0.45,
    op:     0.2 + Math.random() * 0.5,
    wob:    Math.random() * Math.PI * 2,
    wobSpd: 0.012 + Math.random() * 0.016,
    rot:    Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * 0.014,
  };
}
function initParticles() {
  particles = Array.from({ length: COUNT }, () => {
    const p = makePart(); p.y = Math.random() * canvas.height; return p;
  });
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.y   -= p.vy;
    p.x   += p.vx + Math.sin(p.wob) * 0.35;
    p.wob += p.wobSpd;
    p.rot += p.rotSpd;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha  = p.op;
    ctx.fillStyle    = p.col;
    ctx.font         = `${p.size}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.sym, 0, 0);
    ctx.restore();
    if (p.y < -40) Object.assign(p, makePart(canvas.height + 10));
  }
  requestAnimationFrame(animate);
}
resizeCanvas();
initParticles();
animate();
window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════
// INTRO → MAIN
// ═══════════════════════════════════════════
function showMain() {
  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('active');
  loadSavedSettings();
  // Always require the password on every visit/reload — no auto-unlock.
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function showView(view) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(view + 'View').classList.remove('hidden');
  document.getElementById(view + 'View').classList.add('active');
  document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');
  if (view === 'music') initMusicView();
}

// ═══════════════════════════════════════════
// GALLERY PASSWORD
// ═══════════════════════════════════════════
function unlockGallery() {
  const input = document.getElementById('galleryPwInput').value.trim().toLowerCase();
  if (input === PASSWORD) {
    sessionStorage.setItem(GALLERY_AUTH, 'true');
    // Animate lock card out
    const lockEl = document.getElementById('galleryLock');
    lockEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    lockEl.style.opacity    = '0';
    lockEl.style.transform  = 'scale(0.95)';
    setTimeout(() => {
      lockEl.style.display = 'none';
      revealGallery();
    }, 400);
  } else {
    const inp = document.getElementById('galleryPwInput');
    const err = document.getElementById('galleryPwError');
    inp.classList.add('shake');
    err.classList.remove('hidden');
    inp.value = '';
    setTimeout(() => inp.classList.remove('shake'), 400);
  }
}

function revealGallery() {
  const content = document.getElementById('galleryContent');
  content.classList.remove('hidden');
  content.style.opacity   = '0';
  content.style.transform = 'translateY(12px)';
  content.style.transition= 'opacity 0.5s ease, transform 0.5s ease';
  requestAnimationFrame(() => {
    content.style.opacity   = '1';
    content.style.transform = 'translateY(0)';
  });
  loadMemories();
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function loadSavedSettings() {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (s.token) document.getElementById('ghToken').value = s.token;
  // Repo is fixed for everyone — always show it, ignore whatever was saved before.
  document.getElementById('ghRepo').value = REPO;
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    token: document.getElementById('ghToken').value.trim(),
    repo:  REPO,
  }));
}

// ═══════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════
let pendingFiles = [];

function handleFiles(files) {
  pendingFiles = [...files];
  const strip = document.getElementById('previewStrip');
  strip.innerHTML = '';
  pendingFiles.forEach(file => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const el = document.createElement(isVideo ? 'video' : 'img');
    el.className = 'preview-thumb';
    el.src = url;
    if (isVideo) { el.muted = true; el.setAttribute('preload', 'metadata'); }
    strip.appendChild(el);
  });
}

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

// ═══════════════════════════════════════════
// GITHUB UPLOAD
// ═══════════════════════════════════════════
// Cleans up common ways people paste the repo field wrong:
// "https://github.com/user/repo", "github.com/user/repo/", "user/repo.git", etc.
function sanitizeRepo(raw) {
  let r = raw.trim();
  r = r.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  r = r.replace(/\.git$/i, '');
  r = r.replace(/^\/+|\/+$/g, '');
  return r;
}

// Pre-flight check so we can tell the user EXACTLY what's wrong
// instead of a generic "Not Found".
async function verifyRepoAccess(repo, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Authorization: `token ${token}` },
  });
  if (res.status === 404) {
    throw new Error(
      `Repository "${repo}" not found with this token. This almost always means either: ` +
      `(1) the repo name is misspelled/wrong case, or ` +
      `(2) you're using a "Fine-grained" GitHub token that hasn't been given access to this repo ` +
      `(fine-grained tokens return 404 instead of 403 when access is missing — check ` +
      `Settings → Developer settings → Fine-grained tokens → your token → Repository access). ` +
      `Easiest fix: create a CLASSIC token instead at github.com/settings/tokens/new with the "repo" scope checked.`
    );
  }
  if (res.status === 401) {
    throw new Error('GitHub rejected the token itself (401 Unauthorized). Double-check you copied the whole token, and that it hasn\'t expired or been revoked.');
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`GitHub error ${res.status}: ${e.message || 'could not access repository'}`);
  }
  const info = await res.json();
  if (info.permissions && info.permissions.push === false) {
    throw new Error(`Your token can read "${repo}" but doesn't have write/push access, so uploads will fail. Make sure the token has the "repo" scope (classic) or "Contents: Read and write" (fine-grained).`);
  }
}

async function uploadToGitHub() {
  const token   = document.getElementById('ghToken').value.trim();
  const repo    = REPO; // fixed — everyone uploads to the same place
  const caption = document.getElementById('memCaption').value.trim();
  const date    = document.getElementById('memDate').value;

  if (!token) { setStatus('Please enter your GitHub token.', 'error'); return; }
  if (!pendingFiles.length) { setStatus('Please select at least one photo.', 'error'); return; }

  saveSettings();
  setStatus('Checking repo access... ♡', 'loading');
  document.getElementById('uploadBtn').disabled = true;

  try {
    await verifyRepoAccess(repo, token);
  } catch (err) {
    setStatus(`❌ ${err.message}`, 'error');
    document.getElementById('uploadBtn').disabled = false;
    return;
  }

  setStatus('Uploading... please wait ♡', 'loading');

  const uploaded = [];
  for (const file of pendingFiles) {
    try {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — please keep files under ${MAX_FILE_SIZE_MB}MB (try compressing the video first).`);
      }
      const base64  = await toBase64(file);
      const ts      = Date.now();
      const safe    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path    = `${MEDIA_FOLDER}/${ts}_${safe}`;
      const res     = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method:  'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: `Add memory: ${caption || safe} ♡`, content: base64 }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`(${res.status}) ${e.message || 'Upload failed'}`);
      }
      const data = await res.json();
      uploaded.push({
        id:        ts + '_' + Math.random().toString(36).slice(2),
        type:      file.type.startsWith('video/') ? 'video' : 'photo',
        caption:   caption || safe,
        date:      date || new Date().toISOString().split('T')[0],
        url:       data.content.download_url,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
      });
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`, 'error');
      document.getElementById('uploadBtn').disabled = false;
      return;
    }
  }

  setStatus(`✓ ${uploaded.length} item${uploaded.length > 1 ? 's' : ''} saved! Updating gallery list... ♡`, 'loading');
  try {
    await appendManyToManifest(MANIFEST_PATH, uploaded, token);
  } catch (err) {
    console.error('Manifest update failed:', err);
    // Photos/videos are already safely uploaded even if this step fails — not fatal.
  }

  setStatus(`✓ ${uploaded.length} item${uploaded.length > 1 ? 's' : ''} saved! ♡`, 'success');
  document.getElementById('uploadBtn').disabled = false;
  pendingFiles = [];
  document.getElementById('previewStrip').innerHTML = '';
  document.getElementById('memCaption').value = '';
  document.getElementById('memDate').value    = '';
  setTimeout(() => { loadMemories(); showView('gallery'); setStatus(''); }, 2000);
}

// Fetches a manifest.json via GitHub's raw CDN, which is NOT subject to the
// tight 60-requests/hour limit the api.github.com listing endpoint has — this
// is what makes the gallery/playlist load fast and reliably on any device.
async function fetchManifest(path) {
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${branch}/${path}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error(`Manifest fetch failed on branch ${branch}:`, err);
    }
  }
  return null;
}

// Fetches the current manifest.json at `path` (if any), appends new entries, and saves it back.
async function appendManyToManifest(path, newEntries, token) {
  const headers = { Authorization: `token ${token}` };
  let sha = null;
  let manifest = [];

  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    try {
      manifest = JSON.parse(base64ToUtf8(data.content));
      if (!Array.isArray(manifest)) manifest = [];
    } catch (err) {
      // IMPORTANT: never silently discard an unparseable manifest — that would
      // wipe out everyone's existing photos/videos/songs. Fail loudly instead.
      throw new Error(`Existing manifest at "${path}" couldn't be read (it may be corrupted) — nothing was overwritten. Details: ${err.message}`);
    }
  } else if (getRes.status !== 404) {
    throw new Error(`Couldn't read existing manifest (${getRes.status})`);
  }

  manifest.push(...newEntries);

  const body = {
    message: 'Update manifest ♡',
    content: utf8ToBase64(JSON.stringify(manifest, null, 2)),
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method:  'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!putRes.ok) {
    const e = await putRes.json().catch(() => ({}));
    throw new Error(e.message || 'Failed to save manifest');
  }
}

// One-time helper: builds manifest.json from whatever's already in memories/,
// for photos uploaded before this manifest system existed. Run once from a
// device that has a token saved, then every device is fixed going forward.
async function syncManifestFromGitHub() {
  const token = document.getElementById('ghToken').value.trim();
  if (!token) { setStatus('Enter your GitHub token first to sync.', 'error'); return; }

  setStatus('Syncing existing photos into the manifest... ♡', 'loading');
  try {
    const headers = { Authorization: `token ${token}` };
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/memories`, { headers });
    if (!res.ok) throw new Error(`(${res.status}) Couldn't list existing photos`);
    const files = await res.json();

    const manifest = files
      .filter(f => /\.(jpe?g|png|gif|webp|mp4|webm|mov|m4v)$/i.test(f.name))
      .map(f => {
        const nameNoExt = f.name.replace(/\.[^.]+$/, '');
        const parts     = nameNoExt.split('_');
        const rawName   = parts.slice(1).join(' ').replace(/_/g, ' ') || 'A sweet memory';
        const isVideo   = /\.(mp4|webm|mov|m4v)$/i.test(f.name);
        return { id: f.sha, type: isVideo ? 'video' : 'photo', caption: rawName, date: '', url: f.download_url };
      });

    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${MANIFEST_PATH}`, { headers });
    if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }

    const body = {
      message: 'Sync memories manifest ♡',
      content: utf8ToBase64(JSON.stringify(manifest, null, 2)),
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${MANIFEST_PATH}`, {
      method:  'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!putRes.ok) {
      const e = await putRes.json().catch(() => ({}));
      throw new Error(e.message || 'Failed to save manifest');
    }

    setStatus(`✓ Synced ${manifest.length} photo(s) — gallery will now load fast everywhere ♡`, 'success');
    setTimeout(() => { loadMemories(); setStatus(''); }, 2000);
  } catch (err) {
    setStatus(`❌ ${err.message}`, 'error');
  }
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function setStatus(msg, type = '') {
  const el = document.getElementById('uploadStatus');
  el.textContent = msg;
  el.className   = 'upload-status' + (type ? ' status-' + type : '');
}

// ═══════════════════════════════════════════
// GALLERY — loads from GitHub (synced for both)
// ═══════════════════════════════════════════
let allMemories = [];

async function loadMemories() {
  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = `
    <div class="loading-state">
      <img src="cat_wave.gif" alt="" style="width:75px;mix-blend-mode:multiply;" />
      <p style="font-family:'Pixelify Sans',monospace;color:#9c4473;margin-top:0.5rem;font-size:0.88rem;">loading memories... ♡</p>
    </div>`;
  empty.classList.add('hidden');

  // FAST PATH: read manifest.json via GitHub's raw CDN (works reliably on any device).
  const manifest = await fetchManifest(MANIFEST_PATH);
  if (manifest) {
    allMemories = manifest.slice().reverse();
    renderGallery(allMemories);
    return;
  }

  // FALLBACK: list the memories/ folder directly via the GitHub API. Used only
  // if manifest.json doesn't exist yet (e.g. before the first sync/upload).
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const token = saved.token || '';

  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/memories`, { headers });

    if (res.status === 404) { renderGallery([]); return; }
    if (res.status === 403) {
      renderGallery([]);
      const sub = document.querySelector('#emptyState .empty-sub');
      if (sub) sub.textContent = "GitHub rate limit reached — try again shortly, or upload once to auto-fix this.";
      return;
    }
    if (!res.ok) throw new Error('GitHub fetch failed');

    const files = await res.json();
    allMemories = files
      .filter(f => /\.(jpe?g|png|gif|webp|mp4|webm|mov|m4v)$/i.test(f.name))
      .map(f => {
        const nameNoExt = f.name.replace(/\.[^.]+$/, '');
        const parts     = nameNoExt.split('_');
        const rawName   = parts.slice(1).join(' ').replace(/_/g, ' ') || 'A sweet memory';
        const isVideo   = /\.(mp4|webm|mov|m4v)$/i.test(f.name);
        return { id: f.sha, type: isVideo ? 'video' : 'photo', caption: rawName, date: '', url: f.download_url };
      })
      .reverse();

    renderGallery(allMemories);
  } catch (err) {
    console.error(err);
    renderGallery([]);
  }
}

function renderGallery(memories) {
  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (!memories.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  memories.forEach((mem, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card' + (mem.type === 'video' ? ' is-video' : '');
    card.style.animationDelay = (i * 0.055) + 's';
    const mediaHtml = mem.type === 'video'
      ? `<video src="${mem.url}" class="card-photo" muted preload="metadata"></video>`
      : `<img src="${mem.url}" alt="${mem.caption}" class="card-photo" loading="lazy" />`;
    card.innerHTML = `
      ${mediaHtml}
      <div class="memory-card-body">
        <p class="memory-card-caption">${mem.caption}</p>
        ${mem.date ? `<p class="memory-card-date">${formatDate(mem.date)}</p>` : ''}
      </div>`;
    card.onclick = () => openLightbox(mem);
    grid.appendChild(card);
  });
}

function filterMemories() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  renderGallery(allMemories.filter(m => m.caption.toLowerCase().includes(q)));
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
}

// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════
function openLightbox(mem) {
  const img = document.getElementById('lbImg');
  const vid = document.getElementById('lbVideo');
  if (mem.type === 'video') {
    vid.src = mem.url;
    vid.classList.remove('hidden');
    img.classList.add('hidden');
    img.src = '';
    vid.play().catch(() => {});
  } else {
    img.src = mem.url;
    img.classList.remove('hidden');
    vid.classList.add('hidden');
    vid.pause();
    vid.src = '';
  }
  document.getElementById('lbCaption').textContent = mem.caption;
  document.getElementById('lbDate').textContent    = formatDate(mem.date);
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
  const vid = document.getElementById('lbVideo');
  vid.pause();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
const memDate = document.getElementById('memDate');
if (memDate) memDate.value = new Date().toISOString().split('T')[0];

// ═══════════════════════════════════════════
// MUSIC / PLAYLIST
// ═══════════════════════════════════════════
let pendingMusicFile   = null;
let currentPlaylist    = [];
let currentTrackIndex  = -1;
let musicLoaded        = false;
const audioEl          = document.getElementById('audioPlayer');

function initMusicView() {
  const unlocked = sessionStorage.getItem(GALLERY_AUTH) === 'true';
  document.getElementById('musicLockedMsg').classList.toggle('hidden', unlocked);
  document.getElementById('musicContent').classList.toggle('hidden', !unlocked);
  if (unlocked && !musicLoaded) {
    musicLoaded = true;
    loadPlaylist();
  }
}

function handleMusicFile(files) {
  pendingMusicFile = files[0] || null;
  document.getElementById('musicFileName').textContent = pendingMusicFile ? `🎵 ${pendingMusicFile.name}` : '';
}

function setMusicStatus(msg, type = '') {
  const el = document.getElementById('musicUploadStatus');
  el.textContent = msg;
  el.className   = 'upload-status' + (type ? ' status-' + type : '');
}

async function uploadMusicToGitHub() {
  const saved  = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const token  = saved.token || document.getElementById('ghToken').value.trim();
  const title  = document.getElementById('trackTitle').value.trim();
  const artist = document.getElementById('trackArtist').value.trim();

  if (!token) { setMusicStatus('Add your GitHub token under "Add Memory" first — it\'s reused here. ♡', 'error'); return; }
  if (!pendingMusicFile) { setMusicStatus('Please choose an mp3 file.', 'error'); return; }
  if (pendingMusicFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    setMusicStatus(`File is ${(pendingMusicFile.size / 1024 / 1024).toFixed(1)}MB — please keep it under ${MAX_FILE_SIZE_MB}MB.`, 'error');
    return;
  }

  setMusicStatus('Checking repo access... ♡', 'loading');
  document.getElementById('musicUploadBtn').disabled = true;

  try {
    await verifyRepoAccess(REPO, token);

    setMusicStatus('Uploading song... ♡', 'loading');
    const base64 = await toBase64(pendingMusicFile);
    const ts     = Date.now();
    const safe   = pendingMusicFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path   = `${MUSIC_FOLDER}/${ts}_${safe}`;

    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method:  'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: `Add song: ${title || safe} ♡`, content: base64 }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(`(${res.status}) ${e.message || 'Upload failed'}`);
    }
    const data = await res.json();

    const entry = {
      id:     ts + '_' + Math.random().toString(36).slice(2),
      title:  title || safe,
      artist: artist || '',
      url:    data.content.download_url,
    };
    await appendManyToManifest(MUSIC_MANIFEST_PATH, [entry], token);

    setMusicStatus('✓ Song added to the playlist! ♡', 'success');
    pendingMusicFile = null;
    document.getElementById('musicFileName').textContent = '';
    document.getElementById('trackTitle').value  = '';
    document.getElementById('trackArtist').value = '';
    setTimeout(() => { loadPlaylist(); setMusicStatus(''); }, 1500);
  } catch (err) {
    setMusicStatus(`❌ ${err.message}`, 'error');
  } finally {
    document.getElementById('musicUploadBtn').disabled = false;
  }
}

// One-time helper for songs uploaded straight to GitHub before this manifest existed.
async function syncMusicManifest() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const token = saved.token || document.getElementById('ghToken').value.trim();
  if (!token) { setMusicStatus('Add your GitHub token under "Add Memory" first.', 'error'); return; }

  setMusicStatus('Syncing existing songs... ♡', 'loading');
  try {
    const headers = { Authorization: `token ${token}` };
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${MUSIC_FOLDER}`, { headers });
    if (res.status === 404) { setMusicStatus('No music folder found yet — add a song first.', 'error'); return; }
    if (!res.ok) throw new Error(`(${res.status}) Couldn't list existing songs`);
    const files = await res.json();

    const manifest = files
      .filter(f => /\.(mp3|m4a|wav|ogg)$/i.test(f.name))
      .map(f => {
        const nameNoExt = f.name.replace(/\.[^.]+$/, '');
        const parts     = nameNoExt.split('_');
        const rawName   = parts.slice(1).join(' ').replace(/_/g, ' ') || 'Untitled';
        return { id: f.sha, title: rawName, artist: '', url: f.download_url };
      });

    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${MUSIC_MANIFEST_PATH}`, { headers });
    if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }

    const body = {
      message: 'Sync music manifest ♡',
      content: utf8ToBase64(JSON.stringify(manifest, null, 2)),
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${MUSIC_MANIFEST_PATH}`, {
      method:  'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!putRes.ok) {
      const e = await putRes.json().catch(() => ({}));
      throw new Error(e.message || 'Failed to save manifest');
    }

    setMusicStatus(`✓ Synced ${manifest.length} song(s) ♡`, 'success');
    setTimeout(() => { loadPlaylist(); setMusicStatus(''); }, 1500);
  } catch (err) {
    setMusicStatus(`❌ ${err.message}`, 'error');
  }
}

async function loadPlaylist() {
  const list  = document.getElementById('playlistList');
  const empty = document.getElementById('playlistEmpty');
  list.innerHTML = `<p style="text-align:center;color:#9c4473;font-size:0.85rem;padding:1rem;">loading playlist... ♡</p>`;
  empty.classList.add('hidden');

  const manifest = await fetchManifest(MUSIC_MANIFEST_PATH);
  currentPlaylist = manifest || [];
  renderPlaylist();
}

function renderPlaylist() {
  const list  = document.getElementById('playlistList');
  const empty = document.getElementById('playlistEmpty');
  list.innerHTML = '';

  if (!currentPlaylist.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  currentPlaylist.forEach((track, i) => {
    const row = document.createElement('div');
    const isCurrent = i === currentTrackIndex;
    row.className = 'playlist-row' + (isCurrent ? ' playing' : '');
    row.innerHTML = `
      <span class="playlist-icon">${isCurrent && !audioEl.paused ? '♪' : '♡'}</span>
      <div class="playlist-info">
        <p class="playlist-title">${track.title}</p>
        ${track.artist ? `<p class="playlist-artist">${track.artist}</p>` : ''}
      </div>`;
    row.onclick = () => playTrack(i);
    list.appendChild(row);
  });
}

function playTrack(i) {
  if (!currentPlaylist.length) return;
  if (i < 0) i = currentPlaylist.length - 1;
  if (i >= currentPlaylist.length) i = 0;
  currentTrackIndex = i;
  const track = currentPlaylist[i];

  audioEl.src = track.url;
  audioEl.play().catch(() => {});

  document.getElementById('miniPlayer').classList.remove('hidden');
  document.getElementById('nowPlayingTitle').textContent  = track.title;
  document.getElementById('nowPlayingArtist').textContent = track.artist || '';
  document.getElementById('playPauseBtn').textContent = '⏸';
  renderPlaylist();
}

function toggleTrackPlay() {
  if (!audioEl.src) { if (currentPlaylist.length) playTrack(0); return; }
  if (audioEl.paused) {
    audioEl.play();
    document.getElementById('playPauseBtn').textContent = '⏸';
  } else {
    audioEl.pause();
    document.getElementById('playPauseBtn').textContent = '▶';
  }
  renderPlaylist();
}

function playNextTrack() { playTrack(currentTrackIndex + 1); }
function playPrevTrack() { playTrack(currentTrackIndex - 1); }

if (audioEl) {
  audioEl.addEventListener('ended', playNextTrack);
}
