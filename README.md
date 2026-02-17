# Delirium

Zero-knowledge encrypted paste system. All encryption happens client-side; the server never sees plaintext or keys.

## Quick Deploy

```bash
./deploy.sh local                              # Local (http://localhost:8080)
./deploy.sh vps-setup example.com admin@example.com  # VPS + SSL
./deploy.sh production                         # Production
```

## Documentation

- [Setup](docs/getting-started/SETUP.md) - Configure secrets
- [Deployment](docs/deployment/DEPLOYMENT.md) - Full deployment guide
- [Architecture](docs/architecture/C4-DIAGRAMS.md) - System diagrams
- [Contributing](docs/prs/README.md) - PR workflow
- [Docs Index](docs/README.md) - Full documentation
