#!/bin/bash
# Run this script ON THE VULTR SERVER (via SSH)
# This sets up the server environment

set -e

APP_DIR="/opt/voice-concierge"

echo "🚀 Setting up Vultr server for AA Voice Concierge..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
apt install -y curl wget git vim ufw htop

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
apt install -y docker-compose-plugin

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx certbot python3-certbot-nginx

# Create app directory
echo "📁 Creating app directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

echo ""
echo "✅ Server setup complete!"
echo ""
echo "📝 Next: Clone your repository and configure environment variables"
echo "   cd $APP_DIR"
echo "   git clone <your-repo-url> ."
