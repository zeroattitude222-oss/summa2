#!/bin/bash

# Deployment script for Exam Document Converter (React + WebAssembly)
set -e

# Configuration
DOCKER_IMAGE="your-dockerhub-username/exam-converter"
NAMESPACE="exam-converter"
DEPLOYMENT_NAME="exam-converter-app"
APP_NAME="Exam Document Converter"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites for React + WebAssembly deployment..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    if [[ ! -f "vite.config.js" ]]; then
        log_error "vite.config.js not found. This doesn't appear to be a Vite project."
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build WebAssembly modules
build_wasm() {
    log_step "Building WebAssembly modules..."
    
    if [[ -f "build-wasm.sh" ]]; then
        log_info "Running WebAssembly build script..."
        chmod +x build-wasm.sh
        ./build-wasm.sh
    else
        log_warn "build-wasm.sh not found, skipping WASM build"
        log_info "Ensuring WASM directories exist..."
        mkdir -p public/wasm/rust public/wasm/python
        
        # Copy Python analyzer if it exists in src
        if [[ -f "src/wasm/python/document_analyzer.py" ]]; then
            cp src/wasm/python/document_analyzer.py public/wasm/python/
            log_info "Copied Python document analyzer"
        fi
    fi
}

# Build and test the application
build_and_test() {
    log_step "Building and testing the React application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Run linting
    if npm run lint &> /dev/null; then
        log_info "Linting passed"
    else
        log_warn "Linting failed or not configured"
    fi
    
    # Build the application
    log_info "Building React application..."
    npm run build
    
    if [[ ! -d "dist" ]]; then
        log_error "Build failed - dist directory not found"
        exit 1
    fi
    
    log_info "Build completed successfully"
}

# Build and push Docker image
build_and_push_docker() {
    local tag=${1:-latest}
    
    log_step "Building Docker image for React + WebAssembly app..."
    
    # Build Docker image
    log_info "Building Docker image with tag: $tag"
    docker build -t ${DOCKER_IMAGE}:${tag} . --no-cache
    
    # Test the Docker image
    log_info "Testing Docker image..."
    CONTAINER_ID=$(docker run -d -p 8080:80 ${DOCKER_IMAGE}:${tag})
    sleep 10
    
    if curl -f http://localhost:8080/health &> /dev/null; then
        log_info "Docker image health check passed"
    else
        log_error "Docker image health check failed"
        docker logs $CONTAINER_ID
        docker stop $CONTAINER_ID
        exit 1
    fi
    
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    
    # Push to registry
    log_info "Pushing Docker image to registry..."
    docker push ${DOCKER_IMAGE}:${tag}
    
    log_info "Docker image pushed successfully"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    local tag=${1:-latest}
    
    log_step "Deploying to Kubernetes..."
    
    # Update image tag in deployment
    sed -i.bak "s|${DOCKER_IMAGE}:.*|${DOCKER_IMAGE}:${tag}|g" k8s/deployment.yaml
    
    # Apply manifests in order
    log_info "Creating namespace..."
    kubectl apply -f k8s/namespace.yaml
    
    log_info "Applying deployment..."
    kubectl apply -f k8s/deployment.yaml
    
    log_info "Applying service..."
    kubectl apply -f k8s/service.yaml
    
    log_info "Applying ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    log_info "Applying HPA..."
    kubectl apply -f k8s/hpa.yaml
    
    # Wait for rollout
    log_info "Waiting for deployment to complete..."
    kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=300s
    
    # Restore original deployment file
    mv k8s/deployment.yaml.bak k8s/deployment.yaml
    
    log_info "Kubernetes deployment completed successfully"
}

# Health check and verification
health_check() {
    log_step "Performing health check and verification..."
    
    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=exam-converter -n ${NAMESPACE} --timeout=300s
    
    # Get deployment status
    log_info "Deployment status:"
    kubectl get pods -n ${NAMESPACE}
    kubectl get services -n ${NAMESPACE}
    kubectl get ingress -n ${NAMESPACE}
    
    # Test application endpoints
    log_info "Testing application health..."
    
    # Get service IP for internal testing
    SERVICE_IP=$(kubectl get service exam-converter-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
    
    # Run health check from within cluster
    kubectl run health-check-${RANDOM} --rm -i --restart=Never --image=curlimages/curl -- \
        curl -f http://$SERVICE_IP/health || {
        log_error "Health check failed"
        exit 1
    }
    
    log_info "Health check completed successfully"
    
    # Display access information
    log_info "Application deployed successfully!"
    echo -e "${GREEN}Access Information:${NC}"
    echo "- Internal Service: http://$SERVICE_IP"
    echo "- NodePort: http://<node-ip>:30080"
    
    # Check if ingress is configured
    INGRESS_HOST=$(kubectl get ingress exam-converter-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    if [[ -n "$INGRESS_HOST" ]]; then
        echo "- External URL: https://$INGRESS_HOST"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove any temporary Docker containers
    docker ps -a --filter "ancestor=${DOCKER_IMAGE}" --format "{{.ID}}" | xargs -r docker rm -f
    
    # Clean up Docker images (keep latest)
    docker images ${DOCKER_IMAGE} --format "{{.ID}} {{.Tag}}" | grep -v latest | awk '{print $1}' | xargs -r docker rmi -f
    
    # Clean up build artifacts
    rm -rf dist node_modules/.cache
    
    log_info "Cleanup completed"
}

# Main execution
main() {
    local tag=${1:-latest}
    local skip_build=${2:-false}
    
    log_info "Starting deployment process for ${APP_NAME}..."
    echo "Tag: $tag"
    echo "Skip build: $skip_build"
    echo ""
    
    check_prerequisites
    
    if [[ "$skip_build" != "true" ]]; then
        build_wasm
        build_and_test
        build_and_push_docker $tag
    else
        log_info "Skipping build steps as requested"
    fi
    
    deploy_to_k8s $tag
    health_check
    
    log_info "Deployment process completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 ${APP_NAME} is now running on Kubernetes!${NC}"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [TAG] [SKIP_BUILD]"
        echo ""
        echo "Arguments:"
        echo "  TAG         Docker image tag (default: latest)"
        echo "  SKIP_BUILD  Skip build steps (true/false, default: false)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy with latest tag"
        echo "  $0 v1.2.3            # Deploy with specific tag"
        echo "  $0 latest true        # Deploy without building"
        exit 0
        ;;
    --cleanup)
        cleanup
        exit 0
        ;;
    *)
        # Trap cleanup on exit
        trap cleanup EXIT
        
        # Run main function with all arguments
        main "$@"
        ;;
esac