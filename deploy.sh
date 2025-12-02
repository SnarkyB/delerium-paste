#!/bin/bash
set -e

# =============================================================================
# Delirium Paste - Unified Deployment Script
# =============================================================================
# This script consolidates all deployment workflows into a single, easy-to-use
# interface. It supports local development, VPS setup, and production deployment.
#
# Usage:
#   ./deploy.sh [command] [options]
#
# Commands:
#   local           - Deploy locally for development (port 8080)
#   vps-setup       - Initial VPS setup with SSL (requires domain)
#   production      - Deploy to production (existing setup)
#   update          - Update and redeploy (pull + rebuild)
#   status          - Check deployment status
#   logs            - View application logs
#   stop            - Stop all services
#   clean           - Stop services and remove volumes
#
# Examples:
#   ./deploy.sh local
#   ./deploy.sh vps-setup example.com admin@example.com
#   ./deploy.sh production
#   ./deploy.sh update
#   ./deploy.sh logs
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper functions
echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_header() {
    echo ""
    echo -e "${BLUE}${BOLD}========================================${NC}"
    echo -e "${BLUE}${BOLD} $1${NC}"
    echo -e "${BLUE}${BOLD}========================================${NC}"
    echo ""
}

# Check if running as root
check_not_root() {
    if [ "$EUID" -eq 0 ]; then
        echo_error "Please do not run this script as root (use regular user with sudo access)"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    local missing=()
    
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi
    
    if ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo_error "Missing required tools: ${missing[*]}"
        echo_error "Please install them first:"
        echo "  Docker: https://docs.docker.com/get-docker/"
        echo "  Docker Compose: https://docs.docker.com/compose/install/"
        return 1
    fi
    
    return 0
}

# Check if Node.js is installed (for client builds)
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo_warn "Node.js not found. Required for building client."
        echo_warn "Install from: https://nodejs.org/"
        return 1
    fi
    return 0
}

# =============================================================================
# LOCAL DEPLOYMENT
# =============================================================================
deploy_local() {
    echo_header "Local Development Deployment"
    
    check_not_root
    check_prerequisites || exit 1
    
    echo_info "Deploying Delirium for local development..."
    echo_info "This will start services on http://localhost:8080"
    echo ""
    
    # Check for .env file
    if [ ! -f .env ]; then
        echo_info "Creating .env file with secure pepper..."
        PEPPER=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
        cat > .env << EOF
# Delirium Development Configuration
DELETION_TOKEN_PEPPER=$PEPPER
EOF
        echo_info ".env file created"
    fi
    
    # Build client if Node.js is available
    if check_nodejs; then
        echo_info "Building frontend client..."
        cd client
        npm ci --silent
        npm run build
        cd ..
    else
        echo_warn "Skipping client build (Node.js not found)"
        echo_warn "Using pre-built client files if available"
    fi
    
    # Start services
    echo_info "Starting Docker containers..."
    docker compose up --build -d
    
    # Wait for services
    echo_info "Waiting for services to start..."
    sleep 5
    
    # Check health
    if docker compose ps | grep -q "Up"; then
        echo ""
        echo_info "✅ Deployment successful!"
        echo ""
        echo_info "Access your instance at: ${BLUE}http://localhost:8080${NC}"
        echo ""
        echo_info "Useful commands:"
        echo "  View logs:    docker compose logs -f"
        echo "  Stop:         ./deploy.sh stop"
        echo "  Status:       ./deploy.sh status"
        echo ""
    else
        echo_error "Some services failed to start"
        echo_error "Check logs with: docker compose logs"
        exit 1
    fi
}

