#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

interface CollectedFile {
  filename: string;
  fullPath: string;
  size: number;
  sha256: string;
  type: 'binary' | 'dylib';
  architecture: string;
}

class MacFileCollector {
  private collectedFiles: CollectedFile[] = [];
  
  private readonly TARGET_DIRS = [
    '/bin',
    '/usr/bin',
    '/usr/sbin',
    '/sbin'
  ];

  private readonly SKIP_PATTERNS = [
    /^perl/i,
    /^python/i,
    /^ruby/i,
    /\d+\.\d+/,
  ];

  async collectFiles(maxFiles: number = 30): Promise<CollectedFile[]> {
    console.log('Starting macOS file collection...');
    console.log(`Target: ${maxFiles} files`);
    
    for (const dir of this.TARGET_DIRS) {
      if (this.collectedFiles.length >= maxFiles) break;
      
      console.log(`\nScanning: ${dir}`);
      const beforeCount = this.collectedFiles.length;
      await this.scanDirectory(dir, maxFiles);
      const addedCount = this.collectedFiles.length - beforeCount;
      console.log(`  Found ${addedCount} files`);
    }
    
    console.log(`\nTotal collected: ${this.collectedFiles.length} files`);
    this.printCollectionStats();
    
    return this.collectedFiles;
  }

  private async scanDirectory(dirPath: string, maxFiles: number): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        console.log(`  Directory not found: ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        if (this.collectedFiles.length >= maxFiles) break;
        
        const fullPath = path.join(dirPath, file);
        
        if (this.SKIP_PATTERNS.some(pattern => pattern.test(file))) {
          continue;
        }
        
        try {
          const stats = fs.statSync(fullPath);
          
          if (!stats.isFile() || stats.isSymbolicLink()) continue;
          if (stats.size > 10 * 1024 * 1024 || stats.size < 5 * 1024) continue;
          
          if (!this.isBinary(fullPath)) continue;
          
          const fileData = fs.readFileSync(fullPath);
          const sha256 = createHash('sha256').update(fileData).digest('hex');
          const architecture = this.getArchitecture(fullPath);
          
          const collectedFile: CollectedFile = {
            filename: file,
            fullPath: fullPath,
            size: stats.size,
            sha256: sha256,
            type: fullPath.endsWith('.dylib') ? 'dylib' : 'binary',
            architecture: architecture
          };
          
          this.collectedFiles.push(collectedFile);
          console.log(`  + ${file} (${Math.round(stats.size / 1024)}KB, ${architecture})`);
          
        } catch (error: any) {
          // Skip files we can't access
        }
      }
    } catch (error) {
      console.log(`Cannot access ${dirPath}: ${error}`);
    }
  }

  private isBinary(filePath: string): boolean {
    try {
      const buffer = fs.readFileSync(filePath, { flag: 'r' });
      
      // Mach-O magic numbers
      const magicNumbers = [
        0xFEEDFACE, // 32-bit
        0xFEEDFACF, // 64-bit
        0xCAFEBABE, // Universal binary
        0xCEFAEDFE, // 32-bit reverse
        0xCFFAEDFE  // 64-bit reverse
      ];
      
      if (buffer.length < 4) return false;
      
      const magic = buffer.readUInt32BE(0);
      return magicNumbers.includes(magic);
      
    } catch (error) {
      return false;
    }
  }

  private getArchitecture(filePath: string): string {
    try {
      const output = execSync(`file "${filePath}"`, { encoding: 'utf-8' });
      
      if (output.includes('arm64')) return 'arm64';
      if (output.includes('x86_64')) return 'x86_64';
      if (output.includes('i386')) return 'i386';
      if (output.includes('universal binary')) return 'universal';
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private printCollectionStats(): void {
    const binaryFiles = this.collectedFiles.filter(f => f.type === 'binary');
    const dylibFiles = this.collectedFiles.filter(f => f.type === 'dylib');
    
    console.log(`  Binary files: ${binaryFiles.length}`);
    console.log(`  Dynamic libraries: ${dylibFiles.length}`);
    
    const archCounts = new Map<string, number>();
    this.collectedFiles.forEach(f => {
      archCounts.set(f.architecture, (archCounts.get(f.architecture) || 0) + 1);
    });
    
    console.log(`  Architecture distribution:`);
    archCounts.forEach((count, arch) => {
      console.log(`    ${arch}: ${count}`);
    });
    
    const sizes = this.collectedFiles.map(f => f.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    
    console.log(`  Average size: ${Math.round(avgSize / 1024)}KB`);
    
    console.log(`\nSample files:`);
    this.collectedFiles.slice(0, 5).forEach(file => {
      console.log(`  - ${file.filename} (${Math.round(file.size / 1024)}KB, ${file.architecture})`);
    });
    
    if (this.collectedFiles.length > 5) {
      console.log(`  ... and ${this.collectedFiles.length - 5} more`);
    }
  }

  async saveToFile(outputPath: string): Promise<void> {
    const data = {
      platform: 'darwin',
      collection_date: new Date().toISOString(),
      total_files: this.collectedFiles.length,
      files: this.collectedFiles
    };
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\nSaved to: ${outputPath}`);
  }
}

async function main() {
  const collector = new MacFileCollector();
  
  const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 30;
  console.log(`Collecting ${targetCount} macOS binaries...\n`);
  
  const files = await collector.collectFiles(targetCount);
  
  const outputPath = path.join(__dirname, '../data/raw/collected-files-mac.json');
  await collector.saveToFile(outputPath);
  
  console.log('\nCollection complete!');
  console.log(`Total files: ${files.length}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { MacFileCollector, CollectedFile };

