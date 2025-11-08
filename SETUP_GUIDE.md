# ?? Setup Guide - Secrets Configuration

This guide explains how to configure your secrets for Delerium Paste.

## Quick Start

### Option 1: Interactive Setup Wizard (Recommended)

The easiest way to configure your secrets:

```bash
./scripts/setup.sh
# or
make setup
```

The wizard will guide you through:

1. **Choose Environment Type**
   - Local Development (auto-generates development-friendly secrets)
   - Production/VPS (prompts for production-grade configuration)

2. **Configure Secrets**
   - **Auto-generate**: Let the script create a secure random pepper (recommended)
   - **Manual entry**: Enter your own secret if you prefer

3. **Optional Settings** (Production only)
   - Domain name (e.g., `paste.example.com`)
   - Let's Encrypt email for SSL certificates

4. **Start Services**
   - Option to start Docker containers immediately
   - Automatic health checks
   - Browser opening (if not in headless mode)

### Option 2: Manual Configuration

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate a secure secret:**
   ```bash
   openssl rand -hex 32
   ```

3. **Edit `.env` and paste your secret:**
   ```bash
   DELETION_TOKEN_PEPPER=your_generated_secret_here
   ```

4. **Start services:**
   ```bash
   make start
   ```

## What Each Secret Does

### DELETION_TOKEN_PEPPER (Required)

**What it is:** A secret string used to hash deletion tokens before storing them in the database.

**Why it matters:** This prevents attackers from using stolen database dumps to delete pastes.

**Security requirements:**
- ? **At least 64 characters** (recommended)
- ? **Cryptographically random** (use `openssl rand -hex 32`)
- ? **Unique per environment** (different for dev/staging/production)
- ? **Never committed to git** (already in `.gitignore`)
- ? **Rotate periodically** (every 3-6 months)

**Example:**
```bash
DELETION_TOKEN_PEPPER=8d2eaa7238c33056796c0b6f516c3961cceea56f9d41bbc8a8bb7dfc0fa8281d
```

### DOMAIN (Optional)

**What it is:** Your domain name for SSL/TLS certificates.

**When to use:** Only needed for production deployments with a custom domain.

**Example:**
```bash
DOMAIN=paste.example.com
```

### LETSENCRYPT_EMAIL (Optional)

**What it is:** Email address for Let's Encrypt certificate notifications.

**When to use:** Only needed if you're using automatic SSL with Let's Encrypt.

**Example:**
```bash
LETSENCRYPT_EMAIL=admin@example.com
```

## Environment-Specific Configuration

### Local Development

```bash
# .env for local development
DELETION_TOKEN_PEPPER=dev-pepper-$(openssl rand -hex 16)
```

You can use a shorter pepper for development, but still make it random!

### Production/VPS

```bash
# .env for production
DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)
DOMAIN=paste.yourdomain.com
LETSENCRYPT_EMAIL=you@yourdomain.com
```

Use the full 64-character pepper and configure your domain for SSL.

## Security Best Practices

### ? DO:
- Use the interactive setup wizard for first-time setup
- Generate secrets using `openssl rand -hex 32`
- Use different secrets for each environment (dev, staging, prod)
- Store production secrets in a password manager
- Rotate secrets periodically (every 3-6 months)
- Check `.gitignore` includes `.env`

### ? DON'T:
- Never commit `.env` to version control
- Never use weak passwords or predictable patterns
- Never reuse secrets across environments
- Never share secrets in plain text (Slack, email, etc.)
- Never use the example values from `.env.example`

## Troubleshooting

### "DELETION_TOKEN_PEPPER not set"

**Problem:** Docker container can't find the environment variable.

**Solution:**
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify it contains the pepper
cat .env | grep DELETION_TOKEN_PEPPER

# 3. Restart services to pick up changes
docker-compose down
docker-compose up -d
```

### "Secret is too short"

**Problem:** Your pepper is less than 32 characters.

**Solution:**
```bash
# Generate a proper 64-character secret
echo "DELETION_TOKEN_PEPPER=$(openssl rand -hex 32)" > .env

# Then add other configs as needed
echo "DOMAIN=your.domain.com" >> .env
```

### "Permission denied: ./scripts/setup.sh"

**Problem:** Script is not executable.

**Solution:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

## Example Setup Sessions

### Example 1: Local Development (Quick)

```bash
$ ./scripts/setup.sh

Choose environment: 1 (Local Development)
Use generated pepper? yes
Start services now? yes

? Done! Access at http://localhost:8080
```

### Example 2: Production (Full Configuration)

```bash
$ ./scripts/setup.sh

Choose environment: 2 (Production/VPS)
Use generated pepper? yes
Domain: paste.example.com
Email: admin@example.com
Start services now? yes

? Done! Access at https://paste.example.com
```

### Example 3: Headless Server

```bash
$ HEADLESS=1 ./scripts/setup.sh

# Same prompts, but skips browser opening
# Perfect for SSH sessions and CI/CD
```

## FAQ

**Q: Can I see my pepper after it's set?**
A: Yes, it's in your `.env` file: `cat .env`

**Q: What happens if I lose my pepper?**
A: Users won't be able to delete their pastes with their deletion tokens. You'll need to rotate it and inform users.

**Q: Can I change my pepper later?**
A: Yes, but existing deletion tokens won't work. Best to rotate during maintenance windows.

**Q: Do I need different peppers for dev and prod?**
A: YES! Always use different secrets per environment.

**Q: How do I rotate my pepper?**
A:
```bash
# 1. Generate new pepper
NEW_PEPPER=$(openssl rand -hex 32)

# 2. Update .env
sed -i "s/DELETION_TOKEN_PEPPER=.*/DELETION_TOKEN_PEPPER=$NEW_PEPPER/" .env

# 3. Restart services
docker-compose restart
```

**Q: Is the setup wizard secure?**
A: Yes! It uses `openssl rand` for cryptographic randomness and never logs secrets.

## Need Help?

- ?? Read the [README.md](README.md) for general documentation
- ?? Check [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for security guidelines
- ?? See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) for production deployment
- ?? Open an issue on GitHub for bugs or questions

---

**Happy pasting! ??** Remember: Your secrets are what keep your users' data safe. Treat them with care!
