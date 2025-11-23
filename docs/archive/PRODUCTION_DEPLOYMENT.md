# Production Deployment Guide

Quick reference for deploying and managing Delirium in production.

## 🚀 Quick Deploy

Deploy to production with one command:

```bash
./scripts/deploy-prod.sh
```

This will:
- ✅ Validate environment variables
- 💾 Backup existing database
- 📦 Build TypeScript client
- 🐳 Build Docker images
- 🔄 Stop old containers
- 🚀 Start new containers
- 🧪 Verify health status

## 📋 Deployment Options

### Standard Deployment
```bash
./scripts/deploy-prod.sh
```
Full deployment with backup and build (recommended).

### Quick Deployment
```bash
./scripts/deploy-prod.sh --quick
```
Skip backup and build for faster deployment (use when only config changed).

### Skip Client Build
```bash
./scripts/deploy-prod.sh --skip-build
```
Skip TypeScript build (use when only server changed).

### Skip Backup
```bash
./scripts/deploy-prod.sh --no-backup
```
Skip database backup (not recommended for production).

## 📊 Management Commands

### Check Status
```bash
./scripts/prod-status.sh
```
Shows:
- Container status
- API health check
- SSL certificate info
- Data volume size
- Recent logs
- Uptime

### View Logs
```bash
# All logs (follow mode)
./scripts/prod-logs.sh

# Server logs only
./scripts/prod-logs.sh server

# Web logs only
./scripts/prod-logs.sh web

# Last 50 lines (no follow)
./scripts/prod-logs.sh --tail=50
```

### Stop Production
```bash
./scripts/prod-stop.sh
```
Safely stops all production containers while preserving data.

## 🔧 Manual Commands

If you need more control, use docker-compose directly:

```bash
# Start
sudo docker-compose -f docker-compose.prod.yml up -d

# Stop
sudo docker-compose -f docker-compose.prod.yml down

# Restart
sudo docker-compose -f docker-compose.prod.yml restart

# Rebuild
sudo docker-compose -f docker-compose.prod.yml up -d --build

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f

# Check status
sudo docker-compose -f docker-compose.prod.yml ps
```

## 🌐 Access

- **HTTPS**: https://delerium.cc
- **HTTP**: http://delerium.cc (redirects to HTTPS)

## 💾 Backups

Backups are automatically created in the `backups/` directory with timestamps:
```
backups/delirium_backup_20251121_123456.tar.gz
```

### Manual Backup
```bash
# Create backup
sudo docker run --rm \
    -v delirium_server-data:/data \
    -v "$(pwd)/backups":/backup \
    alpine tar czf /backup/manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Restore from Backup
```bash
# Stop containers
./scripts/prod-stop.sh

# Remove old volume
sudo docker volume rm delirium_server-data

# Create new volume
sudo docker volume create delirium_server-data

# Restore data
sudo docker run --rm \
    -v delirium_server-data:/data \
    -v "$(pwd)/backups":/backup \
    alpine tar xzf /backup/delirium_backup_TIMESTAMP.tar.gz -C /data

# Start containers
./scripts/deploy-prod.sh --skip-build
```

## 🔒 Security Checklist

Before deploying to production, ensure:

- [ ] `.env` file has secure `DELETION_TOKEN_PEPPER` (not "change-me")
- [ ] SSL certificates are valid and up-to-date
- [ ] Firewall allows ports 80 and 443
- [ ] Domain DNS points to server IP
- [ ] Regular backups are scheduled
- [ ] System updates are applied

## 🐛 Troubleshooting

### Containers won't start
```bash
# Check logs
./scripts/prod-logs.sh

# Check Docker status
sudo systemctl status docker

# Rebuild from scratch
sudo docker-compose -f docker-compose.prod.yml down -v
./scripts/deploy-prod.sh
```

### API not responding
```bash
# Check server logs
./scripts/prod-logs.sh server

# Check health status
sudo docker-compose -f docker-compose.prod.yml ps

# Restart server
sudo docker-compose -f docker-compose.prod.yml restart server
```

### SSL certificate issues
```bash
# Check certificate
openssl x509 -in ssl/fullchain.pem -noout -text

# Renew certificate (if using Let's Encrypt)
sudo certbot renew

# Restart nginx
sudo docker-compose -f docker-compose.prod.yml restart web
```

### Out of disk space
```bash
# Clean up Docker
sudo docker system prune -a

# Remove old backups
rm backups/delirium_backup_OLD*.tar.gz

# Check volume size
sudo docker run --rm -v delirium_server-data:/data alpine du -sh /data
```

## 📈 Monitoring

### Check API Health
```bash
curl -k https://localhost/api/health
```

### Monitor Resource Usage
```bash
# Container stats
sudo docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🔄 Update Workflow

1. **Backup current deployment**
   ```bash
   ./scripts/deploy-prod.sh  # Automatic backup
   ```

2. **Pull latest changes**
   ```bash
   git pull origin main
   ```

3. **Deploy updates**
   ```bash
   ./scripts/deploy-prod.sh
   ```

4. **Verify deployment**
   ```bash
   ./scripts/prod-status.sh
   ```

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Deploy | `./scripts/deploy-prod.sh` |
| Quick deploy | `./scripts/deploy-prod.sh --quick` |
| Status | `./scripts/prod-status.sh` |
| Logs | `./scripts/prod-logs.sh` |
| Stop | `./scripts/prod-stop.sh` |
| Backup | Automatic on deploy |
| Health check | `curl -k https://localhost/api/health` |

## 🎯 Best Practices

1. **Always backup before deploying**
   - Automatic with standard deploy
   - Manual backup for extra safety

2. **Test in development first**
   ```bash
   make dev  # Test locally
   ```

3. **Monitor after deployment**
   ```bash
   ./scripts/prod-status.sh
   ./scripts/prod-logs.sh
   ```

4. **Keep certificates updated**
   - Check expiry regularly
   - Automate renewal with certbot

5. **Regular maintenance**
   - Clean old backups
   - Update dependencies
   - Monitor disk space

## 📚 Additional Resources

- [Main README](../README.md)
- [Docker Compose Configuration](../docker-compose.prod.yml)
- [SSL Setup Guide](../docs/deployment/SSL_SETUP.md)
- [Security Documentation](../docs/security/)
