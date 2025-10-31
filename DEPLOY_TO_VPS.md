# Deploy Delirium to Your VPS

Quick guide to deploy Delirium to `203.0.113.10` with domain `example.com`.

## Prerequisites Checklist

- [ ] VPS running Ubuntu 22.04+ at `203.0.113.10`
- [ ] SSH access with user `noob`
- [ ] Domain `example.com` DNS A record pointing to `203.0.113.10`
- [ ] Your email for Let's Encrypt SSL certificates

## Quick Start (Easiest Method)

### Option 1: One Command from VPS

SSH into your VPS and run:

```bash
ssh deploy@203.0.113.10

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh -o /tmp/vps-deploy.sh
chmod +x /tmp/vps-deploy.sh
/tmp/vps-deploy.sh example.com your-email@example.com
```

Replace `your-email@example.com` with your actual email.

### Option 2: From Your Local Machine

Run from this directory on your local machine:

```bash
./scripts/setup-vps-from-local.sh
```

This interactive script will:
- Test your SSH connection
- Verify DNS is configured correctly
- Ask for your email address
- Deploy everything to your VPS automatically

### Option 3: Manual Step-by-Step

If you prefer to do it manually:

```bash
# 1. SSH into your VPS
ssh deploy@203.0.113.10

# 2. Clone the repository
git clone https://github.com/your-username/delerium-paste.git
cd delirium

# 3. Run the deployment script
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh example.com your-email@example.com
```

## What the Script Does

The deployment script will automatically:

1. ✅ Update system packages
2. ✅ Install Docker and Docker Compose
3. ✅ Install Node.js (for building the client)
4. ✅ Install Certbot (for SSL certificates)
5. ✅ Configure firewall (allow ports 22, 80, 443)
6. ✅ Clone/update the repository
7. ✅ Generate secure environment variables
8. ✅ Obtain SSL certificate from Let's Encrypt
9. ✅ Configure nginx with your domain
10. ✅ Build the frontend client
11. ✅ Build and start Docker containers
12. ✅ Set up automatic SSL certificate renewal

## After Deployment

Visit your site at: **https://example.com**

### Useful Commands

```bash
# SSH into your VPS
ssh deploy@203.0.113.10
cd ~/delirium

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### DNS Not Working

Check if DNS is configured correctly:

```bash
dig +short example.com
# Should return: 203.0.113.10
```

If not, update your DNS A record and wait for propagation (5-60 minutes).

### SSL Certificate Fails

Make sure:
- DNS is pointing to your VPS (see above)
- Port 80 is accessible from the internet
- No other service is using port 80

Try again:
```bash
ssh deploy@203.0.113.10
cd ~/delirium
./scripts/vps-deploy.sh example.com your-email@example.com
```

### Services Won't Start

Check logs:
```bash
ssh deploy@203.0.113.10
cd ~/delirium
docker compose -f docker-compose.prod.yml logs
```

### Still Having Issues?

See the detailed guide: [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md)

## Security Notes

After deployment:
- ✅ HTTPS is enabled with valid SSL certificate
- ✅ HTTP automatically redirects to HTTPS
- ✅ Secure random token pepper is generated
- ✅ Firewall is configured
- ✅ SSL certificate auto-renewal is set up
- ✅ Rate limiting is enabled on API endpoints

## Next Steps

1. **Test the deployment**: Visit https://example.com
2. **Create a test paste**: Make sure encryption works
3. **Set up backups**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
4. **Monitor logs**: Check for any errors

---

Need more details? See:
- [VPS Deployment Guide](docs/VPS_DEPLOYMENT.md) - Complete manual
- [SSL Setup Guide](docs/SSL_SETUP_GUIDE.md) - SSL troubleshooting
- [Deployment Guide](docs/DEPLOYMENT.md) - General deployment info

