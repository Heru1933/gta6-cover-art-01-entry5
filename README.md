[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Heru1933/gta6-cover-art-01-entry5/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Heru1933/gta6-cover-art-01-entry5/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Vice — cover art maker

Neon Vice turns your own photos into multi-panel, poster-style cover art in the browser, then exports a share-ready PNG. It is a static web app: open it, add photos, arrange them, export. Nothing is uploaded — every photo is read on your own machine and never leaves it.

**Layouts** — Mosaic (7 panels), Poster (one hero + 3), Quad, Trio, Duo and Solo, separated by cream keylines with soft panel shadows. Empty panels are filled with a drawn sunset scene, so a cover always looks finished.

**Photos** — Add files with the picker or drag them straight onto the cover. Click a panel to select it, drag on the cover to pan its photo, and use the zoom slider, Fill/Fit toggle, Centre and Next-photo controls per panel. Two built-in sample photos are included so the app works the moment it opens.

**Colour grades** — Vice Sunset, Neon Night, Golden Hour, Noir and Clean, plus optional film grain, a vignette, and a striped retro-sun overlay.

**Words** — An editable title (auto-fitted Anton lettering with an ink outline), tagline and foot line, with the title placed at the top or bottom of the cover.

**Export** — One click writes a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080. The preview canvas renders at the full export resolution, so what you see is exactly what you share.

The lettering faces are Anton and Bebas Neue, vendored under `app/fonts/` with their SIL Open Font License texts. All artwork is original; no game assets are used.

## Run it

```
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`. To try the app itself, run `node serve.ts` and open the address it prints, or open `app/index.html` through any static file server.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
