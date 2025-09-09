# Exam Document Converter - WebAssembly Edition

A client-side document converter for competitive exam applications, powered by Python and Rust WebAssembly modules. No servers required!

## 🚀 Features

- **100% Client-Side Processing**: Python for intelligent document analysis, Rust for high-performance conversion
- **Advanced Document Analysis**: Python-powered NLP and pattern matching for smart document classification
- **High-Performance Conversion**: Rust-powered image processing and document optimization
- **Multiple Exam Support**: NEET, JEE, UPSC, CAT, GATE
- **Smart Document Analysis**: Automatically suggests better file names based on content
- **Format Conversion**: Convert between PDF, JPEG, PNG formats
- **Size Optimization**: Automatically compress files to meet exam requirements
- **Privacy First**: Your documents never leave your device

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Document Analysis**: Python (via Pyodide WebAssembly)
- **Document Conversion**: Rust (compiled to WebAssembly)
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📋 Supported Exams & Requirements

### NEET
- **Formats**: PDF, JPEG, JPG
- **Max Sizes**: PDF (2MB), JPEG/JPG (500KB)
- **Documents**: 10th/12th Marksheets, Category Certificate, Photo, Signature

### JEE
- **Formats**: PDF, JPEG, PNG
- **Max Sizes**: PDF (1MB), JPEG/PNG (300KB)
- **Documents**: 10th/12th Certificates, Category Certificate, Photo, Signature

### UPSC
- **Formats**: PDF, JPEG, JPG, PNG
- **Max Sizes**: PDF (3MB), Images (1MB)
- **Documents**: Educational Certificates, Age Proof, Category Certificate, Photo, Signature

### CAT
- **Formats**: PDF, JPEG
- **Max Sizes**: PDF (1.5MB), JPEG (400KB)
- **Documents**: Graduation Certificate, Category Certificate, Photo, Signature

### GATE
- **Formats**: PDF, JPEG, PNG
- **Max Sizes**: PDF (2MB), Images (500KB)
- **Documents**: Degree Certificate, Category Certificate, Photo, Signature

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Modern web browser with WebAssembly support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exam-document-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build WebAssembly modules**
   ```bash
   ./build-wasm.sh
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 How to Use

1. **Select Exam Type**: Choose from NEET, JEE, UPSC, CAT, or GATE
2. **Upload Documents**: Drag and drop or click to select files
3. **Smart Analysis**: The app analyzes your files and suggests better names
4. **Convert**: Click "Convert Documents" to process files
5. **Download**: Download individual files or all at once

## 🔧 Features in Detail

### Python-Powered Document Analysis
- **Advanced NLP**: Uses sophisticated pattern matching and keyword analysis
- **Document Classification**: Automatically detects document types (marksheet, certificate, photo, etc.)
- **Education Level Detection**: Identifies 10th, 12th, graduation, post-graduation documents
- **Smart Naming**: Generates standardized file names based on content analysis
- **Confidence Scoring**: Provides accuracy metrics for each analysis

### Rust-Powered Document Conversion
- **High-Performance Image Processing**: Fast JPEG/PNG compression and resizing
- **Memory Efficient**: Optimized algorithms for large file handling
- **Quality Control**: Advanced compression while maintaining visual quality
- **Format Validation**: Ensures files meet exam-specific requirements
- **Batch Processing**: Efficient handling of multiple files simultaneously

### Privacy & Security
- **No Server Communication**: All processing happens locally
- **No Data Upload**: Your documents never leave your device
- **Secure Processing**: Uses browser's built-in security features
- **Memory Management**: Automatic cleanup of processed files

## 🏗️ Architecture

```
src/
├── wasm/                 # WebAssembly modules
│   ├── python/          # Python document analyzer
│   │   └── document_analyzer.py
│   └── rust/            # Rust document converter
│       ├── Cargo.toml
│       └── src/lib.rs
├── components/           # React components
│   ├── DragAndDropFile.jsx
│   ├── ExamSelector.tsx
│   ├── ExamRequirements.tsx
│   └── ConversionProgress.tsx
├── config/              # Configuration files
│   └── examConfigs.ts   # Exam-specific settings
├── services/            # Business logic
│   └── wasmService.ts   # WebAssembly service layer
├── types/               # TypeScript definitions
│   └── index.ts
└── App.jsx              # Main application component
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `./build-wasm.sh` - Build WebAssembly modules

### Building WebAssembly Modules

The application uses two WebAssembly modules:

1. **Python Module (Pyodide)**:
   - Automatically loaded from CDN
   - Contains advanced document analysis logic
   - No build step required

2. **Rust Module**:
   - Requires `wasm-pack` for compilation
   - High-performance document conversion
   - Build with `./build-wasm.sh`
### Adding New Exam Types

1. Update `src/config/examConfigs.ts`:
   ```typescript
   newExam: {
     name: 'New Exam',
     formats: ['PDF', 'JPEG'],
     maxSizes: {
       PDF: 2 * 1024 * 1024,
       JPEG: 500 * 1024
     },
     requirements: ['Document 1', 'Document 2']
   }
   ```

2. The UI will automatically include the new exam type.

### Customizing Python Document Analysis

Modify the patterns in `src/wasm/python/document_analyzer.py`:

```typescript
document_patterns = {
    'new_type': {
        'keywords': ['keyword1', 'keyword2'],
        'patterns': [r'pattern1', r'pattern2']
    }
}
```

### Customizing Rust Document Conversion

Modify the conversion logic in `src/wasm/rust/src/lib.rs`:

```rust
// Add new format support
match target_format.to_uppercase().as_str() {
    "NEW_FORMAT" => {
        // Conversion logic here
    }
}
```

## 🌐 Browser Compatibility

- Chrome 69+
- Firefox 62+
- Safari 14+
- Edge 79+

All modern browsers with WebAssembly support.

## 📱 Mobile Support

The application is fully responsive and works on:
- iOS Safari 14+
- Chrome Mobile 69+
- Firefox Mobile 62+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run lint`
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check browser console for errors
2. Ensure your browser supports WebAssembly
3. Try refreshing the page
4. Clear browser cache if needed

## 🔮 Future Enhancements

- [ ] OCR text extraction from images (Python + Tesseract WASM)
- [ ] Advanced PDF manipulation (Rust + PDF libraries)
- [ ] Batch processing improvements
- [ ] Additional file format support
- [ ] Advanced image editing tools (Rust + image processing)
- [ ] Offline PWA capabilities
- [ ] Multi-language support
- [ ] Machine learning document classification

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the lightning-fast build tool
- Tailwind CSS for the utility-first styling
- Lucide for the beautiful icons
- Pyodide team for Python in the browser
- Rust and wasm-pack teams for high-performance WebAssembly
- WebAssembly community for making advanced client-side processing possible