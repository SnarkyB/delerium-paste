# Setting Up Verified Commits

This guide will help you set up GPG commit signing so your commits show as "Verified" on GitHub.

## Prerequisites

- GPG installed (already installed on macOS via Homebrew)
- Git configured with your name and email
- GitHub account

## Step 1: Check for Existing GPG Keys

First, check if you already have GPG keys:

```bash
gpg --list-secret-keys --keyid-format=long
```

If you see keys listed, you can skip to Step 3. Otherwise, continue to Step 2.

## Step 2: Generate a New GPG Key

Generate a new GPG key (use your GitHub email address):

```bash
gpg --full-generate-key
```

Follow the prompts:
1. **Kind of key**: Select `(1) RSA and RSA` (default)
2. **Key size**: `4096` bits (recommended)
3. **Expiration**: Choose an expiration date (e.g., `1y` for 1 year, or `0` for no expiration)
4. **Name**: Your full name
5. **Email**: Your GitHub email address (must match your GitHub account email)
6. **Comment**: Optional (can leave blank)
7. **Passphrase**: Enter a strong passphrase (you'll need this when signing commits)

## Step 3: List Your GPG Keys

List your keys to find the key ID:

```bash
gpg --list-secret-keys --keyid-format=long
```

Look for a line like:
```
sec   rsa4096/3AA5C34371567BD2 2023-01-01 [SC]
```

The part after the `/` (e.g., `3AA5C34371567BD2`) is your key ID. Copy this.

## Step 4: Configure Git to Use Your GPG Key

Tell Git to use your GPG key for signing (replace `YOUR_KEY_ID` with your actual key ID):

```bash
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
```

To sign commits only for this repository (not globally):

```bash
git config user.signingkey YOUR_KEY_ID
git config commit.gpgsign true
```

## Step 5: Add Your GPG Key to GitHub

### 5a. Export Your Public Key

Export your public key in ASCII format:

```bash
gpg --armor --export YOUR_KEY_ID
```

This will output your public key. Copy the entire output, including:
- `-----BEGIN PGP PUBLIC KEY BLOCK-----`
- The key content
- `-----END PGP PUBLIC KEY BLOCK-----`

### 5b. Add Key to GitHub

1. Go to GitHub → Settings → SSH and GPG keys
   - Direct link: https://github.com/settings/keys
2. Click "New GPG key"
3. Paste your public key
4. Click "Add GPG key"

## Step 6: Test Your Setup

Create a test commit to verify everything works:

```bash
# Make a small change (or use an existing change)
echo "# Test" >> test-signing.md
git add test-signing.md
git commit -m "test: verify GPG signing"

# Check if the commit is signed
git log --show-signature -1
```

You should see:
- `gpg: Good signature from "Your Name <your.email@example.com>"`
- `gpg: Signature made...`

Then push and check on GitHub - your commit should show a "Verified" badge.

## Step 7: Clean Up Test File

Remove the test file:

```bash
git rm test-signing.md
git commit -m "chore: remove test signing file"
```

## Troubleshooting

### "gpg: signing failed: Inappropriate ioctl for device"

This happens when GPG can't prompt for your passphrase. Fix it by:

```bash
export GPG_TTY=$(tty)
```

Add this to your `~/.zshrc` (or `~/.bashrc` if using bash):

```bash
export GPG_TTY=$(tty)
```

Then reload your shell:
```bash
source ~/.zshrc
```

### "gpg: signing failed: No secret key"

Make sure you've:
1. Set the correct key ID: `git config --global user.signingkey YOUR_KEY_ID`
2. Used the correct email that matches your GitHub account

### Commit Not Showing as Verified on GitHub

1. Verify your email matches: Check `git config user.email` matches your GitHub email
2. Make sure you added the GPG key to GitHub (Step 5)
3. Check that the key wasn't revoked or expired

### View Your Git Configuration

Check your current Git signing configuration:

```bash
git config --list | grep -E "(signingkey|gpgsign|user\.)"
```

## Optional: Sign Tags

To also sign Git tags:

```bash
git config --global tag.gpgsign true
```

## Additional Resources

- [GitHub: About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)
- [Git: Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
