// The cover renderer: panels, photos, grade and lettering painted onto a
// 2D canvas at the full export resolution, so what the editor previews is
// byte-for-byte the picture the Export button writes as a PNG.

import { rectsForLayout } from './panels.js';
import { paintGrade, paintSunsetFiller, paintGrain, paintVignette } from './grade.js';

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

// Scale and placement for one photo inside one panel. In fill mode the
// photo covers the panel and the pan offsets slide the overflow; in fit
// mode the whole photo shows and the pan offsets move it in the slack.
export function photoPlacement(imgW, imgH, rect, mode, zoom) {
  const scaleFill = Math.max(rect.w / imgW, rect.h / imgH);
  const scaleFit = Math.min(rect.w / imgW, rect.h / imgH);
  const scale = (mode === 'fit' ? scaleFit : scaleFill) * (zoom || 1);
  return { drawW: imgW * scale, drawH: imgH * scale, scale };
}

function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.img;
  const { drawW, drawH } = photoPlacement(img.naturalWidth, img.naturalHeight, rect, panel.mode, panel.zoom);
  const slackX = drawW - rect.w;
  const slackY = drawH - rect.h;
  const dx = rect.x + (rect.w - drawW) / 2 + (panel.panX || 0) * Math.max(0, slackX) * 0.5;
  const dy = rect.y + (rect.h - drawH) / 2 + (panel.panY || 0) * Math.max(0, slackY) * 0.5;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

// Paint the whole cover. `state` carries the layout name, one panel record
// per panel, the grade, the effect toggles and the three text lines.
export function renderCover(ctx, state, W, H, options = {}) {
  const gutter = Math.max(6, Math.round(W * 0.009));

  // Cream paper is the keyline colour: fill everything, then the panels
  // leave cream seams wherever the gutter separates them.
  ctx.save();
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(0, 0, W, H);

  const rects = rectsForLayout(state.layout, W, H, gutter);
  state.lastRects = rects;

  rects.forEach((rect, index) => {
    const panel = state.panels[index] || {};
    ctx.save();
    ctx.shadowColor = 'rgba(23, 8, 40, 0.35)';
    ctx.shadowBlur = gutter * 1.4;
    ctx.shadowOffsetY = gutter * 0.35;
    ctx.fillStyle = '#1b1030';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.img) {
      // Fit mode can leave slack inside the panel; the sunset filler sits
      // behind the photo so the slack still reads as cover art.
      if (panel.mode === 'fit') paintSunsetFiller(ctx, rect, index + 2);
      drawPanelPhoto(ctx, rect, panel);
    } else {
      paintSunsetFiller(ctx, rect, index);
    }
    paintGrade(ctx, rect, state.grade);
    ctx.restore();

    if (options.highlightSelected && index === state.selected) {
      ctx.save();
      ctx.strokeStyle = '#ff5da2';
      ctx.lineWidth = Math.max(3, gutter * 0.55);
      ctx.strokeRect(rect.x + ctx.lineWidth / 2, rect.y + ctx.lineWidth / 2, rect.w - ctx.lineWidth, rect.h - ctx.lineWidth);
      ctx.restore();
    }
  });

  if (state.sun) paintRetroSun(ctx, W, H);
  if (state.grain) paintGrain(ctx, W, H);
  if (state.vignette) paintVignette(ctx, W, H);
  paintLettering(ctx, state, W, H);
  ctx.restore();
}

// The striped retro sun: a warm disc low on the cover with sky-coloured
// slits cut across its lower half, drawn over the panels but under the
// title so the lettering always wins.
export function paintRetroSun(ctx, W, H) {
  const cx = W * 0.5;
  const cy = H * 0.62;
  const r = Math.min(W, H) * 0.21;
  ctx.save();
  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  disc.addColorStop(0, 'rgba(255, 210, 63, 0.95)');
  disc.addColorStop(0.6, 'rgba(255, 93, 162, 0.9)');
  disc.addColorStop(1, 'rgba(255, 110, 64, 0.9)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 5; i++) {
    const slitY = cy + r * (0.08 + i * 0.17);
    ctx.fillRect(cx - r, slitY, r * 2, r * (0.028 + i * 0.012));
  }
  ctx.restore();
}

// Title, tagline and foot line. The title is set in Anton, shrunk until it
// fits the cover width, with a heavy ink outline and a soft drop shadow.
export function paintLettering(ctx, state, W, H) {
  const title = (state.title || '').trim();
  const tagline = (state.tagline || '').trim();
  const foot = (state.foot || '').trim();
  const atTop = state.titlePlace === 'top';
  const margin = W * 0.045;

  ctx.save();
  ctx.textAlign = 'center';

  if (title) {
    let size = Math.round(H * 0.115);
    ctx.font = `${size}px Anton, sans-serif`;
    const maxWidth = W - margin * 2;
    while (ctx.measureText(title.toUpperCase()).width > maxWidth && size > 18) {
      size -= 4;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const titleY = atTop ? margin + size * 0.92 : H - margin - size * 0.52;
    ctx.lineWidth = Math.max(4, size * 0.14);
    ctx.strokeStyle = '#17121d';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(10, 4, 24, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.07;
    const paint = ctx.createLinearGradient(0, titleY - size, 0, titleY);
    paint.addColorStop(0, '#ffffff');
    paint.addColorStop(0.55, '#ffe9a8');
    paint.addColorStop(1, '#ffb347');
    ctx.fillStyle = paint;
    const text = title.toUpperCase();
    ctx.strokeText(text, W / 2, titleY);
    ctx.fillText(text, W / 2, titleY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (tagline) {
      const tagSize = Math.round(size * 0.34);
      ctx.font = `${tagSize}px "Bebas Neue", sans-serif`;
      try { ctx.letterSpacing = `${Math.round(tagSize * 0.32)}px`; } catch { /* older engines */ }
      const tagY = atTop ? titleY + tagSize * 1.5 : titleY - size * 1.02;
      ctx.lineWidth = Math.max(2, tagSize * 0.16);
      ctx.fillStyle = '#2fd4c4';
      ctx.strokeText(tagline.toUpperCase(), W / 2, tagY);
      ctx.fillText(tagline.toUpperCase(), W / 2, tagY);
      try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
    }
  }

  if (foot) {
    const footSize = Math.max(15, Math.round(H * 0.021));
    ctx.font = `${footSize}px "Bebas Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(footSize * 0.22)}px`; } catch { /* older engines */ }
    const footY = atTop ? H - margin * 0.72 : margin + footSize * 0.4;
    ctx.fillStyle = 'rgba(255, 243, 214, 0.92)';
    ctx.fillText(foot.toUpperCase(), W / 2, footY);
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  }
  ctx.restore();
}
