# Deployment Guide - Elder Strolls

## Recommended Deployment Stack

### Option 1: Vultr (Recommended for Hackathon)
**Best for:** Quick deployment, hackathon demo, cost-effective

#### Architecture
```
┌─────────────────────────────────────────────────┐
│              Vultr Cloud Instance               │
│  ┌──────────────┐         ┌──────────────┐     │
│  │   Nginx      │────────▶│   Frontend   │     │
│  │ (Port 80/443)│         │  (Next.js)   │     │
│  └──────┬───────┘         └──────────────┘     │
│         │                                       │
│         ▼                                       │
│  ┌──────────────┐         ┌──────────────┐     │
│  │   Backend    │────────▶│  PostgreSQL  │     │
│  │  (Django)    │         │  (Managed)   │     │
│  └──────────────┘         └──────────────┘     │
└─────────────────────────────────────────────────┘
```

#### Components
- **Vultr Compute Instance**: 2GB RAM, 1 vCPU (minimum) - $12/month
- **Vultr Managed PostgreSQL**: 1GB RAM - $15/month
- **Nginx**: Reverse proxy and static file serving
- **Gunicorn**: Production WSGI server for Django
- **Docker Compose**: Orchestration (optional, or native install)
- **Let's Encrypt**: Free SSL certificates

#### Setup Steps

1. **Provision Vultr Resources**
   ```bash
   # Create compute instance (Ubuntu 22.04 LTS)
   # Create managed PostgreSQL database
   # Note connection details
   ```

2. **Server Setup**
   ```bash
   # SSH into instance
   ssh root@your-vultr-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Docker & Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose-plugin -y
   
   # Install Nginx
   apt install nginx -y
   
   # Install Certbot for SSL
   apt install certbot python3-certbot-nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url> /opt/voice-concierge
   cd /opt/voice-concierge
   
   # Create production .env files
   # backend/.env
   DEBUG=False
   DJANGO_SECRET_KEY=<generate-secure-key>
   ALLOWED_HOSTS=yourdomain.com,your-vultr-ip
   DATABASE_URL=postgresql://user:pass@db-host:5432/dbname
   GEMINI_API_KEY=<your-key>
   ELEVENLABS_API_KEY=<your-key>
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   
   # frontend/.env.production
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

4. **Update Dockerfiles for Production**

   **backend/Dockerfile.prod:**
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       postgresql-client \
       && rm -rf /var/lib/apt/lists/*
   
   # Install Python dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt gunicorn
   
   # Copy application
   COPY . .
   
   # Collect static files
   RUN python manage.py collectstatic --noinput
   
   # Run migrations and start Gunicorn
   CMD ["sh", "-c", "python manage.py migrate && gunicorn voice_concierge.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"]
   ```
   
   **frontend/Dockerfile.prod:**
   ```dockerfile
   FROM node:20-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

5. **Update next.config.js for standalone output**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
   }
   module.exports = nextConfig
   ```

6. **Create docker-compose.prod.yml**
   ```yaml
   version: '3.8'
   
   services:
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile.prod
       env_file:
         - ./backend/.env
       restart: unless-stopped
       networks:
         - app-network
     
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile.prod
       env_file:
         - ./frontend/.env.production
       restart: unless-stopped
       networks:
         - app-network
       depends_on:
         - backend
   
   networks:
     app-network:
       driver: bridge
   ```

7. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/voice-concierge
   upstream backend {
       server localhost:8000;
   }
   
   upstream frontend {
       server localhost:3000;
   }
   
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       # Frontend
       location / {
           proxy_pass http://frontend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
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
       
       # WebSocket support (for family helper)
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
   ```

8. **Enable Nginx and SSL**
   ```bash
   # Enable site
   ln -s /etc/nginx/sites-available/voice-concierge /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   
   # Get SSL certificate
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

9. **Start Services**
   ```bash
   cd /opt/voice-concierge
   docker compose -f docker-compose.prod.yml up -d
   ```

---

### Option 2: Vercel + Railway (Easiest)
**Best for:** Fastest deployment, minimal DevOps

#### Architecture
```
┌──────────────┐         ┌──────────────┐
│   Vercel     │────────▶│   Railway    │
│  (Frontend)  │         │  (Backend +  │
│  (Next.js)   │         │   Postgres)  │
└──────────────┘         └──────────────┘
```

#### Setup
1. **Frontend on Vercel**
   - Connect GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`

2. **Backend on Railway**
   - Connect GitHub repo (backend folder)
   - Add PostgreSQL service
   - Set environment variables
   - Deploy automatically

**Pros:** Zero server management, auto-scaling, free tiers available  
**Cons:** Less control, potential vendor lock-in

---

### Option 3: AWS/GCP/Azure (Enterprise)
**Best for:** Production scale, enterprise requirements

#### AWS Stack
- **EC2**: Application servers (or ECS/EKS for containers)
- **RDS PostgreSQL**: Managed database
- **Elastic Beanstalk**: Simplified deployment (optional)
- **CloudFront + S3**: Static assets
- **ALB**: Load balancer
- **Route 53**: DNS
- **ACM**: SSL certificates

#### GCP Stack
- **Cloud Run**: Serverless containers
- **Cloud SQL**: Managed PostgreSQL
- **Cloud Load Balancing**: Traffic distribution
- **Cloud CDN**: Static content

---

## Production Checklist

### Security
- [ ] Set `DEBUG=False` in Django
- [ ] Generate strong `DJANGO_SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for frontend domain
- [ ] Set up firewall rules (only 80, 443 open)
- [ ] Regular security updates

### Performance
- [ ] Enable Gunicorn with multiple workers
- [ ] Configure Nginx caching
- [ ] Enable Next.js production build
- [ ] Set up database connection pooling
- [ ] Configure static file serving
- [ ] Enable gzip compression

### Monitoring
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Monitor API response times
- [ ] Database query monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up alerts for downtime

### Backup
- [ ] Automated database backups
- [ ] Environment variable backup
- [ ] Disaster recovery plan

---

## Environment Variables Reference

### Backend (.env)
```bash
DEBUG=False
DJANGO_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GEMINI_API_KEY=<your-key>
ELEVENLABS_API_KEY=<your-key>
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Quick Deploy Script

Save as `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Elder Strolls..."

# Pull latest code
git pull origin main

# Build and restart services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Reload Nginx
systemctl reload nginx

echo "✅ Deployment complete!"
```

Make executable: `chmod +x deploy.sh`

---

## Cost Estimate (Vultr Option)

- **Compute Instance** (2GB RAM): $12/month
- **Managed PostgreSQL** (1GB): $15/month
- **Domain** (optional): $10-15/year
- **Total**: ~$27/month

**Free Alternatives:**
- Railway: $5/month free tier
- Render: Free tier available
- Fly.io: Free tier available

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker compose logs backend

# Check database connection
docker compose exec backend python manage.py dbshell
```

### Frontend build fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf frontend/.next frontend/node_modules
npm install
```

### SSL certificate issues
```bash
# Renew certificate
certbot renew --dry-run

# Check Nginx config
nginx -t
```

---

## Next Steps

1. Choose deployment option
2. Set up domain (optional but recommended)
3. Configure environment variables
4. Deploy and test
5. Set up monitoring
6. Document for team
