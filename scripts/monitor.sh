#!/bin/bash
# Monitoring script for Delirium in headless environments

LOG_FILE="logs/monitor.log"
mkdir -p logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔍 Starting Delirium monitoring..."

while true; do
    # Check Docker status
    if ! docker info > /dev/null 2>&1; then
        log "❌ Docker is not running"
        sleep 30
        continue
    fi

    # Check container health
    if ! docker compose ps | grep -q "Up"; then
        log "❌ Containers are not running"
        # Try to restart
        log "🔄 Attempting to restart services..."
        docker compose up -d
        sleep 10
        continue
    fi

    # Check API health
    if ! curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
        log "⚠️  API health check failed"
    fi
    
    # Check metrics sidecar if running
    if docker compose ps 2>/dev/null | grep -q "metrics.*Up"; then
        if ! curl -s -f http://localhost:9090/health > /dev/null 2>&1; then
            log "⚠️  Metrics sidecar health check failed"
        fi
    fi

    # Check disk space
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log "⚠️  Disk usage is high: ${DISK_USAGE}%"
    fi

    # Check memory usage (if available)
    if command -v free > /dev/null 2>&1; then
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$MEMORY_USAGE" -gt 90 ]; then
            log "⚠️  Memory usage is high: ${MEMORY_USAGE}%"
        fi
    fi

    # Log successful check
    log "✅ All checks passed"
    
    # Wait before next check
    sleep 60
done
