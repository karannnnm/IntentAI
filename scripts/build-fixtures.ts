#!/usr/bin/env ts-node
/**
 * Why this file exists:
 * - We want to train on binaries whose intent we *know* (ground truth).
 * - So we compile our own tiny C programs ("fixtures") into Mach-O arm64 executables.
 *
 * What it does:
 * - Reads `fixtures/fixtures.manifest.json`
 * - Compiles each fixture into `fixtures/bin/` with a few build variants
 *
 * Important concepts (no need to memorize; this script automates it):
 * - -O0: no optimization (easier to analyze)
 * - -O2: optimized (harder/more realistic)
 * - -g : include debug info (helps analysis tools understand symbols)
 * - strip: remove symbols/debug info (hard mode)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type IntentLabel =
  | 'file_reader'
  | 'file_writer'
  | 'directory_ops'
  | 'file_manipulator'
  | 'archive_tool'
  | 'system_utility'
  | 'network_ops'
  | 'console_output'
  | 'compute_only'
  | 'unknown';

interface FixtureEntry {
  name: string;
  source: string; // path relative to repo root
  intent_label: IntentLabel;
  notes?: string;
}

interface FixtureManifest {
  platform: 'darwin';
  architecture: 'arm64';
  fixtures: FixtureEntry[];
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function maybeDeleteDsym(binaryPath: string) {
  // On macOS, some builds may produce a companion "<binary>.dSYM/" bundle.
  // It's useful for debugging, but it clutters fixtures/bin and we don't need it
  // for intent detection. So we remove it by default.
  const dsymPath = `${binaryPath}.dSYM`;
  if (fs.existsSync(dsymPath)) {
    fs.rmSync(dsymPath, { recursive: true, force: true });
  }
}

function main() {
  const repoRoot = path.join(__dirname, '..');
  const manifestPath = path.join(repoRoot, 'fixtures/fixtures.manifest.json');
  const binDir = path.join(repoRoot, 'fixtures/bin');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing fixture manifest at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as FixtureManifest;
  ensureDir(binDir);

  // Build variants:
  // - "easy": O0 + debug symbols
  // - "realistic": O2
  // - "hard": O2 + stripped symbols
  const variants: Array<{
    suffix: string;
    clangFlags: string[];
    stripAfter?: boolean;
  }> = [
    { suffix: 'O0_g', clangFlags: ['-O0', '-g'] },
    { suffix: 'O2', clangFlags: ['-O2'] },
    { suffix: 'O2_stripped', clangFlags: ['-O2'], stripAfter: true }
  ];

  console.log(`Building ${manifest.fixtures.length} fixtures into ${binDir}`);

  for (const fx of manifest.fixtures) {
    const sourceAbs = path.join(repoRoot, fx.source);
    if (!fs.existsSync(sourceAbs)) {
      console.warn(`Skipping ${fx.name}: source not found at ${fx.source}`);
      continue;
    }

    for (const v of variants) {
      const outPath = path.join(binDir, `${fx.name}__${v.suffix}`);
      const flags = v.clangFlags.join(' ');

      // We compile for the host by default (Apple Silicon => arm64). If you ever
      // want to force it, add: -arch arm64
      const cmd = `clang ${flags} \"${sourceAbs}\" -o \"${outPath}\"`;
      try {
        run(cmd);
        maybeDeleteDsym(outPath);
        if (v.stripAfter) {
          // strip may fail for some binaries (or if strip isn't available).
          // That's OK; the binary will just remain unstripped.
          try {
            run(`strip \"${outPath}\"`);
          } catch {
            // ignore
          }
        }
        // Stripping/debug tools may also generate a dSYM; keep bin dir tidy.
        maybeDeleteDsym(outPath);
        console.log(`  + ${path.basename(outPath)}`);
      } catch (e: any) {
        console.warn(`  ! failed ${fx.name} (${v.suffix}): ${e?.message || e}`);
      }
    }
  }

  console.log('Done.');
  console.log('Next: run collection/analyze scripts on fixtures/bin/');
}

if (require.main === module) {
  main();
}

