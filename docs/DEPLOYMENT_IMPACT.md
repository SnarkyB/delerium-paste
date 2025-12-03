# CORS Fixes - Deployment Impact Guide

## 🎯 Summary

The CORS fixes **automatically apply to ALL deployment methods** with no additional steps required. All deployment scripts work exactly as before.

## ✅ What Works Automatically

### 1. Quick Start (Local Development)

```bash
make quick-start
# OR
./scripts/quick-start.sh
```

**Status**: ✅ **Works automatically** - Uses `docker-compose.yml` which is already updated

### 2. Development Mode

```bash
make dev
```

**Status**: ✅ **Works automatically** - Uses dev configuration

### 3. Production Deployment

```bash
make deploy-prod
```

**Status**: ✅ **Works automatically** - Uses `docker-compose.prod.yml` which is now updated

### 4. VPS One-Command Deploy

```bash
curl -fsSL https://raw.githubusercontent.com/marcusb333/delerium-paste/main/scripts/vps-deploy.sh | bash -s your-domain.com your@email.com
```

**Status**: ✅ **Works automatically** - Clones repo with all fixes included

### 5. Secure Mode

```bash
make start-secure
```

**Status**: ✅ **Works automatically** - Inherits base configuration

## 📋 Files Updated for All Deployments

### Development (`docker-compose.yml`)

- ✅ Updated with nginx default.conf removal command
- ✅ Uses `reverse-proxy/nginx-dev.conf` with CORS support

### Production (`docker-compose.prod.yml`)

- ✅ Updated with nginx default.conf removal command
- ✅ Uses `reverse-proxy/nginx.conf` with CORS support

### Nginx Configs

- ✅ `reverse-proxy/nginx-dev.conf` - Dev CORS (permissive, `*`)
- ✅ `reverse-proxy/nginx.conf` - Prod CORS (restrictive, `$http_origin`)

### Backend

- ✅ `server/src/main/kotlin/App.kt` - CORS plugin disabled
- ✅ Incompatible headers removed

## 🔄 Migration Path for Existing Deployments

### If You're Already Running (Local Dev)

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build server
docker compose up -d

# Verify
./scripts/test-deployment-cors.sh
```

### If You're Already Running (Production VPS)

```bash
# SSH into your VPS
ssh user@your-vps

# Navigate to deployment directory
cd ~/delirium  # or wherever you deployed

# Pull latest changes
git pull origin main

# Rebuild backend (includes CORS fixes)
docker compose -f docker-compose.prod.yml build server

# Restart services (Nginx will pick up new config)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Verify services are healthy
docker compose -f docker-compose.prod.yml ps
curl https://your-domain.com/api/health
```

### Fresh Deployment

No special steps needed - just use any deployment method as normal:

```bash
# Local
make quick-start

# Production
make deploy-prod

# VPS
./scripts/vps-deploy.sh your-domain.com your@email.com
```

## 🔍 Verification

After deployment (any method), verify CORS is working:

```bash
# Test 1: Basic health check
curl http://localhost:8080/api/health

# Test 2: With Origin header (should NOT get 403)
curl -X POST http://localhost:8080/api/pastes \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"ct":"dGVzdA==","iv":"dGVzdA==","meta":{"expireTs":9999999999}}'

# Expected: 400 {"error":"pow_required"}
# NOT: 403 Forbidden

# Test 3: Run full deployment tests
./scripts/test-deployment-cors.sh
```

## 📝 Configuration Differences

### Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| **CORS Origin** | `*` (any) | `$http_origin` (reflected) |
| **Rate Limiting** | 100 req/min | 10 req/min |
| **SSL** | No | Yes |
| **Port** | 8080 (HTTP) | 80/443 (HTTP/HTTPS) |
| **Nginx Config** | `nginx-dev.conf` | `nginx.conf` |
| **Docker Compose** | `docker-compose.yml` | `docker-compose.prod.yml` |

## 🔐 Security Considerations

### Development

- **CORS**: Allows all origins (`*`) for easy testing
- **Rate Limiting**: Relaxed (100 req/min)
- **Good for**: Local development, testing

### Production

- **CORS**: Reflects origin (`$http_origin`) - more secure
- **Rate Limiting**: Strict (10 req/min)
- **SSL**: Required (Let's Encrypt)
- **Good for**: Public deployments

## ⚡ Quick Reference

### All Deployments Use These Commands

#### Start/Stop

```bash
# Development
make start        # or docker compose up -d
make stop         # or docker compose down

# Production
make deploy-prod  # or docker compose -f docker-compose.prod.yml up -d
make prod-stop    # or docker compose -f docker-compose.prod.yml down
```

#### Check Status

```bash
# All deployments
docker compose ps
curl http://localhost:8080/api/health  # Dev
curl https://your-domain.com/api/health  # Prod
```

#### View Logs

```bash
# Development
make logs
# or
docker compose logs -f

# Production  
make prod-logs
# or
docker compose -f docker-compose.prod.yml logs -f
```

#### Run Tests

```bash
# Deployment verification
./scripts/test-deployment-cors.sh

# Full test suite
cd server && ./gradlew test
cd client && npm test
```

## 🆘 Troubleshooting

### Issue: Still getting 403 Forbidden

**Solution**: Make sure you pulled latest changes and rebuilt:

```bash
git pull origin main
docker compose build server
docker compose down && docker compose up -d
```

### Issue: Nginx won't start

**Check config syntax**:

```bash
docker compose exec web nginx -t
```

### Issue: API not responding

**Check backend logs**:

```bash
docker compose logs server
```

### Issue: CORS still not working in production

**Verify nginx config loaded**:

```bash
docker compose exec web cat /etc/nginx/nginx.conf | grep -A5 "location /api"
```

## 📊 What Changed vs What Didn't

### ✅ Changed

- Nginx CORS handling
- Backend CORS plugin (disabled)
- Security headers (removed 3 incompatible ones)
- Docker compose nginx startup command

### ❌ No Changes To

- Deployment scripts themselves
- Make commands
- Environment variables
- Port configuration
- SSL setup
- Database configuration
- API endpoints
- Frontend code logic

## 🎓 Learn More

- **Full fixes documentation**: [DEPLOYMENT_FIXES.md](DEPLOYMENT_FIXES.md)
- **Regression analysis**: [REGRESSION_ANALYSIS.md](REGRESSION_ANALYSIS.md)
- **Testing guide**: [TESTING.md](TESTING.md)
- **Deployment guide**: [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)

## ✨ TL;DR

**All deployment methods work automatically with CORS fixes included. No special steps needed for fresh deployments. For existing deployments, just `git pull` and restart.**

```bash
# That's it! 🎉
git pull origin main
docker compose down && docker compose up -d --build
```
