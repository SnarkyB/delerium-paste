#!/bin/bash
set -e

# SSL Setup Script for Delirium
# This script helps set up Let's Encrypt SSL certificates

echo "🔒 Delirium SSL Setup Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please don't run this script as root"
   echo "Run it as your regular user (it will ask for sudo when needed)"
   exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., delirium.example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Domain name is required"
    exit 1
fi

# Get email for Let's Encrypt
read -p "Enter your email for Let's Encrypt notifications: " EMAIL
if [ -z "$EMAIL" ]; then
    echo "❌ Email is required"
    exit 1
fi

echo ""
echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo ""
read -p "Is this correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 1
fi

# Check if certbot is installed
echo ""
echo "📦 Checking for certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing..."
    if command -v brew &> /dev/null; then
        echo "   → Installing via Homebrew..."
        brew install certbot
    elif command -v apt &> /dev/null; then
        echo "   → Installing via apt..."
        sudo apt update
        sudo apt install certbot -y
    elif command -v yum &> /dev/null; then
        echo "   → Installing via yum..."
        sudo yum install certbot -y
    else
        echo "❌ Could not install certbot automatically."
        echo "   Please install certbot manually (see https://certbot.eff.org/) and rerun this script."
        exit 1
    fi
fi

echo "✅ Certbot installed"

# Verify DNS
echo ""
echo "🌐 Verifying DNS..."
RESOLVED_IP=$(dig +short "$DOMAIN" | head -n1)
if [ -z "$RESOLVED_IP" ]; then
    echo "⚠️  Warning: Could not resolve $DOMAIN"
    echo "   Make sure your DNS A record is configured"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Domain resolves to: $RESOLVED_IP"
fi

# Stop docker containers to free port 80
echo ""
echo "🛑 Stopping Docker containers to free port 80..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Get certificate
echo ""
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
echo "   This may take a minute..."
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  || { echo "❌ Failed to obtain certificate"; exit 1; }

echo "✅ Certificate obtained"

# Create SSL directory
echo ""
echo "📁 Setting up SSL directory..."
mkdir -p ssl

# Copy certificates
echo "📋 Copying certificates..."
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/

# Fix permissions
sudo chown $(id -un):$(id -gn) ssl/*.pem
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

echo "✅ Certificates copied"

# Update nginx config
echo ""
echo "⚙️  Updating nginx configuration..."
if [ -f "reverse-proxy/nginx-ssl.conf" ]; then
    cp reverse-proxy/nginx.conf reverse-proxy/nginx.conf.backup 2>/dev/null || true
    cp reverse-proxy/nginx-ssl.conf reverse-proxy/nginx.conf
    sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" reverse-proxy/nginx.conf
    echo "✅ Nginx config updated"
else
    echo "⚠️  nginx-ssl.conf not found, skipping config update"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "🔑 Creating .env file with random secrets..."
    RANDOM_PEPPER=$(openssl rand -base64 32)
    echo "DELETION_TOKEN_PEPPER=$RANDOM_PEPPER" > .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs/nginx

echo ""
echo "🎉 SSL setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your application:"
echo "   docker compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "2. Visit your site:"
echo "   https://$DOMAIN"
echo ""
echo "3. Set up auto-renewal (optional but recommended):"
echo "   sudo systemctl enable certbot.timer"
echo "   sudo systemctl start certbot.timer"
echo ""
echo "📚 For more details, see: docs/SSL_SETUP_GUIDE.md"
