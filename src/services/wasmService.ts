import { AnalysisResult, ConversionResult } from '../types';
import { examConfigs } from '../config/examConfigs';

// Import Pyodide for Python execution
declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

class WasmService {
  private pythonInitialized = false;
  private rustInitialized = false;
  private pyodide: any = null;
  private rustConverter: any = null;

  async initialize(): Promise<void> {
    if (this.pythonInitialized && this.rustInitialized) return;
    
    console.log('Initializing Python and Rust WebAssembly modules...');
    
    // Initialize Python (Pyodide)
    if (!this.pythonInitialized) {
      await this.initializePython();
    }
    
    // Initialize Rust WASM
    if (!this.rustInitialized) {
      await this.initializeRust();
    }
  }

  private async initializePython(): Promise<void> {
    try {
      // Load Pyodide
      if (!window.pyodide) {
        const pyodideScript = document.createElement('script');
        pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(pyodideScript);
        
        await new Promise((resolve) => {
          pyodideScript.onload = resolve;
        });
        
        window.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });
      }
      
      this.pyodide = window.pyodide;
      
      // Load the Python document analyzer
      const pythonCode = await this.loadPythonAnalyzer();
      await this.pyodide.runPython(pythonCode);
      
      console.log('Python document analyzer initialized');
      this.pythonInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Python:', error);
      throw error;
    }
  }

  private async initializeRust(): Promise<void> {
    try {
      // Check if WASM file exists and is valid before attempting to load
      const wasmResponse = await fetch('/wasm/rust/document_converter_bg.wasm');
      if (!wasmResponse.ok) {
        console.warn('WASM file not found, using fallback implementation');
        this.rustInitialized = false;
        return;
      }
      
      // Check if the response contains valid WASM binary
      const wasmArrayBuffer = await wasmResponse.arrayBuffer();
      const wasmBytes = new Uint8Array(wasmArrayBuffer);
      
      // Check for WASM magic number (0x00, 0x61, 0x73, 0x6d)
      if (wasmBytes.length < 4 || 
          wasmBytes[0] !== 0x00 || 
          wasmBytes[1] !== 0x61 || 
          wasmBytes[2] !== 0x73 || 
          wasmBytes[3] !== 0x6d) {
        console.warn('Invalid WASM file format, using fallback implementation');
        this.rustInitialized = false;
        return;
      }
      
      // Load the compiled Rust WASM module
      const wasmModule = await import('../../public/wasm/rust/document_converter.js');
      await wasmModule.default();
      this.rustConverter = wasmModule;
      console.log('Rust document converter initialized');
      this.rustInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Rust WASM module:', error);
      console.log('Falling back to client-side conversion');
      this.rustInitialized = false;
    }
  }

  private async loadPythonAnalyzer(): Promise<string> {
    try {
      const response = await fetch('/wasm/python/document_analyzer.py');
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn('Could not load Python analyzer from file, using embedded version');
    }
    
    // Fallback to embedded Python code
    return `
import re
import json
from typing import Dict, List, Tuple, Optional

class DocumentAnalyzer:
    def __init__(self):
        self.document_patterns = {
            'marksheet': {
                'keywords': [
                    'marksheet', 'mark sheet', 'grade report', 'academic record',
                    'transcript', 'result', 'marks', 'grades', 'cgpa', 'percentage'
                ],
                'patterns': [
                    r'mark\\s*sheet',
                    r'grade\\s*report',
                    r'academic\\s*record',
                    r'transcript',
                    r'result\\s*card',
                    r'marks?\\s*memo'
                ]
            },
            'certificate': {
                'keywords': [
                    'certificate', 'diploma', 'degree', 'qualification',
                    'completion', 'achievement', 'award'
                ],
                'patterns': [
                    r'certificate',
                    r'diploma',
                    r'degree',
                    r'qualification',
                    r'completion\\s*certificate'
                ]
            },
            'photo': {
                'keywords': [
                    'photo', 'photograph', 'image', 'picture', 'pic',
                    'passport size', 'headshot'
                ],
                'patterns': [
                    r'photo(?:graph)?',
                    r'image',
                    r'picture',
                    r'passport\\s*size',
                    r'headshot'
                ]
            },
            'signature': {
                'keywords': [
                    'signature', 'sign', 'autograph', 'signed'
                ],
                'patterns': [
                    r'signature',
                    r'sign(?:ed)?',
                    r'autograph'
                ]
            },
            'identity': {
                'keywords': [
                    'aadhar', 'aadhaar', 'pan card', 'voter id', 'passport',
                    'driving license', 'identity proof', 'id proof'
                ],
                'patterns': [
                    r'aa?dh?aa?r',
                    r'pan\\s*card',
                    r'voter\\s*id',
                    r'passport',
                    r'driving\\s*licen[cs]e',
                    r'identity\\s*proof',
                    r'id\\s*proof'
                ]
            },
            'category': {
                'keywords': [
                    'caste certificate', 'category certificate', 'reservation certificate',
                    'obc', 'sc', 'st', 'ews', 'minority'
                ],
                'patterns': [
                    r'caste\\s*certificate',
                    r'category\\s*certificate',
                    r'reservation\\s*certificate',
                    r'obc|sc|st|ews',
                    r'minority\\s*certificate'
                ]
            }
        }
        
        self.education_patterns = {
            '10th': {
                'keywords': ['10th', 'tenth', 'class 10', 'x class', 'sslc', 'matriculation'],
                'patterns': [
                    r'10th?',
                    r'tenth',
                    r'class\\s*10',
                    r'x\\s*class',
                    r'sslc',
                    r'matriculation'
                ]
            },
            '12th': {
                'keywords': ['12th', 'twelfth', 'class 12', 'xii class', 'intermediate', 'higher secondary'],
                'patterns': [
                    r'12th?',
                    r'twelfth',
                    r'class\\s*12',
                    r'xii\\s*class',
                    r'intermediate',
                    r'higher\\s*secondary'
                ]
            },
            'graduation': {
                'keywords': ['graduation', 'bachelor', 'b.tech', 'b.sc', 'b.com', 'b.a', 'undergraduate'],
                'patterns': [
                    r'graduation',
                    r'bachelor',
                    r'b\\.?tech',
                    r'b\\.?sc',
                    r'b\\.?com',
                    r'b\\.?a',
                    r'undergraduate'
                ]
            },
            'post_graduation': {
                'keywords': ['post graduation', 'master', 'm.tech', 'm.sc', 'm.com', 'm.a', 'postgraduate'],
                'patterns': [
                    r'post\\s*graduation',
                    r'master',
                    r'm\\.?tech',
                    r'm\\.?sc',
                    r'm\\.?com',
                    r'm\\.?a',
                    r'postgraduate'
                ]
            }
        }

    def analyze_document(self, filename: str, file_content: str = None) -> Dict:
        filename_lower = filename.lower()
        
        doc_type, doc_confidence = self._detect_document_type(filename_lower, file_content)
        edu_level, edu_confidence = self._detect_education_level(filename_lower, file_content)
        suggested_name = self._generate_suggested_name(doc_type, edu_level, filename)
        overall_confidence = (doc_confidence + edu_confidence) / 2
        
        return {
            'original_name': filename,
            'suggested_name': suggested_name,
            'document_type': doc_type,
            'education_level': edu_level,
            'confidence': round(overall_confidence, 2),
            'analysis_details': {
                'document_type_confidence': doc_confidence,
                'education_level_confidence': edu_confidence
            }
        }

    def _detect_document_type(self, filename: str, content: str = None) -> Tuple[str, float]:
        best_match = 'document'
        best_confidence = 0.0
        
        for doc_type, config in self.document_patterns.items():
            confidence = 0.0
            
            for keyword in config['keywords']:
                if keyword.lower() in filename:
                    confidence += 0.3
            
            for pattern in config['patterns']:
                if re.search(pattern, filename, re.IGNORECASE):
                    confidence += 0.4
                    break
            
            if content:
                content_lower = content.lower()
                for keyword in config['keywords']:
                    if keyword.lower() in content_lower:
                        confidence += 0.2
                        break
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = doc_type
        
        return best_match, min(best_confidence, 1.0)

    def _detect_education_level(self, filename: str, content: str = None) -> Tuple[str, float]:
        best_match = ''
        best_confidence = 0.0
        
        for edu_level, config in self.education_patterns.items():
            confidence = 0.0
            
            for keyword in config['keywords']:
                if keyword.lower() in filename:
                    confidence += 0.4
            
            for pattern in config['patterns']:
                if re.search(pattern, filename, re.IGNORECASE):
                    confidence += 0.5
                    break
            
            if content:
                content_lower = content.lower()
                for keyword in config['keywords']:
                    if keyword.lower() in content_lower:
                        confidence += 0.3
                        break
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = edu_level
        
        return best_match, min(best_confidence, 1.0)

    def _generate_suggested_name(self, doc_type: str, edu_level: str, original_name: str) -> str:
        name_parts = []
        file_extension = original_name.split('.')[-1] if '.' in original_name else 'pdf'
        
        edu_map = {
            '10th': '10th',
            '12th': '12th',
            'graduation': 'Graduation',
            'post_graduation': 'PostGraduation'
        }
        
        doc_map = {
            'marksheet': 'Marksheet',
            'certificate': 'Certificate',
            'photo': 'Photo',
            'signature': 'Signature',
            'identity': 'IdentityProof',
            'category': 'CategoryCertificate',
            'document': 'Document'
        }
        
        if edu_level and edu_level in edu_map:
            name_parts.append(edu_map[edu_level])
        
        if doc_type in doc_map:
            name_parts.append(doc_map[doc_type])
        
        if not name_parts:
            name_parts.append('Document')
        
        return f"{'_'.join(name_parts)}.{file_extension}"

# Global analyzer instance
analyzer = DocumentAnalyzer()

def analyze_document_js(filename, content=None):
    result = analyzer.analyze_document(filename, content)
    return json.dumps(result)
`;
  }

  async analyzeDocument(file: File, examType: string): Promise<AnalysisResult> {
    await this.initialize();
    
    try {
      // Use Python for advanced document analysis
      const fileName = file.name;
      const analysisJson = await this.pyodide.runPython(
        `analyze_document_js("${fileName}", "${examType}")`
      );
      const analysis = JSON.parse(analysisJson);
      
      return {
        originalName: analysis.original_name,
        suggestedName: analysis.suggested_name,
        confidence: analysis.confidence,
        documentType: analysis.document_type,
        detectedCategory: analysis.detected_category
      };
    } catch (error) {
      console.error('Python analysis failed, falling back to basic analysis:', error);
      return this.performBasicAnalysis(file.name, examType);
    }
  }

  private performBasicAnalysis(fileName: string, examType: string): AnalysisResult {
    // Fallback analysis if Python fails
    
    const lowerName = fileName.toLowerCase();
    let documentType = 'document';
    let detectedCategory = 'document';
    let confidence = 0.3;
    
    if (lowerName.includes('photo') || lowerName.includes('image')) {
      documentType = 'photograph';
      detectedCategory = 'photograph';
      confidence = 0.8;
    } else if (lowerName.includes('signature') || lowerName.includes('sign')) {
      documentType = 'signature';
      detectedCategory = 'signature';
      confidence = 0.8;
    } else if (lowerName.includes('certificate')) {
      documentType = 'certificate';
      detectedCategory = 'class10_certificate';
      confidence = 0.8;
    } else if (lowerName.includes('10th') || lowerName.includes('tenth')) {
      documentType = 'class10_certificate';
      detectedCategory = 'class10_certificate';
      confidence = 0.8;
    }
    
    const extension = fileName.split('.').pop() || 'pdf';
    const suggestedName = `${examType.toUpperCase()}_${detectedCategory}.${extension}`;
    
    return {
      originalName: fileName,
      suggestedName,
      confidence,
      documentType,
      detectedCategory
    };
  }

  async convertDocuments(
    files: Array<{ file: File; documentType: string; detectedCategory: string }>, 
    examType: string, 
    examConfig: any
  ): Promise<ConversionResult> {
    await this.initialize();
    
    try {
      const convertedFiles = [];
      
      for (const fileItem of files) {
        const { file, detectedCategory } = fileItem;
        
        // Get document specification from exam config
        const documentSpec = examConfig.documentSpecs[detectedCategory];
        if (!documentSpec) {
          throw new Error(`No specification found for document type: ${detectedCategory}`);
        }
        
        let convertedFile;
        if (this.rustInitialized && this.rustConverter) {
          // Use Rust for conversion
          convertedFile = await this.convertWithRust(file, examType, detectedCategory, documentSpec);
        } else {
          // Fallback to client-side conversion
          convertedFile = await this.convertWithFallback(file, examType, detectedCategory, documentSpec);
        }
        
        convertedFiles.push(convertedFile);
      }
      
      return {
        success: true,
        files: convertedFiles
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  private async convertWithRust(
    file: File,
    examType: string,
    documentType: string,
    documentSpec: any
  ): Promise<{ originalName: string; convertedName: string; downloadUrl: string; documentType: string; appliedSpec: any }> {
    try {
      // Create Rust converter instance
      const converter = new this.rustConverter.DocumentConverter();
      
      // Set configuration
      const config = {
        exam_type: examType,
        document_type: documentType,
        target_spec: documentSpec
      };
      
      converter.set_config(JSON.stringify(config));
      
      // Convert file
      const result = await converter.convert_file(file);
      
      if (result.success && result.files.length > 0) {
        const convertedFile = result.files[0];
        return {
          originalName: convertedFile.original_name,
          convertedName: convertedFile.converted_name,
          downloadUrl: convertedFile.data_url,
          documentType: convertedFile.document_type,
          appliedSpec: convertedFile.applied_spec
        };
      } else {
        throw new Error(result.error || 'Rust conversion failed');
      }
    } catch (error) {
      console.error('Rust conversion failed, falling back:', error);
      return this.convertWithFallback(file, examType, documentType, documentSpec);
    }
  }

  private async convertWithFallback(
    file: File,
    examType: string,
    documentType: string,
    documentSpec: any
  ): Promise<{ originalName: string; convertedName: string; downloadUrl: string; documentType: string; appliedSpec: any }> {
    // Client-side fallback conversion
    const targetFormat = documentSpec.format[0]; // Use first supported format
    const maxSizeBytes = documentSpec.size_kb.max * 1024;
    
    let convertedBlob: Blob;
    
    if (file.type.startsWith('image/') && (targetFormat === 'JPG' || targetFormat === 'JPEG' || targetFormat === 'PNG')) {
      convertedBlob = await this.convertImageFallback(file, targetFormat, maxSizeBytes, documentSpec);
    } else if (file.type === 'application/pdf' && targetFormat === 'PDF') {
      if (file.size <= maxSizeBytes) {
        convertedBlob = file;
      } else {
        throw new Error(`PDF file too large: ${Math.round(file.size / 1024)}KB, max: ${documentSpec.size_kb.max}KB`);
      }
    } else {
      throw new Error(`Unsupported conversion: ${file.type} to ${targetFormat}`);
    }
    
    const downloadUrl = URL.createObjectURL(convertedBlob);
    const extension = targetFormat.toLowerCase() === 'jpeg' ? 'jpg' : targetFormat.toLowerCase();
    const convertedName = `${examType.toUpperCase()}_${documentType}.${extension}`;
    
    return {
      originalName: file.name,
      convertedName,
      downloadUrl,
      documentType,
      appliedSpec: documentSpec
    };
  }

  private async convertImageFallback(
    file: File,
    targetFormat: string,
    maxSizeBytes: number,
    documentSpec: any
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate target dimensions based on spec
        let { width, height } = img;
        
        // Apply pixel constraints if specified
        if (documentSpec.pixels) {
          if (documentSpec.pixels.width && documentSpec.pixels.height) {
            width = documentSpec.pixels.width;
            height = documentSpec.pixels.height;
          } else if (documentSpec.pixels.min && documentSpec.pixels.max) {
            width = Math.min(Math.max(width, documentSpec.pixels.min.width), documentSpec.pixels.max.width);
            height = Math.min(Math.max(height, documentSpec.pixels.min.height), documentSpec.pixels.max.height);
          }
        }
        
        // Apply dimension constraints (assuming 150 DPI)
        if (documentSpec.dimensions_cm) {
          const pixelsPerCm = 150 / 2.54;
          width = documentSpec.dimensions_cm.width * pixelsPerCm;
          height = documentSpec.dimensions_cm.height * pixelsPerCm;
        }
        
        if (documentSpec.dimensions_mm) {
          const pixelsPerMm = 150 / 25.4;
          width = documentSpec.dimensions_mm.width * pixelsPerMm;
          height = documentSpec.dimensions_mm.height * pixelsPerMm;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Try different quality levels to meet size requirements
        const tryConversion = (quality: number) => {
          const mimeType = targetFormat === 'PNG' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= maxSizeBytes || quality <= 0.1) {
                  resolve(blob);
                } else {
                  // Try with lower quality
                  tryConversion(quality - 0.1);
                }
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            mimeType,
            targetFormat === 'PNG' ? undefined : quality
          );
        };

        tryConversion(0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Keep existing methods for backward compatibility
  private async simulateRustConversion(
    files: File[], 
    config: any
  ): Promise<Array<{ originalName: string; convertedName: string; downloadUrl: string; documentType: string; appliedSpec: any }>> {
    const convertedFiles = [];
    
    for (const file of files) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (const format of config.target_formats) {
        const maxSize = config.max_sizes[format] || Infinity;
        
        // Check if file size is within limits
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} exceeds maximum size for ${format} format`);
        }
        
        const convertedFile = await this.convertToFormat(file, format, maxSize);
        convertedFiles.push(convertedFile);
      }
    }
    
    return convertedFiles;
  }

  private performClientSideAnalysis(fileName: string, examType: string): AnalysisResult {
    const documentPatterns = {
      photograph: [
        /photo/i,
        /photograph/i,
        /image/i,
        /picture/i
      ],
      signature: [
        /signature/i,
        /sign/i,
        /autograph/i
      ],
      certificate: [
        /certificate/i,
        /diploma/i,
        /degree/i,
        /qualification/i
      ],
      class10_certificate: [
        /10th|tenth|class\s*10/i
      ],
      identity: [
        /aadhar|aadhaar/i,
        /pan\s*card/i,
        /voter\s*id/i,
        /passport/i,
        /driving\s*license/i
      ],
      category: [
        /caste\s*certificate/i,
        /category\s*certificate/i,
        /reservation\s*certificate/i,
        /obc|sc|st|ews/i
      ]
    };

    // Detect document type
    let documentType = 'document';
    let detectedCategory = 'document';
    let confidence = 0.3;

    for (const [type, patterns] of Object.entries(documentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(fileName)) {
          documentType = type;
          detectedCategory = type;
          confidence += 0.4;
          break;
        }
      }
      if (documentType !== 'document') break;
    }

    // Generate suggested name
    const extension = fileName.split('.').pop() || 'pdf';
    const suggestedName = `${examType.toUpperCase()}_${detectedCategory}.${extension}`;

    return {
      originalName: fileName,
      suggestedName,
      confidence: Math.min(confidence, 1.0),
      documentType,
      detectedCategory
    };
  }

  private async convertToFormat(
    file: File, 
    targetFormat: string, 
    maxSize: number
  ): Promise<{ originalName: string; convertedName: string; downloadUrl: string; documentType: string; appliedSpec: any }> {
    // For client-side conversion, we'll create optimized versions of files
    let convertedBlob: Blob;
    const fileExtension = targetFormat.toLowerCase();
    
    if (file.type.startsWith('image/') && (targetFormat === 'JPEG' || targetFormat === 'PNG')) {
      // Image conversion using Canvas API
      convertedBlob = await this.convertImage(file, targetFormat, maxSize);
    } else if (file.type === 'application/pdf' && targetFormat === 'PDF') {
      // PDF optimization (just return original for now)
      convertedBlob = file;
    } else {
      // For other formats, return original file
      convertedBlob = file;
    }

    // Create download URL
    const downloadUrl = URL.createObjectURL(convertedBlob);
    const convertedName = `${file.name.split('.')[0]}.${fileExtension}`;

    return {
      originalName: file.name,
      convertedName,
      downloadUrl,
      documentType: 'document',
      appliedSpec: {}
    };
  }

  private async convertImage(
    file: File, 
    targetFormat: string, 
    maxSize: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate dimensions to fit within size constraints
        let { width, height } = img;
        const aspectRatio = width / height;

        // Estimate compression needed based on file size
        const compressionRatio = Math.min(1, maxSize / file.size);
        const scaleFactor = Math.sqrt(compressionRatio);

        width *= scaleFactor;
        height *= scaleFactor;

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        const mimeType = targetFormat === 'PNG' ? 'image/png' : 'image/jpeg';
        const quality = targetFormat === 'JPEG' ? 0.8 : undefined;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const wasmService = new WasmService();