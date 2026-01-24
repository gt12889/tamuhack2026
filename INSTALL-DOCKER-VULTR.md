# Install Docker on Vultr Server

## Quick Install Commands

Run these commands on your Vultr server:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## After Installation

Once Docker is installed, you can deploy:

```bash
cd /opt/voice-concierge
./deploy.sh
```

Or manually:

```bash
cd /opt/voice-concierge
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

If you get permission errors:

```bash
# Add your user to docker group (if not root)
usermod -aG docker $USER
newgrp docker
```

For root user, this shouldn't be needed.
