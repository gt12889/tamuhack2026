#!/bin/bash
# Automated deployment script for Vultr server
# Run this from your local machine

set -e

# Server details
SERVER_IP="45.76.254.240"
SERVER_USER="root"
SERVER_PASS="#S3fxT2-u%D{az,M"
APP_DIR="/opt/voice-concierge"

echo "🚀 Starting automated deployment to Vultr..."

# Check if sshpass is installed (for password authentication)
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installing sshpass for automated SSH..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo "⚠️  Please install sshpass manually, or use SSH keys"
        exit 1
    fi
fi

# Function to run remote commands
run_remote() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Function to copy files
copy_file() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo "📡 Connecting to server..."

# Step 1: Update system and install dependencies
echo "🔧 Installing dependencies..."
run_remote "apt update && apt upgrade -y && apt install -y curl wget git vim ufw"

# Install Docker
echo "🐳 Installing Docker..."
run_remote "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh"

# Install Docker Compose
echo "📦 Installing Docker Compose..."
run_remote "apt install -y docker-compose-plugin"

# Install Nginx
echo "🌐 Installing Nginx..."
run_remote "apt install -y nginx certbot python3-certbot-nginx"

# Step 2: Create app directory
echo "📁 Creating app directory..."
run_remote "mkdir -p $APP_DIR"

# Step 3: Clone repository (you'll need to update this with your actual repo URL)
echo "📥 Cloning repository..."
# Get the git remote URL
GIT_REPO=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$GIT_REPO" ]; then
    echo "⚠️  Could not detect Git remote. Please update the script with your repo URL."
    echo "   Or manually copy files to the server."
else
    run_remote "cd $APP_DIR && git clone $GIT_REPO . || (cd $APP_DIR && git pull)"
fi

# Step 4: Copy deployment files
echo "📋 Copying configuration files..."
copy_file "docker-compose.prod.yml" "$APP_DIR/"
copy_file "deploy.sh" "$APP_DIR/"
copy_file "nginx.conf.example" "$APP_DIR/"

# Step 5: Set up environment files (user needs to fill these)
echo "⚙️  Setting up environment files..."
echo "⚠️  NOTE: You need to manually create backend/.env and frontend/.env.production on the server"
echo "   Run these commands after deployment:"
echo "   ssh root@$SERVER_IP"
echo "   cd $APP_DIR"
echo "   nano backend/.env"
echo "   nano frontend/.env.production"

# Step 6: Configure Nginx
echo "🌐 Configuring Nginx..."
run_remote "cp $APP_DIR/nginx.conf.example /etc/nginx/sites-available/voice-concierge && \
            sed -i 's/yourdomain.com/$SERVER_IP/g' /etc/nginx/sites-available/voice-concierge && \
            ln -sf /etc/nginx/sites-available/voice-concierge /etc/nginx/sites-enabled/ && \
            rm -f /etc/nginx/sites-enabled/default && \
            nginx -t && systemctl enable nginx && systemctl restart nginx"

# Step 7: Configure firewall
echo "🔥 Configuring firewall..."
run_remote "ufw --force enable && ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp"

# Step 8: Make deploy script executable
run_remote "chmod +x $APP_DIR/deploy.sh"

echo ""
echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. SSH into server: ssh root@$SERVER_IP"
echo "2. Create backend/.env file with your API keys"
echo "3. Create frontend/.env.production file"
echo "4. Run: cd $APP_DIR && ./deploy.sh"
echo ""
echo "🔑 Server password: $SERVER_PASS"
echo "🌐 Server IP: $SERVER_IP"
