// Neon Vice editor: owns the cover state, wires every control in the rail,
// loads photos from the person's machine (they are read locally and never
// sent anywhere), and paints through render.js at export resolution.

import { panelCount, panelAtPoint } from './panels.js';
import { renderCover, EXPORT_SIZES } from './render.js';

const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('statusLine');

const SAMPLE_FILES = [
  { name: 'Pier at dusk', src: 'samples/pier.jpg' },
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
];

export const state = {
  layout: 'poster',
  grade: 'vice',
  sun: false,
  grain: false,
  vignette: true,
  title: 'Neon Vice',
  tagline: 'One city, seven stories',
  foot: 'Original fan-made cover art',
  titlePlace: 'bottom',
  sizeKey: '1920x1080',
  selected: 0,
  panels: [],
  photos: [],
  activePhoto: 0,
  lastRects: [],
};

function say(message) {
  if (statusLine) statusLine.textContent = message;
}

function freshPanel(img) {
  return { img: img || null, panX: 0, panY: 0, zoom: 1, mode: 'fill' };
}

// Keep one panel record per panel in the current layout. New panels borrow
// photos round-robin so a fresh layout never opens full of empty slots
// when the person already has photos loaded.
export function ensurePanels() {
  const needed = panelCount(state.layout);
  while (state.panels.length < needed) {
    const borrow = state.photos.length
      ? state.photos[state.panels.length % state.photos.length].img
      : null;
    state.panels.push(freshPanel(borrow));
  }
  state.panels.length = needed;
  if (state.selected >= needed) state.selected = 0;
}

let paintQueued = false;
export function paint() {
  if (paintQueued) return;
  paintQueued = true;
  requestAnimationFrame(() => {
    paintQueued = false;
    const size = EXPORT_SIZES[state.sizeKey];
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    renderCover(ctx, state, size.w, size.h, { highlightSelected: !document.body.classList.contains('shot-cover') });
    syncPanelControls();
  });
}

function loadPhotoFromSrc(src, name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ img, name, src });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  for (const sample of SAMPLE_FILES) {
    const photo = await loadPhotoFromSrc(sample.src, sample.name);
    if (photo) state.photos.push(photo);
  }
  ensurePanels();
  // Give the opening cover a composed look: hero takes the pier, the side
  // panels take the boulevard, and the last panel keeps the drawn sunset.
  if (state.photos.length >= 2) {
    state.panels.forEach((panel, i) => {
      panel.img = state.photos[i % state.photos.length].img;
    });
    if (state.panels.length > 2) state.panels[state.panels.length - 1].img = null;
  }
  buildTray();
}

function buildTray() {
  const tray = document.getElementById('photoTray');
  if (!tray) return;
  tray.innerHTML = '';
  state.photos.forEach((photo, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tray-item' + (index === state.activePhoto ? ' on' : '');
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = photo.name;
    const caption = document.createElement('span');
    caption.textContent = photo.name;
    btn.append(thumb, caption);
    btn.addEventListener('click', () => {
      state.activePhoto = index;
      const panel = state.panels[state.selected];
      if (panel) panel.img = photo.img;
      buildTray();
      paint();
      say(`Panel ${state.selected + 1} now holds “${photo.name}”.`);
    });
    tray.appendChild(btn);
  });
}

function syncPanelControls() {
  const name = document.getElementById('panelName');
  if (name) name.textContent = String(state.selected + 1);
  const panel = state.panels[state.selected];
  const zoom = document.getElementById('zoomRange');
  if (zoom && panel && document.activeElement !== zoom) zoom.value = String(panel.zoom);
  const fit = document.getElementById('fitToggle');
  if (fit && panel) {
    fit.textContent = panel.mode === 'fit' ? 'Mode: Fit' : 'Mode: Fill';
    fit.setAttribute('aria-pressed', panel.mode === 'fit' ? 'true' : 'false');
  }
}

function wireLayoutRow() {
  const row = document.getElementById('layoutRow');
  row.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-layout]');
    if (!btn) return;
    state.layout = btn.dataset.layout;
    row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    ensurePanels();
    paint();
    say(`${btn.textContent.trim()} layout — ${panelCount(state.layout)} panel(s).`);
  });
}

function wirePhotoInputs() {
  const input = document.getElementById('photoInput');
  input.addEventListener('change', async () => {
    await addFiles([...input.files]);
    input.value = '';
  });
  document.getElementById('fillAllBtn').addEventListener('click', () => {
    const photo = state.photos[state.activePhoto];
    if (!photo) return;
    state.panels.forEach((panel) => { panel.img = photo.img; });
    paint();
    say(`Every panel now holds “${photo.name}”. Pan each one for variety.`);
  });
}

export async function addFiles(files) {
  const images = files.filter((f) => f.type.startsWith('image/'));
  if (!images.length) { say('Those files were not images.'); return; }
  let firstNewPanel = state.panels.findIndex((p) => !p.img);
  for (const file of images) {
    const src = URL.createObjectURL(file);
    const photo = await loadPhotoFromSrc(src, file.name.replace(/\.[^.]+$/, ''));
    if (!photo) continue;
    state.photos.push(photo);
    const target = firstNewPanel >= 0 ? firstNewPanel : state.selected;
    if (state.panels[target]) state.panels[target].img = photo.img;
    firstNewPanel = state.panels.findIndex((p) => !p.img);
  }
  state.activePhoto = state.photos.length - 1;
  buildTray();
  paint();
  say(`${images.length} photo(s) added from this machine. Nothing was uploaded.`);
}

