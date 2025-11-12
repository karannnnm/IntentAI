# IntentAI - Binary Intent Detection System

## Overview

IntentAI is a machine learning-powered tool that analyzes binary executables to automatically classify their intended functionality. By extracting features from binaries (system calls, strings, statistics) and training ML models on known executables, the system can predict the intent of unknown binaries.

## Current Status

**Phase 1: Data Collection & Labeling** ✅ (In Progress)
- Binary collection from macOS system directories
- Feature extraction (system calls, strings, statistics)
- Manual labeling interface
- Training dataset preparation

**Phase 2: ML Model Training** (Next)
- Train classification model in Google Colab
- Evaluate accuracy on test set
- Export model for local inference

**Phase 3: Web Application** (Future)
- Upload interface for unknown binaries
- Real-time intent classification
- Confidence scores and detailed analysis

## Intent Categories

The system currently classifies binaries into these categories:

1. **file_reader** - Reads file contents (cat, less, head, tail)
2. **file_writer** - Writes/creates files (echo, tee, editors)
3. **directory_ops** - Directory operations (ls, mkdir, rmdir, cd)
4. **file_manipulator** - Moves/renames/deletes files (mv, cp, rm)
5. **archive_tool** - Compression/extraction (tar, zip, gzip)
6. **system_utility** - System operations (ps, kill, top)
7. **unknown** - Uncertain or other functionality

## Technical Stack

**Data Collection & Processing:**
- Node.js 18+ with TypeScript
- Native tools: `objdump`, `nm`, `strings`, `file`
- Cross-platform support (macOS, Windows, Linux)

**Machine Learning:**
- Python with scikit-learn or Hugging Face Transformers
- Google Colab for training (free GPU)
- Feature-based or transformer-based classification

**Storage:**
- JSON files for dataset storage
- Separate files for: raw data, analysis, labels, training data

## Project Structure

```
IntentAI/
├── scripts/
│   ├── collect-files.ts           # Windows binary collector
│   ├── collect-files-mac.ts       # macOS binary collector
│   ├── analyze-binaries.ts        # Feature extraction
│   ├── label-binaries.ts          # Interactive labeling CLI
│   └── build-training-dataset.ts  # Merge labels with features
├── data/
│   ├── raw/                       # Collected binary metadata
│   │   └── collected-files-mac.json
│   ├── processed/                 # Extracted features
│   │   └── binary-analysis.json
│   ├── labeled/                   # Manual labels (minimal)
│   │   └── labeled-binaries.json
│   └── training/                  # ML-ready dataset
│       └── ml-dataset.json
├── learning/                      # Assembly learning resources
│   ├── c-examples/                # Simple C programs for study
│   ├── assembly-output/           # Disassembled examples
│   └── ASSEMBLY-GUIDE.md          # Learning documentation
├── models/                        # Trained ML models (future)
├── notebooks/                     # Jupyter/Colab notebooks (future)
└── src/                           # Application code (future)
```

## Current Features

### Implemented ✅
- [x] Binary collection from macOS system directories
- [x] Cross-platform collector (Windows/Mac/Linux)
- [x] Feature extraction (system calls, strings, stats)
- [x] Interactive CLI labeling tool with auto-suggestions
- [x] Training dataset builder
- [x] Assembly learning sandbox with C examples

### In Progress 🚧
- [ ] Complete labeling of collected binaries (2/30 done)
- [ ] Train initial ML model in Google Colab
- [ ] Model evaluation and accuracy testing

### Planned 📋
- [ ] Web interface for binary upload
- [ ] Real-time intent classification API
- [ ] Confidence scoring and explanations
- [ ] Batch processing
- [ ] Support for more architectures
- [ ] Expanded intent categories

## Installation & Setup

### Prerequisites
- **Node.js 18+** and npm
- **macOS**: Built-in tools (objdump, nm, strings, file)
- **Windows**: Install MinGW or WSL for objdump
- **Python 3.8+** (for ML training in Colab)

### Quick Start

1. **Clone and install:**
```bash
git clone <repo-url>
cd IntentAI
npm install
```

2. **Collect binaries (macOS example):**
```bash
npm run collect:mac 30
```
This scans `/bin`, `/usr/bin`, etc. and collects 30 binaries.

