# Delerium - Zero-Knowledge Paste System
# Makefile for local development and deployment
# 
# This Makefile now delegates to the unified CLI tool: ./delerium
# For more information, run: ./delerium help

.PHONY: help setup start stop restart logs dev clean test build-client health status deploy backup security monitor version

# Default target
help:
	@./delerium help

# Setup and Installation
setup:
	@./delerium setup

# Service Management
start:
	@./delerium start

stop:
	@./delerium stop

restart:
	@./delerium restart

# Development
dev:
	@./delerium start --dev

# Logs and Status
logs:
	@./delerium logs

status:
	@./delerium status

health:
	@./delerium health

# Testing
test:
	@./delerium test --all

test-frontend:
	@./delerium test --frontend

test-backend:
	@./delerium test --backend

test-quick:
	@./delerium test --quick

# Building
build-client:
	@echo "📦 Building TypeScript client..."
	@cd client && npm run build

# Deployment
deploy:
	@./delerium deploy

deploy-prod:
	@./delerium deploy --target local

# Backup and Recovery
backup:
	@./delerium backup

# Security
security:
	@./delerium security check

security-setup:
	@./delerium security setup

security-check:
	@./delerium security check

security-scan:
	@./delerium security scan

# Monitoring
monitor:
	@./delerium monitor

# Cleanup
clean:
	@echo "🧹 Cleaning up Delerium stack..."
	@docker compose down -v
	@docker system prune -f
	@echo "✅ Cleanup complete"

# Version
version:
	@./delerium version

# Legacy targets for backward compatibility
# These are kept to avoid breaking existing workflows

quick-start:
	@echo "⚠️  'make quick-start' is deprecated. Use: ./delerium setup"
	@./delerium setup

quick-start-headless:
	@echo "⚠️  'make quick-start-headless' is deprecated. Use: HEADLESS=1 ./delerium setup"
	@HEADLESS=1 ./delerium setup

health-check:
	@echo "⚠️  'make health-check' is deprecated. Use: ./delerium status"
	@./delerium status

start-secure:
	@echo "⚠️  'make start-secure' is deprecated. Use: ./delerium security setup && ./delerium start"
	@./delerium security setup
	@./delerium start

prod-status:
	@echo "⚠️  'make prod-status' is deprecated. Use: ./delerium status"
	@./delerium status --detailed

prod-logs:
	@echo "⚠️  'make prod-logs' is deprecated. Use: ./delerium logs"
	@./delerium logs

prod-stop:
	@echo "⚠️  'make prod-stop' is deprecated. Use: ./delerium stop"
	@./delerium stop

# Multi-architecture Docker builds (kept as-is since they're specialized)
build-multiarch:
	@echo "🏗️  Building multi-architecture Docker images..."
	@echo "📋 Checking Docker Buildx..."
	@docker buildx version || (echo "❌ Docker Buildx not found. Please install Docker Desktop or enable buildx." && exit 1)
	@echo "🔧 Creating/using buildx builder..."
	@docker buildx create --name delirium-builder --use 2>/dev/null || docker buildx use delirium-builder || docker buildx use default
	@echo "🏗️  Building for linux/amd64 and linux/arm64..."
	@cd server && docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--tag delerium-paste-mono-server:latest \
		--tag delerium-paste-mono-server:multi-arch \
		--load \
		.
	@echo "✅ Multi-architecture build complete!"

push-multiarch:
	@echo "🚀 Building and pushing multi-architecture Docker images..."
	@if [ -z "$(REGISTRY)" ]; then \
		echo "❌ REGISTRY variable not set. Usage: make push-multiarch REGISTRY=ghcr.io/username TAG=v1.0.0"; \
		exit 1; \
	fi
	@TAG=$${TAG:-latest}; \
	echo "📋 Registry: $(REGISTRY)"; \
	echo "🏷️  Tag: $$TAG"; \
	echo "🔧 Creating/using buildx builder..."; \
	docker buildx create --name delirium-builder --use 2>/dev/null || docker buildx use delirium-builder || docker buildx use default; \
	echo "🏗️  Building and pushing for linux/amd64 and linux/arm64..."; \
	cd server && docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--tag $(REGISTRY)/delerium-paste-mono-server:$$TAG \
		--tag $(REGISTRY)/delerium-paste-mono-server:latest \
		--push \
		.; \
	echo "✅ Multi-architecture images pushed successfully!"

# Full deployment pipeline (kept for CI/CD compatibility)
deploy-full:
	@echo "=========================================="
	@echo "🚀 Full Pipeline: Clean, Build, Test & Deploy"
	@echo "=========================================="
	@echo ""
	@echo "🧹 Step 1/5: Cleaning..."
	@$(MAKE) clean
	@echo ""
	@echo "📦 Step 2/5: Building client and server in parallel..."
	@(cd client && npm run build) & \
	(cd server && ./gradlew clean build) & \
	wait || exit 1
	@echo ""
	@echo "🧪 Step 3/5: Running tests..."
	@./delerium test --all
	@echo ""
	@echo "🐳 Step 4/5: Deploying to Docker..."
	@./delerium deploy
	@echo ""
	@echo "=========================================="
	@echo "✅ Full pipeline completed successfully!"
	@echo "=========================================="
