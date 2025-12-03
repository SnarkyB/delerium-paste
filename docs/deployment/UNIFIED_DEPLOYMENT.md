# Unified Deployment Script

The `deploy.sh` script consolidates all Delirium deployment workflows into a single, easy-to-use interface. This guide explains how to use it for different scenarios.

## Table of Contents

- [Quick Start](#quick-start)
- [Commands Reference](#commands-reference)
- [Deployment Scenarios](#deployment-scenarios)
- [Troubleshooting](#troubleshooting)
- [Migration from Old Scripts](#migration-from-old-scripts)

## Quick Start

### Local Development

```bash
./deploy.sh local
```

This will:

1. Create a secure `.env` file (if missing)
2. Build the frontend client
3. Start Docker containers
4. Make the app available at `http://localhost:8080`

### VPS Production Setup

```bash
./deploy.sh vps-setup example.com admin@example.com
```

This will:

1. Install Docker and dependencies
2. Configure firewall (ports 22, 80, 443)
3. Obtain SSL certificate from Let's Encrypt
4. Build and deploy the application
5. Set up automatic SSL renewal
6. Make the app available at `https://example.com`

### Update Existing Deployment

```bash
./deploy.sh update
```

This will:

1. Pull latest changes from git
2. Rebuild the application
3. Restart services with zero downtime

## Commands Reference

### `./deploy.sh local`

Deploy locally for development on port 8080.

**Use case:** Local development and testing

**Requirements:**

- Docker and Docker Compose
- Node.js 18+ (optional, for building client)

**What it does:**

- Creates `.env` file with secure random pepper
- Builds frontend client (if Node.js available)
- Starts services using `docker-compose.yml`
- Runs on `http://localhost:8080`

### `./deploy.sh vps-setup <domain> <email>`

Initial VPS setup with SSL certificate.

**Use case:** First-time production deployment on a fresh VPS

**Requirements:**

- Ubuntu 22.04+ or Debian 11+ VPS
- Domain name pointed to server IP
- Email address for Let's Encrypt notifications
- At least 1GB RAM, 1 CPU core, 10GB disk

**Arguments:**

- `<domain>`: Your domain name (e.g., `example.com`)
- `<email>`: Email for SSL certificate notifications

**What it does:**

1. Updates system packages
2. Installs Docker, Docker Compose, Docker Buildx
3. Installs Certbot for SSL certificates
4. Installs Node.js 20.x
5. Configures UFW firewall (ports 22, 80, 443)
6. Creates secure `.env` file
7. Obtains SSL certificate from Let's Encrypt
8. Configures Nginx with your domain
9. Builds and starts production containers
10. Sets up automatic SSL renewal (daily at 3 AM)

**Example:**

```bash
./deploy.sh vps-setup delerium.cc admin@delerium.cc
```

### `./deploy.sh production`

Deploy to production using existing setup.

**Use case:** Deploying updates to an already-configured production server

**Requirements:**

- Existing `.env` file with `DELETION_TOKEN_PEPPER`
- Docker and Docker Compose installed
- SSL certificates already configured (for HTTPS)

**What it does:**

1. Validates `.env` file exists
2. Builds frontend client
3. Builds Docker images
4. Stops old containers
5. Starts new containers
6. Verifies services are healthy

### `./deploy.sh update`

Update and redeploy automatically.

**Use case:** Quick updates from git repository

**What it does:**

1. Pulls latest changes from git (if in a git repo)
2. Auto-detects deployment type (local or production)
3. Rebuilds and restarts services

**Smart detection:**

- If production containers are running → runs production deployment
- Otherwise → runs local deployment

### `./deploy.sh status`

Check deployment status.

**Use case:** Verify services are running and healthy

**What it shows:**

- Which deployment type is active (local or production)
- Container status (running, stopped, unhealthy)
- Health check endpoint response
- Port bindings

**Example output:**

```text
Production deployment detected

NAME                IMAGE               STATUS
delirium-server-1   delirium-server     Up 2 hours (healthy)
delirium-web-1      nginx:1.27-alpine   Up 2 hours

Health check: {"status":"ok","timestampMs":1733164800000}
```

### `./deploy.sh logs`

View application logs in real-time.

**Use case:** Debugging, monitoring, troubleshooting

**What it does:**

- Auto-detects deployment type
- Streams logs from all containers
- Press `Ctrl+C` to exit

**Tip:** Use this to monitor deployments and catch errors.

### `./deploy.sh stop`

Stop all services.

**Use case:** Temporarily stop the application

**What it does:**

- Stops all running containers
- Preserves volumes (database remains intact)
- Can be restarted with `./deploy.sh production` or `./deploy.sh local`

### `./deploy.sh clean`

Stop services and remove volumes.

**Use case:** Complete cleanup, fresh start

**⚠️ WARNING:** This will delete your database!

**What it does:**

1. Asks for confirmation
2. Stops all containers
3. Removes all volumes (including database)
4. Requires full redeployment to start again

### `./deploy.sh help`

Show detailed help message with all commands and examples.

## Deployment Scenarios

### Scenario 1: Local Development

**Goal:** Run Delirium locally for development and testing

**Steps:**

```bash
# Clone repository
git clone https://github.com/marcusb333/delerium-paste.git
cd delerium-paste

# Deploy locally
./deploy.sh local

# Access at http://localhost:8080
```

**To stop:**

```bash
./deploy.sh stop
```

**To update after code changes:**

```bash
./deploy.sh update
```

### Scenario 2: Fresh VPS Setup

**Goal:** Deploy Delirium to a new VPS with SSL

**Prerequisites:**

- Fresh Ubuntu 22.04+ VPS
- Domain name pointed to VPS IP (A record)
- SSH access to VPS

**Steps:**

```bash
# 1. SSH into VPS
ssh user@your-vps-ip

# 2. Clone repository
git clone https://github.com/marcusb333/delerium-paste.git
cd delerium-paste

# 3. Run VPS setup
./deploy.sh vps-setup your-domain.com your@email.com

# 4. Access at https://your-domain.com
```

**What happens:**

- Installs all dependencies (Docker, Node.js, Certbot)
- Configures firewall
- Obtains SSL certificate
- Deploys application
- Sets up auto-renewal

**Time:** ~5-10 minutes (depending on VPS speed)

### Scenario 3: Update Production

**Goal:** Deploy updates to running production server

**Steps:**

```bash
# SSH into VPS
ssh user@your-vps-ip
cd delerium-paste

# Pull and deploy updates
./deploy.sh update
```

**Alternative (manual control):**

```bash
# Pull changes
git pull origin main

# Deploy
./deploy.sh production
```

### Scenario 4: Migrate from Old Scripts

**Goal:** Switch from old deployment scripts to unified script

**If you were using:**

- `scripts/vps-deploy.sh` → Use `./deploy.sh vps-setup`
- `scripts/deploy.sh` → Use `./deploy.sh production`
- `scripts/push-to-vps.sh` → Use `./deploy.sh update`
- `make quick-start` → Use `./deploy.sh local`

**Migration steps:**

```bash
# Stop old deployment
docker compose down

# Use new script
./deploy.sh production  # or ./deploy.sh local
```

**Benefits of unified script:**

- Single entry point for all deployments
- Auto-detection of environment
- Better error messages
- Consistent behavior across environments

### Scenario 5: Troubleshooting

**Problem:** Services won't start

```bash
# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Try clean restart
./deploy.sh stop
./deploy.sh production  # or local
```

**Problem:** SSL certificate issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Copy to project
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem ssl/
sudo chown $(id -un):$(id -gn) ssl/*.pem

# Restart
./deploy.sh production
```

**Problem:** Port conflicts

```bash
# Check what's using ports
sudo ss -tlnp | grep -E ":(80|443|8080)"

# Stop conflicting service
sudo systemctl stop apache2  # example

# Deploy again
./deploy.sh production
```

## Troubleshooting

### Common Issues

#### "Docker not found"

**Solution:**

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Log out and back in
exit
ssh user@server

# Try again
./deploy.sh production
```

#### "Node.js not found"

**Solution:**

```bash
# Install Node.js 20.x using signed repository
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

# Verify
node --version
npm --version
```

#### "DELETION_TOKEN_PEPPER not set"

**Solution:**

```bash
# Generate secure pepper
openssl rand -hex 32

# Edit .env file
nano .env

# Add line:
DELETION_TOKEN_PEPPER=your_generated_pepper_here

# Save and deploy
./deploy.sh production
```

#### "SSL certificate failed"

**Causes:**

- DNS not pointing to server
- Port 80 blocked by firewall
- Another service using port 80

**Solution:**

```bash
# Check DNS
dig +short your-domain.com
# Should show your VPS IP

# Check firewall
sudo ufw status
# Should allow ports 80, 443

# Check port 80
sudo ss -tlnp | grep :80
# Should be empty or show certbot

# Stop conflicting service
sudo systemctl stop apache2  # or nginx

# Try again
sudo certbot certonly --standalone -d your-domain.com
```

#### "Services unhealthy"

**Solution:**

```bash
# Check logs
./deploy.sh logs

# Check if server is running
docker compose -f docker-compose.prod.yml exec server curl http://localhost:8080/api/health

# Restart
./deploy.sh stop
./deploy.sh production
```

### Debug Mode

For detailed debugging, run commands manually:

```bash
# Check prerequisites
docker --version
docker compose version
node --version

# Check environment
cat .env

# Check containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs server
docker compose -f docker-compose.prod.yml logs web

# Check health
curl http://localhost/api/health
```

## Migration from Old Scripts

### Mapping Old to New Commands

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `scripts/vps-deploy.sh domain email` | `./deploy.sh vps-setup domain email` | Same functionality |
| `scripts/deploy.sh` | `./deploy.sh production` | Simplified |
| `scripts/push-to-vps.sh` | `./deploy.sh update` | Auto-detects environment |
| `make quick-start` | `./deploy.sh local` | Unified interface |
| `docker compose up -d` | `./deploy.sh local` | Adds validation |
| `docker compose -f docker-compose.prod.yml up -d` | `./deploy.sh production` | Adds validation |
| `docker compose logs -f` | `./deploy.sh logs` | Auto-detects environment |
| `docker compose ps` | `./deploy.sh status` | Enhanced output |
| `docker compose down` | `./deploy.sh stop` | Cleaner |
| `docker compose down -v` | `./deploy.sh clean` | With confirmation |

### Why Migrate?

**Benefits:**

1. **Single entry point** - One script for all deployments
2. **Auto-detection** - Detects local vs production automatically
3. **Better validation** - Checks prerequisites before running
4. **Clearer errors** - Helpful error messages with solutions
5. **Consistent** - Same interface across all environments
6. **Safer** - Prevents common mistakes (running as root, missing env vars)

### Migration Steps

1. **Stop old deployment:**

   ```bash
   docker compose down
   # or
   docker compose -f docker-compose.prod.yml down
   ```

2. **Use new script:**

   ```bash
   # For local
   ./deploy.sh local
   
   # For production
   ./deploy.sh production
   ```

3. **Update documentation/scripts:**
   - Replace old script calls with new commands
   - Update CI/CD pipelines if applicable

4. **Optional: Remove old scripts:**

   ```bash
   # Keep for reference, or remove
   rm scripts/vps-deploy.sh
   rm scripts/push-to-vps.sh
   # Keep scripts/deploy.sh for backwards compatibility if needed
   ```

## Advanced Usage

### Custom Environment Variables

Edit `.env` file to customize:

```bash
# Required
DELETION_TOKEN_PEPPER=your_secure_random_string

# Optional (add as needed)
# CUSTOM_VAR=value
```

### Multiple Environments

Run different environments on same machine:

```bash
# Development on port 8080
./deploy.sh local

# Production on ports 80/443 (different compose file)
./deploy.sh production
```

### Automated Deployments

Use in CI/CD pipelines:

```bash
#!/bin/bash
# deploy-pipeline.sh

# SSH into server and deploy
ssh user@server "cd /path/to/delirium && ./deploy.sh update"
```

### Health Monitoring

Set up monitoring:

```bash
#!/bin/bash
# health-monitor.sh

while true; do
  if ! curl -sf http://localhost/api/health > /dev/null; then
    echo "Health check failed, restarting..."
    ./deploy.sh production
  fi
  sleep 60
done
```

## Best Practices

1. **Always check status before deploying:**

   ```bash
   ./deploy.sh status
   ```

2. **View logs during deployment:**

   ```bash
   ./deploy.sh production
   # In another terminal:
   ./deploy.sh logs
   ```

3. **Test locally before production:**

   ```bash
   ./deploy.sh local
   # Test thoroughly
   ./deploy.sh production
   ```

4. **Keep backups of .env file:**

   ```bash
   cp .env .env.backup
   ```

5. **Monitor after deployment:**

   ```bash
   ./deploy.sh status
   ./deploy.sh logs
   ```

6. **Use update for routine deployments:**

   ```bash
   ./deploy.sh update
   ```

## Support

- **Documentation:** [docs/deployment/](../deployment/)
- **Issues:** [GitHub Issues](https://github.com/marcusb333/delerium-paste/issues)
- **Community:** [GitHub Discussions](https://github.com/marcusb333/delerium-paste/discussions)

## See Also

- [SSL Setup Guide](SSL_SETUP.md)
- [Multi-Architecture Deployment](multi-architecture.md)
- [Production Best Practices](DEPLOYMENT.md)
- [Troubleshooting Guide](../troubleshooting/)
