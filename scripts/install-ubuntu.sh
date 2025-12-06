#!/bin/bash

################################################################################
# SEO Super App - Ubuntu 24.04 LTS Server Setup Script
# This script installs and configures all required dependencies
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  print_error "Please run as root (use sudo)"
  exit 1
fi

print_status "Starting SEO Super App installation on Ubuntu 24.04 LTS..."
echo ""

################################################################################
# 1. System Update
################################################################################
print_status "Updating system packages..."
apt update
apt upgrade -y
print_success "System updated"

################################################################################
# 2. Install Node.js 20.x (LTS)
################################################################################
print_status "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  print_success "Node.js $(node -v) installed"
else
  print_warning "Node.js already installed: $(node -v)"
fi

################################################################################
# 3. Install Nginx
################################################################################
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
  apt install -y nginx
  systemctl enable nginx
  systemctl start nginx
  print_success "Nginx installed and started"
else
  print_warning "Nginx already installed"
fi

################################################################################
# 4. Install Certbot for SSL
################################################################################
print_status "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
  apt install -y certbot python3-certbot-nginx
  print_success "Certbot installed"
else
  print_warning "Certbot already installed"
fi

################################################################################
# 5. Install SQLite
################################################################################
print_status "Installing SQLite..."
apt install -y sqlite3 libsqlite3-dev
print_success "SQLite installed"

################################################################################
# 6. Install PM2 (Process Manager)
################################################################################
print_status "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
print_success "PM2 installed"

################################################################################
# 7. Create Directory Structure
################################################################################
print_status "Creating directory structure..."
mkdir -p /var/www/sites
mkdir -p /var/www/certbot
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Set permissions
chown -R www-data:www-data /var/www/sites
chmod -R 755 /var/www/sites

print_success "Directory structure created"

################################################################################
# 8. Configure Nginx
################################################################################
print_status "Configuring Nginx..."

# Backup default config
if [ -f /etc/nginx/nginx.conf ]; then
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
fi

# Update nginx.conf
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/access.log;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Virtual Host Configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create default site (for admin dashboard)
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
systemctl reload nginx

print_success "Nginx configured"

################################################################################
# 9. Configure Firewall (UFW)
################################################################################
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
  ufw --force enable
  ufw allow 22/tcp      # SSH
  ufw allow 80/tcp      # HTTP
  ufw allow 443/tcp     # HTTPS
  ufw allow 3000/tcp    # Next.js (optional, for direct access)
  ufw reload
  print_success "Firewall configured"
else
  print_warning "UFW not installed, skipping firewall setup"
fi

################################################################################
# 10. Install Git
################################################################################
print_status "Installing Git..."
if ! command -v git &> /dev/null; then
  apt install -y git
  print_success "Git installed"
else
  print_warning "Git already installed"
fi

################################################################################
# Summary
################################################################################
echo ""
print_success "================== Installation Complete =================="
echo ""
echo "Installed components:"
echo "  ✓ Node.js $(node -v)"
echo "  ✓ npm $(npm -v)"
echo "  ✓ Nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  ✓ Certbot $(certbot --version 2>&1 | cut -d' ' -f2)"
echo "  ✓ SQLite $(sqlite3 --version | cut -d' ' -f1)"
echo "  ✓ PM2 $(pm2 -v)"
echo "  ✓ Git $(git --version | cut -d' ' -f3)"
echo ""
echo "Next steps:"
echo "  1. Clone your repository:"
echo "     git clone <your-repo-url> /var/www/seo-app"
echo ""
echo "  2. Install dependencies:"
echo "     cd /var/www/seo-app"
echo "     npm install"
echo ""
echo "  3. Set up environment:"
echo "     cp env.example .env"
echo "     nano .env  # Edit configuration"
echo ""
echo "  4. Generate password hash:"
echo "     npx tsx scripts/hash-password.ts yourpassword"
echo ""
echo "  5. Run database migrations:"
echo "     npx prisma db push"
echo ""
echo "  6. Start the application with PM2:"
echo "     npm run build"
echo "     pm2 start npm --name \"seo-app\" -- start"
echo "     pm2 save"
echo ""
echo "  7. Set up wildcard SSL for *.aksi.info:"
echo "     certbot certonly --manual --preferred-challenges=dns \\"
echo "       -d aksi.info -d *.aksi.info"
echo ""
print_success "Installation script completed successfully!"
