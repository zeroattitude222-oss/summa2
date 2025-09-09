use wasm_bindgen::prelude::*;
use web_sys::{console, File, FileReader, Blob, BlobPropertyBag, Uint8Array};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Import the `console.log` function from the `console` module
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for easier console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DocumentSpec {
    pub format: Vec<String>,
    pub size_kb: SizeSpec,
    pub dimensions_cm: Option<DimensionsSpec>,
    pub dimensions_mm: Option<DimensionsSpec>,
    pub pixels: Option<PixelSpec>,
    pub aspect_ratio: Option<AspectRatioSpec>,
    pub resolution_px_per_inch: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SizeSpec {
    pub min: Option<u32>,
    pub max: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DimensionsSpec {
    pub width: f32,
    pub height: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PixelSpec {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub min_width: Option<u32>,
    pub min_height: Option<u32>,
    pub max_width: Option<u32>,
    pub max_height: Option<u32>,
    pub min: Option<PixelDimensions>,
    pub max: Option<PixelDimensions>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PixelDimensions {
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AspectRatioSpec {
    pub min: Option<f32>,
    pub max: Option<f32>,
    pub height_to_width_min: Option<f32>,
    pub height_to_width_max: Option<f32>,
}

#[derive(Serialize, Deserialize)]
pub struct ConversionConfig {
    pub exam_type: String,
    pub document_type: String,
    pub target_spec: DocumentSpec,
}

#[derive(Serialize, Deserialize)]
pub struct ConversionResult {
    pub success: bool,
    pub files: Vec<ConvertedFile>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ConvertedFile {
    pub original_name: String,
    pub converted_name: String,
    pub document_type: String,
    pub format: String,
    pub size_kb: u32,
    pub dimensions: Option<DimensionsSpec>,
    pub data_url: String,
    pub applied_spec: DocumentSpec,
}

#[wasm_bindgen]
pub struct DocumentConverter {
    config: Option<ConversionConfig>,
}

#[wasm_bindgen]
impl DocumentConverter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DocumentConverter {
        console_log!("Initializing Rust Document Converter with Exam Specifications");
        DocumentConverter { config: None }
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<ConversionConfig>(config_json) {
            Ok(config) => {
                console_log!("Configuration set for exam: {} document: {}", 
                    config.exam_type, config.document_type);
                self.config = Some(config);
                Ok(())
            }
            Err(e) => {
                console_log!("Failed to parse config: {}", e);
                Err(JsValue::from_str(&format!("Invalid config: {}", e)))
            }
        }
    }

    #[wasm_bindgen]
    pub async fn convert_file(&self, file: File) -> Result<JsValue, JsValue> {
        let config = match &self.config {
            Some(c) => c,
            None => return Err(JsValue::from_str("Configuration not set")),
        };

        console_log!("Starting conversion of file: {}", file.name());
        
        match self.convert_single_file(&file, config).await {
            Ok(converted) => {
                let result = ConversionResult {
                    success: true,
                    files: vec![converted],
                    error: None,
                };
                Ok(serde_wasm_bindgen::to_value(&result)?)
            }
            Err(e) => {
                console_log!("Failed to convert file: {:?}", e);
                let result = ConversionResult {
                    success: false,
                    files: vec![],
                    error: Some(format!("Conversion failed: {:?}", e)),
                };
                Ok(serde_wasm_bindgen::to_value(&result)?)
            }
        }
    }

    async fn convert_single_file(
        &self,
        file: &File,
        config: &ConversionConfig,
    ) -> Result<ConvertedFile, JsValue> {
        let file_name = file.name();
        let file_type = file.type_();
        let file_size = file.size() as u32;
        
        console_log!("Converting file: {} ({}) for {}", file_name, file_type, config.document_type);

        // Read file data
        let array_buffer = wasm_bindgen_futures::JsFuture::from(file.array_buffer()).await?;
        let uint8_array = Uint8Array::new(&array_buffer);
        let data = uint8_array.to_vec();

        // Determine target format from spec
        let target_format = self.determine_target_format(&file_type, &config.target_spec)?;
        
        // Convert based on file type and specifications
        let (converted_data, final_dimensions) = if file_type.starts_with("image/") {
            self.convert_image(&data, &file_type, &target_format, &config.target_spec)?
        } else if file_type == "application/pdf" {
            self.convert_pdf(&data, &config.target_spec)?
        } else {
            return Err(JsValue::from_str(&format!("Unsupported file type: {}", file_type)));
        };

        // Validate final result against specifications
        self.validate_conversion_result(&converted_data, &final_dimensions, &config.target_spec)?;

        // Generate new filename
        let converted_name = self.generate_converted_filename(&file_name, &target_format, &config.document_type);
        
        // Create data URL
        let mime_type = self.get_mime_type(&target_format);
        let base64_data = base64::encode(&converted_data);
        let data_url = format!("data:{};base64,{}", mime_type, base64_data);

        Ok(ConvertedFile {
            original_name: file_name,
            converted_name,
            document_type: config.document_type.clone(),
            format: target_format,
            size_kb: (converted_data.len() / 1024) as u32,
            dimensions: final_dimensions,
            data_url,
            applied_spec: config.target_spec.clone(),
        })
    }

    fn convert_image(
        &self,
        data: &[u8],
        original_format: &str,
        target_format: &str,
        spec: &DocumentSpec,
    ) -> Result<(Vec<u8>, Option<DimensionsSpec>), JsValue> {
        console_log!("Converting image from {} to {} with specifications", original_format, target_format);

        // Load image
        let img = image::load_from_memory(data)
            .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;

        let (original_width, original_height) = img.dimensions();
        console_log!("Original image dimensions: {}x{}", original_width, original_height);

        // Calculate target dimensions based on specifications
        let (target_width, target_height) = self.calculate_target_dimensions(
            original_width, 
            original_height, 
            spec
        )?;

        console_log!("Target dimensions: {}x{}", target_width, target_height);

        // Resize image if necessary
        let processed_img = if target_width != original_width || target_height != original_height {
            console_log!("Resizing image from {}x{} to {}x{}", 
                original_width, original_height, target_width, target_height);
            img.resize_exact(target_width, target_height, image::imageops::FilterType::Lanczos3)
        } else {
            img
        };

        // Convert to target format with quality optimization
        let mut output = Vec::new();
        let max_size_bytes = (spec.size_kb.max * 1024) as usize;
        let mut quality = 0.9f32;

        loop {
            output.clear();
            
            match target_format.to_uppercase().as_str() {
                "JPEG" | "JPG" => {
                    let rgb_img = processed_img.to_rgb8();
                    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                        &mut output, 
                        (quality * 100.0) as u8
                    );
                    encoder.encode_image(&rgb_img)
                        .map_err(|e| JsValue::from_str(&format!("JPEG encoding failed: {}", e)))?;
                }
                "PNG" => {
                    let rgba_img = processed_img.to_rgba8();
                    let encoder = image::codecs::png::PngEncoder::new(&mut output);
                    encoder.write_image(
                        rgba_img.as_raw(),
                        rgba_img.width(),
                        rgba_img.height(),
                        image::ColorType::Rgba8,
                    ).map_err(|e| JsValue::from_str(&format!("PNG encoding failed: {}", e)))?;
                    break; // PNG doesn't support quality adjustment
                }
                _ => return Err(JsValue::from_str(&format!("Unsupported target format: {}", target_format))),
            }

            // Check size constraints
            if output.len() <= max_size_bytes {
                break;
            }

            // Reduce quality and try again
            quality -= 0.1;
            if quality < 0.1 {
                return Err(JsValue::from_str("Cannot compress image to meet size requirements"));
            }
            
            console_log!("File too large ({}KB), reducing quality to {:.1}", 
                output.len() / 1024, quality);
        }

        let final_dimensions = Some(DimensionsSpec {
            width: target_width as f32,
            height: target_height as f32,
        });

        console_log!("Image conversion complete. Final size: {}KB", output.len() / 1024);
        Ok((output, final_dimensions))
    }

    fn convert_pdf(&self, data: &[u8], spec: &DocumentSpec) -> Result<(Vec<u8>, Option<DimensionsSpec>), JsValue> {
        console_log!("Processing PDF file");
        
        let max_size_bytes = (spec.size_kb.max * 1024) as usize;
        
        // For now, just validate size constraints
        // In a full implementation, you would use a PDF library to compress/optimize
        if data.len() <= max_size_bytes {
            Ok((data.to_vec(), None))
        } else {
            Err(JsValue::from_str(&format!(
                "PDF file too large: {}KB, maximum allowed: {}KB", 
                data.len() / 1024, 
                spec.size_kb.max
            )))
        }
    }

    fn calculate_target_dimensions(
        &self,
        original_width: u32,
        original_height: u32,
        spec: &DocumentSpec,
    ) -> Result<(u32, u32), JsValue> {
        let mut target_width = original_width;
        let mut target_height = original_height;

        // Apply pixel constraints
        if let Some(pixel_spec) = &spec.pixels {
            // Exact dimensions
            if let (Some(width), Some(height)) = (pixel_spec.width, pixel_spec.height) {
                target_width = width;
                target_height = height;
            }
            // Range constraints
            else {
                let min_width = pixel_spec.min_width
                    .or_else(|| pixel_spec.min.as_ref().map(|m| m.width))
                    .unwrap_or(1);
                let max_width = pixel_spec.max_width
                    .or_else(|| pixel_spec.max.as_ref().map(|m| m.width))
                    .unwrap_or(u32::MAX);
                let min_height = pixel_spec.min_height
                    .or_else(|| pixel_spec.min.as_ref().map(|m| m.height))
                    .unwrap_or(1);
                let max_height = pixel_spec.max_height
                    .or_else(|| pixel_spec.max.as_ref().map(|m| m.height))
                    .unwrap_or(u32::MAX);

                target_width = target_width.clamp(min_width, max_width);
                target_height = target_height.clamp(min_height, max_height);
            }
        }

        // Apply aspect ratio constraints
        if let Some(aspect_spec) = &spec.aspect_ratio {
            let current_ratio = target_width as f32 / target_height as f32;
            
            if let (Some(min_ratio), Some(max_ratio)) = (aspect_spec.min, aspect_spec.max) {
                if current_ratio < min_ratio {
                    target_width = (target_height as f32 * min_ratio) as u32;
                } else if current_ratio > max_ratio {
                    target_height = (target_width as f32 / max_ratio) as u32;
                }
            }
            
            if let (Some(min_hw_ratio), Some(max_hw_ratio)) = 
                (aspect_spec.height_to_width_min, aspect_spec.height_to_width_max) {
                let hw_ratio = target_height as f32 / target_width as f32;
                if hw_ratio < min_hw_ratio {
                    target_height = (target_width as f32 * min_hw_ratio) as u32;
                } else if hw_ratio > max_hw_ratio {
                    target_height = (target_width as f32 * max_hw_ratio) as u32;
                }
            }
        }

        // Apply dimension constraints (convert cm/mm to pixels assuming 150 DPI)
        let dpi = spec.resolution_px_per_inch.unwrap_or(150) as f32;
        
        if let Some(dim_cm) = &spec.dimensions_cm {
            let pixels_per_cm = dpi / 2.54;
            target_width = (dim_cm.width * pixels_per_cm) as u32;
            target_height = (dim_cm.height * pixels_per_cm) as u32;
        }
        
        if let Some(dim_mm) = &spec.dimensions_mm {
            let pixels_per_mm = dpi / 25.4;
            target_width = (dim_mm.width * pixels_per_mm) as u32;
            target_height = (dim_mm.height * pixels_per_mm) as u32;
        }

        Ok((target_width.max(1), target_height.max(1)))
    }

    fn validate_conversion_result(
        &self,
        data: &[u8],
        dimensions: &Option<DimensionsSpec>,
        spec: &DocumentSpec,
    ) -> Result<(), JsValue> {
        // Validate size
        let size_kb = (data.len() / 1024) as u32;
        if let Some(min_size) = spec.size_kb.min {
            if size_kb < min_size {
                return Err(JsValue::from_str(&format!(
                    "File too small: {}KB, minimum required: {}KB", 
                    size_kb, min_size
                )));
            }
        }
        if size_kb > spec.size_kb.max {
            return Err(JsValue::from_str(&format!(
                "File too large: {}KB, maximum allowed: {}KB", 
                size_kb, spec.size_kb.max
            )));
        }

        console_log!("Conversion validation passed. Final size: {}KB", size_kb);
        Ok(())
    }

    fn determine_target_format(&self, file_type: &str, spec: &DocumentSpec) -> Result<String, JsValue> {
        let preferred_format = if file_type.starts_with("image/") {
            // For images, prefer the first supported format
            spec.format.first().cloned().unwrap_or_else(|| "JPEG".to_string())
        } else if file_type == "application/pdf" {
            if spec.format.contains(&"PDF".to_string()) {
                "PDF".to_string()
            } else {
                return Err(JsValue::from_str("PDF format not supported for this document type"));
            }
        } else {
            return Err(JsValue::from_str(&format!("Unsupported file type: {}", file_type)));
        };

        Ok(preferred_format)
    }

    fn generate_converted_filename(&self, original_name: &str, target_format: &str, document_type: &str) -> String {
        let base_name = original_name.split('.').next().unwrap_or(original_name);
        let extension = match target_format.to_uppercase().as_str() {
            "JPEG" | "JPG" => "jpg",
            "PNG" => "png",
            "PDF" => "pdf",
            _ => "bin",
        };
        
        // Use document type in filename for clarity
        format!("{}_{}.{}", document_type, base_name, extension)
    }

    fn get_mime_type(&self, format: &str) -> &str {
        match format.to_uppercase().as_str() {
            "JPEG" | "JPG" => "image/jpeg",
            "PNG" => "image/png",
            "PDF" => "application/pdf",
            _ => "application/octet-stream",
        }
    }
}

// Initialize the module
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust Document Converter WASM module initialized with exam specifications");
}