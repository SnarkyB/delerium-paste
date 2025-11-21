#!/bin/bash
set -e

# Quick start script for Delirium
# This script sets up everything needed for first-time users

echo "🚀 Delirium Quick Start Setup"
echo "=============================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Docker
if ! command -v docker > /dev/null 2>&1; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is installed and running"

# Check Node.js
if ! command -v node > /dev/null 2>&1; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js $(node --version) is installed"

# Check npm
if ! command -v npm > /dev/null 2>&1; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm $(npm --version) is installed"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Client dependencies installed"
else
    echo "✅ Client dependencies already installed"
fi

# Build client
echo "🔨 Building TypeScript client..."
npm run build
echo "✅ Client built successfully"
cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Delirium Environment Configuration
# Change this to a secure random string in production
DELETION_TOKEN_PEPPER=dev-pepper-$(openssl rand -hex 16)
EOF
    echo "✅ .env file created with secure pepper"
else
    echo "✅ .env file already exists"
fi

# Start services
echo ""
echo "🐳 Starting Delirium services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Health check
echo "🏥 Checking service health..."
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend might not be ready yet"
fi

if curl -s http://localhost:8080/api/pow > /dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "⚠️  API might not be ready yet"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:8080"
echo "   API:      http://localhost:8080/api"
echo ""
echo "📋 Useful commands:"
echo "   make logs     - View logs"
echo "   make stop     - Stop services"
echo "   make restart  - Restart services"
echo "   make dev      - Development mode with hot-reload"
echo "   make clean    - Clean up everything"
echo ""

# Check if we're in a headless environment
if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ] || [ "$(uname)" = "Darwin" ]; then
    # We have a display, try to open browser
    if [ -z "$HEADLESS" ] && [ -z "$NO_BROWSER" ]; then
        if command -v open > /dev/null 2>&1; then
            echo "🌐 Opening browser..."
            open http://localhost:8080
        elif command -v xdg-open > /dev/null 2>&1; then
            echo "🌐 Opening browser..."
            xdg-open http://localhost:8080
        else
            echo "🌐 Please open http://localhost:8080 in your browser"
        fi
    else
        echo "🌐 Browser opening skipped (HEADLESS or NO_BROWSER set)"
        echo "   Access at: http://localhost:8080"
    fi
else
    # Headless environment detected
    echo "🖥️  Headless environment detected"
    echo "🌐 Access your application at: http://localhost:8080"
    echo "   (No browser will be opened automatically)"
fi

echo ""
echo "✨ Welcome to Delirium! Your zero-knowledge paste system is ready."
