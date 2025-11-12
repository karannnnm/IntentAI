#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

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
}

interface LabeledBinary extends BinaryFeatures {
  intent_label?: string;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

const INTENT_CATEGORIES = {
  '1': 'file_reader',
  '2': 'file_writer',
  '3': 'directory_ops',
  '4': 'file_manipulator',
  '5': 'archive_tool',
  '6': 'system_utility',
  '0': 'unknown'
};

class BinaryLabeler {
  private binaries: LabeledBinary[] = [];
  private currentIndex: number = 0;
  private outputPath: string;
  private rl: readline.Interface;

  constructor(inputPath: string, outputPath: string) {
    this.outputPath = outputPath;
    this.loadBinaries(inputPath);
    this.loadExistingLabels();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private loadBinaries(inputPath: string): void {
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    this.binaries = data.binaries;
    console.log(`Loaded ${this.binaries.length} binaries\n`);
  }

  private loadExistingLabels(): void {
    if (fs.existsSync(this.outputPath)) {
      const data = JSON.parse(fs.readFileSync(this.outputPath, 'utf-8'));
      const labels = data.labels || data.binaries || [];
      
      labels.forEach((label: any) => {
        const idx = this.binaries.findIndex(b => b.sha256 === label.sha256);
        if (idx !== -1) {
          this.binaries[idx].intent_label = label.intent_label;
          this.binaries[idx].confidence = label.confidence;
          this.binaries[idx].notes = label.notes;
        }
      });
      
      console.log(`Loaded ${labels.length} existing labels\n`);
    }
  }

  private suggestLabel(binary: LabeledBinary): string {
    const calls = binary.system_calls.map((c: string) => c.toLowerCase());
    
    const patterns = {
      file_reader: ['read', 'fread', 'fgets', 'getc', 'recv'],
      file_writer: ['write', 'fwrite', 'fprintf', 'fputs', 'send'],
      directory_ops: ['opendir', 'readdir', 'mkdir', 'rmdir', 'chdir'],
      file_manipulator: ['rename', 'unlink', 'remove', 'link', 'copy'],
      archive_tool: ['compress', 'uncompress', 'inflate', 'deflate']
    };

    const scores: { [key: string]: number } = {};
    
    for (const [intent, keywords] of Object.entries(patterns)) {
      scores[intent] = keywords.filter(kw => 
        calls.some((call: string) => call.includes(kw))
      ).length;
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      const suggested = Object.entries(scores).find(([_, score]) => score === maxScore);
      return suggested ? suggested[0] : 'unknown';
    }

    return 'unknown';
  }

  private displayBinary(binary: LabeledBinary): void {
    console.clear();
    console.log('='.repeat(80));
    console.log(`BINARY ${this.currentIndex + 1}/${this.binaries.length}`);
    console.log('='.repeat(80));
    console.log(`\nName:         ${binary.filename}`);
    console.log(`Size:         ${Math.round(binary.size / 1024)}KB`);
    console.log(`Architecture: ${binary.architecture}`);
    
    if (binary.intent_label) {
      console.log(`\nCURRENT LABEL: ${binary.intent_label} [${binary.confidence || 'medium'}]`);
      if (binary.notes) {
        console.log(`Notes: ${binary.notes}`);
      }
    }

    const suggested = this.suggestLabel(binary);
    console.log(`\nSUGGESTED:    ${suggested}`);

    console.log('\n--- SYSTEM CALLS (Key Evidence) ---');
    const uniqueCalls = [...new Set(binary.system_calls.map((c: string) => c.replace(/^_/, '')))];
    const importantCalls = uniqueCalls.filter((c: string) => 
      !c.includes('architecture') && 
      !c.includes('PROJECT') &&
      !c.startsWith('__')
    ).slice(0, 20);
    
    importantCalls.forEach((call: string, i: number) => {
      if (i % 4 === 0) console.log('');
      process.stdout.write(call.padEnd(20));
    });
    console.log('\n');

    console.log('--- STRINGS (Top 10) ---');
    binary.strings.slice(0, 10).forEach((str: string) => {
      if (str.length > 60) str = str.substring(0, 57) + '...';
      console.log(`  ${str}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('LABEL OPTIONS:');
    console.log('  1) file_reader       - Reads file contents');
    console.log('  2) file_writer       - Writes/creates files');
    console.log('  3) directory_ops     - Manages directories (ls, mkdir, etc.)');
    console.log('  4) file_manipulator  - Moves/renames/deletes files');
    console.log('  5) archive_tool      - Compression/archiving');
    console.log('  6) system_utility    - System operations (ps, kill, etc.)');
    console.log('  0) unknown           - Not sure / other');
    console.log('\nCOMMANDS:');
    console.log('  s) skip   b) back   q) quit & save   r) review all');
    console.log('='.repeat(80));
  }

  private async promptLabel(): Promise<void> {
    return new Promise((resolve) => {
      this.rl.question('\nYour choice: ', (answer) => {
        this.handleInput(answer.trim().toLowerCase());
        resolve();
      });
    });
  }

  private handleInput(input: string): void {
    const binary = this.binaries[this.currentIndex];

    if (input === 'q') {
      this.saveAndExit();
      return;
    }

    if (input === 's') {
      this.currentIndex++;
      return;
    }

    if (input === 'b') {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      return;
    }

    if (input === 'r') {
      this.reviewAll();
      return;
    }

    if (INTENT_CATEGORIES[input as keyof typeof INTENT_CATEGORIES]) {
      binary.intent_label = INTENT_CATEGORIES[input as keyof typeof INTENT_CATEGORIES];
      binary.confidence = 'medium';
      
      this.rl.question('Confidence (h/m/l) [default: m]: ', (conf) => {
        if (conf === 'h') binary.confidence = 'high';
        if (conf === 'l') binary.confidence = 'low';
        
        this.saveProgress();
        this.currentIndex++;
        this.continueLabeling();
      });
      return;
    }

    console.log('Invalid input. Please try again.');
  }

  private saveProgress(): void {
    const labeled = this.binaries.filter(b => b.intent_label);
    
    const labels = labeled.map(b => ({
      sha256: b.sha256,
      filename: b.filename,
      intent_label: b.intent_label,
      confidence: b.confidence,
      notes: b.notes || ''
    }));

    const output = {
      last_updated: new Date().toISOString(),
      total_binaries: this.binaries.length,
      labeled_count: labeled.length,
      labels: labels
    };

    fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2));
  }

  private saveAndExit(): void {
    this.saveProgress();
    const labeled = this.binaries.filter(b => b.intent_label);
    
    console.log('\n\nLabeling session saved!');
    console.log(`Labeled: ${labeled.length}/${this.binaries.length}`);
    console.log(`Saved to: ${this.outputPath}`);
    
    this.rl.close();
    process.exit(0);
  }

  private reviewAll(): void {
    console.clear();
    console.log('='.repeat(80));
    console.log('REVIEW ALL LABELS');
    console.log('='.repeat(80));
    
    const labeled = this.binaries.filter(b => b.intent_label);
    const byIntent: { [key: string]: string[] } = {};
    
    labeled.forEach(b => {
      const label = b.intent_label!;
      if (!byIntent[label]) byIntent[label] = [];
      byIntent[label].push(b.filename);
    });

    Object.entries(byIntent).forEach(([intent, files]) => {
      console.log(`\n${intent.toUpperCase()} (${files.length}):`);
      files.forEach(f => console.log(`  - ${f}`));
    });

    console.log(`\n\nTotal labeled: ${labeled.length}/${this.binaries.length}`);
    console.log(`Unlabeled: ${this.binaries.length - labeled.length}`);
    
    this.rl.question('\nPress Enter to continue labeling...', () => {
      this.continueLabeling();
    });
  }

  private async continueLabeling(): Promise<void> {
    if (this.currentIndex >= this.binaries.length) {
      console.log('\n\nAll binaries reviewed!');
      this.saveAndExit();
      return;
    }

    this.displayBinary(this.binaries[this.currentIndex]);
    await this.promptLabel();
    await this.continueLabeling();
  }

  async start(): Promise<void> {
    console.log('Binary Intent Labeling Tool');
    console.log('Navigate with numbers, s=skip, b=back, q=quit\n');
    
    const labeled = this.binaries.filter(b => b.intent_label).length;
    console.log(`Progress: ${labeled}/${this.binaries.length} labeled\n`);
    
    this.rl.question('Press Enter to start...', () => {
      this.continueLabeling();
    });
  }
}

async function main() {
  const inputPath = path.join(__dirname, '../data/processed/binary-analysis.json');
  const outputPath = path.join(__dirname, '../data/labeled/labeled-binaries.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Analysis file not found at ${inputPath}`);
    console.error('Run "npm run analyze" first.');
    process.exit(1);
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const labeler = new BinaryLabeler(inputPath, outputPath);
  await labeler.start();
}

if (require.main === module) {
  main().catch(console.error);
}

