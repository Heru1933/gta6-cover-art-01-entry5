// Neon Vice — handover program for the gta6-cover-art-01 entry.
//
// Run with Node 22:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program does three things, in order: it copies the static app from
// app/ into the output directory, copies the maker's screenshots from
// screenshots/ beside it, and writes dossier.json there with the vendored
// buildDossier library (vendor/makefun-app.ts, the kit's own copy,
// unchanged). The grader runs this program twice and expects both runs to
// leave identical bytes behind, so nothing here depends on the clock, on
// randomness, or on anything outside this repository.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, passed to the dossier builder so an entry that
// would fail the gate fails here first, on the maker's machine.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(from, to, label) {
  if (!existsSync(from)) {
    throw new Error(`Neon Vice: missing ${label} at ${from}`);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return readdirSync(to, { recursive: true }).length;
}

// Fail loudly, before copying anything, if the app has no front door: a
// dossier built from an app without index.html can only fail the gate.
if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('Neon Vice: app/index.html is missing — there is no entry to hand in.');
}

mkdirSync(outputDir, { recursive: true });
const appEntries = copyTree(join(repoRoot, 'app'), join(outputDir, 'app'), 'app folder');
const shotEntries = copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), 'screenshots folder');

const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Neon Vice handed in: ${appEntries} app entries, ${shotEntries} screenshots, dossier ${dossier.length} bytes -> ${outputDir}`);
