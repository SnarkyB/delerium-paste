# Quick Start After Merge

Welcome to the new decomposed Delerium architecture!

## 1. Where is everything?

The code has been moved to four focused repositories:

| Component | Repository | Description |
|-----------|------------|-------------|
| **Frontend** | `delerium-client` | TypeScript/React frontend |
| **Backend** | `delerium-server` | Kotlin/Ktor backend |
| **Infra** | `delerium-infrastructure` | Docker, K8s, Terraform |
| **Docs** | `delerium` | Documentation hub |

## 2. Getting Started

### Backend Development
```bash
git clone https://github.com/your-org/delerium-server
cd delerium-server
./gradlew run
```

### Frontend Development
```bash
git clone https://github.com/your-org/delerium-client
cd delerium-client
npm install
npm start
```

### Infrastructure
```bash
git clone https://github.com/your-org/delerium-infrastructure
cd delerium-infrastructure
docker-compose up -d
```

## 3. Common Tasks

- **Running Tests**: Run `npm test` or `./gradlew test` in the respective repo.
- **Deployment**: Push to `main` in the respective repo to trigger CI/CD.
- **Documentation**: Check `delerium` repo for architectural docs.

## 4. Troubleshooting

If you are missing files or history, please refer to the `MIGRATION_GUIDE.md` in the `delerium` repository.
