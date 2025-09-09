export interface ExamConfig {
  name: string;
  formats: string[];
  maxSizes: {
    [format: string]: number; // in bytes
  };
  requirements: string[];
  documentSpecs: {
    [documentType: string]: DocumentSpec;
  };
}

export interface DocumentSpec {
  format: string[];
  size_kb: {
    min?: number;
    max: number;
  };
  dimensions_cm?: {
    width: number;
    height: number;
  };
  dimensions_mm?: {
    width: number;
    height: number;
  };
  pixels?: {
    width?: number;
    height?: number;
    min_width?: number;
    min_height?: number;
    max_width?: number;
    max_height?: number;
    min?: {
      width: number;
      height: number;
    };
    max?: {
      width: number;
      height: number;
    };
  };
  aspect_ratio?: {
    min?: number;
    max?: number;
    height_to_width_min?: number;
    height_to_width_max?: number;
  };
  resolution_px_per_inch?: number;
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  originalName: string;
  size: number;
  type: string;
  status: 'pending' | 'analyzing' | 'converting' | 'success' | 'error';
  progress: number;
  convertedUrl?: string;
  error?: string;
  documentType?: string;
  targetSpec?: DocumentSpec;
}

export interface ConversionResult {
  success: boolean;
  files: {
    originalName: string;
    convertedName: string;
    downloadUrl: string;
    documentType: string;
    appliedSpec: DocumentSpec;
  }[];
  error?: string;
}

export interface AnalysisResult {
  originalName: string;
  suggestedName: string;
  confidence: number;
  documentType: string;
  detectedCategory: string;
}