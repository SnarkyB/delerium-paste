#!/bin/bash
set -e

# Production Deployment Script for Delirium
# Usage: ./scripts/deploy-prod.sh [options]
# Options:
#   --skip-build    Skip client build step
#   --no-backup     Skip database backup
#   --quick         Skip build and backup (fastest)
#   --pull          Pull images from registry (default behavior)
#   --build         Build images locally instead of pulling
#   --no-build      Skip Docker image build (use existing images)
#   --skip-deps     Skip dependency installation
#   --skip-ssl      Skip SSL setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
SKIP_BUILD=false
NO_BACKUP=false
QUICK_MODE=false
PULL_IMAGES=true  # Default to pulling latest images
NO_DOCKER_BUILD=false
SKIP_DEPS=false
SKIP_SSL=false

for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        --quick)
            QUICK_MODE=true
            SKIP_BUILD=true
            NO_BACKUP=true
            shift
            ;;
        --build)
            PULL_IMAGES=false
            shift
            ;;
        --pull)
            PULL_IMAGES=true
            NO_DOCKER_BUILD=true
            shift
            ;;
        --no-build)
            NO_DOCKER_BUILD=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --help)
            echo "Production Deployment Script for Delirium"
            echo ""
            echo "Usage: ./scripts/deploy-prod.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-build    Skip client build step"
            echo "  --no-backup     Skip database backup"
            echo "  --quick         Skip build and backup (fastest)"
            echo "  --pull          Pull images from registry (default behavior)"
            echo "  --build         Build images locally instead of pulling"
            echo "  --no-build      Skip Docker image build (use existing images)"
            echo "  --skip-deps     Skip dependency installation"
            echo "  --skip-ssl      Skip SSL setup"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/deploy-prod.sh                    # Full deployment (pull latest)"
            echo "  ./scripts/deploy-prod.sh --quick            # Quick deploy (no build/backup)"
            echo "  ./scripts/deploy-prod.sh --build            # Build from source"
            echo "  ./scripts/deploy-prod.sh --skip-ssl         # Skip SSL setup"
            exit 0
            ;;
    esac
done

# Detect docker-compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="sudo docker-compose"
elif sudo docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="sudo docker compose"
else
    echo -e "${RED}❌ Error: Neither 'docker-compose' nor 'docker compose' found${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Delirium Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Install/Update Dependencies
if [ "$SKIP_DEPS" = false ]; then
    echo -e "${YELLOW}📦 Checking and installing dependencies...${NC}"
    
    # Check for curl
    if ! command -v curl &> /dev/null; then
        echo -e "${YELLOW}   Installing curl...${NC}"
        sudo apt update && sudo apt install -y curl
    fi
    
    # Check for docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}   Installing Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}   ✅ Docker installed${NC}"
        echo -e "${YELLOW}   ⚠️  You may need to log out and back in for Docker permissions${NC}"
    fi
    
    # Check for docker-compose
    if ! command -v docker-compose &> /dev/null && ! sudo docker compose version &> /dev/null 2>&1; then
        echo -e "${YELLOW}   Installing Docker Compose...${NC}"
        sudo apt update && sudo apt install -y docker-compose-plugin
    fi
    
    # Check for Node.js (needed for client build)
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}   Installing Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Check for certbot (for SSL)
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}   Installing certbot...${NC}"
        sudo apt update && sudo apt install -y certbot
    fi
    
    echo -e "${GREEN}✅ All dependencies installed/verified${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping dependency check${NC}"
    echo ""
fi

