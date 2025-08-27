#!/bin/bash

# Docker build script for production deployment

echo "🚀 Building Docker image for production..."

# Build the Docker image
docker build -t cultural-quiz-app:latest .

echo "📊 Docker image built successfully!"
echo "🏷️  Tagged as: cultural-quiz-app:latest"

# Show image size
echo "📏 Image size:"
docker images cultural-quiz-app:latest

echo ""
echo "✅ Ready for deployment to Coolify!"
echo "💡 Next steps:"
echo "   1. Push to your git repository"
echo "   2. Configure Coolify with the environment variables"
echo "   3. Deploy using the Dockerfile"