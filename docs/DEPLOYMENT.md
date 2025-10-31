# Deployment Guide

This guide covers deploying delerium to a production VPS.

## Prerequisites

- Ubuntu 22.04+ or Debian 11+ VPS
- Root or sudo access
- Domain name pointed to your VPS (optional but recommended)
- At least 1GB RAM, 1 CPU core, 10GB disk

## Quick Start

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

### 2. Clone Repository

```bash
git clone https://github.com/your-username/delerium-paste.git
cd delerium

# Checkout the alpha release
git checkout v0.1.0-alpha
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate a secure pepper
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" >> .env

# Edit .env with your domain (if using SSL)
nano .env
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

The application will be available at `http://your-vps-ip:80`

## SSL/TLS Setup (Recommended)

### Option 1: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop web

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Create ssl directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/

# Update nginx config to use SSL (see SSL Configuration section)

# Restart
docker compose -f docker-compose.prod.yml up -d
```

### Option 2: Self-Signed Certificate (Development/Testing)

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
# Server health
curl http://localhost:8080/health

# Web health
curl http://localhost/
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

Add to crontab:
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

# Checkout new version
git checkout v0.2.0-alpha

# Rebuild and deploy
./scripts/deploy.sh production
```

### Rollback

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout v0.1.0-alpha

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

## Security Checklist

- [ ] Changed default `DELETION_TOKEN_PEPPER`
- [ ] Configured firewall (ufw)
- [ ] SSL/TLS enabled
- [ ] Regular backups configured
- [ ] SSH key authentication only (disable password auth)
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs regularly
- [ ] Configure rate limiting (already in nginx)

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

- GitHub Issues: https://github.com/your-username/delerium-paste/issues
- Documentation: https://github.com/your-username/delerium-paste
