# Migration Guide: Old Scripts → Unified CLI

This guide helps you transition from the old script-based workflow to the new unified Delerium CLI.

## Table of Contents

- [Why Migrate?](#why-migrate)
- [What Changed?](#what-changed)
- [Quick Reference](#quick-reference)
- [Step-by-Step Migration](#step-by-step-migration)
- [Backward Compatibility](#backward-compatibility)
- [Breaking Changes](#breaking-changes)
- [FAQ](#faq)

## Why Migrate?

The unified CLI offers several advantages:

✅ **Single Entry Point** - One command instead of 26+ scripts  
✅ **Better UX** - Intuitive command structure with helpful output  
✅ **Auto-Detection** - Automatically detects environment and configuration  
✅ **Consistent Behavior** - Shared code means consistent behavior  
✅ **Better Error Handling** - Clear error messages with suggestions  
✅ **Easier Maintenance** - Single codebase to maintain and update  
✅ **Better Documentation** - Comprehensive help system built-in  
✅ **Extensibility** - Easy to add new commands and features  

## What Changed?

### Before: Multiple Scripts

```bash
./scripts/quick-start.sh
./scripts/setup.sh
./scripts/deploy.sh
./scripts/dev.sh
./scripts/prod-logs.sh
./scripts/prod-status.sh
./scripts/health-check.sh
./scripts/backup.sh
./scripts/monitor.sh
./scripts/security-check.sh
# ... and 16 more scripts
```

### After: Unified CLI

```bash
./delerium setup
./delerium start
./delerium deploy
./delerium dev
./delerium logs
./delerium status
./delerium backup
./delerium monitor
./delerium security check
# ... all in one tool
```

## Quick Reference

### Command Mapping

| Old Script | New CLI Command | Notes |
|-----------|----------------|-------|
| `./scripts/quick-start.sh` | `./delerium setup` | Interactive setup wizard |
| `./scripts/setup.sh` | `./delerium setup` | Same functionality |
| `./scripts/deploy.sh` | `./delerium deploy` | Enhanced with options |
| `./scripts/dev.sh` | `./delerium dev` | Development mode |
| `./scripts/prod-logs.sh` | `./delerium logs` | View logs |
| `./scripts/prod-status.sh` | `./delerium status` | Check status |
| `./scripts/prod-stop.sh` | `./delerium stop` | Stop services |
| `./scripts/health-check.sh` | `./delerium status` | Health checks |
| `./scripts/backup.sh` | `./delerium backup` | Create backups |
| `./scripts/monitor.sh` | `./delerium monitor` | Continuous monitoring |
| `./scripts/security-check.sh` | `./delerium security check` | Security verification |
| `./scripts/security-setup.sh` | `./delerium security setup` | Security configuration |
| `./scripts/security-scan.sh` | `./delerium security scan` | Vulnerability scanning |
| `./scripts/setup-ssl.sh` | `./delerium security ssl` | SSL management |
| `./scripts/ci-verify-all.sh` | `./delerium test --all` | Run all tests |
| `./scripts/ci-verify-frontend.sh` | `./delerium test --frontend` | Frontend tests |
| `./scripts/ci-verify-backend.sh` | `./delerium test --backend` | Backend tests |
| `./scripts/ci-verify-quick.sh` | `./delerium test --quick` | Quick tests |

### Makefile Commands

| Old Make Command | New Command | Notes |
|-----------------|-------------|-------|
| `make setup` | `./delerium setup` or `make setup` | Makefile delegates to CLI |
| `make start` | `./delerium start` or `make start` | Makefile delegates to CLI |
| `make stop` | `./delerium stop` or `make stop` | Makefile delegates to CLI |
| `make restart` | `./delerium restart` or `make restart` | Makefile delegates to CLI |
| `make logs` | `./delerium logs` or `make logs` | Makefile delegates to CLI |
| `make dev` | `./delerium dev` or `make dev` | Makefile delegates to CLI |
| `make test` | `./delerium test` or `make test` | Makefile delegates to CLI |
| `make deploy` | `./delerium deploy` or `make deploy` | Makefile delegates to CLI |
| `make backup` | `./delerium backup` or `make backup` | Makefile delegates to CLI |
| `make health-check` | `./delerium status` or `make health` | Renamed for clarity |
| `make security-check` | `./delerium security check` or `make security` | Grouped under security |
| `make monitor` | `./delerium monitor` or `make monitor` | Makefile delegates to CLI |

**Note:** The Makefile still works! It now delegates to the unified CLI, so you can use either approach.

## Step-by-Step Migration

### For New Users

If you're setting up Delerium for the first time, just use the new CLI:

```bash
# Clone repository
git clone https://github.com/yourusername/delerium-paste.git
cd delerium-paste

# Run setup
./delerium setup

# You're done! Services are running.
```

### For Existing Users

If you're already using Delerium with the old scripts:

#### Step 1: Update Your Repository

```bash
# Pull latest changes
git pull origin main

# Make CLI executable (if needed)
chmod +x ./delerium
```

#### Step 2: Test the New CLI

The old scripts still work (with deprecation warnings), so you can test the new CLI safely:

```bash
# Check status with new CLI
./delerium status

# Compare with old script
./scripts/prod-status.sh  # Shows deprecation warning, then runs new CLI
```

#### Step 3: Update Your Workflows

**Local Development:**

```bash
# Old way
./scripts/dev.sh

# New way
./delerium dev
```

**Production Deployment:**

```bash
# Old way
./scripts/deploy.sh

# New way
./delerium deploy
```

**Monitoring:**

```bash
# Old way
./scripts/monitor.sh

# New way
./delerium monitor
```

#### Step 4: Update Scripts and CI/CD

If you have custom scripts or CI/CD pipelines that call the old scripts:

**Before:**
```bash
#!/bin/bash
./scripts/quick-start.sh
./scripts/health-check.sh
./scripts/backup.sh
```

**After:**
```bash
#!/bin/bash
./delerium setup
./delerium status
./delerium backup
```

**CI/CD Example (GitHub Actions):**

**Before:**
```yaml
- name: Run tests
  run: |
    ./scripts/ci-verify-all.sh
```

**After:**
```yaml
- name: Run tests
  run: |
    ./delerium test --all
```

#### Step 5: Update Documentation

If you have internal documentation that references the old scripts, update it to use the new CLI commands.

## Backward Compatibility

### Old Scripts Still Work

All old scripts have been replaced with wrapper scripts that:
1. Show a deprecation warning
2. Redirect to the new CLI command
3. Pass through all arguments

**Example:**
```bash
$ ./scripts/quick-start.sh
⚠️  WARNING: This script is deprecated!

   Old command: ./scripts/quick-start.sh
   New command: ./delerium setup

   The unified Delerium CLI provides all functionality in one tool.
   Run './delerium help' to see all available commands.

Redirecting to new CLI in 3 seconds...

🚀 Delerium Quick Start Setup
...
```

### Makefile Still Works

The Makefile has been updated to delegate to the CLI, so all your existing `make` commands continue to work:

```bash
make setup    # Calls ./delerium setup
make start    # Calls ./delerium start
make dev      # Calls ./delerium dev
make logs     # Calls ./delerium logs
# ... etc
```

### Gradual Migration

You can migrate gradually:
- Use new CLI for new workflows
- Keep using old scripts/make commands temporarily
- No rush to update everything at once

### Timeline

- **Now - Week 4:** Both old scripts and new CLI work
- **Week 5-8:** Deprecation warnings on old scripts
- **Week 9+:** Old scripts may be removed (legacy folder kept for reference)

## Breaking Changes

### None!

There are **no breaking changes**. All functionality is preserved and enhanced.

### Enhanced Features

Some commands have new features that weren't available before:

**Logs:**
```bash
# New: Filter by service
./delerium logs server

# New: Tail specific number of lines
./delerium logs --tail=50

# New: Don't follow logs
./delerium logs --no-follow
```

**Status:**
```bash
# New: Detailed status with resource usage
./delerium status --detailed
```

**Deploy:**
```bash
# New: Quick deploy without tests
./delerium deploy --quick

# New: Deploy without backup
./delerium deploy --no-backup
```

**Test:**
```bash
# New: Run specific test suites
./delerium test --frontend
./delerium test --backend

# New: Coverage reports
./delerium test --coverage
```

**Security:**
```bash
# New: Grouped security commands
./delerium security check
./delerium security setup
./delerium security scan
./delerium security ssl
```

## FAQ

### Q: Do I have to migrate immediately?

**A:** No! The old scripts still work. You can migrate at your own pace.

### Q: Will the old scripts be removed?

**A:** Eventually (after several weeks), but the original scripts will be kept in `scripts/legacy/` for reference.

### Q: Can I use both old and new commands?

**A:** Yes! They're compatible. The old scripts redirect to the new CLI.

### Q: What if I have custom scripts that call the old scripts?

**A:** They'll continue to work. Update them when convenient to remove the deprecation warnings.

### Q: Does the Makefile still work?

**A:** Yes! The Makefile now delegates to the CLI, so all `make` commands work as before.

### Q: How do I get help with the new CLI?

**A:** Run `./delerium help` for comprehensive help, or `./delerium <command> --help` for command-specific help.

### Q: What if I find a bug?

**A:** Please report it on GitHub Issues. The old scripts are still available as a fallback.

### Q: Can I configure the CLI?

**A:** Yes! Copy `delerium.config.example` to `delerium.config` and customize settings.

### Q: Does the CLI work on Windows?

**A:** The CLI is a bash script, so it works on macOS, Linux, and WSL (Windows Subsystem for Linux).

### Q: How do I update the CLI?

**A:** Just pull the latest changes from git: `git pull origin main`

### Q: Can I contribute to the CLI?

**A:** Yes! The CLI is open source. See CONTRIBUTING.md for guidelines.

## Examples

### Example 1: First-Time Setup

**Old way:**
```bash
./scripts/quick-start.sh
```

**New way:**
```bash
./delerium setup
```

### Example 2: Development Workflow

**Old way:**
```bash
./scripts/dev.sh
# In another terminal:
./scripts/health-check.sh
./scripts/prod-logs.sh server
```

**New way:**
```bash
./delerium dev
# In another terminal:
./delerium status
./delerium logs server
```

### Example 3: Production Deployment

**Old way:**
```bash
./scripts/backup.sh
./scripts/deploy.sh
./scripts/prod-status.sh
./scripts/prod-logs.sh
```

**New way:**
```bash
./delerium backup
./delerium deploy
./delerium status --detailed
./delerium logs
```

### Example 4: Security Check

**Old way:**
```bash
./scripts/security-check.sh
./scripts/security-scan.sh
```

**New way:**
```bash
./delerium security check
./delerium security scan
```

### Example 5: Monitoring

**Old way:**
```bash
./scripts/monitor.sh
```

**New way:**
```bash
./delerium monitor --interval=30
```

## Need Help?

- **Documentation:** See `docs/CLI.md` for comprehensive CLI documentation
- **Help Command:** Run `./delerium help` for quick reference
- **GitHub Issues:** Report bugs or request features
- **Community:** Join our Discord/Slack for support

## Summary

The migration to the unified CLI is:
- ✅ **Safe** - Old scripts still work
- ✅ **Easy** - Simple command mapping
- ✅ **Gradual** - Migrate at your own pace
- ✅ **Better** - Improved UX and features
- ✅ **Supported** - Comprehensive documentation

Start using `./delerium` today and enjoy a better Delerium experience!
