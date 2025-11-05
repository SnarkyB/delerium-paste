# Automatic Deployment Setup

This guide explains how to set up automatic deployments to your VPS using GitHub Actions.

## Overview

Every time you push to the `main` branch, GitHub Actions will:
1. ? Run linter, type checks, and unit tests
2. ?? Build the client
3. ?? Deploy to your VPS automatically
4. ?? Run health checks to verify deployment

## Setup Instructions

### 1. Generate SSH Key for GitHub Actions

On your **local machine**, generate a dedicated SSH key for deployments:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates two files:
- `~/.ssh/github_actions_deploy` (private key)
- `~/.ssh/github_actions_deploy.pub` (public key)

### 2. Add Public Key to VPS

Copy the public key to your VPS:

```bash
# Copy the public key
cat ~/.ssh/github_actions_deploy.pub

# SSH into your VPS
ssh noob@your-vps-ip

# Add the key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Add Secrets to GitHub

Go to your GitHub repository:
1. Navigate to **Settings** ? **Secrets and variables** ? **Actions**
2. Click **New repository secret**
3. Add these three secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `your-vps-ip-or-domain` | Your VPS IP address or domain |
| `VPS_USER` | `noob` | Your VPS username |
| `VPS_SSH_KEY` | Contents of `~/.ssh/github_actions_deploy` | The **private** SSH key |

To get the private key contents:
```bash
cat ~/.ssh/github_actions_deploy
```

Copy the **entire output** including the `-----BEGIN` and `-----END` lines.

### 4. Test the Deployment

#### Option A: Manual Trigger
1. Go to **Actions** tab in GitHub
2. Select **Deploy to VPS** workflow
3. Click **Run workflow** ? **Run workflow**

#### Option B: Push to Main
```bash
git checkout main
git merge ux  # or whatever branch you want to deploy
git push origin main
```

The workflow will automatically trigger!

### 5. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the deployment progress in real-time

## Workflow Steps

### Test Job
- Installs dependencies
- Runs ESLint
- Runs TypeScript type checking
- Runs unit tests (174 tests)
- Builds the client

### Deploy Job (only runs if tests pass)
- SSHs into your VPS
- Pulls latest code from GitHub
- Builds the client on VPS
- Stops old Docker containers
- Cleans up old images
- Builds and starts new containers
- Runs health checks

## Troubleshooting

### Deployment Fails with "Permission denied"
- Make sure the SSH key is added to `~/.ssh/authorized_keys` on the VPS
- Check that the private key is correctly added to GitHub secrets

### Deployment Fails with "Port already allocated"
SSH into your VPS and clean up:
```bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker system prune -af
```

### Tests Fail
Check the Actions tab to see which test failed:
- Linter errors: Run `npm run lint:fix` locally
- Type errors: Run `npm run typecheck` locally
- Unit tests: Run `npm run test:unit` locally

### View VPS Logs
```bash
ssh noob@your-vps-ip
cd ~/delerium-paste
docker compose -f docker-compose.prod.yml logs -f
```

## Manual Deployment (Fallback)

If you need to deploy manually, you can still use:
```bash
./push-to-vps.sh
```

## Security Notes

- ? The SSH key is dedicated for deployments only
- ? GitHub Secrets are encrypted and never exposed in logs
- ? The workflow only deploys on push to `main` branch
- ? Tests must pass before deployment happens
- ? Health checks verify successful deployment

## Disabling Auto-Deployment

To temporarily disable auto-deployment:
1. Go to **Settings** ? **Actions** ? **General**
2. Under **Actions permissions**, select **Disable actions**

Or delete/rename the workflow file:
```bash
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
```
