#!/bin/bash

# Build script for WebAssembly modules

echo "Building WebAssembly modules..."

# Build Rust WASM module
echo "Building Rust document converter..."
cd src/wasm/rust

# Install wasm-pack if not present
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the Rust WASM module
wasm-pack build --target web --out-dir ../../../public/wasm/rust

cd ../../..

# Copy Python analyzer to public directory
echo "Copying Python document analyzer..."
mkdir -p public/wasm/python
cp src/wasm/python/document_analyzer.py public/wasm/python/

echo "WebAssembly modules built successfully!"
echo "Rust WASM module: public/wasm/rust/"
echo "Python analyzer: public/wasm/python/"