#!/bin/bash
set -e

# Local Setup Script for VPS Deployment
# This script prepares your VPS from your local machine
# Usage: ./scripts/setup-vps-from-local.sh

VPS_IP="203.0.113.10"
VPS_USER="noob"
DOMAIN="example.com"
REPO_DIR="delirium"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo_info "================================================"
echo_info "Delirium VPS Deployment Setup"
echo_info "================================================"
echo ""
echo_info "VPS IP:     $VPS_IP"
echo_info "VPS User:   $VPS_USER"
echo_info "Domain:     $DOMAIN"
echo ""

# Step 1: Test SSH connection
echo_info "Testing SSH connection to VPS..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 -o PubkeyAuthentication=no "$VPS_USER@$VPS_IP" 'echo "SSH connection successful"' 2>/dev/null; then
    echo_info "✅ SSH connection successful"
else
    echo_warn "SSH connection requires password authentication"
    echo_info "You'll be prompted for password during deployment"
fi

# Step 2: Check DNS
echo_info "Checking DNS configuration..."
DNS_IP=$(dig +short $DOMAIN | tail -1)
if [ "$DNS_IP" = "$VPS_IP" ]; then
    echo_info "✅ DNS correctly points to VPS ($VPS_IP)"
else
    echo_warn "⚠️  DNS issue detected:"
    echo_warn "    Domain $DOMAIN resolves to: $DNS_IP"
    echo_warn "    Expected: $VPS_IP"
    echo_warn "    Please update your DNS A record before continuing"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "Deployment cancelled. Please fix DNS first."
        exit 1
    fi
fi

# Step 3: Ask for email
echo ""
echo_info "Let's Encrypt requires an email for SSL certificate notifications"
read -p "Enter your email address: " EMAIL
if [ -z "$EMAIL" ]; then
    echo_error "Email is required for SSL certificates"
    exit 1
fi

# Step 4: Check local Git status
echo_info "Checking local repository status..."
if [ -d .git ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo_warn "You have uncommitted changes:"
        git status --short
        echo ""
        read -p "Commit changes before deployment? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "Pre-deployment commit"
            echo_info "Changes committed"
        fi
    fi
    
    # Check if we should push
    if [ -n "$(git log --branches --not --remotes)" ]; then
        echo_warn "You have unpushed commits"
        read -p "Push to remote before deployment? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push
            echo_info "Changes pushed to remote"
        fi
    fi
fi

# Step 5: Copy deployment files to VPS
echo ""
echo_info "================================================"
echo_info "Deployment Options"
echo_info "================================================"
echo ""
echo_info "Choose deployment method:"
echo "  1) Automated (copy script to VPS and run it)"
echo "  2) Manual instructions (display steps to run on VPS)"
echo "  3) Copy entire repo to VPS via SCP"
echo ""
read -p "Select option (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo_info "Starting automated deployment..."
        
        # Create deployment script
        DEPLOY_SCRIPT=$(cat << 'EOFSCRIPT'
#!/bin/bash
set -e

DOMAIN="example.com"
EMAIL="EMAIL_PLACEHOLDER"
INSTALL_DIR="$HOME/delirium"

echo "[INFO] Installing prerequisites..."
sudo apt update
sudo apt install -y curl git

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install Certbot
sudo apt install -y certbot

# Clone or update repo
if [ -d "$INSTALL_DIR" ]; then
    cd "$INSTALL_DIR"
    git pull
else
    git clone https://github.com/your-username/delerium-paste.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Run deployment script
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh "$DOMAIN" "$EMAIL"
EOFSCRIPT
)
        
        # Replace email placeholder
        DEPLOY_SCRIPT="${DEPLOY_SCRIPT//EMAIL_PLACEHOLDER/$EMAIL}"
        
        # Copy and execute
        echo "$DEPLOY_SCRIPT" | ssh "$VPS_USER@$VPS_IP" 'cat > /tmp/deploy-delirium.sh && chmod +x /tmp/deploy-delirium.sh && bash /tmp/deploy-delirium.sh'
        
        echo_info "✅ Automated deployment completed!"
        ;;
        
    2)
        echo ""
        echo_info "================================================"
        echo_info "Manual Deployment Instructions"
        echo_info "================================================"
        echo ""
        echo "Run these commands on your VPS:"
        echo ""
        echo "# SSH into VPS"
        echo "ssh $VPS_USER@$VPS_IP"
        echo ""
        echo "# Clone repository"
        echo "git clone https://github.com/your-username/delerium-paste.git"
        echo "cd delirium"
        echo ""
        echo "# Run deployment script"
        echo "chmod +x scripts/vps-deploy.sh"
        echo "./scripts/vps-deploy.sh $DOMAIN $EMAIL"
        echo ""
        echo_info "================================================"
        ;;
        
    3)
        echo_info "Copying repository to VPS via SCP..."
        
        # Create temporary archive
        TEMP_ARCHIVE="/tmp/delirium-deploy.tar.gz"
        echo_info "Creating archive..."
        tar czf "$TEMP_ARCHIVE" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='client/node_modules' \
            --exclude='server/build' \
            --exclude='server/.gradle' \
            --exclude='.env' \
            .
        
        echo_info "Copying to VPS..."
        scp "$TEMP_ARCHIVE" "$VPS_USER@$VPS_IP:/tmp/"
        
        echo_info "Extracting on VPS and running deployment..."
        ssh "$VPS_USER@$VPS_IP" << ENDSSH
set -e
mkdir -p ~/delirium
cd ~/delirium
tar xzf /tmp/delirium-deploy.tar.gz
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh $DOMAIN $EMAIL
ENDSSH
        
        rm "$TEMP_ARCHIVE"
        echo_info "✅ Deployment completed!"
        ;;
        
    *)
        echo_error "Invalid option"
        exit 1
        ;;
esac

echo ""
echo_info "================================================"
echo_info "🎉 Deployment Complete!"
echo_info "================================================"
echo ""
echo_info "Your Delirium instance should now be running at:"
echo_info "  🔒 https://$DOMAIN"
echo ""
echo_info "To check status, SSH into your VPS and run:"
echo "  ssh $VPS_USER@$VPS_IP"
echo "  cd ~/delirium"
echo "  docker compose -f docker-compose.prod.yml ps"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""

