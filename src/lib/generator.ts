import * as fs from 'fs/promises';
import * as path from 'path';
import slugify from 'slugify';
import { getTheme, Theme } from './themes';
import { findRelatedArticles } from './related-posts';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'aksi.info';

// Generate URL-safe slug from text
export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

interface ArticleWithKeyword {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDesc: string;
  createdAt: Date;
  keyword?: {
    keyword: string;
  };
}

interface SiteData {
  subdomain: string;
  mainKeyword: string;
}

// Generate article HTML page with Tailwind and theme
export function generateArticleHTML(
  article: ArticleWithKeyword,
  site: SiteData,
  allArticles: ArticleWithKeyword[],
  themeId?: string
): string {
  const theme = getTheme(themeId);
  const canonicalUrl = `https://${site.subdomain}.${BASE_DOMAIN}/articles/${article.slug}.html`;
  const homeUrl = `https://${site.subdomain}.${BASE_DOMAIN}/`;

  // Find related articles
  const related = article.keyword
    ? findRelatedArticles(article as Required<ArticleWithKeyword>, allArticles as Required<ArticleWithKeyword>[], 5)
    : [];

  const relatedPostsHTML = related.length > 0
    ? `
    <div class="mt-12 pt-8 border-t" style="border-color: ${theme.colors.border}">
      <h2 class="text-2xl font-bold mb-6" style="color: ${theme.colors.text}; font-family: ${theme.fonts.heading}">
        Related Articles
      </h2>
      <div class="grid md:grid-cols-2 gap-4">
        ${related.map(r => `
          <a href="/articles/${r.slug}.html" 
             class="block p-4 rounded-lg border hover:shadow-lg transition-all duration-200"
             style="border-color: ${theme.colors.border}; background: ${theme.colors.surface}">
            <h3 class="font-semibold mb-2 hover:underline" style="color: ${theme.colors.primary}">
              ${escapeHtml(r.title)}
            </h3>
            <p class="text-sm line-clamp-2" style="color: ${theme.colors.textLight}">
              ${escapeHtml(r.metaDesc)}
            </p>
          </a>
        `).join('')}
      </div>
    </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(article.metaDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.metaDesc)}">
  <meta property="og:url" content="${canonicalUrl}">
  
  <title>${escapeHtml(article.title)}</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Lora:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=Roboto+Mono:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700;900&family=Josefin+Sans:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800;900&family=Nunito:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    body {
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      font-family: ${theme.fonts.body};
    }
    
    .prose h2 {
      color: ${theme.colors.text};
      font-family: ${theme.fonts.heading};
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .prose h3 {
      color: ${theme.colors.text};
      font-family: ${theme.fonts.heading};
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .prose p {
      margin-bottom: 1.25rem;
      line-height: 1.8;
    }
    
    .prose ul, .prose ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
    }
    
    .prose li {
      margin-bottom: 0.5rem;
    }
    
    .prose a {
      color: ${theme.colors.primary};
      text-decoration: underline;
    }
    
    .prose a:hover {
      color: ${theme.colors.primaryDark};
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  </style>
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${escapeHtml(article.title)}",
    "description": "${escapeHtml(article.metaDesc)}",
    "datePublished": "${article.createdAt.toISOString()}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${canonicalUrl}"
    }
  }
  </script>
</head>
<body>
  <!-- Header -->
  <header class="sticky top-0 z-50 border-b backdrop-blur-sm" 
          style="background-color: ${theme.colors.surface}cc; border-color: ${theme.colors.border}">
    <div class="container mx-auto px-6 py-4">
      <a href="${homeUrl}" class="text-xl font-bold hover:opacity-80 transition-opacity" 
         style="color: ${theme.colors.primary}; font-family: ${theme.fonts.heading}">
        ${escapeHtml(site.mainKeyword)}
      </a>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="container mx-auto px-6 py-12 max-w-4xl">
    <article class="rounded-2xl p-8 md:p-12 shadow-lg" 
             style="background-color: ${theme.colors.surface}">
      <!-- Title -->
      <h1 class="text-4xl md:text-5xl font-extrabold mb-4 leading-tight" 
          style="color: ${theme.colors.text}; font-family: ${theme.fonts.heading}">
        ${escapeHtml(article.title)}
      </h1>
      
      <!-- Meta -->
      <div class="flex items-center gap-4 mb-8 pb-6 border-b text-sm"
           style="color: ${theme.colors.textLight}; border-color: ${theme.colors.border}">
        <time datetime="${article.createdAt.toISOString()}">
          ${article.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
        </time>
      </div>
      
      <!-- Content -->
      <div class="prose max-w-none">
        ${article.content}
      </div>
      
      ${relatedPostsHTML}
    </article>
  </main>
  
  <!-- Footer -->
  <footer class="mt-16 py-8 border-t" 
          style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}">
    <div class="container mx-auto px-6 text-center text-sm" 
         style="color: ${theme.colors.textLight}">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(site.mainKeyword)}. All rights reserved.</p>
      <p class="mt-2">
        <a href="${homeUrl}" style="color: ${theme.colors.primary}" class="hover:underline">
          Back to Home
        </a>
      </p>
    </div>
  </footer>
</body>
</html>`;
}

