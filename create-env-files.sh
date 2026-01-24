#!/bin/bash
# Script to create .env files on Vultr server
# Run this on the server after cloning the repo

set -e

APP_DIR="/opt/voice-concierge"
cd $APP_DIR

echo "⚙️  Creating environment files..."

# Generate Django secret key
SECRET_KEY=$(openssl rand -hex 32)

# Create backend/.env
echo "📝 Creating backend/.env..."
cat > backend/.env << EOF
# Django Settings
DEBUG=False
DJANGO_SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=45.76.254.240,localhost,127.0.0.1
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

# Database (using SQLite for quick setup - change to PostgreSQL later)
# For PostgreSQL, uncomment and fill:
# POSTGRES_DB_HOST=your-db-host.vultrdb.com
# POSTGRES_DB_NAME=defaultdb
# POSTGRES_DB_USER=vultradmin
# POSTGRES_DB_PASSWORD=your-password
# POSTGRES_DB_PORT=5432

# API Keys - FILL THESE IN!
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_API_KEY_HERE
RETELL_API_KEY=

# CORS
CORS_ALLOWED_ORIGINS=http://45.76.254.240,http://localhost:3000
EOF

# Create frontend/.env.production
echo "📝 Creating frontend/.env.production..."
cat > frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=http://45.76.254.240
EOF

echo ""
echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: Edit backend/.env and add your API keys:"
echo "   nano backend/.env"
echo ""
echo "   Required:"
echo "   - GEMINI_API_KEY (get from https://aistudio.google.com/app/apikey)"
echo "   - ELEVENLABS_API_KEY (get from https://elevenlabs.io/app/settings/api-keys)"
echo ""
echo "🔑 Django Secret Key generated: $SECRET_KEY"
