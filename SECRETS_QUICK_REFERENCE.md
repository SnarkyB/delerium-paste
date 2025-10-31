# ?? Secrets Configuration - Quick Reference

**TL;DR:** Run `./scripts/setup.sh` and follow the prompts. It will guide you through everything!

## ?? Quick Setup

### Option 1: Interactive Wizard (Recommended)
```bash
./scripts/setup.sh
# or
make setup
```

### Option 2: Quick Automated
```bash
make quick-start
```

### Option 3: Manual
```bash
cp .env.example .env
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" > .env
make start
```

## ?? Where Secrets Go

**All secrets go in `.env` file in the project root:**

```
delerium-paste/
??? .env          ? Your secrets go here (never committed to git)
??? .env.example  ? Template (safe to commit)
??? ...
```

## ?? Required Secrets

| Secret | What it does | How to generate | Example |
|--------|--------------|-----------------|---------|
| `DELETION_TOKEN_PEPPER` | Hashes deletion tokens securely | `openssl rand -hex 32` | `8d2eaa...fa8281d` |

## ?? Optional Secrets (Production Only)

| Secret | When to use | Example |
|--------|-------------|---------|
| `DOMAIN` | If you have a custom domain | `paste.example.com` |
| `LETSENCRYPT_EMAIL` | For automatic SSL certs | `admin@example.com` |

## ? Security Checklist

- [ ] Run `./scripts/setup.sh` or generate secrets with `openssl rand -hex 32`
- [ ] Never use the example values from `.env.example`
- [ ] Verify `.env` is in `.gitignore` (already done ?)
- [ ] Use different secrets for dev/staging/production
- [ ] Store production secrets in a password manager
- [ ] Rotate secrets every 3-6 months

## ?? Common Mistakes

| ? Don't Do This | ? Do This Instead |
|-----------------|-------------------|
| `DELETION_TOKEN_PEPPER=password123` | `DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)` |
| Commit `.env` to git | Keep `.env` in `.gitignore` |
| Use same secret in dev and prod | Generate separate secrets per environment |
| Share secrets in Slack/email | Use password managers or secret management tools |

## ?? Troubleshooting

### Problem: "DELETION_TOKEN_PEPPER not set"
```bash
# Check .env exists
ls -la .env

# Verify it has the pepper
cat .env | grep DELETION_TOKEN_PEPPER

# Restart to pick up changes
docker-compose restart
```

### Problem: "Permission denied: ./scripts/setup.sh"
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Problem: I lost my pepper!
```bash
# Generate a new one (users will need new deletion tokens)
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" > .env
docker-compose restart
```

## ?? More Information

- **Detailed Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Examples:** [scripts/DEMO_SETUP.md](scripts/DEMO_SETUP.md)
- **General Docs:** [README.md](README.md)
- **Security:** [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

## ?? Pro Tips

1. **Use the wizard!** It explains everything as you go
2. **Store backups** of your production `.env` in a password manager
3. **Document** where you stored your secrets (for your team)
4. **Rotate regularly** - set a calendar reminder for every 6 months
5. **Test locally first** before deploying to production

---

**Need help?** Open an issue or check the full [SETUP_GUIDE.md](SETUP_GUIDE.md)
