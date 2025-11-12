#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

interface Label {
  sha256: string;
  filename: string;
  intent_label: string;
  confidence: string;
  notes: string;
}

interface BinaryFeatures {
  filename: string;
  sha256: string;
  size: number;
  architecture: string;
  system_calls: string[];
  strings: string[];
  function_count: number;
  instruction_count: number;
}

interface TrainingExample extends BinaryFeatures {
  intent_label: string;
  confidence: string;
  notes: string;
}

class TrainingDatasetBuilder {
  async build(analysisPath: string, labelsPath: string, outputPath: string): Promise<void> {
    console.log('Building ML training dataset...\n');

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const labelsData = JSON.parse(fs.readFileSync(labelsPath, 'utf-8'));

    const binaries: BinaryFeatures[] = analysisData.binaries;
    const labels: Label[] = labelsData.labels;

    console.log(`Total binaries analyzed: ${binaries.length}`);
    console.log(`Total binaries labeled: ${labels.length}\n`);

    const trainingExamples: TrainingExample[] = [];

    labels.forEach(label => {
      const binary = binaries.find(b => b.sha256 === label.sha256);
      if (binary) {
        trainingExamples.push({
          ...binary,
          intent_label: label.intent_label,
          confidence: label.confidence,
          notes: label.notes
        });
      } else {
        console.warn(`Warning: No analysis found for ${label.filename} (${label.sha256})`);
      }
    });

    const labelCounts: { [key: string]: number } = {};
    trainingExamples.forEach(ex => {
      labelCounts[ex.intent_label] = (labelCounts[ex.intent_label] || 0) + 1;
    });

    console.log('Dataset distribution:');
    Object.entries(labelCounts).forEach(([label, count]) => {
      console.log(`  ${label}: ${count}`);
    });

    const output = {
      created_at: new Date().toISOString(),
      total_examples: trainingExamples.length,
      label_distribution: labelCounts,
      examples: trainingExamples
    };

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nTraining dataset saved to: ${outputPath}`);
    console.log(`Ready for ML training!`);
  }
}

async function main() {
  const analysisPath = path.join(__dirname, '../data/processed/binary-analysis.json');
  const labelsPath = path.join(__dirname, '../data/labeled/labeled-binaries.json');
  const outputPath = path.join(__dirname, '../data/training/ml-dataset.json');

  if (!fs.existsSync(analysisPath)) {
    console.error(`Error: Analysis file not found at ${analysisPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(labelsPath)) {
    console.error(`Error: Labels file not found at ${labelsPath}`);
    console.error('Run "npm run label" first to label binaries.');
    process.exit(1);
  }

  const builder = new TrainingDatasetBuilder();
  await builder.build(analysisPath, labelsPath, outputPath);
}

if (require.main === module) {
  main().catch(console.error);
}

