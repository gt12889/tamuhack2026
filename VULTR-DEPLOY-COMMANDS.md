# Vultr Deployment Commands
**Run these commands to deploy your app**

## Server Information
- **IP:** 45.76.254.240
- **User:** root
- **Password:** #S3fxT2-u%D{az,M
- **Location:** Atlanta

---

## Step 1: SSH into Server

```bash
ssh root@45.76.254.240
# Enter password when prompted: #S3fxT2-u%D{az,M
```

---

## Step 2: Initial Server Setup (Run Once)

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim ufw htop

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install -y docker-compose-plugin

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Configure firewall
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

---

## Step 3: Clone Repository

```bash
# Create app directory
mkdir -p /opt/voice-concierge
cd /opt/voice-concierge

# Clone your repository
git clone https://github.com/gt12889/tamuhack2026.git .

# Or if already cloned, just pull
git pull origin main
```

---

## Step 4: Create Environment Files

### Create backend/.env:

```bash
cd /opt/voice-concierge/backend
nano .env
```

Paste this (then edit with your API keys):

```bash
# Django Settings
DEBUG=False
DJANGO_SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_HOSTS=45.76.254.240,localhost,127.0.0.1
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

# Database (SQLite for quick setup)
# For PostgreSQL later, add:
# POSTGRES_DB_HOST=your-db-host.vultrdb.com
# POSTGRES_DB_NAME=defaultdb
# POSTGRES_DB_USER=vultradmin
# POSTGRES_DB_PASSWORD=your-password
# POSTGRES_DB_PORT=5432

# API Keys - REPLACE WITH YOUR ACTUAL KEYS!
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_API_KEY_HERE
RETELL_API_KEY=

# CORS
CORS_ALLOWED_ORIGINS=http://45.76.254.240,http://localhost:3000
```

**To generate secret key:**
```bash
openssl rand -hex 32
```

### Create frontend/.env.production:

```bash
cd /opt/voice-concierge/frontend
nano .env.production
```

Paste this:

```bash
NEXT_PUBLIC_API_URL=http://45.76.254.240
```

---

## Step 5: Configure Nginx

```bash
cd /opt/voice-concierge

# Copy and configure Nginx
cp nginx.conf.example /etc/nginx/sites-available/voice-concierge

# Edit for IP-only setup (no domain)
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
    
    # Frontend
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
    
    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/voice-concierge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx
```

---

## Step 6: Deploy Application

```bash
cd /opt/voice-concierge

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or manually:**

```bash
cd /opt/voice-concierge

# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

## Step 7: Verify Deployment

```bash
# Check if services are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test backend health
curl http://localhost:8000/api/health/

# Test frontend
curl http://localhost:3000
```

**Visit in browser:** http://45.76.254.240

---

## Quick Commands Reference

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Update and redeploy
cd /opt/voice-concierge
git pull
./deploy.sh

# Check resource usage
htop
docker stats
```

---

## Troubleshooting

### Backend not starting:
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml exec backend python manage.py check
```

### Frontend not loading:
```bash
docker compose -f docker-compose.prod.yml logs frontend
# Check if NEXT_PUBLIC_API_URL is correct in frontend/.env.production
```

### Nginx errors:
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Can't connect to server:
- Check firewall: `ufw status`
- Verify IP: `curl ifconfig.me` (should show 45.76.254.240)

---

## Next Steps After Deployment

1. **Add your API keys** to `backend/.env`:
   - Get Gemini key: https://aistudio.google.com/app/apikey
   - Get ElevenLabs key: https://elevenlabs.io/app/settings/api-keys

2. **Test the app**: Visit http://45.76.254.240

3. **Set up domain** (optional):
   - Point domain A record to 45.76.254.240
   - Run: `certbot --nginx -d yourdomain.com`
   - Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

4. **Set up PostgreSQL** (optional, for production):
   - Create Vultr Managed PostgreSQL
   - Update `backend/.env` with database credentials

---

**Your app should now be live at: http://45.76.254.240** 🚀
