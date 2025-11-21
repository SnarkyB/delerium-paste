# Delirium - Zero-Knowledge Paste System
# Makefile for local development and deployment

.PHONY: help setup start stop restart logs dev clean test build-client build-server health-check quick-start deploy-full security-scan build-multiarch push-multiarch deploy-prod prod-status prod-logs prod-stop

# Default target
help:
	@echo "Delirium - Zero-Knowledge Paste System"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "🚀 Production:"
	@echo "  make deploy-prod   - Deploy to production (with backup)"
	@echo "  make prod-status   - Check production status"
	@echo "  make prod-logs     - View production logs"
	@echo "  make prod-stop     - Stop production containers"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make setup         - 🔐 Interactive setup wizard (configure secrets)"
	@echo "  make start         - Start everything (build client + docker compose up)"
	@echo "  make stop          - Stop all containers"
	@echo "  make restart       - Restart services"
	@echo "  make logs          - Follow logs from all services"
	@echo "  make dev           - Development mode with hot-reload"
	@echo "  make clean         - Clean up everything (volumes, containers, etc.)"
	@echo "  make test          - Run all tests"
	@echo "  make build-client  - Build TypeScript only"
	@echo "  make health-check  - Verify services are running"
	@echo "  make quick-start   - First-time setup and start"
	@echo "  make quick-start-headless - First-time setup for headless environments"
	@echo ""
	@echo "🔒 Security:"
	@echo "  make security-setup - Enhance security for headless environments"
	@echo "  make start-secure  - Start with security enhancements"
	@echo "  make security-check - Run security verification"
	@echo "  make security-scan - Run automated vulnerability scanning"
	@echo ""
	@echo "📊 Monitoring:"
	@echo "  make monitor       - Start service monitoring"
	@echo "  make backup        - Create data backup"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make deploy-full   - Full pipeline: clean, build, test, and deploy"
	@echo "  make build-multiarch - Build multi-architecture Docker images locally"
	@echo "  make push-multiarch - Build and push multi-architecture images to registry"
	@echo ""

# Interactive setup wizard
setup:
	@echo "🔐 Starting interactive setup wizard..."
	@chmod +x scripts/setup.sh
	./scripts/setup.sh

# Start everything
start: build-client
	@echo "🚀 Starting Delirium stack..."
	docker compose up -d
	@echo "✅ Services started! Access at http://localhost:8080"
	@echo "📊 Check status: make logs"

# Stop all containers
stop:
	@echo "🛑 Stopping Delirium stack..."
	docker compose down
	@echo "✅ Services stopped"

# Restart services
restart: stop start

# Follow logs
logs:
	@echo "📋 Following logs (Ctrl+C to exit)..."
	docker compose logs -f

# Development mode with hot-reload
dev:
	@echo "🔧 Starting development mode..."
	@echo "📝 Backend will run in Docker, frontend will watch for changes"
	@echo "🌐 Access at http://localhost:8080"
	@echo ""
	@chmod +x scripts/dev.sh
	./scripts/dev.sh

# Clean up everything
clean:
	@echo "🧹 Cleaning up Delirium stack..."
	docker compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete"

# Run all tests
test:
	@echo "🧪 Running test suite..."
	cd client && npm test
	@echo "✅ Tests completed"

# Build TypeScript client
build-client:
	@echo "📦 Building TypeScript client..."
	cd client && npm run build
	@echo "✅ Client built"

# Health check
health-check:
	@echo "🏥 Checking service health..."
	@chmod +x scripts/health-check.sh
	./scripts/health-check.sh

# Quick start for first-time users
quick-start:
	@echo "🚀 Quick start setup..."
	@chmod +x scripts/quick-start.sh
	./scripts/quick-start.sh

# Quick start for headless environments
quick-start-headless:
	@echo "🚀 Quick start setup (headless mode)..."
	@chmod +x scripts/quick-start.sh
	HEADLESS=1 ./scripts/quick-start.sh

# Security setup for headless environments
security-setup:
	@echo "🔒 Setting up security enhancements..."
	@chmod +x scripts/security-setup.sh
	./scripts/security-setup.sh

# Start with security enhancements
start-secure: security-setup
	@echo "🛡️  Starting with security enhancements..."
	docker compose -f docker-compose.yml -f docker-compose.secure.yml up -d

# Security check
security-check:
	@echo "🔍 Running security check..."
	@chmod +x scripts/security-check.sh
	./scripts/security-check.sh

# Security scan
security-scan:
	@echo "🔒 Running automated security scan..."
	@chmod +x scripts/security-scan.sh
	./scripts/security-scan.sh

# Monitor services
monitor:
	@echo "📊 Starting monitoring..."
	@chmod +x scripts/monitor.sh
	./scripts/monitor.sh

# Create backup
backup:
	@echo "💾 Creating backup..."
	@chmod +x scripts/backup.sh
	./scripts/backup.sh

# Full pipeline: clean, build, test, and deploy
# Optimized with parallel builds and tests for faster execution
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
	@echo "🧪 Step 3/5: Running tests in parallel..."
	@echo "  → Client tests..."
	@(cd client && npm test || (echo "⚠️  Client tests failed!" && exit 1)) & \
	CLIENT_PID=$$!; \
	echo "  → Server tests..."
	@(cd server && ./gradlew test || (echo "⚠️  Server tests failed!" && exit 1)) & \
	SERVER_PID=$$!; \
	wait $$CLIENT_PID; \
	CLIENT_EXIT=$$?; \
	wait $$SERVER_PID; \
	SERVER_EXIT=$$?; \
	if [ $$CLIENT_EXIT -ne 0 ] || [ $$SERVER_EXIT -ne 0 ]; then \
		echo "❌ Tests failed!"; \
		exit 1; \
	fi
	@echo ""
	@echo "🐳 Step 4/5: Deploying to Docker..."
	@docker compose down
	@docker compose up -d
	@echo ""
	@echo "=========================================="
	@echo "✅ Full pipeline completed successfully!"
	@echo "=========================================="
	@echo "🌐 Access at http://localhost:8080"
	@echo "📊 Check logs: make logs"

# Build multi-architecture Docker images locally
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
	@echo "📦 Images tagged as:"
	@echo "   - delerium-paste-mono-server:latest"
	@echo "   - delerium-paste-mono-server:multi-arch"

# Build and push multi-architecture images to registry
# Usage: make push-multiarch REGISTRY=ghcr.io/username TAG=v1.0.0
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
	echo "✅ Multi-architecture images pushed successfully!"; \
	echo "📦 Images available at:"; \
	echo "   - $(REGISTRY)/delerium-paste-mono-server:$$TAG"; \
	echo "   - $(REGISTRY)/delerium-paste-mono-server:latest"; \
	echo "🔍 Inspect with: docker buildx imagetools inspect $(REGISTRY)/delerium-paste-mono-server:$$TAG"

# Production deployment commands
deploy-prod:
	@echo "🚀 Deploying to production..."
	@chmod +x scripts/deploy-prod.sh
	./scripts/deploy-prod.sh

prod-status:
	@echo "📊 Checking production status..."
	@chmod +x scripts/prod-status.sh
	./scripts/prod-status.sh

prod-logs:
	@echo "📋 Viewing production logs..."
	@chmod +x scripts/prod-logs.sh
	./scripts/prod-logs.sh

prod-stop:
	@echo "🛑 Stopping production..."
	@chmod +x scripts/prod-stop.sh
	./scripts/prod-stop.sh
