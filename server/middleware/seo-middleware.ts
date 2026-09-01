// server/middleware/seo-middleware.ts
import { Request, Response, NextFunction } from 'express';

// Middleware pour optimiser les headers SEO
export const seoHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Headers de sécurité et SEO
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Headers de cache pour les ressources statiques
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.match(/\.(html|htm)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Headers pour les images
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:;");
  }
  
  next();
};

// Middleware pour gérer les slugs et URLs canoniques
export const canonicalUrlMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const originalUrl = req.originalUrl;
  
  // Définir l'URL canonique dans les locals
  res.locals.canonicalUrl = `${protocol}://${host}${originalUrl.split('?')[0]}`;
  res.locals.currentUrl = `${protocol}://${host}${originalUrl}`;
  
  // Rediriger les URLs non-canoniques
  if (req.path.endsWith('/') && req.path.length > 1) {
    const canonicalPath = req.path.slice(0, -1);
    return res.redirect(301, canonicalPath + (req.query ? '?' + new URLSearchParams(req.query as any).toString() : ''));
  }
  
  // Forcer HTTPS en production
  if (process.env.NODE_ENV === 'production' && protocol !== 'https') {
    return res.redirect(301, `https://${host}${originalUrl}`);
  }
  
  next();
};

// Middleware pour générer des meta tags côté serveur
export const serverSideSEOMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Déterminer les meta tags en fonction de la route
  const getMetaForRoute = (path: string) => {
    const baseMeta = {
      title: 'SV Pressing - Service de Pressing Professionnel à Antananarivo | Madagascar',
      description: 'SV Pressing - Premier service de pressing par abonnement à Madagascar. Collecte et livraison à domicile à Antananarivo, qualité premium, service express.',
      keywords: 'pressing Antananarivo, lavage linge Madagascar, nettoyage vêtements professionnel, repassage service à domicile',
      image: 'https://svpressing.com/assets/img/SV_Pattern_Gris.svg',
      type: 'website',
      url: `https://svpressing.com${path}`,
    };
    
    if (path.includes('/plans') || path.includes('#plans')) {
      return {
        ...baseMeta,
        title: 'Plans d\'Abonnement Pressing - Formules Mensuelles Économiques | SV Pressing',
        description: 'Découvrez nos formules d\'abonnement pressing mensuel à Antananarivo. Formule Familiale, Premium et Essentielle avec collecte et livraison incluses.',
        keywords: 'abonnement pressing Madagascar, forfait pressing mensuel, prix pressing Antananarivo, formule pressing économique',
      };
    }
    
    if (path.includes('/app') || path.includes('#download-app')) {
      return {
        ...baseMeta,
        title: 'Application Mobile SV Pressing - Télécharger l\'App Pressing Madagascar',
        description: 'Téléchargez l\'application mobile SV Pressing pour Android. Gérez vos commandes de pressing, suivez vos livraisons depuis votre smartphone.',
        keywords: 'application pressing Madagascar, app pressing Antananarivo, télécharger app pressing, mobile app laundry service',
      };
    }
    
    return baseMeta;
  };
  
  const meta = getMetaForRoute(req.path);
  res.locals.seo = meta;
  
  // Injecter les meta tags dans le HTML initial
  res.locals.seoTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">
    <meta name="keywords" content="${meta.keywords}">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:image" content="${meta.image}">
    <meta property="og:url" content="${meta.url}">
    <meta property="og:type" content="${meta.type}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <link rel="canonical" href="${meta.url}">
  `;
  
  next();
};

// Middleware pour compression Gzip/Brotli
import compression from 'compression';
export const compressionMiddleware = compression({
  level: 6,
  threshold: 0,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Middleware pour logger les crawlers
export const crawlerLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  const crawlers = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebookexternalhit', 'twitterbot',
    'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
    'showyoubot', 'outbrain', 'pinterest', 'developers.google.com',
    'whatsapp', 'slackbot', 'applebot'
  ];
  
  const isCrawler = crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
  
  if (isCrawler) {
    console.log(`Crawler detected: ${userAgent} - ${req.method} ${req.url}`);
    
    // Log supplémentaire pour les crawlers importants
    if (userAgent.toLowerCase().includes('googlebot')) {
      console.log('Googlebot accessing:', req.url, 'at', new Date().toISOString());
    }
  }
  
  next();
};