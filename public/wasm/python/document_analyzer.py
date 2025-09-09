"""
Advanced Document Analysis Module for Competitive Exam Applications
Uses sophisticated NLP and pattern matching for intelligent document classification
"""

import re
import json
from typing import Dict, List, Tuple, Optional

class DocumentAnalyzer:
    def __init__(self):
        # Enhanced document patterns with exam-specific mappings
        self.document_patterns = {
            'photograph': {
                'keywords': [
                    'photo', 'photograph', 'image', 'picture', 'pic',
                    'passport size', 'headshot', 'passport photo', 'passport photograph'
                ],
                'patterns': [
                    r'photo(?:graph)?',
                    r'image',
                    r'picture',
                    r'passport\s*(?:size|photo)',
                    r'headshot',
                    r'postcard\s*photo'
                ],
                'exam_mappings': {
                    'jee': 'photograph',
                    'neet': 'passport_photograph',
                    'upsc': 'photograph',
                    'gate': 'photograph',
                    'cat': 'photograph'
                }
            },
            'postcard_photograph': {
                'keywords': [
                    'postcard photo', 'postcard photograph', 'postcard size photo'
                ],
                'patterns': [
                    r'postcard\s*(?:photo|photograph)',
                    r'postcard\s*size'
                ],
                'exam_mappings': {
                    'neet': 'postcard_photograph'
                }
            },
            'signature': {
                'keywords': [
                    'signature', 'sign', 'autograph', 'signed', 'sig'
                ],
                'patterns': [
                    r'signature',
                    r'sign(?:ed)?',
                    r'autograph',
                    r'\bsig\b'
                ],
                'exam_mappings': {
                    'jee': 'signature',
                    'neet': 'signature',
                    'upsc': 'signature',
                    'gate': 'signature',
                    'cat': 'signature'
                }
            },
            'class10_certificate': {
                'keywords': [
                    'class 10', '10th', 'tenth', 'x class', 'sslc', 'matriculation',
                    'class10', 'class-10', '10 class'
                ],
                'patterns': [
                    r'class\s*10',
                    r'10th?',
                    r'tenth',
                    r'x\s*class',
                    r'sslc',
                    r'matriculation'
                ],
                'exam_mappings': {
                    'jee': 'class10_certificate',
                    'neet': 'class10_certificate'
                }
            },
            'category_certificate': {
                'keywords': [
                    'caste certificate', 'category certificate', 'reservation certificate',
                    'obc', 'sc', 'st', 'ews', 'minority', 'pwd', 'disability'
                ],
                'patterns': [
                    r'caste\s*certificate',
                    r'category\s*certificate',
                    r'reservation\s*certificate',
                    r'obc|sc|st|ews',
                    r'minority\s*certificate',
                    r'pwd|disability'
                ],
                'exam_mappings': {
                    'neet': 'category_certificate',
                    'gate': 'category_certificate'
                }
            },
            'caste_or_pwd_certificate': {
                'keywords': [
                    'caste certificate', 'pwd certificate', 'disability certificate',
                    'reservation certificate', 'category certificate'
                ],
                'patterns': [
                    r'caste\s*certificate',
                    r'pwd\s*certificate',
                    r'disability\s*certificate',
                    r'reservation\s*certificate'
                ],
                'exam_mappings': {
                    'jee': 'caste_or_pwd_certificate'
                }
            },
            'finger_thumb_impressions': {
                'keywords': [
                    'finger impression', 'thumb impression', 'fingerprint',
                    'thumb print', 'finger print'
                ],
                'patterns': [
                    r'finger\s*(?:impression|print)',
                    r'thumb\s*(?:impression|print)',
                    r'fingerprint'
                ],
                'exam_mappings': {
                    'neet': 'finger_thumb_impressions'
                }
            },
            'address_proof': {
                'keywords': [
                    'address proof', 'address certificate', 'domicile',
                    'residence proof', 'residential certificate'
                ],
                'patterns': [
                    r'address\s*(?:proof|certificate)',
                    r'domicile',
                    r'residence\s*proof',
                    r'residential\s*certificate'
                ],
                'exam_mappings': {
                    'neet': 'address_proof'
                }
            },
            'photo_id_proof': {
                'keywords': [
                    'photo id', 'identity proof', 'id proof', 'aadhar', 'aadhaar',
                    'pan card', 'voter id', 'passport', 'driving license'
                ],
                'patterns': [
                    r'photo\s*id',
                    r'identity\s*proof',
                    r'id\s*proof',
                    r'aa?dh?aa?r',
                    r'pan\s*card',
                    r'voter\s*id',
                    r'passport',
                    r'driving\s*licen[cs]e'
                ],
                'exam_mappings': {
                    'upsc': 'photo_id_proof'
                }
            },
            'certificates_academic_or_category': {
                'keywords': [
                    'academic certificate', 'degree certificate', 'graduation certificate',
                    'category certificate', 'educational certificate'
                ],
                'patterns': [
                    r'academic\s*certificate',
                    r'degree\s*certificate',
                    r'graduation\s*certificate',
                    r'educational\s*certificate'
                ],
                'exam_mappings': {
                    'cat': 'certificates_academic_or_category'
                }
            }
        }
        
        # Education level patterns for better classification
        self.education_patterns = {
            '10th': {
                'keywords': ['10th', 'tenth', 'class 10', 'x class', 'sslc', 'matriculation'],
                'patterns': [
                    r'10th?',
                    r'tenth',
                    r'class\s*10',
                    r'x\s*class',
                    r'sslc',
                    r'matriculation'
                ]
            },
            '12th': {
                'keywords': ['12th', 'twelfth', 'class 12', 'xii class', 'intermediate', 'higher secondary'],
                'patterns': [
                    r'12th?',
                    r'twelfth',
                    r'class\s*12',
                    r'xii\s*class',
                    r'intermediate',
                    r'higher\s*secondary'
                ]
            },
            'graduation': {
                'keywords': ['graduation', 'bachelor', 'b.tech', 'b.sc', 'b.com', 'b.a', 'undergraduate'],
                'patterns': [
                    r'graduation',
                    r'bachelor',
                    r'b\.?tech',
                    r'b\.?sc',
                    r'b\.?com',
                    r'b\.?a',
                    r'undergraduate'
                ]
            }
        }

    def analyze_document(self, filename: str, exam_type: str = None, file_content: Optional[str] = None) -> Dict:
        """
        Analyze document with exam-specific context
        """
        filename_lower = filename.lower()
        
        # Extract document type with exam context
        doc_type, doc_confidence = self._detect_document_type(filename_lower, exam_type, file_content)
        
        # Extract education level
        edu_level, edu_confidence = self._detect_education_level(filename_lower, file_content)
        
        # Generate suggested name based on exam requirements
        suggested_name = self._generate_exam_specific_name(doc_type, edu_level, filename, exam_type)
        
        # Calculate overall confidence
        overall_confidence = (doc_confidence + edu_confidence) / 2
        
        return {
            'original_name': filename,
            'suggested_name': suggested_name,
            'document_type': doc_type,
            'education_level': edu_level,
            'exam_type': exam_type,
            'confidence': round(overall_confidence, 2),
            'detected_category': self._get_exam_specific_category(doc_type, exam_type),
            'analysis_details': {
                'document_type_confidence': doc_confidence,
                'education_level_confidence': edu_confidence,
                'exam_specific_mapping': self._get_exam_mapping(doc_type, exam_type)
            }
        }

    def _detect_document_type(self, filename: str, exam_type: str = None, content: Optional[str] = None) -> Tuple[str, float]:
        """
        Detect document type with exam-specific context
        """
        best_match = 'document'
        best_confidence = 0.0
        
        for doc_type, config in self.document_patterns.items():
            confidence = 0.0
            
            # Check if this document type is relevant for the exam
            if exam_type and exam_type in config.get('exam_mappings', {}):
                confidence += 0.1  # Bonus for exam relevance
            
            # Check keywords
            for keyword in config['keywords']:
                if keyword.lower() in filename:
                    confidence += 0.3
            
            # Check regex patterns
            for pattern in config['patterns']:
                if re.search(pattern, filename, re.IGNORECASE):
                    confidence += 0.4
                    break
            
            # Analyze content if available
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

    def _detect_education_level(self, filename: str, content: Optional[str] = None) -> Tuple[str, float]:
        """
        Detect education level from filename and content
        """
        best_match = ''
        best_confidence = 0.0
        
        for edu_level, config in self.education_patterns.items():
            confidence = 0.0
            
            # Check keywords
            for keyword in config['keywords']:
                if keyword.lower() in filename:
                    confidence += 0.4
            
            # Check regex patterns
            for pattern in config['patterns']:
                if re.search(pattern, filename, re.IGNORECASE):
                    confidence += 0.5
                    break
            
            # Analyze content if available
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

    def _generate_exam_specific_name(self, doc_type: str, edu_level: str, original_name: str, exam_type: str = None) -> str:
        """
        Generate exam-specific file name suggestions
        """
        file_extension = original_name.split('.')[-1] if '.' in original_name else 'pdf'
        
        # Get exam-specific mapping
        exam_specific_type = self._get_exam_mapping(doc_type, exam_type)
        
        if exam_specific_type:
            # Use exam-specific naming convention
            name_parts = [exam_type.upper() if exam_type else '', exam_specific_type]
            name_parts = [part for part in name_parts if part]  # Remove empty parts
            base_name = '_'.join(name_parts)
        else:
            # Fallback to generic naming
            name_parts = []
            
            if edu_level:
                edu_map = {
                    '10th': '10th',
                    '12th': '12th',
                    'graduation': 'Graduation'
                }
                if edu_level in edu_map:
                    name_parts.append(edu_map[edu_level])
            
            doc_map = {
                'photograph': 'Photo',
                'signature': 'Signature',
                'class10_certificate': 'Class10Certificate',
                'category_certificate': 'CategoryCertificate',
                'document': 'Document'
            }
            
            if doc_type in doc_map:
                name_parts.append(doc_map[doc_type])
            
            if not name_parts:
                name_parts.append('Document')
            
            base_name = '_'.join(name_parts)
        
        return f"{base_name}.{file_extension}"

    def _get_exam_mapping(self, doc_type: str, exam_type: str = None) -> str:
        """
        Get exam-specific document type mapping
        """
        if not exam_type or doc_type not in self.document_patterns:
            return doc_type
        
        exam_mappings = self.document_patterns[doc_type].get('exam_mappings', {})
        return exam_mappings.get(exam_type, doc_type)

    def _get_exam_specific_category(self, doc_type: str, exam_type: str = None) -> str:
        """
        Get the exam-specific category for the document
        """
        return self._get_exam_mapping(doc_type, exam_type)

    def batch_analyze(self, files_info: List[Dict], exam_type: str = None) -> List[Dict]:
        """
        Analyze multiple documents in batch with exam context
        """
        results = []
        for file_info in files_info:
            filename = file_info.get('name', '')
            content = file_info.get('content', None)
            analysis = self.analyze_document(filename, exam_type, content)
            results.append(analysis)
        
        return results

# Global analyzer instance
analyzer = DocumentAnalyzer()

def analyze_document_js(filename: str, exam_type: str = None, content: str = None) -> str:
    """
    JavaScript-callable function for document analysis
    """
    result = analyzer.analyze_document(filename, exam_type, content)
    return json.dumps(result)

def batch_analyze_js(files_json: str, exam_type: str = None) -> str:
    """
    JavaScript-callable function for batch analysis
    """
    files_info = json.loads(files_json)
    results = analyzer.batch_analyze(files_info, exam_type)
    return json.dumps(results)