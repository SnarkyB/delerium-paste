# Delirium Scripts

## ⚠️ IMPORTANT: Migration to Unified CLI

**The individual scripts in this directory are deprecated and will be removed in a future release.**

All functionality has been consolidated into the **unified Delerium CLI** at the root of the project:

```bash
./delerium <command> [options]
```

**Benefits of the unified CLI:**
- ✅ Single entry point for all operations
- ✅ Intuitive command structure
- ✅ Auto-detection of environment
- ✅ Better error handling and help
- ✅ Consistent behavior across all commands
- ✅ Easier to maintain and extend

## 🚀 Quick Migration Guide

| Old Script | New CLI Command |
|-----------|----------------|
| `./scripts/quick-start.sh` | `./delerium setup` |
| `./scripts/setup.sh` | `./delerium setup` |
| `./scripts/deploy.sh` | `./delerium deploy` |
| `./scripts/deploy-prod.sh` | `./delerium deploy` |
| `./scripts/dev.sh` | `./delerium dev` |
| `./scripts/prod-logs.sh` | `./delerium logs` |
| `./scripts/prod-status.sh` | `./delerium status` |
| `./scripts/prod-stop.sh` | `./delerium stop` |
| `./scripts/health-check.sh` | `./delerium status` |
| `./scripts/backup.sh` | `./delerium backup` |
| `./scripts/monitor.sh` | `./delerium monitor` |
| `./scripts/security-check.sh` | `./delerium security check` |
| `./scripts/security-setup.sh` | `./delerium security setup` |
| `./scripts/security-scan.sh` | `./delerium security scan` |
| `./scripts/setup-ssl.sh` | `./delerium security ssl` |
| `./scripts/ci-verify-all.sh` | `./delerium test --all` |
| `./scripts/ci-verify-frontend.sh` | `./delerium test --frontend` |
| `./scripts/ci-verify-backend.sh` | `./delerium test --backend` |
| `./scripts/ci-verify-quick.sh` | `./delerium test --quick` |

## 📖 Documentation

**For comprehensive documentation, see:**
- [CLI Documentation](../docs/CLI.md) - Complete CLI reference
- [Migration Guide](../docs/MIGRATION.md) - Detailed migration instructions
- [Main README](../README.md) - Project overview

## 🎯 Quick Command Reference

### Setup and Installation
```bash
./delerium setup              # Interactive first-time setup
./delerium start              # Start services
./delerium stop               # Stop services
./delerium restart            # Restart services
```

### Development
```bash
./delerium dev                # Development mode with hot-reload
./delerium test               # Run tests
./delerium test --frontend    # Frontend tests only
./delerium test --backend     # Backend tests only
./delerium test --coverage    # Run with coverage
```

### Monitoring and Status
```bash
./delerium status             # Check service status
./delerium status --detailed  # Detailed status
./delerium logs               # View logs
./delerium logs server        # Server logs only
./delerium logs --tail=50     # Last 50 lines
```

### Deployment
```bash
./delerium deploy             # Deploy to production
./delerium deploy --quick     # Quick deploy (skip tests)
./delerium backup             # Create backup
./delerium backup --restore=<file>  # Restore from backup
```

### Security
```bash
./delerium security check     # Security verification
./delerium security setup     # Configure security
./delerium security scan      # Vulnerability scan
./delerium security ssl       # SSL management
```

### Monitoring
```bash
./delerium monitor            # Start monitoring
./delerium monitor --interval=30  # 30s interval
```

### Help
```bash
./delerium help               # Show all commands
./delerium version            # Show version
```

## 🔄 Backward Compatibility

**The old scripts still work!** They now act as wrappers that:
1. Show a deprecation warning
2. Redirect to the new CLI command
3. Pass through all arguments

