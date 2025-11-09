#!/bin/bash
set -e

# Easy VPS Deployment Script for Delerium Paste
# Just run: ./push-to-vps.sh

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}"
echo "??????????????????????????????????????????????????"
echo "?                                                ?"
echo "?      ?? Push to VPS - Delerium Paste ??       ?"
echo "?                                                ?"
echo "??????????????????????????????????????????????????"
echo -e "${NC}"
echo ""

# Load VPS config from .env
if [ -f .env ]; then
    DOMAIN=$(grep "^DOMAIN=" .env | cut -d'=' -f2)
    VPS_EMAIL=$(grep "^LETSENCRYPT_EMAIL=" .env | cut -d'=' -f2)
else
    echo -e "${RED}? .env file not found${NC}"
    echo "Please run ./scripts/setup.sh first"
    exit 1
fi

# Default values if not in .env
VPS_USER=${VPS_USER:-deploy}
VPS_HOST=${VPS_HOST:-$DOMAIN}

echo -e "${BOLD}Current Configuration:${NC}"
echo "  Domain:      $DOMAIN"
echo "  VPS Host:    $VPS_HOST"
echo "  VPS User:    $VPS_USER"
echo "  Email:       $VPS_EMAIL"
echo ""

# Function to check if git repo is clean
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}??  You have uncommitted changes${NC}"
        git status --short
        echo ""
        read -p "Continue anyway? (yes/no) [no]: " continue_dirty
        if [ "$continue_dirty" != "yes" ] && [ "$continue_dirty" != "y" ]; then
            echo "Deployment cancelled."
            exit 0
        fi
    fi
}

# Function to push code
push_code() {
    echo -e "${BLUE}?? Pushing code to GitHub...${NC}"
    
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    git push origin $CURRENT_BRANCH
    echo -e "${GREEN}? Code pushed${NC}"
    echo ""
}

# Function to deploy to VPS
deploy_to_vps() {
    echo -e "${BLUE}?? Deploying to VPS...${NC}"
    echo ""
    
    # Get current branch and latest commit
    CURRENT_BRANCH=$(git branch --show-current)
    LATEST_COMMIT=$(git rev-parse --short HEAD)
    
    echo "Deploying branch: $CURRENT_BRANCH (commit: $LATEST_COMMIT)"
    echo ""
    
    # SSH into VPS and run deployment
    # Use SSH key if available, otherwise try password auth
    SSH_KEY_OPT=""
    if [ -f ~/.ssh/delerium_deploy ]; then
        SSH_KEY_OPT="-i ~/.ssh/delerium_deploy"
    elif [ -f ~/.ssh/id_rsa ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_rsa"
    elif [ -f ~/.ssh/id_ed25519 ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_ed25519"
    fi
    ssh $SSH_KEY_OPT $VPS_USER@$VPS_HOST << ENDSSH
set -e

echo "?? Pulling latest code..."
cd ~/delerium-paste 2>/dev/null || {
    echo "?? First time setup - cloning repository..."
    cd ~
    git clone https://github.com/SnarkyB/delerium-paste.git
    cd delerium-paste
}

# Pull latest changes
git fetch origin
git checkout $CURRENT_BRANCH
git pull origin $CURRENT_BRANCH

echo ""
echo "?? Ensuring .env file exists..."
if [ ! -f .env ]; then
    echo "??  .env file not found, creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "??  Please update .env file with your configuration!"
        echo "??  Minimum required: DELETION_TOKEN_PEPPER"
    else
        echo "? .env.example not found! Cannot create .env file."
        exit 1
    fi
fi

echo ""
echo "?? Running deployment script..."
chmod +x scripts/deploy.sh
./scripts/deploy.sh production

echo ""
echo "?? Service status:"
docker compose -f docker-compose.prod.yml ps

ENDSSH

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}${BOLD}? Deployment successful!${NC}"
        echo ""
        echo -e "?? Your site: ${BLUE}https://$DOMAIN${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}? Deployment failed${NC}"
        echo "Check logs with: ssh $VPS_USER@$VPS_HOST  'cd ~/delerium-paste && docker compose -f docker-compose.prod.yml logs'"
        exit 1
    fi
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}?? Viewing logs...${NC}"
    SSH_KEY_OPT=""
    if [ -f ~/.ssh/delerium_deploy ]; then
        SSH_KEY_OPT="-i ~/.ssh/delerium_deploy"
    elif [ -f ~/.ssh/id_rsa ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_rsa"
    elif [ -f ~/.ssh/id_ed25519 ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_ed25519"
    fi
    ssh $SSH_KEY_OPT $VPS_USER@$VPS_HOST "cd ~/delerium-paste && docker compose -f docker-compose.prod.yml logs -f"
}

# Function to check status
check_status() {
    echo -e "${BLUE}?? Checking status...${NC}"
    ssh $VPS_USER@$VPS_HOST -o PubkeyAuthentication=no "cd ~/delerium-paste && docker compose -f docker-compose.prod.yml ps"
}

# Main menu
echo -e "${YELLOW}What would you like to do?${NC}"
echo ""
echo "  1) Full deployment (recommended)"
echo "     - Check git status"
echo "     - Push to GitHub"
echo "     - Deploy to VPS"
echo ""
echo "  2) Deploy only (skip git push)"
echo "     - Deploy current code on VPS"
echo ""
echo "  3) Check VPS status"
echo "     - View running containers"
echo ""
echo "  4) View VPS logs"
echo "     - Tail container logs"
echo ""
echo "  5) Quick redeploy"
echo "     - Just restart containers (no rebuild)"
echo ""
read -p "Select option (1-5): " choice
echo ""

case $choice in
    1)
        check_git_status
        push_code
        deploy_to_vps
        ;;
    2)
        deploy_to_vps
        ;;
    3)
        check_status
        ;;
    4)
        view_logs
        ;;
    5)
        echo -e "${BLUE}?? Quick redeploying...${NC}"
        ssh $VPS_USER@$VPS_HOST -o PubkeyAuthentication=no "cd ~/delerium-paste && docker compose -f docker-compose.prod.yml restart"
        echo -e "${GREEN}? Services restarted${NC}"
        check_status
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

SSH_KEY_CMD=""
if [ -f ~/.ssh/delerium_deploy ]; then
    SSH_KEY_CMD="-i ~/.ssh/delerium_deploy"
elif [ -f ~/.ssh/id_rsa ]; then
    SSH_KEY_CMD="-i ~/.ssh/id_rsa"
elif [ -f ~/.ssh/id_ed25519 ]; then
    SSH_KEY_CMD="-i ~/.ssh/id_ed25519"
fi
echo ""
echo -e "${BOLD}Useful commands:${NC}"
echo "  View logs:    ssh $SSH_KEY_CMD $VPS_USER@$VPS_HOST 'cd ~/delerium-paste && docker compose -f docker-compose.prod.yml logs -f'"
echo "  Check status: ssh $SSH_KEY_CMD $VPS_USER@$VPS_HOST 'cd ~/delerium-paste && docker compose -f docker-compose.prod.yml ps'"
echo "  Stop:         ssh $SSH_KEY_CMD $VPS_USER@$VPS_HOST 'cd ~/delerium-paste && docker compose -f docker-compose.prod.yml down'"
echo ""
echo -e "${GREEN}Done! ??${NC}"
