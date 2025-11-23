# 🚀 Delirium Has Moved to Multi-Repository Architecture!

**Date:** 2025-11-16  
**Status:** ✅ Migration Complete

---

## 🎉 What Happened?

Delirium has successfully migrated from a single monorepo to a modern multi-repository architecture! This improves development speed, code organization, and contribution workflows.

---

## 📦 New Repository Structure

The project is now split across **four focused repositories**:

### 1. 🎨 [delerium-client](https://github.com/marcusb333/delerium-client)
**Frontend TypeScript Application**

- Client-side encryption (AES-256-GCM)
- Comprehensive test suite
- Independent CI/CD pipeline

```bash
git clone https://github.com/marcusb333/delerium-client.git
cd delerium-client
npm install && npm run build
```

### 2. ⚡ [delerium-server](https://github.com/marcusb333/delerium-server)
**Backend Kotlin/Ktor API**

- REST API for paste operations
- Proof-of-work protection
- Docker image publishing

```bash
git clone https://github.com/marcusb333/delerium-server.git
cd delerium-server
./gradlew run
```

### 3. 🐳 [delerium-infrastructure](https://github.com/marcusb333/delerium-infrastructure)
**Deployment & Orchestration**

- Docker Compose configurations
- Automated setup scripts
- Integration tests

```bash
git clone https://github.com/marcusb333/delerium-infrastructure.git
cd delerium-infrastructure
./scripts/setup.sh
```

### 4. 📚 [delerium](https://github.com/marcusb333/delerium)
**Documentation Hub**

- Architecture documentation
- Migration guides
- Project overview

```bash
git clone https://github.com/marcusb333/delerium.git
```

---

## 🚀 Quick Start (New Users)

**Easiest way to get started:**

```bash
# Clone infrastructure repository
git clone https://github.com/marcusb333/delerium-infrastructure.git
cd delerium-infrastructure

# Run automated setup
./scripts/setup.sh

# Access at http://localhost:8080
```

---

## 📖 For Existing Users

### If You Had This Monorepo Cloned:

**Your existing clone is still valid!** But for future updates:

1. **For deployment**, use the new infrastructure repository:
   ```bash
   git clone https://github.com/marcusb333/delerium-infrastructure.git
   ```

2. **For development**, clone only what you need:
   - Working on frontend → clone `delerium-client`
   - Working on backend → clone `delerium-server`
   - Working on deployment → clone `delerium-infrastructure`

### Data Migration:

**No action needed!** Your existing pastes and data are fully compatible. The database format and encryption are unchanged.

---

## ✨ Benefits of Multi-Repo

- ✅ **Faster CI/CD** - Only test what changed (2x faster builds!)
- ✅ **Independent Releases** - Deploy client and server separately
- ✅ **Clearer Ownership** - Focused repositories with specific maintainers
- ✅ **Easier Onboarding** - Clone only what you need
- ✅ **Better PRs** - Smaller, more focused changes

---

## 📚 Documentation

- **Project Overview:** https://github.com/marcusb333/delerium
- **Migration Guide:** https://github.com/marcusb333/delerium/blob/main/docs/MIGRATION_GUIDE.md
- **Architecture Docs:** https://github.com/marcusb333/delerium/tree/main/docs/architecture

---

## 🤝 Contributing

Each repository has its own contribution guidelines:

- [Client Contributing](https://github.com/marcusb333/delerium-client/blob/main/CONTRIBUTING.md)
- [Server Contributing](https://github.com/marcusb333/delerium-server/blob/main/CONTRIBUTING.md)
- [Infrastructure Contributing](https://github.com/marcusb333/delerium-infrastructure/blob/main/CONTRIBUTING.md)

**Choose the repository that matches what you want to work on!**

---

## ❓ FAQ

### Q: Will my existing pastes still work?

**A:** Yes! 100% compatible. The database format and encryption are unchanged.

### Q: Do I need to change my deployment?

**A:** Not immediately. But we recommend migrating to the new infrastructure repository for easier updates.

### Q: What happens to this monorepo?

**A:** This repository is now **archived (read-only)**. All active development happens in the new repositories.

### Q: Where do I report bugs now?

**A:** Report bugs in the appropriate repository:
- UI bugs → [delerium-client issues](https://github.com/marcusb333/delerium-client/issues)
- API bugs → [delerium-server issues](https://github.com/marcusb333/delerium-server/issues)
- Deployment bugs → [delerium-infrastructure issues](https://github.com/marcusb333/delerium-infrastructure/issues)

---

## 🔗 Important Links

- **Main Hub:** https://github.com/marcusb333/delerium
- **Client:** https://github.com/marcusb333/delerium-client
- **Server:** https://github.com/marcusb333/delerium-server
- **Infrastructure:** https://github.com/marcusb333/delerium-infrastructure

---

## 🎊 Thank You!

Thank you for being part of the Delirium community! This migration sets us up for faster development, better organization, and an improved contributor experience.

**Questions?** Open a discussion in the [main repository](https://github.com/marcusb333/delerium/discussions).

---

**HACK THE PLANET! 🌍**

*This monorepo is now archived. See the new repositories above.*
