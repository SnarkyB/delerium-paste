# Delerium - Zero-Knowledge Paste System
# Makefile delegates to unified CLI: ./delerium

.PHONY: help setup start stop restart logs dev clean test build-client deploy backup security monitor status version

# Default target
help:
	@./delerium help

# Core commands
setup:
	@./delerium setup

start:
	@./delerium start

stop:
	@./delerium stop

restart:
	@./delerium restart

logs:
	@./delerium logs

dev:
	@./delerium start --dev

test:
	@./delerium test --all

deploy:
	@./delerium deploy

backup:
	@./delerium backup

security:
	@./delerium security check

monitor:
	@./delerium monitor

status:
	@./delerium status

version:
	@./delerium version

# Build client only
build-client:
	@echo "📦 Building TypeScript client..."
	@cd client && npm run build

# Clean up
clean:
	@echo "🧹 Cleaning up..."
	@docker compose down -v
	@docker system prune -f
	@echo "✅ Cleanup complete"

# Multi-architecture builds (specialized)
build-multiarch:
	@echo "🏗️  Building multi-architecture Docker images..."
	@docker buildx version || (echo "❌ Docker Buildx not found" && exit 1)
	@docker buildx create --name delirium-builder --use 2>/dev/null || docker buildx use delirium-builder || docker buildx use default
	@cd server && docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--tag delerium-paste-mono-server:latest \
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
	docker buildx create --name delirium-builder --use 2>/dev/null || docker buildx use delirium-builder || docker buildx use default; \
	cd server && docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--tag $(REGISTRY)/delerium-paste-mono-server:$$TAG \
		--tag $(REGISTRY)/delerium-paste-mono-server:latest \
		--push \
		.
	@echo "✅ Multi-architecture images pushed!"
