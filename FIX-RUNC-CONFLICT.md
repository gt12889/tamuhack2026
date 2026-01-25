# Fix runc Conflict - Install Docker on AlmaLinux

## Solution: Remove conflicting runc and install Docker

The issue is that Docker's containerd.io includes its own runc, which conflicts with the system runc. We need to allow the replacement.

```bash
# Remove conflicting runc package
dnf remove -y runc

# Install Docker with --allowerasing to replace runc
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing

# Start Docker
systemctl enable docker
systemctl start docker

# Verify
docker --version
docker compose version
```

---

## Complete Installation Steps

```bash
# 1. Remove conflicting packages
dnf remove -y runc podman podman-compose 2>/dev/null || true

# 2. Install prerequisites
dnf install -y dnf-plugins-core yum-utils

# 3. Add Docker repository (if not already added)
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 4. Install Docker (this will replace runc with Docker's version)
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing

# 5. Start Docker
systemctl enable docker
systemctl start docker

# 6. Verify
docker --version
docker compose version
docker run hello-world
```

---

## One-Liner Solution

```bash
dnf remove -y runc && dnf install -y dnf-plugins-core yum-utils && dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo && dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing && systemctl enable docker && systemctl start docker && docker --version
```
