# VPS Deployment Guide for Delirium

This guide will help you deploy Delirium to your VPS at `203.0.113.10` with the domain `example.com`.

## Prerequisites

- VPS with Ubuntu 22.04+ or Debian 11+
- Root or sudo access via SSH
- Domain name (`example.com`) with DNS A record pointing to your VPS IP
- At least 1GB RAM, 1 CPU core, 10GB disk space

## DNS Setup

Before deploying, make sure your domain's DNS is configured:

1. Log into your domain registrar (where you bought `example.com`)
2. Add an A record:
   - **Type**: A
   - **Name**: @ (or leave blank for root domain)
   - **Value**: 203.0.113.10
   - **TTL**: 300 (or default)

3. Wait for DNS propagation (5-60 minutes typically)
4. Verify DNS is working:
   ```bash
   dig +short example.com
   # Should return: 203.0.113.10
   ```

## Quick Deployment (Automated)

### Option 1: One-Command Deployment

SSH into your VPS and run this single command:

```bash
ssh deploy@203.0.113.10
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh | bash -s example.com your-email@example.com
```

This will automatically:
- Install Docker and dependencies
- Clone the repository
- Get SSL certificates from Let's Encrypt
- Build and deploy the application
- Set up automatic certificate renewal

### Option 2: Manual Clone and Deploy

If you prefer more control:

```bash
# SSH into your VPS
ssh deploy@203.0.113.10

# Clone this repository on your local machine first, then copy it to VPS
# Or clone directly on VPS (if you have SSH keys set up for GitHub)
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste

# Make the script executable
chmod +x scripts/vps-deploy.sh

# Run the deployment script
./scripts/vps-deploy.sh example.com your-email@example.com
```

The script will guide you through the entire deployment process.

## Manual Deployment (Step by Step)

If you prefer to deploy manually or the script fails, follow these steps:

### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js for building client
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Certbot for SSL
sudo apt install certbot -y

# Log out and back in for Docker group to take effect
exit
```

### 2. Clone Repository

```bash
ssh deploy@203.0.113.10
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste
```

### 3. Create Environment File

```bash
# Generate a secure random pepper
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" > .env
```

### 4. Get SSL Certificate

```bash
# Stop any services using port 80
sudo systemctl stop nginx 2>/dev/null || true

# Get certificate from Let's Encrypt
sudo certbot certonly --standalone \
  -d example.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

# Copy certificates to project
mkdir -p ssl
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem
```

### 5. Configure Nginx

```bash
# Copy SSL configuration
cp reverse-proxy/nginx-ssl.conf reverse-proxy/nginx.conf

# Replace placeholder domain with your actual domain
sed -i 's/YOUR_DOMAIN_HERE/example.com/g' reverse-proxy/nginx.conf
```

### 6. Build Client

```bash
cd client
npm ci
npm run build
cd ..
```

### 7. Deploy with Docker

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up --build -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 8. Configure Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

### 9. Set Up Auto-Renewal for SSL

```bash
# Add cron job for certificate renewal
crontab -e

# Add this line (adjust paths as needed):
0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/example.com/*.pem /home/noob/delirium/ssl/ && chown noob:noob /home/noob/delirium/ssl/*.pem && cd /home/noob/delirium && docker compose -f docker-compose.prod.yml restart web' >> /var/log/certbot-renew.log 2>&1
```

### 10. Verify Deployment

Visit your site:
- **HTTPS**: https://example.com ✅ (should work with valid SSL)
- **HTTP**: http://example.com (should redirect to HTTPS)

## Post-Deployment

### View Logs

```bash
cd ~/delirium
docker compose -f docker-compose.prod.yml logs -f
```

### Restart Services

```bash
cd ~/delirium
docker compose -f docker-compose.prod.yml restart
```

### Update Deployment

```bash
cd ~/delirium
git pull
docker compose -f docker-compose.prod.yml down
cd client && npm run build && cd ..
docker compose -f docker-compose.prod.yml up --build -d
```

### Backup Data

```bash
# Create backup of paste data
docker run --rm \
  -v delirium_server-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/server-data-$(date +%Y%m%d-%H%M%S).tar.gz /data
```

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS propagation
dig +short example.com
nslookup example.com
```

If it doesn't return `203.0.113.10`, wait for DNS to propagate (can take up to 24 hours).

### SSL Certificate Fails

```bash
# Make sure port 80 is accessible
sudo ufw allow 80/tcp
sudo ufw reload

# Check if port 80 is blocked
curl http://example.com

# Try getting certificate again
sudo certbot certonly --standalone -d example.com
```

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

### 502 Bad Gateway

This usually means the backend server isn't running:

```bash
# Check if server container is running
docker compose -f docker-compose.prod.yml ps

# Restart server
docker compose -f docker-compose.prod.yml restart server

# Check server logs
docker compose -f docker-compose.prod.yml logs server
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/delirium
sudo chown -R $USER:$USER ~/delirium/ssl
```

## Security Checklist

After deployment, verify:

- [ ] HTTPS is working (padlock icon in browser)
- [ ] HTTP redirects to HTTPS
- [ ] `DELETION_TOKEN_PEPPER` is set to random value (check `.env` file)
- [ ] Firewall is configured (ports 22, 80, 443 only)
- [ ] SSL certificate auto-renewal is set up
- [ ] Regular backups are scheduled
- [ ] Strong SSH authentication (consider disabling password auth)

## Maintenance

### Check Certificate Expiry

```bash
sudo certbot certificates
```

### Renew Certificate Manually

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/example.com/*.pem ~/delirium/ssl/
sudo chown $USER:$USER ~/delirium/ssl/*.pem
cd ~/delirium
docker compose -f docker-compose.prod.yml restart web
```

### Monitor Resource Usage

```bash
# Check Docker stats
docker stats

# Check disk usage
df -h

# Check memory
free -m
```

## Support

If you encounter issues:

1. Check the logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Review the [main deployment guide](./DEPLOYMENT.md)
3. Check the [SSL setup guide](./SSL_SETUP_GUIDE.md)
4. Open an issue on GitHub

---

**Note**: Replace `your-email@example.com` with your actual email address when running commands. The email is only used by Let's Encrypt for certificate expiration notices.

