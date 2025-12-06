# SEO Super App

An all-in-one automated SEO content generation and deployment platform that creates 500+ SEO-optimized articles from a single keyword and deploys them as static websites on subdomains.

## Features

- 🚀 **Multi-source Keyword Research** - Generates 500+ related keywords from Google Suggest, Bing, DuckDuckGo, Wikipedia, and AI expansion
- 🤖 **AI Article Generation** - Uses Google Gemini 2.5 Flash to create SEO-optimized articles
- 🎨 **12 Beautiful Themes** - Tailwind CSS themes with responsive design
- 📄 **Smart Pagination** - Automatic pagination for large article collections
- 🔗 **Related Posts** - Intelligent article recommendations based on similarity
- 🔐 **Secure Admin Dashboard** - NextAuth authentication with bcrypt
- 📊 **Progress Tracking** - Real-time generation progress monitoring
- 🌐 **Nginx Integration** - Automatic subdomain creation and SSL setup
- ⚡ **API Key Rotation** - Support for 5x speed with multiple Gemini keys

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd adstera1m
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Set up admin authentication:**
```bash
# Generate password hash
npx tsx scripts/hash-password.ts yourpassword

# Generate auth secret
openssl rand -base64 32

# Copy admin config template
cp src/config/admin.template.ts src/config/admin.ts
# Edit src/config/admin.ts with your hash
```

5. **Initialize database:**
```bash
npx prisma db push
```

6. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:3000` and login with your admin credentials.

## Environment Variables

See `env.example` for all available environment variables.

**Required:**
- `GEMINI_API_KEY` - Your Google Gemini API key
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password
- `AUTH_SECRET` - Random secret for NextAuth

**Optional:**
- `GEMINI_API_KEYS` - Comma-separated keys for 5x speed
- `BASE_DOMAIN` - Your base domain (default: aksi.info)
- `GEMINI_RPM` - Rate limit (15 for single key, 75 for 5 keys)

## Production Deployment

### Ubuntu 24.04 LTS

Run the automated installer:

```bash
sudo bash scripts/install-ubuntu.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Architecture

- **Frontend:** Next.js 16 with App Router, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** SQLite with Prisma ORM
- **AI:** Google Gemini 2.5 Flash
- **Auth:** NextAuth.js (Auth.js v5) with bcrypt
- **Server:** Nginx with PM2 process manager

## Key Features Explained

### API Key Rotation
With 5 Gemini API keys, generation speed increases 5x:
- 1 key: ~34 minutes for 500 articles
- 5 keys: ~7 minutes for 500 articles

### Theme System
12 pre-designed themes with:
- Tailwind CSS styling
- Google Fonts integration
- Fully responsive design
- Dark and light variants

### Pagination
Automatic pagination for performance:
- 24 articles per page by default
- SEO-friendly with prev/next tags
- Sitemap includes all pages

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx tsx scripts/hash-password.ts <password>` - Generate password hash

## License

MIT

## Support

For issues and feature requests, please create an issue on GitHub.
