# Delirium Deployment - Quick Reference

## 🚀 Quick Commands

```bash
# Local development
./deploy.sh local              # Start on http://localhost:8080

# VPS production setup
./deploy.sh vps-setup example.com admin@example.com

# Production deployment
./deploy.sh production         # Deploy to production

# Update & redeploy
./deploy.sh update            # Pull + rebuild + restart

# Management
./deploy.sh status            # Check status
./deploy.sh logs              # View logs (Ctrl+C to exit)
./deploy.sh stop              # Stop services
./deploy.sh clean             # Stop + remove volumes (⚠️ deletes DB)

# Help
./deploy.sh help              # Show detailed help
```

## 📋 Common Workflows

### First Time Local Setup
```bash
git clone https://github.com/marcusb333/delerium-paste.git
cd delerium-paste
./deploy.sh local
# Access: http://localhost:8080
```

### First Time VPS Setup
```bash
ssh user@your-vps
git clone https://github.com/marcusb333/delerium-paste.git
cd delerium-paste
./deploy.sh vps-setup your-domain.com your@email.com
# Access: https://your-domain.com
```

### Update Production
```bash
ssh user@your-vps
cd delerium-paste
./deploy.sh update
```

### Troubleshooting
```bash
./deploy.sh status            # Check what's running
./deploy.sh logs              # See what's happening
./deploy.sh stop              # Stop everything
./deploy.sh production        # Start fresh
```

## 🔧 Requirements

### Local Development
- Docker & Docker Compose
- Node.js 18+ (optional)

### VPS Production
- Ubuntu 22.04+ or Debian 11+
- Domain pointed to server IP
- 1GB RAM, 1 CPU, 10GB disk

## 📖 Full Documentation

- **Detailed Guide:** [docs/deployment/UNIFIED_DEPLOYMENT.md](../deployment/UNIFIED_DEPLOYMENT.md)
- **README:** [README.md](README.md)
- **SSL Setup:** [docs/deployment/SSL_SETUP.md](../deployment/SSL_SETUP.md)

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not found | `curl -fsSL https://get.docker.com \| sudo sh` |
| Node.js not found | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash -` |
| Services unhealthy | `./deploy.sh logs` then `./deploy.sh stop && ./deploy.sh production` |
| SSL failed | Check DNS: `dig +short your-domain.com` should show VPS IP |
| Port conflict | `sudo ss -tlnp \| grep -E ":(80\|443\|8080)"` |

## 🔄 Migration from Old Scripts

| Old | New |
|-----|-----|
| `scripts/vps-deploy.sh domain email` | `./deploy.sh vps-setup domain email` |
| `scripts/deploy.sh` | `./deploy.sh production` |
| `make quick-start` | `./deploy.sh local` |
| `docker compose logs -f` | `./deploy.sh logs` |
| `docker compose ps` | `./deploy.sh status` |

---

**Need help?** Run `./deploy.sh help` or see [docs/deployment/UNIFIED_DEPLOYMENT.md](../deployment/UNIFIED_DEPLOYMENT.md)
