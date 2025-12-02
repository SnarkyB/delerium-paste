# Delirium Documentation

Welcome to the Delirium documentation! This index will help you find what you need.

## ?? Documentation Structure

### Getting Started

- **[Setup Guide](getting-started/SETUP.md)** - Configure secrets and get started locally
  - Interactive setup wizard
  - Manual configuration
  - Security best practices
  - Troubleshooting

### Deployment

- **[Deployment Guide](deployment/DEPLOYMENT.md)** - Deploy to production VPS
  - Quick deployment options
  - Manual deployment steps
  - SSL/TLS setup
  - Monitoring and backups
  - Troubleshooting

- **[SSL Setup Guide](deployment/SSL_SETUP.md)** - Detailed SSL/TLS configuration
  - Let's Encrypt setup
  - Certificate renewal
  - Nginx SSL configuration

- **[Multi-Architecture Deployment](deployment/multi-architecture.md)** - Build for multiple CPU architectures
  - AMD64 and ARM64 support
  - Local multi-arch builds
  - CI/CD integration
  - Platform-specific deployment
  - Troubleshooting

- **[Automated Deployment](AUTO_DEPLOYMENT.md)** - CI/CD with GitHub Actions
  - Setup instructions
  - Workflow configuration
  - Monitoring deployments

### Architecture

- **[C4 Architecture Diagrams](architecture/C4-DIAGRAMS.md)** - System architecture documentation
  - System context
  - Container diagrams
  - Component diagrams
  - Code structure

### Development

- **[PR Guide](prs/README.md)** - Pull request workflow and guidelines
  - PR series overview
  - Review process
  - Development workflow

- **[Testing Guide](../../client/tests/README.md)** - Testing documentation
  - Unit tests
  - Integration tests
  - E2E tests
  - Coverage requirements

### Contributing

- **[Cursor Migration Guide](../../CURSOR_MIGRATION.md)** - Migration to Cursor IDE
  - Workspace configuration
  - AI collaboration guidelines

- **[PR Review Guidelines](CURSOR-PR-REVIEW.md)** - Code review best practices

## ?? Quick Links

- **Main README**: [../README.md](random/README.md)
- **Security Checklist**: [security/CHECKLIST.md](security/CHECKLIST.md)
- **Changelog**: [archive/CHANGELOG.md](archive/CHANGELOG.md)

## ?? Documentation by Role

### For Users
- [Setup Guide](getting-started/SETUP.md) - Get started quickly

### For DevOps/Deployers
- [Deployment Guide](deployment/DEPLOYMENT.md) - Production deployment
- [SSL Setup Guide](deployment/SSL_SETUP.md) - SSL configuration
- [Multi-Architecture Deployment](deployment/multi-architecture.md) - Multi-arch builds
- [Automated Deployment](AUTO_DEPLOYMENT.md) - CI/CD setup

### For Developers
- [Architecture Diagrams](architecture/C4-DIAGRAMS.md) - System design
- [PR Guide](prs/README.md) - Contribution workflow
- [Testing Guide](../../client/tests/README.md) - Testing practices

### For Contributors
- [Cursor Migration Guide](../../CURSOR_MIGRATION.md) - IDE setup
- [PR Review Guidelines](CURSOR-PR-REVIEW.md) - Review process

## ?? Finding Documentation

### Need to...
- **Set up locally?** ? [Setup Guide](getting-started/SETUP.md)
- **Deploy to production?** ? [Deployment Guide](deployment/DEPLOYMENT.md)
- **Configure SSL?** ? [SSL Setup Guide](deployment/SSL_SETUP.md)
- **Build for ARM/AMD64?** ? [Multi-Architecture Guide](deployment/multi-architecture.md)
- **Understand the architecture?** ? [C4 Diagrams](architecture/C4-DIAGRAMS.md)
- **Contribute code?** ? [PR Guide](prs/README.md)
- **Set up CI/CD?** ? [Automated Deployment](AUTO_DEPLOYMENT.md)

## ?? Documentation Maintenance

This documentation is maintained alongside the codebase. When making changes:

1. Update relevant documentation files
2. Update this index if adding new sections
3. Keep links consistent and working
4. Add examples where helpful

## ?? Tips

- Use the search function in your editor to find specific topics
- Check the [main README](random/README.md) for project overview
- See [archive/CHANGELOG.md](archive/CHANGELOG.md) for recent changes

---

**Questions?** Open an issue on GitHub or check the relevant guide above.
