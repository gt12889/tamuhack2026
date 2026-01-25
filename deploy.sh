#!/bin/bash
set -e

echo "🚀 Deploying Elder Strolls..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env not found. Please create it from .env.example${NC}"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  Warning: frontend/.env.production not found. Please create it.${NC}"
    exit 1
fi

# Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main || echo "Could not pull from git, continuing..."
fi

# Build and restart services
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Run migrations
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate || echo "Migration failed, but continuing..."

# Collect static files
echo "📦 Collecting static files..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput || echo "Static collection failed, but continuing..."

# Reload Nginx (if installed)
if command -v nginx &> /dev/null; then
    echo "🔄 Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx || echo "Nginx reload failed"
fi

# Show status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Service status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📝 View logs with: docker compose -f docker-compose.prod.yml logs -f"
