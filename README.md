# IntentAI - Binary Intent Detection System

## Overview

IntentAI is a reverse engineering tool that analyzes binary executables to infer their intended functionality using AI-powered assembly code analysis. The system disassembles binary files and uses machine learning models to classify their operational intent, starting with filesystem operations.

## Problem Statement

When analyzing unknown binary executables, security researchers and reverse engineers need to quickly understand what a program does without access to source code. Manual reverse engineering is time-consuming and requires specialized expertise. IntentAI automates this process by:

1. **Disassembling** binary executables into assembly code
2. **Analyzing** assembly patterns using trained AI models  
3. **Classifying** the program's intended functionality
4. **Providing** confidence scores and detailed analysis

## Current Focus: Filesystem Intent Detection

The initial implementation focuses on detecting filesystem-related operations:

- **File Readers**: Programs that read file contents (cat, type, notepad, text editors)
- **File Writers**: Programs that write/modify files (echo, copy, text editors in write mode)
- **Directory Operations**: Programs that manipulate directories (ls, dir, mkdir, rmdir)
- **File Manipulators**: Programs that move/rename/delete files (mv, rm, del, rename)
- **Archive Tools**: Programs that compress/extract files (zip, tar, 7zip, winrar)

## Architecture

### Hybrid Local-Cloud Approach

**Local Components (Node.js/TypeScript):**
- Binary file parsing and validation
- Disassembly pipeline using external tools
- Data preprocessing and feature extraction
- Trained model inference API
- Web interface for file uploads

**Cloud Components (Python/Google Colab):**
- Dataset preprocessing for training
- Machine learning model training
- Model validation and testing
- Model export for local inference

### Data Flow

```
Binary File → PE Parser → Disassembler → Assembly Code → Feature Extractor → AI Model → Intent Classification
```

## Technical Stack

**Backend:**
- Node.js with TypeScript
- External disassembler (Ghidra/radare2/objdump)
- Express.js for API endpoints
- File system operations for data management

**Machine Learning:**
- Python with Hugging Face Transformers
- Google Colab for free GPU training
- Pre-trained language models fine-tuned for assembly analysis
- Classification models for intent detection

**Frontend:**
- Simple web interface for file uploads
- Results visualization
- Confidence score display

## Project Structure

```
IntentAI/
├── src/
│   ├── pipeline/           # Data processing pipeline
│   │   ├── parser.ts       # PE executable parser
│   │   ├── disassembler.ts # Assembly extraction
│   │   └── processor.ts    # Data preprocessing
│   ├── disassembler/       # Disassembly integration
│   ├── dataset/            # Dataset collection tools
│   ├── api/               # REST API endpoints
│   └── index.ts           # Main application entry
├── data/
│   ├── raw/               # Original binary files
│   ├── processed/         # Extracted assembly code
│   └── labeled/           # Training dataset with labels
├── models/                # Trained model artifacts
├── scripts/               # Utility and automation scripts
├── notebooks/             # Jupyter/Colab training notebooks
└── web/                   # Frontend interface
```

## Features

### Core Features
- [ ] Binary file upload and validation
- [ ] PE executable parsing
- [ ] Assembly code extraction
- [ ] Intent classification for filesystem operations
- [ ] Confidence scoring
- [ ] Results export (JSON/CSV)

### Advanced Features (Future)
- [ ] Support for multiple architectures (x86, x64, ARM)
- [ ] Malware detection capabilities
- [ ] Network operation intent detection
- [ ] Registry operation analysis
- [ ] Batch processing for multiple files
- [ ] Historical analysis and trends

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ (for training)
- Git
- External disassembler tool (Ghidra recommended)

### Local Development Setup

1. **Clone the repository:**
```bash
git clone <repo-url>
cd IntentAI
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the project:**
```bash
npm run build
```

4. **Run in development mode:**
```bash
npm run dev
```

### Training Setup (Google Colab)

1. Open the provided Colab notebook
2. Upload processed dataset
3. Configure training parameters
4. Train the model
5. Download trained model artifacts

## Usage

### Basic Usage
```bash
# Start the development server
npm run dev

# Upload a binary file through the web interface
# View the intent classification results
# Download detailed analysis report
```

### API Usage
```bash
# Upload binary for analysis
POST /api/analyze
Content-Type: multipart/form-data
Body: binary file

# Get analysis results
GET /api/results/{analysisId}

# List all analyses
GET /api/analyses
```

## Dataset

### Data Sources
- Windows System32 utilities
- Common open-source tools compiled for Windows
- Curated filesystem utility collection
- Properly labeled training examples

### Data Format
```json
{
  "filename": "copy.exe",
  "sha256": "hash",
  "assembly_code": "mov eax, [ebp+8]...",
  "intent_label": "file_writer",
  "confidence": 0.95,
  "operations": ["file_read", "file_write"]
}
```

## Training Process

1. **Data Collection**: Gather labeled Windows executables
2. **Preprocessing**: Extract assembly code and features
3. **Model Training**: Fine-tune transformer model on assembly patterns
4. **Validation**: Test on holdout dataset
5. **Export**: Convert model for local inference

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## Security Considerations

- All uploaded binaries are processed in isolated environments
- No execution of analyzed binaries
- Secure handling of potentially malicious files
- Data privacy for sensitive binary analysis

## Limitations

- Currently supports PE executables only
- Focused on filesystem operations initially
- Requires external disassembler installation
- Training requires cloud resources for optimal performance

## Future Roadmap

- [ ] Support for ELF and Mach-O binaries
- [ ] Real-time analysis capabilities
- [ ] Integration with existing reverse engineering tools
- [ ] Multi-language intent detection
- [ ] Advanced visualization of analysis results
