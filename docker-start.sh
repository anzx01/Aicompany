#!/bin/bash

# AI Company Builder - Docker Startup Script
# This script helps you build and run the application using Docker

set -e

echo "🚀 AI Company Builder - Docker Setup"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your environment variables."
    echo ""
    echo "Required variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - DATABASE_URL"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Function to build Docker image
build_image() {
    echo "📦 Building Docker image..."
    docker build -t ai-company-builder:latest .
    echo "✅ Docker image built successfully"
    echo ""
}

# Function to start with docker-compose
start_compose() {
    echo "🚀 Starting application with docker-compose..."
    docker-compose up -d
    echo ""
    echo "✅ Application started!"
    echo "🌐 Access the application at: http://localhost:3000"
    echo ""
    echo "📊 View logs with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
}

# Function to start without docker-compose
start_docker() {
    echo "🚀 Starting application with Docker..."
    docker run -d \
        --name ai-company-builder \
        -p 3000:3000 \
        --env-file .env.local \
        ai-company-builder:latest
    echo ""
    echo "✅ Application started!"
    echo "🌐 Access the application at: http://localhost:3000"
    echo ""
    echo "📊 View logs with: docker logs -f ai-company-builder"
    echo "🛑 Stop with: docker stop ai-company-builder && docker rm ai-company-builder"
}

# Main menu
echo "Choose an option:"
echo "1) Build and start with docker-compose (recommended)"
echo "2) Build and start with Docker only"
echo "3) Build image only"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        build_image
        start_compose
        ;;
    2)
        build_image
        start_docker
        ;;
    3)
        build_image
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