# =============================================================================
# VPS SETUP (Initial deployment with SSL)
# =============================================================================
deploy_vps_setup() {
    local DOMAIN=$1
    local EMAIL=$2
    
    echo_header "VPS Initial Setup with SSL"
    
    check_not_root
    
    # Validate arguments
    if [ -z "$DOMAIN" ]; then
        echo_error "Domain name is required"
        echo "Usage: $0 vps-setup YOUR_DOMAIN YOUR_EMAIL"
        echo "Example: $0 vps-setup example.com admin@example.com"
        exit 1
    fi
    
    if [ -z "$EMAIL" ]; then
        echo_error "Email address is required for Let's Encrypt"
        echo "Usage: $0 vps-setup YOUR_DOMAIN YOUR_EMAIL"
        echo "Example: $0 vps-setup example.com admin@example.com"
        exit 1
    fi
    
    echo_info "Setting up Delirium on VPS for domain: $DOMAIN"
    echo ""
    
    # Step 1: Update system
    echo_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Step 2: Install Docker
    if ! command -v docker &> /dev/null; then
        echo_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo_warn "Docker installed. You may need to log out and back in for group changes to take effect."
    else
        echo_info "Docker already installed"
    fi
    
    # Step 3: Install Docker Compose
    if ! docker compose version &> /dev/null; then
        echo_info "Installing Docker Compose..."
        sudo apt install docker-compose-plugin -y
    fi
    
    # Step 4: Install Docker Buildx (for multi-arch support)
    if ! docker buildx version &> /dev/null; then
        echo_info "Installing Docker Buildx..."
        sudo apt install docker-buildx-plugin -y
    fi
    
    # Step 5: Install Certbot
    if ! command -v certbot &> /dev/null; then
        echo_info "Installing Certbot..."
        sudo apt install certbot -y
    else
        echo_info "Certbot already installed"
    fi
    
    # Step 6: Install Node.js
    if ! command -v node &> /dev/null; then
        echo_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        echo_info "Node.js already installed (version $(node -v))"
    fi
    
    # Step 7: Configure firewall
    echo_info "Configuring firewall..."
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow 22/tcp   # SSH
        sudo ufw allow 80/tcp   # HTTP
        sudo ufw allow 443/tcp  # HTTPS
        sudo ufw status
    else
        echo_warn "UFW not found, skipping firewall configuration"
    fi
    
    # Step 8: Create .env file
    echo_info "Creating .env file with secure pepper..."
    PEPPER=$(openssl rand -hex 32)
    cat > .env << EOF
# Delirium Production Configuration
DELETION_TOKEN_PEPPER=$PEPPER
EOF
    echo_info ".env file created with secure random pepper"
    
    # Step 9: Stop any running containers
    echo_info "Stopping any existing containers..."
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Step 10: Get SSL certificate
    echo_info "Obtaining SSL certificate from Let's Encrypt..."
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        sudo certbot certonly --standalone \
            -d "$DOMAIN" \
            --non-interactive \
            --agree-tos \
            --email "$EMAIL" \
            || {
                echo_error "Failed to obtain SSL certificate"
                echo_error "Make sure:"
                echo_error "  1. DNS is pointing to this server"
                echo_error "  2. Port 80 is accessible from the internet"
                echo_error "  3. No other service is using port 80"
                exit 1
            }
        echo_info "SSL certificate obtained successfully"
    else
        echo_info "SSL certificate already exists for $DOMAIN"
    fi
    
    # Step 11: Copy SSL certificates
    echo_info "Copying SSL certificates to project..."
    mkdir -p ssl
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/
    sudo chown $(id -un):$(id -gn) ssl/*.pem
    chmod 644 ssl/fullchain.pem
    chmod 600 ssl/privkey.pem
    
    # Step 12: Configure nginx with domain
    echo_info "Configuring nginx for domain $DOMAIN..."
    cp reverse-proxy/nginx-ssl.conf reverse-proxy/nginx.conf
    sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" reverse-proxy/nginx.conf
    
    # Step 13: Build client
    echo_info "Building frontend client..."
    cd client
    npm ci
    npm run build
    cd ..
    
    # Step 14: Build and start containers
    echo_info "Building and starting Docker containers..."
    docker compose -f docker-compose.prod.yml build --parallel
    docker compose -f docker-compose.prod.yml up -d
    
    # Step 15: Wait for services to start
    echo_info "Waiting for services to start..."
    sleep 15
    
    # Step 16: Check service health
    echo_info "Checking service health..."
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo_info "✅ Services are running!"
    else
        echo_error "Some services failed to start. Check logs with:"
        echo_error "  docker compose -f docker-compose.prod.yml logs"
        exit 1
    fi
    
    # Step 17: Set up certificate auto-renewal
    echo_info "Setting up automatic SSL certificate renewal..."
    INSTALL_DIR=$(pwd)
    CRON_JOB="0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/$DOMAIN/*.pem $INSTALL_DIR/ssl/ && chown \$(id -un):\$(id -gn) $INSTALL_DIR/ssl/*.pem && cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml restart web' >> /var/log/certbot-renew.log 2>&1"
    
    # Remove old cron job if exists
    (crontab -l 2>/dev/null | grep -v "certbot renew") | crontab - 2>/dev/null || true
    
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    echo_info "Certificate auto-renewal configured (daily at 3 AM)"
    
    # Step 18: Display deployment info
    echo ""
    echo_info "================================================"
    echo_info "🎉 Deployment Complete!"
    echo_info "================================================"
    echo ""
    echo_info "Your Delirium instance is now running at:"
    echo_info "  🔒 https://$DOMAIN"
    echo ""
    echo_info "Useful commands:"
    echo_info "  View logs:      ./deploy.sh logs"
    echo_info "  Restart:        docker compose -f docker-compose.prod.yml restart"
    echo_info "  Stop:           ./deploy.sh stop"
    echo_info "  Status:         ./deploy.sh status"
    echo_info "  Update:         ./deploy.sh update"
    echo ""
    echo_info "SSL certificate will auto-renew daily at 3 AM"
    echo ""
}

# =============================================================================
# PRODUCTION DEPLOYMENT (Existing setup)
# =============================================================================
deploy_production() {
    echo_header "Production Deployment"
    
    check_not_root
    check_prerequisites || exit 1
    
    echo_info "Deploying to production..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo_error ".env file not found"
        echo_error "Please create .env file with required environment variables"
        echo_error "Run './deploy.sh vps-setup' for initial setup"
        exit 1
    fi
    
    # Source environment variables
    source .env
    
    # Validate required environment variables
    if [ -z "$DELETION_TOKEN_PEPPER" ] || [ "$DELETION_TOKEN_PEPPER" = "change-me" ]; then
        echo_error "DELETION_TOKEN_PEPPER not set or using default value"
        echo_error "Please set a secure value in .env file"
        exit 1
    fi
    
    # Build client if Node.js is available
    if check_nodejs; then
        echo_info "Building frontend client..."
        cd client
        npm ci
        npm run build
        cd ..
    else
        echo_warn "Skipping client build (Node.js not found)"
    fi
    
    echo_info "Building Docker images..."
    docker compose -f docker-compose.prod.yml build --parallel
    
    echo_info "Stopping old containers..."
    docker compose -f docker-compose.prod.yml down
    
    echo_info "Starting new containers..."
    docker compose -f docker-compose.prod.yml up -d
    
    echo_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are healthy
    if docker compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
        echo_error "Some services are unhealthy!"
        docker compose -f docker-compose.prod.yml ps
        docker compose -f docker-compose.prod.yml logs
        exit 1
    fi
    
    echo ""
    echo_info "✅ Deployment successful!"
    echo ""
    echo_info "Service status:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
}

# =============================================================================
# UPDATE DEPLOYMENT
# =============================================================================
deploy_update() {
    echo_header "Update Deployment"
    
    check_not_root
    check_prerequisites || exit 1
    
    echo_info "Updating Delirium..."
    
    # Check if we're in a git repository
    if [ -d .git ]; then
        echo_info "Pulling latest changes..."
        git pull origin main || git pull origin master || {
            echo_warn "Git pull failed, continuing with local changes"
        }
    else
        echo_warn "Not a git repository, skipping pull"
    fi
    
    # Detect which compose file to use
    if [ -f docker-compose.prod.yml ] && docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
        echo_info "Detected production deployment"
        deploy_production
    else
        echo_info "Detected local deployment"
        deploy_local
    fi
}

# =============================================================================
# STATUS CHECK
# =============================================================================
check_status() {
    echo_header "Deployment Status"
    
    # Check which compose file is active
    if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
        echo_info "Production deployment detected"
        echo ""
        docker compose -f docker-compose.prod.yml ps
        echo ""
        
        # Try to get health status
        echo_info "Health check:"
        if command -v curl &> /dev/null; then
            curl -s http://localhost/api/health 2>/dev/null | head -n 5 || echo "Health endpoint not responding"
        fi
    elif docker compose ps 2>/dev/null | grep -q "Up"; then
        echo_info "Local deployment detected"
        echo ""
        docker compose ps
        echo ""
        
        # Try to get health status
        echo_info "Health check:"
        if command -v curl &> /dev/null; then
            curl -s http://localhost:8080/api/health 2>/dev/null | head -n 5 || echo "Health endpoint not responding"
        fi
    else
        echo_warn "No active deployment found"
        echo_info "Start a deployment with:"
        echo "  ./deploy.sh local          (for development)"
        echo "  ./deploy.sh production     (for production)"
    fi
}

# =============================================================================
# VIEW LOGS
# =============================================================================
view_logs() {
    echo_header "Application Logs"
    
    # Check which compose file is active
    if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
        echo_info "Showing production logs (Ctrl+C to exit)..."
        docker compose -f docker-compose.prod.yml logs -f
    elif docker compose ps 2>/dev/null | grep -q "Up"; then
        echo_info "Showing local logs (Ctrl+C to exit)..."
        docker compose logs -f
    else
        echo_error "No active deployment found"
        exit 1
    fi
}

# =============================================================================
# STOP SERVICES
# =============================================================================
stop_services() {
    echo_header "Stopping Services"
    
    local stopped=false
    
    # Try production compose file
    if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
        echo_info "Stopping production deployment..."
        docker compose -f docker-compose.prod.yml down
        stopped=true
    fi
    
    # Try local compose file
    if docker compose ps 2>/dev/null | grep -q "Up"; then
        echo_info "Stopping local deployment..."
        docker compose down
        stopped=true
    fi
    
    if [ "$stopped" = true ]; then
        echo_info "✅ Services stopped"
    else
        echo_warn "No running services found"
    fi
}

# =============================================================================
# CLEAN (Stop and remove volumes)
# =============================================================================
clean_deployment() {
    echo_header "Clean Deployment"
    
    echo_warn "This will stop all services and remove volumes (including database)"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
        echo_info "Cancelled"
        exit 0
    fi
    
    local cleaned=false
    
    # Try production compose file
    if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up" || \
       docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Exit"; then
        echo_info "Cleaning production deployment..."
        docker compose -f docker-compose.prod.yml down -v
        cleaned=true
    fi
    
    # Try local compose file
    if docker compose ps 2>/dev/null | grep -q "Up" || \
       docker compose ps 2>/dev/null | grep -q "Exit"; then
        echo_info "Cleaning local deployment..."
        docker compose down -v
        cleaned=true
    fi
    
    if [ "$cleaned" = true ]; then
        echo_info "✅ Deployment cleaned"
    else
        echo_warn "No deployment found to clean"
    fi
}

# =============================================================================
# SHOW USAGE
# =============================================================================
show_usage() {
    cat << EOF
${BOLD}Delirium Paste - Unified Deployment Script${NC}

${BOLD}USAGE:${NC}
    ./deploy.sh [command] [options]

${BOLD}COMMANDS:${NC}
    ${GREEN}local${NC}
        Deploy locally for development (port 8080)
        Example: ./deploy.sh local

    ${GREEN}vps-setup${NC} <domain> <email>
        Initial VPS setup with SSL (requires domain)
        Example: ./deploy.sh vps-setup example.com admin@example.com

    ${GREEN}production${NC}
        Deploy to production (existing setup)
        Example: ./deploy.sh production

    ${GREEN}update${NC}
        Update and redeploy (pull + rebuild)
        Example: ./deploy.sh update

    ${GREEN}status${NC}
        Check deployment status
        Example: ./deploy.sh status

    ${GREEN}logs${NC}
        View application logs (Ctrl+C to exit)
        Example: ./deploy.sh logs

    ${GREEN}stop${NC}
        Stop all services
        Example: ./deploy.sh stop

    ${GREEN}clean${NC}
        Stop services and remove volumes (including database)
        Example: ./deploy.sh clean

    ${GREEN}help${NC}
        Show this help message

${BOLD}EXAMPLES:${NC}
    # Local development
    ./deploy.sh local

    # Initial VPS setup with SSL
    ./deploy.sh vps-setup example.com admin@example.com

    # Deploy to production
    ./deploy.sh production

    # Update existing deployment
    ./deploy.sh update

    # Check status
    ./deploy.sh status

    # View logs
    ./deploy.sh logs

${BOLD}REQUIREMENTS:${NC}
    - Docker and Docker Compose
    - Node.js 18+ (for building client)
    - For VPS setup: Domain name pointed to server IP
    - For production: Existing .env file with DELETION_TOKEN_PEPPER

${BOLD}MORE INFO:${NC}
    Documentation: docs/deployment/
    GitHub: https://github.com/marcusb333/delerium-paste

EOF
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

# Parse command
COMMAND=${1:-help}

case $COMMAND in
    local)
        deploy_local
        ;;
    vps-setup)
        deploy_vps_setup "$2" "$3"
        ;;
    production)
        deploy_production
        ;;
    update)
        deploy_update
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    stop)
        stop_services
        ;;
    clean)
        clean_deployment
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo_error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac
