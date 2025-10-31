# Deployment Setup Complete! 🚀

I've prepared everything you need to deploy Delirium to your VPS at `203.0.113.10` with domain `example.com`.

## What I've Created

### 1. Automated Deployment Scripts

- **`scripts/vps-deploy.sh`** - Complete automated deployment script for VPS
  - Installs all prerequisites (Docker, Node.js, Certbot)
  - Gets SSL certificate from Let's Encrypt
  - Builds and deploys the application
  - Sets up automatic certificate renewal
  
- **`scripts/setup-vps-from-local.sh`** - Interactive deployment from your local machine
  - Tests SSH connection
  - Verifies DNS configuration
  - Guides you through deployment options

### 2. Documentation

- **`DEPLOY_TO_VPS.md`** - Quick start guide with 3 deployment options
- **`docs/VPS_DEPLOYMENT.md`** - Complete detailed deployment manual
- **`.env.example`** - Example environment configuration (attempted)

## How to Deploy

### ⚡ Fastest Method (Recommended)

Run this from your local machine:

```bash
cd /Users/marcusb/src/repos/delirium
./scripts/setup-vps-from-local.sh
```

The script will guide you through everything!

### 🔧 Alternative: Direct VPS Deployment

Or SSH directly to your VPS and run:

```bash
ssh deploy@203.0.113.10

# Quick one-liner
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh -o /tmp/deploy.sh && chmod +x /tmp/deploy.sh && /tmp/deploy.sh example.com your-email@example.com
```

Replace `your-email@example.com` with your actual email.

## Pre-Deployment Checklist

Before deploying, make sure:

- [ ] **DNS is configured**: Add an A record for `example.com` → `203.0.113.10`
- [ ] **SSH access works**: Test with `ssh deploy@203.0.113.10`
- [ ] **You have an email**: Required for Let's Encrypt SSL certificates
- [ ] **VPS meets requirements**: Ubuntu 22.04+, 1GB+ RAM, 10GB+ disk

## Check DNS Configuration

Run this to verify DNS is working:

```bash
dig +short example.com
# Should return: 203.0.113.10
```

If it doesn't return your VPS IP:
1. Log into your domain registrar
2. Add/update A record:
   - Type: A
   - Name: @ (or blank)
   - Value: 203.0.113.10
   - TTL: 300
3. Wait 5-60 minutes for DNS propagation

## What Happens During Deployment

The automated script will:

1. ✅ Update system packages
2. ✅ Install Docker & Docker Compose
3. ✅ Install Node.js 20 (for building client)
4. ✅ Install Certbot (for SSL)
5. ✅ Configure firewall (UFW)
6. ✅ Clone repository to `~/delirium`
7. ✅ Generate secure `.env` with random pepper
8. ✅ Obtain Let's Encrypt SSL certificate
9. ✅ Configure nginx for HTTPS
10. ✅ Build TypeScript client
11. ✅ Build and start Docker containers
12. ✅ Set up automatic SSL renewal (cron job)

Estimated time: **5-10 minutes**

## After Deployment

Your site will be live at: **https://example.com**

### Verify Deployment

```bash
# Check if site is up
curl -I https://example.com

# SSH and check services
ssh deploy@203.0.113.10
cd ~/delirium
docker compose -f docker-compose.prod.yml ps
```

### Common Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Update deployment
git pull
docker compose -f docker-compose.prod.yml down
cd client && npm run build && cd ..
docker compose -f docker-compose.prod.yml up --build -d
```

## Security Features (Included)

- 🔒 **HTTPS with Let's Encrypt** - Valid SSL certificate
- 🔄 **Auto-renewal** - Certificate renews automatically
- 🛡️ **Security headers** - HSTS, CSP, X-Frame-Options
- 🚦 **Rate limiting** - 10 requests/minute on API
- 🔥 **Firewall** - Only ports 22, 80, 443 open
- 🔐 **Secure tokens** - Random 32-byte pepper generated

## Troubleshooting

### DNS not resolving?
- Wait for propagation (5-60 minutes)
- Check with: `dig +short example.com`

### SSL certificate fails?
- Ensure DNS points to VPS first
- Make sure port 80 is accessible
- Run deployment script again

### Services won't start?
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Check disk space: `df -h`
- Check memory: `free -m`

### More help?
- See [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md)
- See [docs/SSL_SETUP_GUIDE.md](docs/SSL_SETUP_GUIDE.md)

## Repository Structure

```
delirium/
├── DEPLOY_TO_VPS.md              ← Quick start guide
├── DEPLOYMENT_SUMMARY.md         ← This file
├── scripts/
│   ├── vps-deploy.sh             ← VPS deployment script
│   └── setup-vps-from-local.sh   ← Local deployment helper
├── docs/
│   ├── VPS_DEPLOYMENT.md         ← Detailed guide
│   ├── SSL_SETUP_GUIDE.md        ← SSL troubleshooting
│   └── DEPLOYMENT.md             ← General deployment
├── client/                       ← Frontend (TypeScript)
├── server/                       ← Backend (Kotlin/Ktor)
├── reverse-proxy/                ← Nginx configs
│   ├── nginx.conf               ← Basic config
│   └── nginx-ssl.conf           ← SSL config (template)
└── docker-compose.prod.yml       ← Production Docker setup
```

## Next Steps

1. **Verify DNS** - Make sure `example.com` points to `203.0.113.10`
2. **Run deployment** - Use `./scripts/setup-vps-from-local.sh`
3. **Test the site** - Visit https://example.com
4. **Create test paste** - Verify encryption works
5. **Set up backups** - See docs/DEPLOYMENT.md

## Important Notes

- **Email required**: Let's Encrypt needs your email for expiration notices
- **DNS must work first**: SSL certificates require working DNS
- **SSH password**: Script uses password auth (`-o PubkeyAuthentication=no`)
- **Repo location**: Code will be in `~/delirium` on VPS
- **Auto-renewal**: Certificates renew automatically at 3 AM daily

## Support

If you encounter issues:
1. Check the deployment logs
2. Review [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md)
3. Check service logs: `docker compose -f docker-compose.prod.yml logs -f`
4. Open a GitHub issue if needed

---

**Ready to deploy?** Run this:

```bash
./scripts/setup-vps-from-local.sh
```

Good luck! 🚀

