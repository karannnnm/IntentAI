#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface CollectedFile {
  filename: string;
  fullPath: string;
  size: number;
  sha256: string;
  type: string;
  architecture?: string;
  // Optional: if the collector already knows the label (fixtures workflow),
  // we can carry it through for dataset building without manual labeling.
  intent_label?: string;
  fixture_name?: string;
  build_variant?: string;
}

interface BinaryFeatures {
  filename: string;
  fullPath: string;
  sha256: string;
  size: number;
  architecture: string;
  system_calls: string[];
  strings: string[];
  function_count: number;
  instruction_count: number;
  analysis_success: boolean;
  error?: string;
  // Optional passthrough metadata (useful for fixtures)
  intent_label?: string;
  fixture_name?: string;
  build_variant?: string;
}

class BinaryAnalyzer {
  private results: BinaryFeatures[] = [];

  async analyzeCollectedFiles(inputPath: string): Promise<BinaryFeatures[]> {
    console.log('Starting binary analysis...');
    console.log(`Reading from: ${inputPath}\n`);

    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const files: CollectedFile[] = data.files || [];

    console.log(`Found ${files.length} binaries to analyze\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Analyzing: ${file.filename}`);

      try {
        const features = await this.extractFeatures(file);
        this.results.push(features);

        if (features.analysis_success) {
          console.log(`  System calls: ${features.system_calls.length}`);
          console.log(`  Strings: ${features.strings.length}`);
          console.log(`  Functions: ${features.function_count}`);
        } else {
          console.log(`  Failed: ${features.error}`);
        }
      } catch (error: any) {
        console.log(`  Error: ${error.message}`);
      }

      console.log('');
    }

    console.log('Analysis Summary:');
    console.log(`  Total: ${this.results.length}`);
    console.log(`  Successful: ${this.results.filter(r => r.analysis_success).length}`);
    console.log(`  Failed: ${this.results.filter(r => !r.analysis_success).length}`);

    return this.results;
  }

  private async extractFeatures(file: CollectedFile): Promise<BinaryFeatures> {
    const features: BinaryFeatures = {
      filename: file.filename,
      fullPath: file.fullPath,
      sha256: file.sha256,
      size: file.size,
      architecture: file.architecture || 'unknown',
      system_calls: [],
      strings: [],
      function_count: 0,
      instruction_count: 0,
      analysis_success: false,
      intent_label: file.intent_label,
      fixture_name: file.fixture_name,
      build_variant: file.build_variant
    };

    try {
      features.system_calls = this.extractSystemCalls(file.fullPath);
      features.strings = this.extractStrings(file.fullPath);
      const stats = this.extractStats(file.fullPath);
      features.function_count = stats.functions;
      features.instruction_count = stats.instructions;
      features.analysis_success = true;
    } catch (error: any) {
      features.error = error.message;
      features.analysis_success = false;
    }

    return features;
  }

  private extractSystemCalls(filePath: string): string[] {
    try {
      const output = execSync(`nm -u "${filePath}" 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024
      });

      const calls = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^_/, ''));

      return calls;
    } catch (error) {
      return [];
    }
  }

  private extractStrings(filePath: string): string[] {
    try {
      const output = execSync(`strings "${filePath}" 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024
      });

      const strings = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 3 && line.length < 100)
        .slice(0, 50);

      return strings;
    } catch (error) {
      return [];
    }
  }

  private extractStats(filePath: string): { functions: number; instructions: number } {
    try {
      // On macOS, `otool` is the most reliable built-in disassembly viewer for Mach-O.
      // We only use it here for *counts* (functions/instructions), not for training.
      //
      // Fallbacks:
      // - If otool is missing or fails, try objdump.
      let output = '';
      let usedOtool = false;
      try {
        output = execSync(`otool -tv "${filePath}" 2>/dev/null`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        });
        usedOtool = true;
      } catch {
        output = execSync(`objdump -d "${filePath}" 2>/dev/null`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024
        });
      }

      const lines = output.split('\n');
      // objdump typically shows: "0000000100000460 <_main>:"
      // otool typically shows: "_main:" then instructions like:
      // "0000000100000460\tadd\tx29, sp, #0x10"
      const functionCount = usedOtool
        ? lines.filter(line => /^_[A-Za-z0-9$_.]+:$/.test(line.trim())).length
        : lines.filter(line => /^[0-9a-f]+ <.*>:/.test(line)).length;

      const instructionCount = usedOtool
        ? lines.filter(line => /^[0-9a-fA-F]{8,16}\t/.test(line)).length
        : lines.filter(line => /^\s*[0-9a-f]+:/.test(line)).length;

      return {
        functions: functionCount,
        instructions: instructionCount
      };
    } catch (error) {
      return { functions: 0, instructions: 0 };
    }
  }

  async saveResults(outputPath: string): Promise<void> {
    const output = {
      analysis_date: new Date().toISOString(),
      total_binaries: this.results.length,
      successful_analyses: this.results.filter(r => r.analysis_success).length,
      binaries: this.results
    };

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nSaved analysis results to: ${outputPath}`);
  }
}

async function main() {
  const analyzer = new BinaryAnalyzer();

  // Allow passing an explicit input file:
  // - fixtures: data/raw/collected-fixtures.json
  // - old mac collector: data/raw/collected-files-mac.json
  const inputPath =
    process.argv[2] ||
    path.join(__dirname, '../data/raw/collected-fixtures.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Collected files not found at ${inputPath}`);
    console.error('Run one of:');
    console.error('  - npm run fixtures:build');
    console.error('  - npm run fixtures:collect');
    process.exit(1);
  }

  await analyzer.analyzeCollectedFiles(inputPath);

  const outputPath = path.join(__dirname, '../data/processed/binary-analysis.json');
  await analyzer.saveResults(outputPath);

  console.log('\nAnalysis complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { BinaryAnalyzer, BinaryFeatures };