**Example:**
```bash
$ ./scripts/quick-start.sh
⚠️  WARNING: This script is deprecated!

   Old command: ./scripts/quick-start.sh
   New command: ./delerium setup

Redirecting to new CLI in 3 seconds...
```

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── legacy/                      # Original scripts (archived)
│   ├── backup.sh
│   ├── deploy.sh
│   ├── dev.sh
│   ├── health-check.sh
│   ├── monitor.sh
│   ├── prod-logs.sh
│   ├── prod-status.sh
│   ├── prod-stop.sh
│   ├── quick-start.sh
│   ├── security-check.sh
│   └── setup.sh
├── backup.sh                    # Wrapper → ./delerium backup
├── deploy.sh                    # Wrapper → ./delerium deploy
├── dev.sh                       # Wrapper → ./delerium dev
├── health-check.sh              # Wrapper → ./delerium status
├── monitor.sh                   # Wrapper → ./delerium monitor
├── prod-logs.sh                 # Wrapper → ./delerium logs
├── prod-status.sh               # Wrapper → ./delerium status
├── prod-stop.sh                 # Wrapper → ./delerium stop
├── quick-start.sh               # Wrapper → ./delerium setup
├── security-check.sh            # Wrapper → ./delerium security check
├── setup.sh                     # Wrapper → ./delerium setup
└── [other scripts...]           # Specialized scripts (kept as-is)
```

## 🎯 Common Workflows with New CLI

### Initial Setup
```bash
# Clone repository
git clone https://github.com/marcusb333/delerium-paste-mono.git
cd delerium-paste-mono

# Run setup
./delerium setup

# Services are now running!
```

### Development Workflow
```bash
# Start development mode
./delerium dev

# In another terminal:
./delerium status
./delerium logs server --follow
./delerium test --frontend
```

### Production Deployment
```bash
# Initial deployment
./delerium setup
./delerium security setup
./delerium deploy

# Update deployment
git pull
./delerium deploy

# Check status
./delerium status --detailed
```

### Monitoring and Maintenance
```bash
# Check status
./delerium status

# View logs
./delerium logs

# Create backup
./delerium backup

# Run security check
./delerium security check

# Start monitoring
./delerium monitor
```

### Troubleshooting
```bash
# Check status
./delerium status --detailed

# View logs
./delerium logs server

# Restart services
./delerium restart

# Run health check
./delerium status
```

## 🔍 Still Available: Specialized Scripts

Some specialized scripts are kept as-is because they serve specific purposes:

### VPS Deployment
```bash
# One-command VPS deployment
curl -fsSL https://raw.githubusercontent.com/marcusb333/delerium-paste-mono/main/scripts/vps-deploy.sh | bash -s your-domain.com your@email.com
```

### CI/CD Scripts
These scripts are still available for CI/CD pipelines, but the CLI provides equivalent functionality:
- `ci-verify-all.sh` → Use `./delerium test --all`
- `ci-verify-frontend.sh` → Use `./delerium test --frontend`
- `ci-verify-backend.sh` → Use `./delerium test --backend`
- `ci-verify-quick.sh` → Use `./delerium test --quick`

### Other Specialized Scripts
- `setup-vps-from-local.sh` - Deploy from local to VPS
- `push-to-vps.sh` - Push and deploy to existing VPS
- `install-headless.sh` - Headless installation
- `fix-branch-protection.sh` - Git branch protection
- `post-merge-release.sh` - Post-merge automation
- `pre-pr-check.sh` - Pre-PR validation
- `review-pr.sh` - PR review automation
- `sync-to-standalone.sh` - Sync to standalone repo

## 🚀 Get Started

1. **Use the new CLI:**
   ```bash
   ./delerium help
   ```

2. **Read the documentation:**
   - [CLI Documentation](../docs/CLI.md)
   - [Migration Guide](../docs/MIGRATION.md)

3. **Update your workflows:**
   - Replace script calls with CLI commands
   - Update CI/CD pipelines
   - Update internal documentation

## 📝 Timeline

- **Now - Week 4:** Both old scripts and new CLI work
- **Week 5-8:** Deprecation warnings on old scripts
- **Week 9+:** Old scripts may be removed (legacy folder kept for reference)

## 🤝 Need Help?

- Run `./delerium help` for comprehensive help
- See [CLI Documentation](../docs/CLI.md) for detailed reference
- See [Migration Guide](../docs/MIGRATION.md) for migration instructions
- Report issues on GitHub

---

**Start using the unified CLI today for a better Delerium experience!**

```bash
./delerium help
```
