#!/usr/bin/env ts-node
/**
 * Collect binaries from `fixtures/bin/` (not from /bin, /usr/bin, etc.).
 *
 * Why:
 * - System utilities are ambiguous / multi-intent (bash imports everything).
 * - Our fixtures have clear ground-truth labels from `fixtures/fixtures.manifest.json`.
 *
 * Output:
 * - Writes a "collected files" JSON to `data/raw/collected-fixtures.json`
 *   (data/ is gitignored in this repo, so you won't accidentally commit outputs.)
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

type IntentLabel =
  | 'file_reader'
  | 'file_writer'
  | 'directory_ops'
  | 'file_manipulator'
  | 'archive_tool'
  | 'system_utility'
  | 'network_ops'
  | 'unknown';

interface FixtureEntry {
  name: string;
  source: string;
  intent_label: IntentLabel;
  notes?: string;
}

interface FixtureManifest {
  platform: 'darwin';
  architecture: 'arm64';
  fixtures: FixtureEntry[];
}

interface CollectedFixtureBinary {
  filename: string;
  fullPath: string;
  size: number;
  sha256: string;
  type: 'binary';
  architecture: string;
  // Ground-truth label (because we compiled it from our own fixture source)
  intent_label: IntentLabel;
  fixture_name: string;
  build_variant: string;
}

function getArchitecture(filePath: string): string {
  try {
    const output = execSync(`file "${filePath}"`, { encoding: 'utf-8' });
    if (output.includes('arm64')) return 'arm64';
    if (output.includes('x86_64')) return 'x86_64';
    if (output.includes('universal binary')) return 'universal';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function isMachO(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);

    const magicNumbers = [
      0xfeedface, // 32-bit Mach-O
      0xfeedfacf, // 64-bit Mach-O
      0xcafebabe, // Universal binary
      0xcefaedfe, // 32-bit reverse
      0xcffaedfe // 64-bit reverse
    ];
    const magic = buf.readUInt32BE(0);
    return magicNumbers.includes(magic);
  } catch {
    return false;
  }
}

function main() {
  const repoRoot = path.join(__dirname, '..');
  const binDir = path.join(repoRoot, 'fixtures/bin');
  const manifestPath = path.join(repoRoot, 'fixtures/fixtures.manifest.json');
  const outputPath = path.join(repoRoot, 'data/raw/collected-fixtures.json');

  if (!fs.existsSync(binDir)) {
    console.error(`Missing ${binDir}. Run: npm run fixtures:build`);
    process.exit(1);
  }
  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing ${manifestPath}.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as FixtureManifest;
  const labelByFixtureName = new Map<string, IntentLabel>(
    manifest.fixtures.map(f => [f.name, f.intent_label])
  );

  const files = fs.readdirSync(binDir);
  const collected: CollectedFixtureBinary[] = [];

  for (const file of files) {
    const fullPath = path.join(binDir, file);
    const st = fs.statSync(fullPath);
    if (!st.isFile()) continue;
    if (!isMachO(fullPath)) continue;

    // Our build script names outputs like: <fixtureName>__<variant>
    const [fixtureName, variant] = file.split('__');
    const intent = labelByFixtureName.get(fixtureName) ?? 'unknown';

    const buf = fs.readFileSync(fullPath);
    const sha256 = createHash('sha256').update(buf).digest('hex');
    const arch = getArchitecture(fullPath);

    // Enforce our Phase 0 decision (arm64-first). If you want to allow universal later,
    // loosen this filter.
    if (arch !== 'arm64') continue;

    collected.push({
      filename: file,
      fullPath,
      size: st.size,
      sha256,
      type: 'binary',
      architecture: arch,
      intent_label: intent,
      fixture_name: fixtureName,
      build_variant: variant || 'unknown'
    });
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        platform: 'darwin',
        collection_date: new Date().toISOString(),
        total_files: collected.length,
        files: collected
      },
      null,
      2
    )
  );

  console.log(`Collected ${collected.length} fixture binaries`);
  console.log(`Saved to: ${outputPath}`);
}

if (require.main === module) {
  main();
}

