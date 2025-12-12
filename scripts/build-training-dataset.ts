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
  async build(
    analysisPath: string,
    labelsPath: string,
    outputPath: string,
    opts?: { forceEmbeddedLabels?: boolean }
  ): Promise<void> {
    console.log('Building ML training dataset...\n');

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const binaries: BinaryFeatures[] = analysisData.binaries;
    console.log(`Total binaries analyzed: ${binaries.length}`);

    /**
     * Two supported labeling modes:
     *
     * 1) Manual labeling mode (old workflow):
     *    - labelsPath exists (data/labeled/labeled-binaries.json)
     *    - we join by sha256 and attach intent_label
     *
     * 2) Fixtures mode (new workflow):
     *    - labelsPath may NOT exist
     *    - the collector/analyzer already carries `intent_label` through
     *      because fixtures have ground-truth labels from the manifest
     */
    let trainingExamples: TrainingExample[] = [];

    // If analysis already contains labels (fixtures workflow), prefer those unless:
    // - you explicitly want the manual labels file, AND
    // - the labels actually match binaries in this analysis run.
    const embedded = binaries.filter((b: any) => typeof (b as any).intent_label === 'string');
    const hasEmbedded = embedded.length > 0;

    if (opts?.forceEmbeddedLabels && hasEmbedded) {
      console.log(`Using embedded labels from analysis (forced): ${embedded.length}\n`);
      trainingExamples = embedded.map((b: any) => ({
        ...(b as any),
        confidence: (b as any).confidence || 'high',
        notes: (b as any).notes || ''
      }));
    } else if (fs.existsSync(labelsPath)) {
      const labelsData = JSON.parse(fs.readFileSync(labelsPath, 'utf-8'));
      const labels: Label[] = labelsData.labels;
      const joinable = labels.filter(l => binaries.some(b => b.sha256 === l.sha256));

      // If the labels file doesn't match this analysis run but embedded labels exist,
      // we fall back to embedded labels automatically.
      if (joinable.length === 0 && hasEmbedded) {
        console.log(`Labels file exists at ${labelsPath} but doesn't match this analysis run.`);
        console.log(`Falling back to embedded labels from analysis (fixtures mode): ${embedded.length}\n`);
        trainingExamples = embedded.map((b: any) => ({
          ...(b as any),
          confidence: (b as any).confidence || 'high',
          notes: (b as any).notes || ''
        }));
      } else {
        console.log(`Total binaries labeled (labels file): ${labels.length}`);
        console.log(`Matched labels for this analysis: ${joinable.length}\n`);

        joinable.forEach(label => {
          const binary = binaries.find(b => b.sha256 === label.sha256);
          if (!binary) return;
          trainingExamples.push({
            ...binary,
            intent_label: label.intent_label,
            confidence: label.confidence,
            notes: label.notes
          });
        });
      }
    } else {
      // Fixtures mode: use intent_label already present in analysis JSON
      console.log(`Labels file not found at ${labelsPath}`);
      console.log(`Using embedded labels from analysis (fixtures mode): ${embedded.length}\n`);

      trainingExamples = embedded.map((b: any) => ({
        ...(b as any),
        // fixtures are ground-truth, so default confidence can be "high"
        confidence: 'high',
        notes: ''
      }));
    }

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
  const forceEmbeddedLabels = process.argv.includes('--embedded');

  if (!fs.existsSync(analysisPath)) {
    console.error(`Error: Analysis file not found at ${analysisPath}`);
    process.exit(1);
  }

  const builder = new TrainingDatasetBuilder();
  await builder.build(analysisPath, labelsPath, outputPath, { forceEmbeddedLabels });
}

if (require.main === module) {
  main().catch(console.error);
}

