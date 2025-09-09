pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE = 'your-dockerhub-username/exam-converter'
        KUBECONFIG = credentials('kubeconfig')
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        node --version
                        npm --version
                        npm ci
                    '''
                }
            }
        }
        
        stage('Lint and Test') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Build Test') {
                    steps {
                        sh 'npm run build'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def imageTag = "${env.BUILD_NUMBER}"
                    def latestTag = "latest"
                    
                    sh """
                        docker build -t ${DOCKER_IMAGE}:${imageTag} .
                        docker tag ${DOCKER_IMAGE}:${imageTag} ${DOCKER_IMAGE}:${latestTag}
                    """
                    
                    env.IMAGE_TAG = imageTag
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Using Trivy for vulnerability scanning
                    sh """
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                        -v \$PWD/cache:/root/.cache/ aquasec/trivy:latest \\
                        image --exit-code 0 --severity HIGH,CRITICAL \\
                        ${DOCKER_IMAGE}:${env.IMAGE_TAG}
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    sh '''
                        echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin
                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh '''
                        # Update deployment image
                        sed -i "s|your-dockerhub-username/exam-converter:latest|${DOCKER_IMAGE}:${IMAGE_TAG}|g\" k8s/deployment.yaml
                        
                        # Apply Kubernetes manifests
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml
                        kubectl apply -f k8s/ingress.yaml
                        kubectl apply -f k8s/hpa.yaml
                        
                        # Wait for deployment to complete
                        kubectl rollout status deployment/exam-converter-app -n exam-converter --timeout=300s
                        
                        # Verify deployment
                        kubectl get pods -n exam-converter
                        kubectl get services -n exam-converter
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh '''
                        # Wait for pods to be ready
                        kubectl wait --for=condition=ready pod -l app=exam-converter -n exam-converter --timeout=300s
                        
                        # Get service endpoint for health check
                        SERVICE_IP=$(kubectl get service exam-converter-service -n exam-converter -o jsonpath='{.spec.clusterIP}')
                        
                        # Perform health check
                        kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- \\
                        curl -f http://$SERVICE_IP/ || exit 1
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh '''
                docker rmi ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                docker rmi ${DOCKER_IMAGE}:latest || true
                docker system prune -f
            '''
        }
        success {
            echo 'Pipeline succeeded! Application deployed successfully.'
            // Send success notification
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Exam Converter deployed successfully! Build: ${env.BUILD_NUMBER}"
            )
        }
        failure {
            echo 'Pipeline failed!'
            // Send failure notification
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Exam Converter deployment failed! Build: ${env.BUILD_NUMBER}"
            )
        }
    }
}