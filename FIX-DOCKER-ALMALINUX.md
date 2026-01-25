# Fix Docker Installation on AlmaLinux

## Solution: Install Docker Engine with Dependencies

The issue is missing dependencies. Let's install them properly:

```bash
# Update system first
dnf update -y

# Install required dependencies
dnf install -y dnf-plugins-core yum-utils

# Add Docker repository
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install container-selinux (required dependency)
dnf install -y container-selinux

# Install Docker Engine and dependencies
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing

# Start Docker
systemctl enable docker
systemctl start docker

# Verify
docker --version
docker compose version
```

---

## Alternative: Install runc first, then Podman

If you want to use Podman instead:

```bash
# Install runc first
dnf install -y runc

# Then install podman
dnf install -y podman podman-compose --allowerasing

# Start podman
systemctl enable podman
systemctl start podman
```

---

## Recommended: Clean Docker Installation

Try this step-by-step:

```bash
# 1. Clean any previous attempts
dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine podman

# 2. Update system
dnf update -y

# 3. Install prerequisites
dnf install -y dnf-plugins-core yum-utils device-mapper-persistent-data lvm2

# 4. Add Docker repo
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 5. Install container-selinux
dnf install -y container-selinux

# 6. Install Docker
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 7. Start Docker
systemctl enable docker
systemctl start docker

# 8. Verify
docker --version
docker compose version
docker run hello-world
```

---

## If Still Having Issues: Use Podman with runc

```bash
# Install runc explicitly
dnf install -y runc

# Install podman
dnf install -y podman podman-compose --allowerasing

# Start podman
systemctl enable podman
systemctl start podman

# Test
podman --version
podman-compose --version
```

Then use `podman-compose` instead of `docker compose` in your deploy script.
