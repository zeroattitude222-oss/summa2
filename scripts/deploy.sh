#!/bin/bash

# Deployment script for Exam Document Converter
set -e

# Configuration
DOCKER_IMAGE="your-dockerhub-username/exam-converter"
NAMESPACE="exam-converter"
DEPLOYMENT_NAME="exam-converter-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build and push Docker image
build_and_push() {
    local tag=${1:-latest}
    
    log_info "Building Docker image with tag: $tag"
    docker build -t ${DOCKER_IMAGE}:${tag} .
    
    log_info "Pushing Docker image to registry"
    docker push ${DOCKER_IMAGE}:${tag}
}

# Deploy to Kubernetes
deploy_to_k8s() {
    local tag=${1:-latest}
    
    log_info "Deploying to Kubernetes..."
    
    # Update image tag in deployment
    sed -i.bak "s|${DOCKER_IMAGE}:.*|${DOCKER_IMAGE}:${tag}|g" k8s/deployment.yaml
    
    # Apply manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml
    
    # Wait for rollout
    log_info "Waiting for deployment to complete..."
    kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=300s
    
    # Restore original deployment file
    mv k8s/deployment.yaml.bak k8s/deployment.yaml
    
    log_info "Deployment completed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=exam-converter -n ${NAMESPACE} --timeout=300s
    
    # Get pod status
    kubectl get pods -n ${NAMESPACE}
    
    log_info "Health check completed"
}

# Main execution
main() {
    local tag=${1:-latest}
    
    log_info "Starting deployment process..."
    
    check_prerequisites
    build_and_push $tag
    deploy_to_k8s $tag
    health_check
    
    log_info "Deployment process completed successfully!"
}

# Run main function with all arguments
main "$@"