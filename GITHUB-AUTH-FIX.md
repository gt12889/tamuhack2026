# Fix GitHub Authentication for Vultr Deployment

## Problem
GitHub no longer supports password authentication. You need a Personal Access Token or SSH key.

---

## Solution 1: Use Personal Access Token (Easiest)

### Step 1: Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Vultr Deployment`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Use Token to Clone

On your Vultr server, use the token as the password:

```bash
cd /opt/voice-concierge
git clone https://github.com/gt12889/tamuhack2026.git .
# Username: gt12889
# Password: <paste your Personal Access Token here>
```

**Or use token directly in URL (one-liner):**

```bash
cd /opt/voice-concierge
git clone https://YOUR_TOKEN@github.com/gt12889/tamuhack2026.git .
```

Replace `YOUR_TOKEN` with your actual token.

---

## Solution 2: Use SSH Keys (More Secure)

### Step 1: Generate SSH Key on Vultr Server

```bash
ssh-keygen -t ed25519 -C "vultr-deployment"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

### Step 2: Copy Public Key

```bash
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```

### Step 3: Add Key to GitHub

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `Vultr Server`
4. Paste the public key
5. Click **"Add SSH key"**

### Step 4: Clone Using SSH

```bash
cd /opt/voice-concierge
git clone git@github.com:gt12889/tamuhack2026.git .
```

---

## Solution 3: Make Repository Public (If Possible)

If the repository doesn't need to be private:

1. Go to: https://github.com/gt12889/tamuhack2026/settings
2. Scroll to **"Danger Zone"**
3. Click **"Change visibility"** → **"Make public"**

Then clone without authentication:

```bash
cd /opt/voice-concierge
git clone https://github.com/gt12889/tamuhack2026.git .
```

---

## Quick Fix (Recommended for Now)

**Use Personal Access Token in the clone command:**

```bash
cd /opt/voice-concierge
# Replace YOUR_TOKEN with your actual GitHub Personal Access Token
git clone https://YOUR_TOKEN@github.com/gt12889/tamuhack2026.git .
```

**Or set it as an environment variable:**

```bash
export GITHUB_TOKEN=your_token_here
git clone https://${GITHUB_TOKEN}@github.com/gt12889/tamuhack2026.git .
```

---

## Alternative: Upload Files Manually

If you can't get authentication working, you can upload files via SCP:

**From your local machine (Windows PowerShell):**

```powershell
# Install SCP (if not available, use WinSCP or FileZilla)
# Or use Git Bash which includes SCP

# Upload entire project
scp -r "C:\Program Files\Misc\APCS\gitrepos\tamuhack2026\*" root@45.76.254.240:/opt/voice-concierge/
```

---

## Recommended: Use Personal Access Token

**Fastest solution for hackathon:**

1. Create token: https://github.com/settings/tokens
2. Copy token
3. On Vultr server:
   ```bash
   cd /opt/voice-concierge
   git clone https://YOUR_TOKEN@github.com/gt12889/tamuhack2026.git .
   ```

Done! 🚀