// Generate homepage with Tailwind and pagination
export function generateHomepageHTML(
  site: SiteData,
  articles: ArticleWithKeyword[],
  currentPage: number = 1,
  articlesPerPage: number = 24,
  themeId?: string
): string {
  const theme = getTheme(themeId);
  const totalArticles = articles.length;
  const totalPages = Math.ceil(totalArticles / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const pageArticles = articles.slice(startIndex, endIndex);

  const canonicalUrl = currentPage === 1
    ? `https://${site.subdomain}.${BASE_DOMAIN}/`
    : `https://${site.subdomain}.${BASE_DOMAIN}/page-${currentPage}.html`;

  const articleListHtml = pageArticles
    .map(
      (article) => `
      <article class="rounded-xl p-6 border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
               style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}">
        <h2 class="text-xl font-bold mb-3">
          <a href="/articles/${article.slug}.html" 
             class="hover:underline" 
             style="color: ${theme.colors.primary}">
            ${escapeHtml(article.title)}
          </a>
        </h2>
        <p class="text-sm leading-relaxed" style="color: ${theme.colors.textLight}">
          ${escapeHtml(article.metaDesc)}
        </p>
      </article>`
    )
    .join('\n');

  // Pagination controls
  const paginationHTML = totalPages > 1 ? `
    <div class="mt-12 flex items-center justify-center gap-2 flex-wrap">
      ${currentPage > 1 ? `
        <a href="${currentPage === 2 ? '/index.html' : `/page-${currentPage - 1}.html`}"
           class="px-4 py-2 rounded-lg border font-medium hover:shadow-lg transition-all"
           style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}; color: ${theme.colors.text}">
          ← Previous
        </a>
      ` : ''}
      
      ${Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page => {
        // Show first page, last page, current page, and 2 pages around current
        return page === 1 ||
          page === totalPages ||
          Math.abs(page - currentPage) <= 2;
      })
      .map((page, index, pages) => {
        // Add ellipsis if there's a gap
        const prevPage = pages[index - 1];
        const ellipsis = prevPage && page - prevPage > 1
          ? '<span class="px-2" style="color: ' + theme.colors.textLight + '">...</span>'
          : '';

        const pageLink = page === 1 ? '/index.html' : `/page-${page}.html`;
        const isActive = page === currentPage;

        return ellipsis + (isActive
          ? `<span class="px-4 py-2 rounded-lg font-bold" 
                     style="background-color: ${theme.colors.primary}; color: white">${page}</span>`
          : `<a href="${pageLink}" 
                  class="px-4 py-2 rounded-lg border hover:shadow-lg transition-all"
                  style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}; color: ${theme.colors.text}">${page}</a>`
        );
      }).join('')}
      
      ${currentPage < totalPages ? `
        <a href="/page-${currentPage + 1}.html"
           class="px-4 py-2 rounded-lg border font-medium hover:shadow-lg transition-all"
           style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}; color: ${theme.colors.text}">
          Next →
        </a>
      ` : ''}
    </div>
    
    <p class="text-center mt-4 text-sm" style="color: ${theme.colors.textLight}">
      Page ${currentPage} of ${totalPages} • Showing ${startIndex + 1}-${Math.min(endIndex, totalArticles)} of ${totalArticles} articles
    </p>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Comprehensive guide about ${escapeHtml(site.mainKeyword)}${currentPage > 1 ? ` - Page ${currentPage}` : ''}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  ${currentPage > 1 ? `<link rel="prev" href="${currentPage === 2 ? '/' : `/page-${currentPage - 1}.html`}">` : ''}
  ${currentPage < totalPages ? `<link rel="next" href="/page-${currentPage + 1}.html">` : ''}
  
  <title>${escapeHtml(site.mainKeyword)} - Complete Resource Guide${currentPage > 1 ? ` - Page ${currentPage}` : ''}</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${theme.fonts.heading.split(',')[0]}:wght@300;400;500;600;700;800;900&family=${theme.fonts.body.split(',')[0]}:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    body {
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      font-family: ${theme.fonts.body};
    }
  </style>
