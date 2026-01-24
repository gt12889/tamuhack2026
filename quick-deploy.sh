#!/bin/bash
# Quick deployment script - Run this ON THE VULTR SERVER
# After SSH: ssh root@45.76.254.240

set -e

APP_DIR="/opt/voice-concierge"
GIT_REPO="https://github.com/gt12889/tamuhack2026.git"

echo "🚀 Quick Deploy to Vultr Server"
echo "================================"

# Step 1: Initial setup (only if not done)
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt update && apt install -y docker-compose-plugin
fi

if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing Nginx..."
    apt update && apt install -y nginx certbot python3-certbot-nginx
fi

# Step 2: Clone or update repository
echo "📥 Setting up repository..."
mkdir -p $APP_DIR
cd $APP_DIR

if [ -d ".git" ]; then
    echo "   Updating existing repository..."
    git pull origin main || true
else
    echo "   Cloning repository..."
    git clone $GIT_REPO .
fi

# Step 3: Create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating backend/.env..."
    SECRET_KEY=$(openssl rand -hex 32)
    cat > backend/.env << EOF
DEBUG=False
DJANGO_SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=45.76.254.240,localhost,127.0.0.1
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_API_KEY_HERE
RETELL_API_KEY=
CORS_ALLOWED_ORIGINS=http://45.76.254.240,http://localhost:3000
EOF
    echo "   ⚠️  Please edit backend/.env and add your API keys!"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "⚙️  Creating frontend/.env.production..."
    echo "NEXT_PUBLIC_API_URL=http://45.76.254.240" > frontend/.env.production
fi

# Step 4: Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/voice-concierge << 'EOF'
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name 45.76.254.240;
    
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/voice-concierge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Step 5: Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Step 6: Deploy
echo "🚀 Deploying application..."
cd $APP_DIR
chmod +x deploy.sh

# Check if .env files have real API keys
if grep -q "YOUR_GEMINI_API_KEY_HERE" backend/.env; then
    echo ""
    echo "⚠️  WARNING: You need to add your API keys to backend/.env"
    echo "   Run: nano backend/.env"
    echo "   Then run: ./deploy.sh"
else
    ./deploy.sh
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add API keys: nano backend/.env"
echo "2. Deploy: cd $APP_DIR && ./deploy.sh"
echo "3. Visit: http://45.76.254.240"
echo ""