3. **Extract features:**
```bash
npm run analyze
```
Extracts system calls, strings, and statistics from each binary.

4. **Label binaries:**
```bash
npm run label
```
Interactive CLI tool to classify each binary's intent.

5. **Build training dataset:**
```bash
npm run build-dataset
```
Merges labels with features into ML-ready format.

## Usage

### Data Collection Pipeline

```bash
# Collect binaries from system directories
npm run collect:mac [count]      # macOS
npm run collect:windows [count]  # Windows

# Analyze collected binaries
npm run analyze

# Label binaries interactively
npm run label

# Build ML training dataset
npm run build-dataset
```

### Labeling Tool Commands

When running `npm run label`:
- **1-6**: Select intent category
- **s**: Skip binary
- **b**: Go back
- **r**: Review all labels
- **q**: Quit and save

### Learning Assembly (Optional)

Study how binaries work with included examples:

```bash
cd learning
./compile-and-disassemble.sh  # Compile C examples
bash analyze-for-ml.sh <binary>  # Analyze any binary
```

## Dataset

### Data Sources
- macOS system binaries (`/bin`, `/usr/bin`)
- Windows system utilities (`C:\Windows\System32`)
- Common Unix/Linux tools
- Manually labeled with ground truth intents

### Training Data Format

**Labels** (minimal, no duplication):
```json
{
  "labels": [
    {
      "sha256": "abc123...",
      "filename": "cat",
      "intent_label": "file_reader",
      "confidence": "high",
      "notes": ""
    }
  ]
}
```

**ML Dataset** (merged features + labels):
```json
{
  "examples": [
    {
      "filename": "cat",
      "sha256": "abc123...",
      "system_calls": ["read", "write", "open", "close"],
      "strings": ["usage: cat", "cannot open"],
      "size": 118992,
      "architecture": "arm64",
      "intent_label": "file_reader",
      "confidence": "high"
    }
  ]
}
```

## ML Training Process (Next Phase)

1. **Prepare Dataset**: 
   - Collect 100-200+ labeled binaries
   - Balance classes (equal samples per intent)
   - Split into train/validation/test sets

2. **Feature Engineering**:
   - System call frequency vectors
   - String embeddings
   - Statistical features (size, complexity)

3. **Model Training** (Google Colab):
   - Option A: Traditional ML (Random Forest, SVM)
   - Option B: Transformer-based (fine-tuned BERT/CodeBERT)
   - Hyperparameter tuning
   - Cross-validation

4. **Evaluation**:
   - Test set accuracy >80%
   - Per-class precision/recall
   - Confusion matrix analysis

5. **Export & Deploy**:
   - Save model weights
   - Build inference API
   - Integrate with web app

## How to Contribute

### Help Label Binaries
The project needs more labeled training data! You can:
1. Run `npm run collect:mac` on your system
2. Label binaries with `npm run label`
3. Share your `labeled-binaries.json` file

### Add More Features
- Implement better feature extraction
- Add support for more platforms
- Improve the labeling tool UX
- Create training notebooks

### Standard Contribution Process
1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## Security Considerations

⚠️ **Important**: This tool analyzes binaries but **never executes them**.
- All analysis is static (no code execution)
- Use caution when analyzing untrusted binaries
- Malicious files cannot harm your system during analysis
- Consider running in a VM for extra safety

## Current Limitations

- Requires 100+ labeled examples per category for good accuracy
- Only extracts basic features (system calls, strings)
- No deep semantic analysis yet
- Manual labeling is time-consuming
- Model training requires Python/Colab setup

## Future Roadmap

**Near Term:**
- [ ] Train and validate first ML model
- [ ] Build web interface for binary upload
- [ ] Real-time classification API
- [ ] Confidence explanations

**Long Term:**
- [ ] Support for more architectures (x86, ARM, RISC-V)
- [ ] Malware detection capabilities
- [ ] Network intent detection (sockets, HTTP)
- [ ] Multi-label classification (binaries with multiple intents)
- [ ] Integration with IDA Pro / Ghidra
- [ ] Automated binary collection from GitHub

## Questions or Issues?

- Check `learning/ASSEMBLY-GUIDE.md` for assembly basics
- Check `learning/CODE-VS-DATA.md` to understand binaries
- Open an issue on GitHub
- Review the PRD.md for project goals