</head>
<body>
  <!-- Hero Header -->
  <header class="py-16 md:py-24 text-center" 
          style="background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)">
    <div class="container mx-auto px-6">
      <h1 class="text-4xl md:text-6xl font-extrabold mb-4 text-white" 
          style="font-family: ${theme.fonts.heading}">
        ${escapeHtml(site.mainKeyword)}
      </h1>
      <p class="text-lg md:text-xl text-white/90">
        Your complete resource guide
      </p>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="container mx-auto px-6 py-12 max-w-6xl">
    <!-- Stats -->
    <div class="rounded-2xl p-6 mb-12 text-center" 
         style="background-color: ${theme.colors.surface}">
      <p class="text-lg" style="color: ${theme.colors.text}">
        Explore <span class="font-bold text-2xl" style="color: ${theme.colors.primary}">${totalArticles}</span> 
        articles about ${escapeHtml(site.mainKeyword)}
      </p>
    </div>
    
    <!-- Articles Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
${articleListHtml}
    </div>
    
    <!-- Pagination -->
    ${paginationHTML}
  </main>
  
  <!-- Footer -->
  <footer class="mt-16 py-8 border-t" 
          style="background-color: ${theme.colors.surface}; border-color: ${theme.colors.border}">
    <div class="container mx-auto px-6 text-center text-sm" 
         style="color: ${theme.colors.textLight}">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(site.mainKeyword)}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
}

// Generate sitemap.xml
export function generateSitemap(site: SiteData, articles: ArticleWithKeyword[]): string {
  const baseUrl = `https://${site.subdomain}.${BASE_DOMAIN}`;

  const articleUrls = articles
    .map(
      (article) => `
  <url>
    <loc>${baseUrl}/articles/${article.slug}.html</loc>
    <lastmod>${article.createdAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>${articleUrls}
</urlset>`;
}

// Generate robots.txt
export function generateRobotsTxt(site: SiteData): string {
  const baseUrl = `https://${site.subdomain}.${BASE_DOMAIN}`;

  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
}

// Write all static files for a site with theme and pagination
export async function generateStaticSite(
  site: SiteData,
  articles: ArticleWithKeyword[],
  outputDir: string,
  themeId?: string,
  articlesPerPage: number = 24
): Promise<void> {
  // Create directories
  const articlesDir = path.join(outputDir, 'articles');
  await fs.mkdir(articlesDir, { recursive: true });

  const totalPages = Math.ceil(articles.length / articlesPerPage);

  // Generate homepage and pagination pages
  for (let page = 1; page <= totalPages; page++) {
    const homepageHtml = generateHomepageHTML(site, articles, page, articlesPerPage, themeId);
    const filename = page === 1 ? 'index.html' : `page-${page}.html`;
    await fs.writeFile(path.join(outputDir, filename), homepageHtml, 'utf-8');
  }

  // Generate each article
  for (const article of articles) {
    const articleHtml = generateArticleHTML(article, site, articles, themeId);
    await fs.writeFile(
      path.join(articlesDir, `${article.slug}.html`),
      articleHtml,
      'utf-8'
    );
  }

  // Generate sitemap (include pagination pages)
  const sitemapXml = generateSitemapWithPagination(site, articles, totalPages);
  await fs.writeFile(path.join(outputDir, 'sitemap.xml'), sitemapXml, 'utf-8');

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt(site);
  await fs.writeFile(path.join(outputDir, 'robots.txt'), robotsTxt, 'utf-8');

  const themeName = themeId ? getTheme(themeId).name : 'Default';
  console.log(
    `Generated static site for ${site.subdomain} with ${articles.length} articles (${totalPages} pages, Theme: ${themeName})`
  );
}

// Generate sitemap with pagination pages included
function generateSitemapWithPagination(
  site: SiteData,
  articles: ArticleWithKeyword[],
  totalPages: number
): string {
  const baseUrl = `https://${site.subdomain}.${BASE_DOMAIN}`;

  // Homepage and pagination pages
  const paginationUrls = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map(page => {
      const url = page === 1 ? `${baseUrl}/` : `${baseUrl}/page-${page}.html`;
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === 1 ? '1.0' : '0.7'}</priority>
  </url>`;
    })
    .join('');

  // Article pages
  const articleUrls = articles
    .map(
      (article) => `
  <url>
    <loc>${baseUrl}/articles/${article.slug}.html</loc>
    <lastmod>${article.createdAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paginationUrls}${articleUrls}
</urlset>`;
}

// Helper: Escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
