# SEO Super App - Ubuntu 24.04 LTS Setup Guide

## Quick Installation

```bash
# 1. Run the automated installer
sudo bash scripts/install-ubuntu.sh
```

This script will install:
- ✅ Node.js 20.x LTS
- ✅ Nginx web server
- ✅ Certbot (for SSL certificates)
- ✅ SQLite database
- ✅ PM2 process manager
- ✅ Git
- ✅ Firewall configuration (UFW)

## Manual Deployment Steps

### 1. Clone Repository
```bash
cd /var/www
git clone <your-repo-url> seo-app
cd seo-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp env.example .env
nano .env
```

**Required environment variables:**
```env
# Database
DATABASE_URL="file:./prod.db"

# Gemini API (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY="your-key-here"
# OR use multiple keys for 5x speed:
# GEMINI_API_KEYS="key1,key2,key3,key4,key5"

# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="generate-hash-see-below"
AUTH_SECRET="generate-secret-see-below"

# Domain
BASE_DOMAIN="aksi.info"

# Server Paths
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
STATIC_SITES_PATH="/var/www/sites"

# Rate Limiting
GEMINI_RPM=15  # or 75 with 5 keys
```

### 4. Generate Admin Password
```bash
# Generate bcrypt hash for your password
npx tsx scripts/hash-password.ts YourStrongPassword123

# Copy the generated hash to ADMIN_PASSWORD_HASH in .env
```

### 5. Generate Auth Secret
```bash
# Generate random secret
openssl rand -base64 32

# Copy to AUTH_SECRET in .env
```

### 6. Initialize Database
```bash
npx prisma db push
```

### 7. Build Application
```bash
npm run build
```

### 8. Start with PM2
```bash
pm2 start npm --name "seo-app" -- start
pm2 save
pm2 startup  # Enable auto-start on boot
```

## SSL Certificate Setup (Wildcard)

### Option 1: Manual DNS Challenge (Recommended for *.aksi.info)
```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  -d aksi.info \
  -d *.aksi.info
```

Follow prompts to add DNS TXT records.

### Option 2: Per-Subdomain (Automatic)
The app will generate Nginx configs automatically. For each subdomain:
```bash
sudo certbot --nginx -d subdomain.aksi.info
```

## Nginx Configuration

The installer creates:
- `/etc/nginx/sites-available/default` - Admin dashboard proxy to :3000
- `/var/www/sites/` - Static site files directory

### Verify Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Firewall Configuration

UFW rules configured by installer:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Next.js - optional)

```bash
sudo ufw status
```

## Monitoring & Logs

### View Application Logs
```bash
pm2 logs seo-app
pm2 monit
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart app
pm2 restart seo-app

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

## Updating the Application

```bash
cd /var/www/seo-app
git pull
npm install
npm run build
pm2 restart seo-app
```

## Security Checklist

- [ ] Strong admin password set
- [ ] AUTH_SECRET is random and secure
- [ ] Firewall (UFW) enabled
- [ ] SSH key authentication enabled
- [ ] Regular system updates scheduled
- [ ] SSL certificates auto-renewal configured
- [ ] Database backups scheduled

## Troubleshooting

### App won't start
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs seo-app --lines 100

# Check environment
cd /var/www/seo-app && cat .env
```

### Nginx errors
```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -n 50 /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Check certificates
sudo certbot certificates

# Renew manually
sudo certbot renew --dry-run
```

## Performance Tuning

### For high traffic:
1. Increase PM2 instances:
```bash
pm2 scale seo-app +2  # Add 2 more instances
```

2. Configure Nginx caching in `/etc/nginx/sites-available/default`

3. Increase Node.js memory:
```bash
pm2 delete seo-app
pm2 start npm --name "seo-app" --max-memory-restart 2G -- start
```

## Backup Strategy

### Database
```bash
# Backup
cp /var/www/seo-app/prod.db /backups/prod-$(date +%Y%m%d).db

# Automated daily backup (add to crontab)
0 2 * * * cp /var/www/seo-app/prod.db /backups/prod-$(date +\%Y\%m\%d).db
```

### Generated Sites
```bash
# Backup static sites
tar -czf /backups/sites-$(date +%Y%m%d).tar.gz /var/www/sites/
```
