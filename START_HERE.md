# 🚀 Deploy Delirium to Your VPS

## Quick Status

✅ **DNS Configured**: `example.com` → `203.0.113.10`  
✅ **Client Builds**: TypeScript compilation successful  
✅ **Repository**: https://github.com/your-username/delerium-paste.git  
✅ **Deployment Scripts**: Ready to use  

**You're ready to deploy!**

---

## 🎯 Easiest Way to Deploy (30 seconds)

Just run this command from this directory:

```bash
./QUICK_DEPLOY.sh
```

It will guide you through 3 deployment options and handle everything automatically.

---

## 📋 What You Need

- ✅ VPS IP: `203.0.113.10` (already set)
- ✅ Domain: `example.com` (DNS already configured)
- ✅ SSH User: `noob`
- ⚠️  Your email address (for SSL certificate notifications)

---

## 🚀 Deployment Options

### Option 1: Interactive Script (Recommended)

```bash
./QUICK_DEPLOY.sh
```

### Option 2: Automated from Local Machine

```bash
./scripts/setup-vps-from-local.sh
```

### Option 3: Direct VPS Command

```bash
ssh deploy@203.0.113.10
curl -fsSL https://raw.githubusercontent.com/your-username/delerium-paste/main/scripts/vps-deploy.sh | bash -s example.com your-email@example.com
```

---

## ⏱️ What to Expect

**Deployment time**: 5-10 minutes

The script will automatically:
1. Install Docker & dependencies
2. Get Let's Encrypt SSL certificate
3. Build and deploy your application
4. Set up automatic certificate renewal

---

## 🎉 After Deployment

Your site will be live at: **https://example.com**

To verify:
```bash
curl -I https://example.com
```

To check services:
```bash
ssh deploy@203.0.113.10
cd ~/delirium
docker compose -f docker-compose.prod.yml ps
```

---

## 📚 Documentation

- **QUICK_DEPLOY.sh** - Run this to start deployment
- **DEPLOY_TO_VPS.md** - Quick reference guide
- **DEPLOYMENT_SUMMARY.md** - Complete overview
- **docs/VPS_DEPLOYMENT.md** - Detailed manual deployment guide
- **docs/SSL_SETUP_GUIDE.md** - SSL troubleshooting

---

## 🆘 Need Help?

### DNS Issues?
```bash
dig +short example.com
# Should show: 203.0.113.10
```

### SSL Issues?
- Make sure DNS is working first (see above)
- Ensure port 80 is accessible
- Check [docs/SSL_SETUP_GUIDE.md](docs/SSL_SETUP_GUIDE.md)

### Deployment Failed?
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- See troubleshooting in [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md)

---

## 🔐 Security (Included)

- ✅ HTTPS with valid Let's Encrypt certificate
- ✅ Auto-renewing SSL certificates
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ API rate limiting (10 req/min)
- ✅ Firewall configuration
- ✅ Zero-knowledge encryption

---

## 🎬 Ready to Deploy?

Run this command now:

```bash
./QUICK_DEPLOY.sh
```

---

**Questions?** Check the docs/ folder or open a GitHub issue.

**Let's go! 🚀**

