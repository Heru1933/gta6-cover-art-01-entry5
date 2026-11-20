// Colour work for Neon Vice: named grades painted over each panel photo,
// a drawn sunset scene for panels that hold no photo yet, and the retro
// sun disc that can sit over the whole cover.

export const GRADE_ORDER = ['vice', 'neon', 'golden', 'noir', 'clean'];

export const GRADE_LABELS = {
  vice: 'Vice Sunset',
  neon: 'Neon Night',
  golden: 'Golden Hour',
  noir: 'Noir',
  clean: 'Clean',
};

// Paint one grade over a rectangle that already holds a photo. Grades are
// layered translucent washes, so the photograph keeps its detail while the
// whole cover takes on one shared light.
export function paintGrade(ctx, rect, gradeName) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (gradeName === 'vice') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255, 93, 162, 0.20)');
    wash.addColorStop(0.45, 'rgba(255, 93, 162, 0.02)');
    wash.addColorStop(1, 'rgba(255, 138, 42, 0.30)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 80, 110, 0.12)';
    ctx.fillRect(x, y, w, h);
  } else if (gradeName === 'neon') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(47, 212, 196, 0.20)');
    wash.addColorStop(0.55, 'rgba(20, 10, 60, 0.10)');
    wash.addColorStop(1, 'rgba(150, 50, 220, 0.32)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 93, 162, 0.20)';
    ctx.fillRect(x, y, w, h);
  } else if (gradeName === 'golden') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255, 214, 120, 0.16)');
    wash.addColorStop(1, 'rgba(190, 90, 20, 0.26)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 183, 71, 0.14)';
    ctx.fillRect(x, y, w, h);
  } else if (gradeName === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#7f7f7f';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const shade = ctx.createLinearGradient(x, y, x, y + h);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
    shade.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
  } else {
    // Clean: a whisper of warmth so mixed photos sit together, nothing more.
    ctx.fillStyle = 'rgba(255, 190, 120, 0.06)';
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

// A drawn stand-in scene for an empty panel: banded sunset sky, a low sun,
// a dark shore line and a palm silhouette. The variant number shifts the
// palette and the sun position so neighbouring empty panels differ.
export function paintSunsetFiller(ctx, rect, variant) {
  const { x, y, w, h } = rect;
  const palettes = [
    ['#2b1055', '#7597de', '#ff5da2', '#ff9a3d', '#ffd23d'],
    ['#0f2027', '#2c5364', '#2fd4c4', '#ff5da2', '#ffe29a'],
    ['#3a1c71', '#d76d77', '#ffaf7b', '#ff5da2', '#fff3b0'],
    ['#141e30', '#243b55', '#f7971e', '#ffd200', '#ff5da2'],
  ];
  const pal = palettes[Math.abs(variant) % palettes.length];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, pal[0]);
  sky.addColorStop(0.45, pal[1]);
  sky.addColorStop(0.72, pal[2]);
  sky.addColorStop(1, pal[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const sunCx = x + w * (0.34 + 0.11 * (Math.abs(variant) % 3));
  const sunCy = y + h * 0.68;
  const sunR = Math.min(w, h) * 0.26;
  const sun = ctx.createLinearGradient(x, sunCy - sunR, x, sunCy + sunR);
  sun.addColorStop(0, pal[4]);
  sun.addColorStop(1, pal[2]);
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunCx, sunCy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Shore and sea bands across the lower third.
  ctx.fillStyle = 'rgba(10, 6, 24, 0.85)';
  ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(x, y + h * 0.8, w, 2);

  paintPalm(ctx, x + w * 0.8, y + h * 0.82, Math.min(w, h) * 0.34);
  ctx.restore();
}

// One palm silhouette: a leaning trunk and five fronds, all in near-black.
export function paintPalm(ctx, baseX, baseY, size) {
  ctx.save();
  ctx.strokeStyle = 'rgba(8, 4, 18, 0.92)';
  ctx.fillStyle = 'rgba(8, 4, 18, 0.92)';
  ctx.lineWidth = Math.max(2, size * 0.055);
  ctx.lineCap = 'round';
  const topX = baseX - size * 0.22;
  const topY = baseY - size;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX - size * 0.05, baseY - size * 0.55, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const angle = Math.PI * (0.08 + i * 0.21);
    const reach = size * (0.5 + (i % 2) * 0.14);
    const endX = topX + Math.cos(angle) * reach * (i < 2 ? -1 : 1) * 0.9;
    const endY = topY - Math.sin(angle) * reach * 0.42 + reach * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + (endX - topX) * 0.5, topY - reach * 0.3, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

// Film grain: a small tile of deterministic noise (a linear congruential
// generator with a fixed seed, so every render of the same cover is the
// same picture) stamped across the cover at low opacity.
let grainTile = null;

function buildGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 180;
  tile.height = 180;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(tile.width, tile.height);
  let seed = 987654321;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const value = seed % 256;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  return tile;
}

export function paintGrain(ctx, W, H, strength = 0.07) {
  if (!grainTile) grainTile = buildGrainTile();
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// Vignette: a radial falloff that keeps the centre bright and lets the
// corners sink into shade, the way a printed poster ages.
export function paintVignette(ctx, W, H, strength = 0.42) {
  const radius = Math.hypot(W, H) * 0.62;
  const glow = ctx.createRadialGradient(W / 2, H / 2, radius * 0.42, W / 2, H / 2, radius);
  glow.addColorStop(0, 'rgba(8, 2, 18, 0)');
  glow.addColorStop(1, `rgba(8, 2, 18, ${strength})`);
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
