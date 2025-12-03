# VPS Deployment Example

This is a practical example showing how to deploy Delirium to a VPS with a custom domain. For complete deployment documentation, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Example Scenario

- **VPS IP**: `203.0.113.10`
- **Domain**: `example.com`
- **Email**: `admin@example.com`
- **OS**: Ubuntu 22.04

## Step-by-Step Example

### 1. Configure DNS

Log into your domain registrar and add an A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 203.0.113.10 | 300 |

Verify DNS propagation:

```bash
dig +short example.com
# Should return: 203.0.113.10
```

### 2. Quick Deployment (One Command)

SSH into your VPS and run:

```bash
ssh deploy@203.0.113.10
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh | bash -s example.com admin@example.com
```

This automatically:

- Installs Docker and dependencies
- Clones the repository
- Gets SSL certificates from Let's Encrypt
- Builds and deploys the application
- Sets up automatic certificate renewal

### 3. Verify Deployment

```bash
# Check services are running
docker compose -f docker-compose.prod.yml ps

# Test HTTPS access
curl -I https://example.com

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Manual Alternative

If you prefer manual control:

```bash
# SSH into VPS
ssh deploy@203.0.113.10

# Clone repository
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste

# Run deployment script
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh example.com admin@example.com
```

## Common Tasks

### Restart Services

```bash
cd ~/delerium-paste
docker compose -f docker-compose.prod.yml restart
```

### Update Deployment

```bash
cd ~/delerium-paste
git pull
docker compose -f docker-compose.prod.yml down
cd client && npm run build && cd ..
docker compose -f docker-compose.prod.yml up --build -d
```

### View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Backup Data

```bash
docker run --rm \
  -v delirium_server-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/server-data-$(date +%Y%m%d-%H%M%S).tar.gz /data
```

## Quick Troubleshooting

### DNS Not Resolving

```bash
# Wait for DNS propagation (5-60 minutes typically)
dig +short example.com
nslookup example.com
```

### SSL Certificate Fails

```bash
# Ensure port 80 is open for Let's Encrypt verification
sudo ufw allow 80/tcp
sudo ufw reload
```

### 502 Bad Gateway

```bash
# Check if backend is running
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml restart server
```

## More Information

For complete deployment documentation including:

- Security configuration
- Monitoring setup
- Advanced SSL options
- Production best practices
- Comprehensive troubleshooting

See the main [Deployment Guide](DEPLOYMENT.md).

## Quick Links

- [Setup Guide](../getting-started/SETUP.md) - Configure secrets
- [SSL Setup](SSL_SETUP.md) - Advanced SSL configuration
- [Security Checklist](../security/CHECKLIST.md) - Security best practices