# SSL Setup
if [ "$SKIP_SSL" = false ]; then
    echo -e "${YELLOW}🔒 Checking SSL certificates...${NC}"
    
    if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
        echo -e "${YELLOW}   SSL certificates not found${NC}"
        
        # Check if domain is configured
        if [ -f ".env" ] && grep -q "DOMAIN=" .env; then
            source .env
            if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
                echo -e "${YELLOW}   Setting up SSL for domain: $DOMAIN${NC}"
                
                # Stop containers to free port 80
                $DOCKER_COMPOSE -f $COMPOSE_FILE down 2>/dev/null || true
                
                # Get email from .env or use default
                EMAIL="${SSL_EMAIL:-admin@$DOMAIN}"
                
                # Obtain certificate
                echo -e "${YELLOW}   Obtaining SSL certificate...${NC}"
                sudo certbot certonly --standalone \
                    -d "$DOMAIN" \
                    --non-interactive \
                    --agree-tos \
                    --email "$EMAIL" \
                    2>/dev/null || {
                        echo -e "${YELLOW}   ⚠️  Could not obtain SSL certificate automatically${NC}"
                        echo -e "${YELLOW}   Continuing without SSL...${NC}"
                    }
                
                # Copy certificates if obtained
                if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
                    mkdir -p ssl
                    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/ 2>/dev/null || true
                    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/ 2>/dev/null || true
                    sudo chown $(id -un):$(id -gn) ssl/*.pem 2>/dev/null || true
                    chmod 644 ssl/fullchain.pem 2>/dev/null || true
                    chmod 600 ssl/privkey.pem 2>/dev/null || true
                    echo -e "${GREEN}   ✅ SSL certificates obtained and configured${NC}"
                fi
            else
                echo -e "${YELLOW}   ⚠️  No domain configured, skipping SSL setup${NC}"
                echo -e "${YELLOW}   Set DOMAIN in .env to enable SSL${NC}"
            fi
        else
            echo -e "${YELLOW}   ⚠️  No .env file or DOMAIN not configured${NC}"
            echo -e "${YELLOW}   Continuing without SSL...${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ SSL certificates found${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping SSL setup${NC}"
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}🔑 Creating .env file...${NC}"
    RANDOM_PEPPER=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    cat > .env << ENVEOF
# Delirium Environment Configuration
DELETION_TOKEN_PEPPER=$RANDOM_PEPPER

# Domain configuration (optional, for SSL)
# DOMAIN=your-domain.com
# SSL_EMAIL=admin@your-domain.com
ENVEOF
    echo -e "${GREEN}✅ .env file created with random secrets${NC}"
    echo ""
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$DELETION_TOKEN_PEPPER" ] || [ "$DELETION_TOKEN_PEPPER" = "change-me" ]; then
    echo -e "${RED}❌ Error: DELETION_TOKEN_PEPPER not set or using default value${NC}"
    echo "Please set a secure value in .env file"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"
echo ""

# Create necessary directories
mkdir -p logs/nginx backups ssl

# Backup database if it exists and backup not skipped
if [ "$NO_BACKUP" = false ]; then
    echo -e "${YELLOW}💾 Checking for existing database...${NC}"
    if $DOCKER_COMPOSE -f $COMPOSE_FILE ps | grep -q "Up"; then
        echo -e "${YELLOW}📦 Creating backup...${NC}"
        BACKUP_FILE="backups/delirium_backup_${TIMESTAMP}.tar.gz"
        
        # Backup the data volume
        if sudo docker volume ls | grep -q "delirium_server-data"; then
            sudo docker run --rm \
                -v delirium_server-data:/data \
                -v "$PROJECT_DIR/backups":/backup \
                alpine tar czf /backup/delirium_backup_${TIMESTAMP}.tar.gz -C /data . 2>/dev/null || true
            
            if [ -f "$BACKUP_FILE" ]; then
                echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
            else
                echo -e "${YELLOW}⚠️  No data to backup (volume might be empty)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  No existing data volume found, skipping backup${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No running containers found, skipping backup${NC}"
    fi
    echo ""
fi

# Build client
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}📦 Building TypeScript client...${NC}"
    cd client
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📥 Installing dependencies...${NC}"
        npm ci
    fi
    
    npm run build
    cd ..
    echo -e "${GREEN}✅ Client built successfully${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping client build${NC}"
    echo ""
fi

# Build or pull Docker images
if [ "$PULL_IMAGES" = true ]; then
    echo -e "${YELLOW}📥 Pulling Docker images from registry...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE pull
    echo -e "${GREEN}✅ Docker images pulled${NC}"
    echo ""
elif [ "$NO_DOCKER_BUILD" = false ]; then
    echo -e "${YELLOW}🐳 Building Docker images...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE build --parallel 2>&1 | grep -v "DEPRECATED" || true
    echo -e "${GREEN}✅ Docker images built${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping Docker image build (using existing images)${NC}"
    echo ""
fi

# Stop old containers
echo -e "${YELLOW}🔄 Stopping old containers...${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE down
echo -e "${GREEN}✅ Old containers stopped${NC}"
echo ""

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE up -d
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check health status
MAX_RETRIES=12
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE -f $COMPOSE_FILE ps | grep -q "Up (healthy)"; then
        HEALTHY=true
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}   Waiting... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 5
done

echo ""

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Services started but health check pending${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show service status
echo -e "${BLUE}📊 Service Status:${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE ps
echo ""

# Test API endpoint
echo -e "${BLUE}🧪 Testing API endpoint...${NC}"
if [ -f "ssl/fullchain.pem" ]; then
    if curl -k -s https://localhost/api/pow > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is responding (HTTPS)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS API test failed (might need a moment to start)${NC}"
    fi
else
    if curl -s http://localhost/api/pow > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is responding (HTTP)${NC}"
    else
        echo -e "${YELLOW}⚠️  API test failed (might need a moment to start)${NC}"
    fi
fi
echo ""

# Show access information
echo -e "${BLUE}🌐 Access Information:${NC}"
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && [ -f "ssl/fullchain.pem" ]; then
    echo -e "   HTTPS: ${GREEN}https://$DOMAIN${NC}"
    echo -e "   HTTP:  ${GREEN}http://$DOMAIN${NC} (redirects to HTTPS)"
else
    echo -e "   HTTP:  ${GREEN}http://localhost${NC}"
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "localhost" ]; then
        echo -e "   ${YELLOW}💡 Tip: Set DOMAIN in .env to enable SSL${NC}"
    fi
fi
echo ""

# Show useful commands
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "   View logs:    ${YELLOW}make prod-logs${NC}"
echo -e "   Stop:         ${YELLOW}make prod-stop${NC}"
echo -e "   Status:       ${YELLOW}make prod-status${NC}"
echo -e "   Quick deploy: ${YELLOW}make deploy-prod --quick${NC}"
echo ""

# Show backup location if backup was created
if [ "$NO_BACKUP" = false ] && [ -f "$BACKUP_FILE" ]; then
    echo -e "${BLUE}💾 Backup Location:${NC}"
    echo -e "   ${YELLOW}$BACKUP_FILE${NC}"
    echo ""
fi

echo -e "${GREEN}🎉 Delirium is now running in production mode!${NC}"
