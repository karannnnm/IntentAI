#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

interface CollectedFile {
  filename: string;
  fullPath: string;
  size: number;
  sha256: string;
  type: 'exe' | 'dll';
}

class WindowsFileCollector {
  private collectedFiles: CollectedFile[] = [];
  
  // Common Windows directories with useful executables
  private readonly TARGET_DIRS = [
    'C:\\Windows\\System32',
    'C:\\Windows\\SysWOW64', 
    'C:\\Program Files\\Windows NT\\Accessories',
    'C:\\Program Files (x86)\\Windows NT\\Accessories'
  ];

  // Skip these files as they're usually stub/placeholder DLLs
  private readonly SKIP_PATTERNS = [
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, // GUID-named files
    /^api-ms-win-/i, // Windows API set stubs
    /^ext-ms-win-/i  // Extended API set stubs
  ];

  async collectFiles(maxFiles: number = 30): Promise<CollectedFile[]> {
    console.log('🔍 Starting Windows file collection...');
    console.log(`📋 Target: ${maxFiles} files`);
    console.log(`🎯 Looking for meaningful Windows executables (not stubs/placeholders)`);
    
    for (const dir of this.TARGET_DIRS) {
      if (this.collectedFiles.length >= maxFiles) break;
      
      console.log(`\n📂 Scanning: ${dir}`);
      const beforeCount = this.collectedFiles.length;
      await this.scanDirectory(dir, maxFiles);
      const addedCount = this.collectedFiles.length - beforeCount;
      console.log(`   Found ${addedCount} useful files in this directory`);
    }
    
    console.log(`\n✅ Collection Summary:`);
    console.log(`   Total collected: ${this.collectedFiles.length} files`);
    this.printCollectionStats();
    
    return this.collectedFiles;
  }

  private async scanDirectory(dirPath: string, maxFiles: number): Promise<void> {
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        if (this.collectedFiles.length >= maxFiles) break;
        
        const fullPath = path.join(dirPath, file);
        const ext = path.extname(file).toLowerCase();
        
        // Only collect .exe and .dll files
        if (ext === '.exe' ) {
          // Skip stub/placeholder files
          if (this.SKIP_PATTERNS.some(pattern => pattern.test(file))) {
            continue;
          }
          
          try {
            const stats = fs.statSync(fullPath);
            
            // Skip very large files (>10MB) and very small files (<5KB) 
            if (stats.size > 10 * 1024 * 1024 || stats.size < 5 * 1024) continue;
            
            const fileData = fs.readFileSync(fullPath);
            const sha256 = createHash('sha256').update(fileData).digest('hex');
            
            const collectedFile: CollectedFile = {
              filename: file,
              fullPath: fullPath,
              size: stats.size,
              sha256: sha256,
              type: ext.slice(1) as 'exe' | 'dll'
            };
            
            this.collectedFiles.push(collectedFile);
            console.log(`  ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
            
          } catch (error) {
            // Skip files we can't read (permissions, etc.)
            console.log(`  ⚠️  Skipped ${file}: Access denied`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Cannot access ${dirPath}: ${error}`);
    }
  }

  private printCollectionStats(): void {
    const exeFiles = this.collectedFiles.filter(f => f.type === 'exe');
    const dllFiles = this.collectedFiles.filter(f => f.type === 'dll');
    
    console.log(`   EXE files: ${exeFiles.length}`);
    console.log(`   DLL files: ${dllFiles.length}`);
    
    // Size distribution
    const sizes = this.collectedFiles.map(f => f.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    console.log(`   Size range: ${Math.round(minSize / 1024)}KB - ${Math.round(maxSize / 1024)}KB`);
    console.log(`   Average size: ${Math.round(avgSize / 1024)}KB`);
    
    // Show some interesting files
    console.log(`\n📋 Sample files collected:`);
    this.collectedFiles.slice(0, 5).forEach(file => {
      console.log(`   • ${file.filename} (${Math.round(file.size / 1024)}KB)`);
    });
    
    if (this.collectedFiles.length > 5) {
      console.log(`   ... and ${this.collectedFiles.length - 5} more`);
    }
  }

  async saveToFile(outputPath: string): Promise<void> {
    // Validate collected files before saving
    this.validateCollection();
    
    const data = {
      collection_date: new Date().toISOString(),
      total_files: this.collectedFiles.length,
      collection_quality: this.assessQuality(),
      files: this.collectedFiles
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved file list to: ${outputPath}`);
  }

  private validateCollection(): void {
    console.log(`\n🔍 Validating collection quality...`);
    
    const issues: string[] = [];
    
    // Check for duplicates
    const hashes = new Set();
    const duplicates = this.collectedFiles.filter(file => {
      if (hashes.has(file.sha256)) return true;
      hashes.add(file.sha256);
      return false;
    });
    
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate files`);
    }
    
    // Check for very small files (likely stubs)
    const tinyFiles = this.collectedFiles.filter(f => f.size < 10 * 1024); // < 10KB
    if (tinyFiles.length > 0) {
      issues.push(`${tinyFiles.length} files are very small (< 10KB) - might be stubs`);
    }
    
    // Check for system stub patterns that might have slipped through
    const suspiciousFiles = this.collectedFiles.filter(f => 
      f.filename.includes('api-ms-') || 
      f.filename.includes('ext-ms-') ||
      /^[0-9a-f-]{36}/.test(f.filename)
    );
    
    if (suspiciousFiles.length > 0) {
      issues.push(`${suspiciousFiles.length} files look like system stubs`);
    }
    
    if (issues.length === 0) {
      console.log(`   ✅ Collection looks good!`);
    } else {
      console.log(`   ⚠️  Quality issues found:`);
      issues.forEach(issue => console.log(`      • ${issue}`));
    }
  }

  private assessQuality(): string {
    const totalFiles = this.collectedFiles.length;
    const meaningfulFiles = this.collectedFiles.filter(f => 
      f.size >= 10 * 1024 && // At least 10KB
      !f.filename.includes('api-ms-') &&
      !f.filename.includes('ext-ms-') &&
      !/^[0-9a-f-]{36}/.test(f.filename)
    ).length;
    
    const qualityRatio = meaningfulFiles / totalFiles;
    
    if (qualityRatio >= 0.9) return 'excellent';
    if (qualityRatio >= 0.7) return 'good';
    if (qualityRatio >= 0.5) return 'fair';
    return 'poor';
  }
}

// Main execution
async function main() {
  const collector = new WindowsFileCollector();
  
  // Test with different collection sizes
  const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 20;
  console.log(`🎯 Collecting ${targetCount} files for testing...\n`);
  
  const files = await collector.collectFiles(targetCount);
  
  // Save to data/raw directory
  const outputPath = path.join(__dirname, '../data/raw/collected-files.json');
  await collector.saveToFile(outputPath);
  
  console.log('\n📋 Summary:');
  console.log(`Total files: ${files.length}`);
  console.log(`EXE files: ${files.filter(f => f.type === 'exe').length}`);
  console.log(`DLL files: ${files.filter(f => f.type === 'dll').length}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { WindowsFileCollector, CollectedFile };
