# GitHub Setup Instructions

## Option 1: Using Personal Access Token (Recommended)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name like "RFP Management System"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   # When prompted:
   # Username: bansalbhunesh
   # Password: <paste your personal access token>
   ```

## Option 2: Using SSH (More Secure)

1. **Generate SSH key (if you don't have one):**
   ```bash
   ssh-keygen -t ed25519 -C "bhuneshbansal20039888@gmail.com"
   # Press Enter to accept default location
   # Optionally set a passphrase
   ```

2. **Add SSH key to GitHub:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key and save

3. **Change remote to SSH:**
   ```bash
   git remote set-url origin git@github.com:bansalbhunesh/rfp-management-system.git
   git push -u origin main
   ```

## Option 3: Install GitHub CLI

```bash
# Install GitHub CLI
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
# Follow the prompts

# Then push
git push -u origin main
```

