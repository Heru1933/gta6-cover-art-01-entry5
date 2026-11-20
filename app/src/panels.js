// Panel geometry for Neon Vice covers.
//
// Every layout is a tiling of the cover rectangle, written as fractions of
// the cover's width and height so the same arrangement works at square,
// portrait and wide export sizes. The renderer asks for pixel rectangles
// and this module handles the cream keyline gutter between panels.

const TILINGS = {
  solo: [
    [0, 0, 1, 1],
  ],
  duo: [
    [0, 0, 0.5, 1],
    [0.5, 0, 0.5, 1],
  ],
  trio: [
    [0, 0, 0.52, 1],
    [0.52, 0, 0.48, 0.5],
    [0.52, 0.5, 0.48, 0.5],
  ],
  quad: [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.5, 0.5],
    [0, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
  ],
  poster: [
    [0, 0, 0.62, 1],
    [0.62, 0, 0.38, 1 / 3],
    [0.62, 1 / 3, 0.38, 1 / 3],
    [0.62, 2 / 3, 0.38, 1 / 3],
  ],
  mosaic: [
    [0, 0, 0.42, 0.58],
    [0.42, 0, 0.29, 0.34],
    [0.71, 0, 0.29, 0.34],
    [0.42, 0.34, 0.58, 0.24],
    [0, 0.58, 0.3, 0.42],
    [0.3, 0.58, 0.34, 0.42],
    [0.64, 0.58, 0.36, 0.42],
  ],
};

export const LAYOUT_ORDER = ['mosaic', 'poster', 'quad', 'trio', 'duo', 'solo'];

export function panelCount(layoutName) {
  const tiling = TILINGS[layoutName];
  return tiling ? tiling.length : 1;
}

export function layoutLabel(layoutName) {
  const labels = {
    mosaic: 'Mosaic',
    poster: 'Poster',
    quad: 'Quad',
    trio: 'Trio',
    duo: 'Duo',
    solo: 'Solo',
  };
  return labels[layoutName] || 'Poster';
}

// Pixel rectangles for a layout on a W x H cover. Each rect is pulled in by
// half the gutter on every side, so neighbouring panels share one keyline
// of exactly `gutter` pixels and the outer edge keeps a half-gutter frame.
export function rectsForLayout(layoutName, W, H, gutter) {
  const tiling = TILINGS[layoutName] || TILINGS.poster;
  const half = gutter / 2;
  return tiling.map(([fx, fy, fw, fh], index) => ({
    index,
    x: fx * W + half,
    y: fy * H + half,
    w: fw * W - gutter,
    h: fh * H - gutter,
  }));
}

export function describeLayout(layoutName) {
  const count = panelCount(layoutName);
  return `${layoutLabel(layoutName)} — ${count} panel${count === 1 ? '' : 's'}`;
}

// Which panel sits under a point, given the rectangles already computed.
export function panelAtPoint(rects, px, py) {
  for (const rect of rects) {
    if (px >= rect.x && px < rect.x + rect.w && py >= rect.y && py < rect.y + rect.h) {
      return rect.index;
    }
  }
  return -1;
}
