# VPS Deployment Example

Example: deploy to VPS `203.0.113.10` with domain `example.com`.

## 1. DNS

Add A record: `@` → `203.0.113.10`. Verify: `dig +short example.com`

## 2. Deploy

```bash
ssh deploy@203.0.113.10
git clone https://github.com/your-username/delerium-paste.git
cd delerium-paste
./deploy.sh vps-setup example.com admin@example.com
```

## 3. Verify

```bash
docker compose -f docker-compose.prod.yml ps
curl -I https://example.com
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full guide.
