#!/bin/bash
set -e

# Deployment script for delerium
# Usage: ./scripts/deploy.sh [environment]

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Deploying delerium to ${ENVIRONMENT}..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with required environment variables"
    echo "See .env.example for reference"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$DELETION_TOKEN_PEPPER" ] || [ "$DELETION_TOKEN_PEPPER" = "change-me" ]; then
    echo "❌ Error: DELETION_TOKEN_PEPPER not set or using default value"
    echo "Please set a secure value in .env file"
    exit 1
fi

echo "📦 Building client..."
cd client
npm ci
npm run build
cd ..

echo "🐳 Building Docker images..."
docker compose -f $COMPOSE_FILE build --parallel

echo "🔄 Stopping old containers..."
docker compose -f $COMPOSE_FILE down

echo "🚀 Starting new containers..."
docker compose -f $COMPOSE_FILE up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are healthy
if docker compose -f $COMPOSE_FILE ps | grep -q "unhealthy"; then
    echo "❌ Some services are unhealthy!"
    docker compose -f $COMPOSE_FILE ps
    docker compose -f $COMPOSE_FILE logs
    exit 1
fi

echo "✅ Deployment successful!"
echo ""
echo "📊 Service status:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "📝 View logs with: docker compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop services with: docker compose -f $COMPOSE_FILE down"
