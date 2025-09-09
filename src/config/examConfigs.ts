import { ExamConfig } from '../types';

export const examConfigs: Record<string, ExamConfig> = {
  jee: {
    name: 'JEE (Main/Advanced)',
    formats: ['JPG', 'JPEG', 'PDF'],
    maxSizes: {
      JPG: 300 * 1024,
      JPEG: 300 * 1024,
      PDF: 300 * 1024
    },
    requirements: [
      'Photograph (JPG/JPEG, 10-300KB, 3.5×4.5cm)',
      'Signature (JPG/JPEG, 10-50KB, 3.5×1.5cm)',
      'Class 10 Certificate (PDF, 50-300KB)',
      'Caste/PWD Certificate (PDF, 50-300KB)'
    ],
    documentSpecs: {
      photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 10, max: 300 },
        dimensions_cm: { width: 3.5, height: 4.5 }
      },
      signature: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 10, max: 50 },
        dimensions_cm: { width: 3.5, height: 1.5 }
      },
      class10_certificate: {
        format: ['PDF'],
        size_kb: { min: 50, max: 300 }
      },
      caste_or_pwd_certificate: {
        format: ['PDF'],
        size_kb: { min: 50, max: 300 }
      }
    }
  },
  neet: {
    name: 'NEET (UG)',
    formats: ['JPG', 'JPEG', 'PDF'],
    maxSizes: {
      JPG: 300 * 1024,
      JPEG: 300 * 1024,
      PDF: 300 * 1024
    },
    requirements: [
      'Passport Photograph (JPG/JPEG, 10-200KB)',
      'Postcard Photograph (JPG/JPEG, 10-200KB)',
      'Signature (JPG, 4-30KB)',
      'Finger/Thumb Impressions (JPG/JPEG/PDF, 10-200KB)',
      'Category Certificate (PDF, 50-300KB)',
      'Class 10 Certificate (PDF, 50-300KB)',
      'Address Proof (PDF, 50-300KB)'
    ],
    documentSpecs: {
      passport_photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 10, max: 200 }
      },
      postcard_photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 10, max: 200 }
      },
      signature: {
        format: ['JPG'],
        size_kb: { min: 4, max: 30 }
      },
      finger_thumb_impressions: {
        format: ['JPG', 'JPEG', 'PDF'],
        size_kb: { min: 10, max: 200 }
      },
      category_certificate: {
        format: ['PDF'],
        size_kb: { min: 50, max: 300 }
      },
      class10_certificate: {
        format: ['PDF'],
        size_kb: { min: 50, max: 300 }
      },
      address_proof: {
        format: ['PDF'],
        size_kb: { min: 50, max: 300 }
      }
    }
  },
  upsc: {
    name: 'UPSC (CSE)',
    formats: ['JPG', 'JPEG', 'PDF'],
    maxSizes: {
      JPG: 300 * 1024,
      JPEG: 300 * 1024,
      PDF: 300 * 1024
    },
    requirements: [
      'Photograph (JPG/JPEG, 20-300KB, 350×350 to 1000×1000px)',
      'Signature (JPG/JPEG, 20-300KB, 350×350 to 1000×1000px)',
      'Photo ID Proof (PDF, 20-300KB)'
    ],
    documentSpecs: {
      photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 20, max: 300 },
        pixels: { 
          min_width: 350, 
          min_height: 350, 
          max_width: 1000, 
          max_height: 1000 
        }
      },
      signature: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 20, max: 300 },
        pixels: { 
          min_width: 350, 
          min_height: 350, 
          max_width: 1000, 
          max_height: 1000 
        }
      },
      photo_id_proof: {
        format: ['PDF'],
        size_kb: { min: 20, max: 300 }
      }
    }
  },
  gate: {
    name: 'GATE',
    formats: ['JPG', 'JPEG', 'PDF'],
    maxSizes: {
      JPG: 1024 * 1024,
      JPEG: 1024 * 1024,
      PDF: 300 * 1024
    },
    requirements: [
      'Photograph (JPG/JPEG, 5-1024KB, 3.5×4.5cm, 200×260 to 530×690px)',
      'Signature (JPG/JPEG, 3-1024KB, 250×80 to 580×180px)',
      'Category Certificate (PDF, max 300KB)'
    ],
    documentSpecs: {
      photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 5, max: 1024 },
        dimensions_cm: { width: 3.5, height: 4.5 },
        pixels: { 
          min: { width: 200, height: 260 }, 
          max: { width: 530, height: 690 } 
        },
        aspect_ratio: { min: 0.66, max: 0.89 }
      },
      signature: {
        format: ['JPG', 'JPEG'],
        size_kb: { min: 3, max: 1024 },
        pixels: { 
          min: { width: 250, height: 80 }, 
          max: { width: 580, height: 180 } 
        },
        aspect_ratio: { 
          height_to_width_min: 1 / 3.75, 
          height_to_width_max: 1 / 2.75 
        }
      },
      category_certificate: {
        format: ['PDF'],
        size_kb: { max: 300 }
      }
    }
  },
  cat: {
    name: 'CAT',
    formats: ['JPG', 'JPEG', 'PDF'],
    maxSizes: {
      JPG: 200 * 1024,
      JPEG: 200 * 1024,
      PDF: 200 * 1024
    },
    requirements: [
      'Photograph (JPG/JPEG, max 80KB, 1200×1200px, 150 PPI)',
      'Signature (JPG/JPEG, max 80KB, 80×35mm)',
      'Academic/Category Certificates (PDF, max 200KB)'
    ],
    documentSpecs: {
      photograph: {
        format: ['JPG', 'JPEG'],
        size_kb: { max: 80 },
        pixels: { width: 1200, height: 1200 },
        resolution_px_per_inch: 150
      },
      signature: {
        format: ['JPG', 'JPEG'],
        size_kb: { max: 80 },
        dimensions_mm: { width: 80, height: 35 }
      },
      certificates_academic_or_category: {
        format: ['PDF'],
        size_kb: { max: 200 }
      }
    }
  }
};