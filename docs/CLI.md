# Delerium CLI Documentation

The Delerium CLI is a unified command-line interface for managing your Delerium Paste deployment. It consolidates all deployment, development, and maintenance operations into a single, easy-to-use tool.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [setup](#setup)
  - [start](#start)
  - [stop](#stop)
  - [restart](#restart)
  - [logs](#logs)
  - [status](#status)
  - [deploy](#deploy)
  - [dev](#dev)
  - [test](#test)
  - [backup](#backup)
  - [health](#health)
  - [security](#security)
  - [monitor](#monitor)
  - [version](#version)
  - [help](#help)
- [Configuration](#configuration)
- [Environment Detection](#environment-detection)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

The Delerium CLI is included in the repository. Make sure it's executable:

```bash
chmod +x ./delerium
```

## Quick Start

For first-time setup:

```bash
./delerium setup
```

This will:
1. Check prerequisites (Docker, Node.js)
2. Generate secure secrets
3. Create `.env` file
4. Install dependencies
5. Build the client
6. Optionally start services

## Commands

### setup

Interactive first-time setup wizard.

```bash
./delerium setup
```

**What it does:**
- Checks prerequisites (Docker, Node.js)
- Creates `.env` file with secure secrets
- Installs client dependencies
- Builds TypeScript client
- Optionally starts services

**Options:**
- None (interactive prompts guide you through)

**Example:**
```bash
./delerium setup
```

---

### start

Start Delerium services.

```bash
./delerium start [options]
```

**Options:**
- `--dev` - Start in development mode with hot-reload
- `--prod` - Start in production mode
- `--build` - Force rebuild client before starting

**Examples:**
```bash
# Start with auto-detected environment
./delerium start

# Start in development mode
./delerium start --dev

# Start in production mode
./delerium start --prod

# Force rebuild and start
./delerium start --build
```

---

### stop

Stop all Delerium services.

```bash
./delerium stop
```

**Example:**
```bash
./delerium stop
```

---

### restart

Restart Delerium services.

```bash
./delerium restart [options]
```

**Options:**
- Same as `start` command

**Example:**
```bash
./delerium restart
./delerium restart --dev
```

---

### logs

View logs from services.

```bash
./delerium logs [service] [options]
```

**Arguments:**
- `service` - Optional service name (`server`, `web`)

**Options:**
- `--tail=N` - Show last N lines
- `--no-follow` - Don't follow logs (exit after displaying)

**Examples:**
```bash
# Follow all logs
./delerium logs

# Follow server logs only
./delerium logs server

# Show last 50 lines of all logs
./delerium logs --tail=50

# Show last 100 lines of server logs without following
./delerium logs server --tail=100 --no-follow
```

---

### status

Check service status and health.

```bash
./delerium status [options]
```

**Options:**
- `--detailed` or `-d` - Show detailed information including resource usage

**Examples:**
```bash
# Basic status
./delerium status

# Detailed status with resource usage
./delerium status --detailed
```

**Output includes:**
- Container status
- API health check
- Frontend accessibility
- Resource usage (with `--detailed`)
- Access URLs

---

### deploy

Deploy to production.

```bash
./delerium deploy [options]
```

**Options:**
- `--target=local|vps` - Deployment target (default: local)
- `--quick` - Skip tests and checks
- `--no-backup` - Skip backup creation

**Examples:**
```bash
# Deploy to local Docker
./delerium deploy

# Deploy to local with backup
./delerium deploy --target local

# Quick deploy without backup
./delerium deploy --quick --no-backup
```

**What it does:**
1. Validates `.env` file
2. Creates backup (unless `--no-backup`)
3. Builds client (unless `--quick`)
4. Builds Docker images
5. Stops old containers
6. Starts new containers
7. Runs health checks

---

### dev

Start development environment with hot-reload.

```bash
./delerium dev
```

**What it does:**
- Starts backend in Docker
- Runs frontend in watch mode
- Auto-recompiles TypeScript on changes
- Provides live development experience

**Example:**
```bash
./delerium dev
```

Press `Ctrl+C` to stop the development environment.

---

### test

Run test suites.

```bash
./delerium test [options]
```

**Options:**
- `--frontend` - Run only frontend tests
- `--backend` - Run only backend tests
- `--all` - Run all tests (default)
- `--quick` - Skip E2E tests
- `--coverage` - Generate coverage reports

**Examples:**
```bash
# Run all tests
./delerium test

# Run only frontend tests
./delerium test --frontend

# Run only backend tests
./delerium test --backend

# Run tests with coverage
./delerium test --coverage

# Quick test (skip E2E)
./delerium test --quick
```

---

### backup

Create or restore backups.

```bash
./delerium backup [options]
```

**Options:**
- `--restore=<file>` - Restore from backup file

**Examples:**
```bash
# Create backup
./delerium backup

# Restore from backup
./delerium backup --restore=backups/delirium-backup-20250121-120000.tar.gz
```

**What it backs up:**
- Server data volume
- `.env` file
- Docker compose files
- Reverse proxy configuration
- Logs

**Retention:** Backups older than 7 days are automatically cleaned up.

---

### health

Check service health (alias for `status`).

```bash
./delerium health
```

Same as `./delerium status`.

---

### security

Security operations.

```bash
./delerium security <subcommand>
```

**Subcommands:**
- `setup` - Configure security enhancements
- `check` - Run security verification
- `scan` - Vulnerability scanning
- `ssl` - SSL certificate management

**Examples:**
```bash
# Run security check
./delerium security check

# Setup security enhancements
./delerium security setup

# Run vulnerability scan
./delerium security scan

# Manage SSL certificates
./delerium security ssl
```

**Security check includes:**
- `.env` file validation
- Deletion token pepper strength
- File permissions
- Docker security
- Container health
- Firewall status (if available)

---

### monitor

Continuous health monitoring.

```bash
./delerium monitor [options]
```

**Options:**
- `--interval=N` - Check interval in seconds (default: 60)

**Example:**
```bash
# Monitor with default interval (60s)
./delerium monitor

# Monitor with 30s interval
./delerium monitor --interval=30
```

**What it monitors:**
- Docker status
- Container health
- API health
- Disk usage
- Memory usage (on Linux)

**Features:**
- Auto-restart on failure
- Logs to `logs/monitor.log`
- Continuous monitoring until stopped

Press `Ctrl+C` to stop monitoring.

---

### version

Show version information.

```bash
./delerium version
```

---

### help

Show help information.

```bash
./delerium help
```

Shows comprehensive help with all commands, options, and examples.

## Configuration

Optional configuration file: `delerium.config`

Copy the example file:
```bash
cp delerium.config.example delerium.config
```

**Available settings:**

```bash
# Environment
ENVIRONMENT=production

# VPS Deployment
VPS_HOST=example.com
VPS_USER=deploy
VPS_SSH_KEY=~/.ssh/id_rsa

# Backup Settings
BACKUP_RETENTION_DAYS=7
BACKUP_DIR=./backups

# Monitoring
HEALTH_CHECK_INTERVAL=30
AUTO_RESTART=true
MONITOR_LOG_FILE=./logs/monitor.log

# Docker
DOCKER_COMPOSE_CMD="docker compose"
DEV_COMPOSE_FILE=docker-compose.yml
PROD_COMPOSE_FILE=docker-compose.prod.yml

# Browser
NO_BROWSER=false
HEADLESS=false

# Deployment
SKIP_TESTS=false
SKIP_BACKUP=false
BUILD_JOBS=4

# Security
SECURITY_ENHANCED=false
SSL_DIR=./ssl
LETSENCRYPT_EMAIL=admin@example.com
```

## Environment Detection

The CLI automatically detects your environment:

**Development:**
- Uses `docker-compose.yml`
- Enables hot-reload
- Opens browser automatically

**Production:**
- Uses `docker-compose.prod.yml`
- Optimized builds
- Health checks

**Headless:**
- Detected when no display is available
- Skips browser opening
- Suitable for VPS/server environments

You can override detection with flags:
```bash
./delerium start --prod  # Force production mode
HEADLESS=1 ./delerium setup  # Force headless mode
```

## Examples

### First-Time Setup

```bash
# Clone repository
git clone https://github.com/yourusername/delerium-paste.git
cd delerium-paste

# Run setup
./delerium setup

# Services are now running at http://localhost:8080
```

### Development Workflow

```bash
# Start development mode
./delerium dev

# In another terminal, run tests
./delerium test --frontend

# Check status
./delerium status

# View logs
./delerium logs server --follow
```

### Production Deployment

```bash
# Setup for production
./delerium setup

# Deploy
./delerium deploy --target local

# Check status
./delerium status --detailed

# View logs
./delerium logs

# Create backup
./delerium backup
```

### Monitoring

```bash
# Start monitoring
./delerium monitor --interval=30

# In another terminal, check status
./delerium status --detailed

# Run security check
./delerium security check
```

### Maintenance

```bash
# Create backup
./delerium backup

# Stop services
./delerium stop

# Restart services
./delerium restart

# Check health
./delerium health
```

## Troubleshooting

### Services won't start

```bash
# Check prerequisites
./delerium setup

# Check Docker
docker info

# Check logs
./delerium logs

# Try restart
./delerium restart
```

### API not responding

```bash
# Check status
./delerium status --detailed

# View server logs
./delerium logs server

# Restart services
./delerium restart
```

### Permission errors

```bash
# Check .env permissions
ls -la .env

# Fix permissions
chmod 600 .env

# Run security check
./delerium security check
```

### Docker issues

```bash
# Check Docker is running
docker info

# Clean up
make clean

# Restart
./delerium start --build
```

### Build failures

```bash
# Clean and rebuild
make clean
./delerium start --build

# Check Node.js version
node --version  # Should be 18+

# Reinstall dependencies
cd client && npm install && cd ..
```

## Migration from Old Scripts

If you were using the old scripts, here's the migration guide:

| Old Command | New Command |
|------------|-------------|
| `./scripts/quick-start.sh` | `./delerium setup` |
| `./scripts/setup.sh` | `./delerium setup` |
| `./scripts/deploy.sh` | `./delerium deploy` |
| `./scripts/dev.sh` | `./delerium dev` |
| `./scripts/prod-logs.sh` | `./delerium logs` |
| `./scripts/prod-status.sh` | `./delerium status` |
| `./scripts/prod-stop.sh` | `./delerium stop` |
| `./scripts/health-check.sh` | `./delerium status` |
| `./scripts/backup.sh` | `./delerium backup` |
| `./scripts/monitor.sh` | `./delerium monitor` |
| `./scripts/security-check.sh` | `./delerium security check` |
| `make start` | `./delerium start` |
| `make dev` | `./delerium dev` |
| `make logs` | `./delerium logs` |
| `make status` | `./delerium status` |

The old scripts still work but show deprecation warnings and redirect to the new CLI.

## Support

For more information:
- **Documentation**: `./docs/`
- **Migration Guide**: `./docs/MIGRATION.md`
- **Issues**: GitHub Issues
- **Help**: `./delerium help`

## License

See LICENSE file for details.
