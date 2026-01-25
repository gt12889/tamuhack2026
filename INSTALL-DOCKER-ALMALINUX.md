# Install Docker on AlmaLinux (Vultr)

## Method 1: Install Docker Engine (Recommended)

```bash
# Install required packages
dnf install -y dnf-plugins-core

# Add Docker repository
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker Engine
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version
```

---

## Method 2: Install from EPEL (Alternative)

```bash
# Install EPEL repository
dnf install -y epel-release

# Install Docker from EPEL
dnf install -y docker

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose separately
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

## Method 3: Podman (AlmaLinux Native Alternative)

AlmaLinux comes with Podman which is Docker-compatible:

```bash
# Install Podman and Podman Compose
dnf install -y podman podman-compose

# Start Podman service
systemctl enable podman
systemctl start podman

# Use podman-compose instead of docker-compose
podman-compose -f docker-compose.prod.yml up -d
```

**Note:** If using Podman, you'll need to use `podman` and `podman-compose` instead of `docker` and `docker compose`.

---

## Recommended: Method 1 (Docker Engine)

Run these commands:

```bash
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

Then deploy:

```bash
cd /opt/voice-concierge
./deploy.sh
```
