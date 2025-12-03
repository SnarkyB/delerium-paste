# Deployment Guide

Complete guide for deploying Delirium to a production VPS with SSL/TLS support.

## Prerequisites

- Ubuntu 22.04+ or Debian 11+ VPS
- Root or sudo access
- Domain name pointed to your VPS (optional but recommended for SSL)
- At least 1GB RAM, 1 CPU core, 10GB disk space
- SSH access configured

## Quick Deployment Options

### Option 1: Automated One-Command Deployment

SSH into your VPS and run:

```bash
ssh deploy@your-vps-ip
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh | bash -s your-domain.com your-email@example.com
```

This automatically:
- Installs Docker and dependencies
- Clones the repository
- Configures SSL certificates (Let's Encrypt)
- Builds and deploys the application
- Sets up automatic certificate renewal

### Option 2: Manual Deployment Script

If you prefer more control:

```bash
# SSH into your VPS
ssh deploy@your-vps-ip

# Clone the repository
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste

# Make script executable
chmod +x scripts/vps-deploy.sh

# Run deployment
./scripts/vps-deploy.sh your-domain.com your-email@example.com
```

## Manual Deployment Steps

### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js for building client using signed repository
NODE_MAJOR=20
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
    sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
sudo chmod go+r /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | \
    sudo tee /etc/apt/sources.list.d/nodesource.list > /dev/null
sudo apt-get update
sudo apt-get install -y nodejs

# Install Certbot for SSL
sudo apt install certbot -y

# Log out and back in for Docker group to take effect
exit
```

### 2. Clone Repository

```bash
ssh deploy@your-vps-ip
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure pepper
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" >> .env

# Add domain and email (for SSL)
echo "DOMAIN=your-domain.com" >> .env
echo "LETSENCRYPT_EMAIL=your-email@example.com" >> .env
```

### 4. Build Client

```bash
cd client
npm ci
npm run build
cd ..
```

### 5. Deploy

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Deploy!
./scripts/deploy.sh production
```

The application will be available at `http://your-vps-ip` or `https://your-domain.com` (if SSL is configured).

## SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

The easiest way is to use the automated deployment script, which handles SSL automatically. For manual setup:

```bash
# Install certbot
sudo apt install certbot -y

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop web

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# The deployment script will handle certificate setup automatically
# Or see docs/deployment/SSL_SETUP.md for manual certificate configuration
```

See [SSL Setup Guide](SSL_SETUP.md) for detailed SSL configuration instructions.

### Option 2: Self-Signed Certificate (Development/Testing Only)

```bash
# Create ssl directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/CN=localhost"

# Deploy
./scripts/deploy.sh production
```

**Warning:** Self-signed certificates will show security warnings in browsers. Only use for testing!

## Automated Deployment (CI/CD)

Set up automatic deployments using GitHub Actions. See [Automated Deployment Guide](./AUTO_DEPLOYMENT.md) for complete setup instructions.

Quick setup:
1. Generate SSH key for GitHub Actions
2. Add public key to VPS `~/.ssh/authorized_keys`
3. Add GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
4. Push to `main` branch to trigger deployment

## Firewall Configuration

```bash
# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml logs -f web
```

### Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Health Checks

```bash
# Check if services are responding
curl http://localhost/api/health
curl https://your-domain.com/api/health
```

## Backup Strategy

### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup server data volume
docker run --rm \
  -v delirium_server-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/server-data-$(date +%Y%m%d-%H%M%S).tar.gz /data

# Restore from backup
docker run --rm \
  -v delirium_server-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/server-data-TIMESTAMP.tar.gz -C /
```

### Automated Backups

Add to crontab for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2am
0 2 * * * cd /path/to/delerium && docker run --rm -v delirium_server-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/server-data-$(date +\%Y\%m\%d).tar.gz /data

# Keep only last 7 days
0 3 * * * find /path/to/delerium/backups -name "server-data-*.tar.gz" -mtime +7 -delete
```

## Updates

### Pull Latest Changes

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Pull updates
git pull

# Rebuild and deploy
./scripts/deploy.sh production
```

### Rollback

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout v0.1.0-alpha  # or whatever version you want

# Deploy
./scripts/deploy.sh production
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory
free -m

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart specific service
docker compose -f docker-compose.prod.yml restart server
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix SSL permissions
sudo chown -R $USER:$USER ssl/
```

### DNS Issues

Verify DNS is configured correctly:

```bash
# Check DNS resolution
dig +short your-domain.com

# Should return your VPS IP address
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate files
ls -la /etc/letsencrypt/live/your-domain.com/
```

## Security Checklist

- [ ] Changed default `DELETION_TOKEN_PEPPER` in `.env`
- [ ] Configured firewall (ufw) - only ports 22, 80, 443 open
- [ ] SSL/TLS enabled with valid certificates
- [ ] Regular backups configured
- [ ] SSH key authentication only (disable password auth)
- [ ] System updated: `sudo apt update && sudo apt upgrade`
- [ ] Monitoring logs regularly
- [ ] Rate limiting configured (already in nginx)

## Performance Tuning

### For Low-Memory VPS (512MB - 1GB)

Edit `docker-compose.prod.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### For High-Traffic Deployments

- Use a reverse proxy like Cloudflare
- Increase nginx worker processes
- Add Redis for rate limiting
- Consider multiple server instances with load balancer

## Support

- ?? See [Setup Guide](../getting-started/SETUP.md) for initial configuration
- ?? Check [Security Checklist](../security/CHECKLIST.md) for security best practices
- ?? Open an issue on GitHub for bugs or questions
- ?? See [SSL Setup Guide](SSL_SETUP.md) for detailed SSL configuration