function wirePanelControls() {
  document.getElementById('zoomRange').addEventListener('input', (event) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Number(event.target.value);
    paint();
  });
  document.getElementById('centreBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.panX = 0;
    panel.panY = 0;
    paint();
    say(`Panel ${state.selected + 1} photo centred.`);
  });
  document.getElementById('cycleBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel || !state.photos.length) return;
    const current = state.photos.findIndex((p) => p.img === panel.img);
    const next = state.photos[(current + 1) % state.photos.length];
    panel.img = next.img;
    state.activePhoto = state.photos.indexOf(next);
    buildTray();
    paint();
    say(`Panel ${state.selected + 1} now holds “${next.name}”.`);
  });
  document.getElementById('fitToggle').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.mode = panel.mode === 'fit' ? 'fill' : 'fit';
    paint();
    say(`Panel ${state.selected + 1}: ${panel.mode} mode.`);
  });
}

// Pointer work on the cover itself: a plain click selects the panel under
// the pointer; a drag pans that panel's photo. Coordinates are mapped from
// the displayed (CSS-sized) canvas back to export pixels.
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

function wireCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelAtPoint(state.lastRects, point.x, point.y);
    if (hit >= 0) state.selected = hit;
    const panel = state.panels[state.selected];
    drag = { startX: event.clientX, startY: event.clientY, panX: panel ? panel.panX : 0, panY: panel ? panel.panY : 0, moved: false };
    canvas.setPointerCapture(event.pointerId);
    paint();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const panel = state.panels[state.selected];
    const rect = state.lastRects[state.selected];
    if (!panel || !rect) return;
    const box = canvas.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) * (canvas.width / box.width);
    const dy = (event.clientY - drag.startY) * (canvas.height / box.height);
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    panel.panX = clampPan(drag.panX + (dx / rect.w) * 1.6);
    panel.panY = clampPan(drag.panY + (dy / rect.h) * 1.6);
    paint();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  const stage = document.getElementById('stageBox');
  ['dragover', 'dragenter'].forEach((name) => stage.addEventListener(name, (event) => {
    event.preventDefault();
    document.getElementById('dropHint').textContent = 'Let go — the photos land in the panels in order.';
  }));
  stage.addEventListener('drop', async (event) => {
    event.preventDefault();
    await addFiles([...event.dataTransfer.files]);
  });
}

function clampPan(value) {
  return Math.max(-1, Math.min(1, value));
}

function wireGradeAndEffects() {
  const row = document.getElementById('gradeRow');
  row.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-grade]');
    if (!btn) return;
    state.grade = btn.dataset.grade;
    row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    paint();
    say(`Grade: ${btn.textContent.trim()}.`);
  });
  const bind = (id, key, label) => {
    const box = document.getElementById(id);
    box.checked = Boolean(state[key]);
    box.addEventListener('change', () => {
      state[key] = box.checked;
      paint();
      say(`${label} ${box.checked ? 'on' : 'off'}.`);
    });
  };
  bind('grainToggle', 'grain', 'Film grain');
  bind('vignetteToggle', 'vignette', 'Vignette');
  bind('sunToggle', 'sun', 'Retro sun');
}

function wireWords() {
  const bindText = (id, key) => {
    document.getElementById(id).addEventListener('input', (event) => {
      state[key] = event.target.value;
      paint();
    });
  };
  bindText('titleInput', 'title');
  bindText('taglineInput', 'tagline');
  bindText('footInput', 'foot');
  const top = document.getElementById('placeTopBtn');
  const bottom = document.getElementById('placeBottomBtn');
  const setPlace = (place) => {
    state.titlePlace = place;
    top.classList.toggle('on', place === 'top');
    bottom.classList.toggle('on', place === 'bottom');
    paint();
  };
  top.addEventListener('click', () => setPlace('top'));
  bottom.addEventListener('click', () => setPlace('bottom'));
}

function wireSizeAndExport() {
  const pick = document.getElementById('sizePick');
  pick.value = state.sizeKey;
  pick.addEventListener('change', () => {
    state.sizeKey = pick.value;
    paint();
    const size = EXPORT_SIZES[state.sizeKey];
    say(`Cover is now ${size.w} × ${size.h} (${size.label}).`);
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    paint();
    canvas.toBlob((blob) => {
      if (!blob) { say('Export failed in this browser.'); return; }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'neon-vice-cover.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      const size = EXPORT_SIZES[state.sizeKey];
      say(`Exported a ${size.w} × ${size.h} PNG.`);
    }, 'image/png');
  });
}

// Screenshot scenes, driven by the query string (see shots.json): a cover
// scene hides the chrome and pre-loads a named arrangement; an editor scene
// keeps the chrome and shows the app mid-work.
function applyShotScene(params) {
  const shot = params.get('shot');
  if (!shot) return;
  if (params.get('layout')) {
    state.layout = params.get('layout');
    document.querySelectorAll('#layoutRow button').forEach((b) =>
      b.classList.toggle('on', b.dataset.layout === state.layout));
  }
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('size')) state.sizeKey = params.get('size');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('tagline')) state.tagline = params.get('tagline');
  if (params.get('sun') === '1') state.sun = true;
  if (params.get('grain') === '1') state.grain = true;
  state.vignette = params.get('vignette') !== '0';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  ensurePanels();
}

async function boot() {
  const params = new URLSearchParams(location.search);
  applyShotScene(params);
  wireLayoutRow();
  wirePhotoInputs();
  wirePanelControls();
  wireCanvas();
  wireGradeAndEffects();
  wireWords();
  wireSizeAndExport();
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('80px Anton'),
        document.fonts.load('40px "Bebas Neue"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch { /* fonts fall back to system faces */ }
  await loadSamples();
  if (params.get('shot')) applyShotScene(params);
  ensurePanels();
  paint();
  document.body.classList.add('ready');
  window.__NEON_VICE_READY = true;
  say('Ready. Add your photos, pick a layout, export the PNG.');
}

boot();
