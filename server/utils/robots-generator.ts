// server/utils/robots-generator.ts
export const generateRobotsTxt = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return `# Development Environment - No Indexing
User-agent: *
Disallow: /
    
# Crawlers should not index development environment
Host: localhost:${process.env.PORT || 5000}`;
  }
  
  return `# Production Robots.txt for SV Pressing Madagascar
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/
    
# Sitemap
Sitemap: https://svpressing.com/sitemap.xml
    
# Crawl-delay
Crawl-delay: 2
    
# Specific bots
User-agent: Googlebot
Allow: /
Crawl-delay: 1
    
User-agent: Bingbot
Allow: /
Crawl-delay: 2
    
User-agent: Yandex
Allow: /
Crawl-delay: 3
    
User-agent: Baiduspider
Disallow: /
    
User-agent: ChatGPT-User
Disallow: /`;
};