# Delerium CLI Documentation

The Delerium CLI is a unified command-line interface for managing your Delerium Paste deployment.

## Quick Start

```bash
# First-time setup
./delerium setup

# Start services
./delerium start

# Check status
./delerium status

# View logs
./delerium logs
```

## Commands

### setup
Interactive first-time setup wizard.
```bash
./delerium setup
```

### start
Start Delerium services.
```bash
./delerium start          # Auto-detect environment
./delerium start --dev    # Development mode
./delerium start --prod   # Production mode
./delerium start --build  # Force rebuild
```

### stop
Stop all services.
```bash
./delerium stop
```

### restart
Restart services.
```bash
./delerium restart
```

### logs
View logs from services.
```bash
./delerium logs                    # All logs
./delerium logs server             # Server logs only
./delerium logs --tail=50          # Last 50 lines
./delerium logs --no-follow        # Don't follow
```

### status
Check service status and health.
```bash
./delerium status              # Basic status
./delerium status --detailed   # Detailed info
```

### deploy
Deploy to production.
```bash
./delerium deploy              # Full deployment
./delerium deploy --quick      # Skip tests
./delerium deploy --no-backup  # Skip backup
```

### dev
Development mode with hot-reload.
```bash
./delerium dev
```

### test
Run test suites.
```bash
./delerium test                # All tests
./delerium test --frontend     # Frontend only
./delerium test --backend      # Backend only
./delerium test --coverage     # With coverage
```

### backup
Create backups.
```bash
./delerium backup
```

### security
Security operations.
```bash
./delerium security check
```

### monitor
Continuous health monitoring.
```bash
./delerium monitor                # Default interval (60s)
./delerium monitor --interval=30  # Custom interval
```

### version
Show version.
```bash
./delerium version
```

### help
Show help.
```bash
./delerium help
```

## Configuration

Optional configuration file: `delerium.config`

```bash
cp delerium.config.example delerium.config
```

## Environment Detection

The CLI automatically detects:
- Development vs Production
- Headless vs GUI environment
- Docker Compose command availability

## Examples

### First-Time Setup
```bash
git clone https://github.com/yourusername/delerium-paste.git
cd delerium-paste
./delerium setup
```

### Development Workflow
```bash
./delerium dev
# In another terminal:
./delerium status
./delerium logs server --follow
```

### Production Deployment
```bash
./delerium setup
./delerium deploy
./delerium status --detailed
```

## Troubleshooting

### Services won't start
```bash
./delerium status
./delerium logs
./delerium restart
```

### API not responding
```bash
./delerium status --detailed
./delerium logs server
./delerium restart
```

## Support

- Run `./delerium help` for quick reference
- Check README.md for project overview
- Report issues on GitHub
