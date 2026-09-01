// server/utils/seo-utils.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO UTILS ULTIME
// VERSION COMPLETE NON COMPRESSÉE
// ====================================================================================================
// FICHIER CONTENANT TOUTES LES FONCTIONS SEO SERVER-SIDE
// ====================================================================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';

// ====================================================================================================
// SECTION 1: CONFIGURATION SEO ULTIME
// ====================================================================================================

export const SEO_CONFIG = {
  siteName: 'SV Pressing Madagascar',
  siteShortName: 'SV Pressing',
  siteDescription: 'Service de pressing professionnel, blanchisserie et nettoyage à sec à Antananarivo, Madagascar - Leader du marché, meilleur que Sasa Vanda, Clean Press, Speed Clean, Express Pressing, Top Clean, Laundry Service MG',
  siteUrl: 'https://svpressing.com',
  siteEmail: 'contact.sasavanda@gmail.com',
  sitePhone: '+261 34 99 483 01',
  siteAddress: 'Antananarivo, Analamanga, Madagascar',
  sitePostalCode: '101',
  siteCountry: 'Madagascar',
  siteRegion: 'Analamanga',
  siteCity: 'Antananarivo',
  siteLatitude: '-18.8792',
  siteLongitude: '47.5079',
  siteGoogleAnalytics: 'G-3WS5VRMR88',
  siteFacebookPixel: '1500646934790117',
  siteGoogleAds: 'pub-0000000000000000',
  siteCopyright: 'SV Pressing Madagascar ' + new Date().getFullYear(),
  siteAuthor: 'SV Pressing Madagascar Team',
  siteLanguage: 'fr',
  siteLanguages: ['fr', 'mg', 'en'],
  siteThemeColor: '#0B676E',
  siteFavicon: '/favicon.ico',
  siteLogo: '/logo-svpressing.png',
  siteOgImage: '/og-image-svpressing-ultimate.jpg',
  siteTwitterHandle: '@svpressing',
  siteFacebook: 'https://www.facebook.com/sasavandapressing',
  siteInstagram: 'https://www.instagram.com/svpressing',
  siteTwitter: 'https://twitter.com/svpressing',
  siteLinkedin: 'https://www.linkedin.com/company/svpressing',
  siteYoutube: 'https://youtube.com/@svpressing',
  siteTiktok: 'https://tiktok.com/@svpressing'
};

// ====================================================================================================
// SECTION 2: GENERATEUR DE METADONNEES - SERVER SIDE
// ====================================================================================================

export interface SEOHeadData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  alternates?: { hreflang: string; href: string }[];
  structuredData?: any[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export const generateSEOHead = function(data: SEOHeadData): string {
  const title = data.title || SEO_CONFIG.siteName;
  const description = data.description || SEO_CONFIG.siteDescription;
  const keywords = data.keywords || [];
  const canonical = data.canonical || SEO_CONFIG.siteUrl;
  const robots = data.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const ogTitle = data.ogTitle || title;
  const ogDescription = data.ogDescription || description;
  const ogImage = data.ogImage || SEO_CONFIG.siteOgImage;
  const ogType = data.ogType || 'website';
  const ogUrl = data.ogUrl || canonical;
  const twitterCard = data.twitterCard || 'summary_large_image';
  const twitterSite = data.twitterSite || SEO_CONFIG.siteTwitterHandle;
  const twitterTitle = data.twitterTitle || title;
  const twitterDescription = data.twitterDescription || description;
  const twitterImage = data.twitterImage || ogImage;
  const alternates = data.alternates || [];
  const structuredData = data.structuredData || [];
  const noIndex = data.noIndex || false;
  const noFollow = data.noFollow || false;

  let robotsContent = robots;
  if (noIndex && noFollow) {
    robotsContent = 'noindex, nofollow';
  } else if (noIndex) {
    robotsContent = 'noindex, follow';
  } else if (noFollow) {
    robotsContent = 'index, nofollow';
  }

  let html = '';

  // Titre
  html = html + '<title>' + escapeHtml(title) + '</title>\n';
  
  // Meta Description
  html = html + '<meta name="description" content="' + escapeHtml(description) + '" />\n';
  
  // Meta Keywords
  if (keywords.length > 0) {
    html = html + '<meta name="keywords" content="' + escapeHtml(keywords.slice(0, 30).join(', ')) + '" />\n';
  }
  
  // Robots
  html = html + '<meta name="robots" content="' + escapeHtml(robotsContent) + '" />\n';
  html = html + '<meta name="googlebot" content="' + escapeHtml(robotsContent) + '" />\n';
  html = html + '<meta name="bingbot" content="' + escapeHtml(robotsContent) + '" />\n';
  html = html + '<meta name="yandex" content="' + escapeHtml(robotsContent) + '" />\n';
  html = html + '<meta name="googlebot-news" content="' + escapeHtml(robotsContent) + '" />\n';
  html = html + '<meta name="googlebot-image" content="index, follow" />\n';
  html = html + '<meta name="googlebot-video" content="index, follow" />\n';
  
  // Canonical
  html = html + '<link rel="canonical" href="' + escapeHtml(canonical) + '" />\n';
  
  // Alternates
  var allAlternates = alternates.slice();
  for (var i = 0; i < SEO_CONFIG.siteLanguages.length; i++) {
    var lang = SEO_CONFIG.siteLanguages[i];
    var href = lang === 'fr' ? canonical : canonical.replace(SEO_CONFIG.siteUrl, SEO_CONFIG.siteUrl + '/' + lang);
    allAlternates.push({ hreflang: lang, href: href });
  }
  
  var seenHreflang: { [key: string]: boolean } = {};
  for (var j = 0; j < allAlternates.length; j++) {
    var alt = allAlternates[j];
    if (!seenHreflang[alt.hreflang]) {
      seenHreflang[alt.hreflang] = true;
      html = html + '<link rel="alternate" hreflang="' + escapeHtml(alt.hreflang) + '" href="' + escapeHtml(alt.href) + '" />\n';
    }
  }
  
  // Open Graph
  html = html + '<meta property="og:site_name" content="' + escapeHtml(SEO_CONFIG.siteName) + '" />\n';
  html = html + '<meta property="og:title" content="' + escapeHtml(ogTitle) + '" />\n';
  html = html + '<meta property="og:description" content="' + escapeHtml(ogDescription) + '" />\n';
  html = html + '<meta property="og:image" content="' + escapeHtml(ogImage) + '" />\n';
  html = html + '<meta property="og:image:width" content="1200" />\n';
  html = html + '<meta property="og:image:height" content="630" />\n';
  html = html + '<meta property="og:image:type" content="image/jpeg" />\n';
  html = html + '<meta property="og:image:alt" content="' + escapeHtml(SEO_CONFIG.siteName) + '" />\n';
  html = html + '<meta property="og:type" content="' + escapeHtml(ogType) + '" />\n';
  html = html + '<meta property="og:url" content="' + escapeHtml(ogUrl) + '" />\n';
  html = html + '<meta property="og:locale" content="' + escapeHtml(SEO_CONFIG.siteLanguage) + '" />\n';
  html = html + '<meta property="og:locale:alternate" content="mg_MG" />\n';
  html = html + '<meta property="og:locale:alternate" content="en_MG" />\n';
  html = html + '<meta property="og:updated_time" content="' + new Date().toISOString() + '" />\n';
  
  // Twitter Cards
  html = html + '<meta name="twitter:card" content="' + escapeHtml(twitterCard) + '" />\n';
  html = html + '<meta name="twitter:site" content="' + escapeHtml(twitterSite) + '" />\n';
  html = html + '<meta name="twitter:title" content="' + escapeHtml(twitterTitle) + '" />\n';
  html = html + '<meta name="twitter:description" content="' + escapeHtml(twitterDescription) + '" />\n';
  html = html + '<meta name="twitter:image" content="' + escapeHtml(twitterImage) + '" />\n';
  html = html + '<meta name="twitter:image:alt" content="' + escapeHtml(SEO_CONFIG.siteName) + '" />\n';
  
  // Author & Copyright
  html = html + '<meta name="author" content="' + escapeHtml(SEO_CONFIG.siteAuthor) + '" />\n';
  html = html + '<meta name="copyright" content="' + escapeHtml(SEO_CONFIG.siteCopyright) + '" />\n';
  html = html + '<meta name="reply-to" content="' + escapeHtml(SEO_CONFIG.siteEmail) + '" />\n';
  
  // Additional meta tags
  html = html + '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />\n';
  html = html + '<meta name="theme-color" content="' + escapeHtml(SEO_CONFIG.siteThemeColor) + '" />\n';
  html = html + '<meta name="mobile-web-app-capable" content="yes" />\n';
  html = html + '<meta name="apple-mobile-web-app-capable" content="yes" />\n';
  html = html + '<meta name="apple-mobile-web-app-title" content="' + escapeHtml(SEO_CONFIG.siteShortName) + '" />\n';
  html = html + '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n';
  html = html + '<meta name="application-name" content="' + escapeHtml(SEO_CONFIG.siteName) + '" />\n';
  html = html + '<meta name="referrer" content="strict-origin-when-cross-origin" />\n';
  html = html + '<meta name="format-detection" content="telephone=yes" />\n';
  html = html + '<meta name="msapplication-TileColor" content="' + escapeHtml(SEO_CONFIG.siteThemeColor) + '" />\n';
  html = html + '<meta name="msapplication-config" content="/browserconfig.xml" />\n';
  
  // Geo meta tags
  html = html + '<meta name="geo.region" content="MG-A" />\n';
  html = html + '<meta name="geo.placename" content="' + escapeHtml(SEO_CONFIG.siteCity) + '" />\n';
  html = html + '<meta name="geo.position" content="' + SEO_CONFIG.siteLatitude + ';' + SEO_CONFIG.siteLongitude + '" />\n';
  html = html + '<meta name="ICBM" content="' + SEO_CONFIG.siteLatitude + ', ' + SEO_CONFIG.siteLongitude + '" />\n';
  
  // Structured Data
  if (structuredData.length > 0) {
    for (var k = 0; k < structuredData.length; k++) {
      html = html + '<script type="application/ld+json">\n' + JSON.stringify(structuredData[k], null, 2) + '\n</script>\n';
    }
  }
  
  return html;
};

// ====================================================================================================
// SECTION 3: GENERATEUR DE STRUCTURED DATA - SERVER SIDE
// ====================================================================================================

export const generateOrganizationSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SEO_CONFIG.siteUrl + '/#organization',
    'name': SEO_CONFIG.siteName,
    'alternateName': ['SV Pressing', 'Net à Sec SV', 'Pressing Madagascar'],
    'url': SEO_CONFIG.siteUrl,
    'logo': SEO_CONFIG.siteLogo,
    'description': SEO_CONFIG.siteDescription,
    'email': SEO_CONFIG.siteEmail,
    'telephone': SEO_CONFIG.sitePhone,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': SEO_CONFIG.siteCity,
      'addressRegion': SEO_CONFIG.siteRegion,
      'addressCountry': SEO_CONFIG.siteCountry,
      'postalCode': SEO_CONFIG.sitePostalCode
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': SEO_CONFIG.sitePhone,
      'contactType': 'customer service',
      'email': SEO_CONFIG.siteEmail,
      'availableLanguage': ['French', 'Malagasy', 'English'],
      'hoursAvailable': {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        'opens': '08:00',
        'closes': '20:00'
      }
    },
    'sameAs': [
      SEO_CONFIG.siteFacebook,
      SEO_CONFIG.siteInstagram,
      SEO_CONFIG.siteTwitter,
      SEO_CONFIG.siteLinkedin,
      SEO_CONFIG.siteYoutube,
      SEO_CONFIG.siteTiktok
    ],
    'foundingDate': '2020',
    'numberOfEmployees': {
      '@type': 'QuantitativeValue',
      'value': '25'
    },
    'serviceArea': {
      '@type': 'GeoCircle',
      'geoMidpoint': {
        '@type': 'GeoCoordinates',
        'latitude': SEO_CONFIG.siteLatitude,
        'longitude': SEO_CONFIG.siteLongitude
      },
      'geoRadius': '30000'
    }
  };
};

export const generateLocalBusinessSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Laundry',
    '@id': SEO_CONFIG.siteUrl + '/#localbusiness',
    'name': SEO_CONFIG.siteName,
    'description': SEO_CONFIG.siteDescription,
    'url': SEO_CONFIG.siteUrl,
    'telephone': SEO_CONFIG.sitePhone,
    'email': SEO_CONFIG.siteEmail,
    'priceRange': '$$',
    'currenciesAccepted': 'MGA',
    'paymentAccepted': 'Cash, Mobile Money (MVola, Airtel Money), Credit Card (Visa, Mastercard), Bank Transfer',
    'openingHours': 'Mo-Su 08:00-20:00',
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        'opens': '08:00',
        'closes': '20:00'
      }
    ],
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': SEO_CONFIG.siteCity,
      'addressRegion': SEO_CONFIG.siteRegion,
      'addressCountry': SEO_CONFIG.siteCountry,
      'postalCode': SEO_CONFIG.sitePostalCode
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': SEO_CONFIG.siteLatitude,
      'longitude': SEO_CONFIG.siteLongitude
    },
    'areaServed': {
      '@type': 'GeoCircle',
      'geoMidpoint': {
        '@type': 'GeoCoordinates',
        'latitude': SEO_CONFIG.siteLatitude,
        'longitude': SEO_CONFIG.siteLongitude
      },
      'geoRadius': '20000'
    },
    'makesOffer': [
      {
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': 'Pressing Costume'
        }
      },
      {
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': 'Blanchisserie Couette'
        }
      },
      {
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': 'Nettoyage à Sec'
        }
      }
    ],
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '847',
      'bestRating': '5'
    }
  };
};

export const generateBreadcrumbSchema = function(items: { name: string; url: string }[]) {
  var itemListElement = [];
  for (var i = 0; i < items.length; i++) {
    itemListElement.push({
      '@type': 'ListItem',
      'position': i + 1,
      'name': items[i].name,
      'item': items[i].url
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': itemListElement
  };
};

export const generateFAQSchema = function(questions: { question: string; answer: string }[]) {
  var mainEntity = [];
  for (var i = 0; i < questions.length; i++) {
    mainEntity.push({
      '@type': 'Question',
      'name': questions[i].question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': questions[i].answer
      }
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': mainEntity
  };
};

// ====================================================================================================
// SECTION 4: MIDDLEWARES SEO
// ====================================================================================================

export const seoHeadersMiddleware = function(req: Request, res: Response, next: NextFunction) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Cache headers
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Surrogate-Control', 'public, max-age=86400');
  
  // CORS headers for SEO resources
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin');
  
  // SEO specific headers
  res.setHeader('X-Robots-Tag', 'index, follow');
  res.setHeader('X-Robots-Tag', 'max-image-preview:large');
  res.setHeader('X-Robots-Tag', 'max-snippet:-1');
  res.setHeader('X-Robots-Tag', 'max-video-preview:-1');
  
  next();
};

export const seoSitemapMiddleware = function(req: Request, res: Response, next: NextFunction) {
  var path = req.path;
  if (path === '/sitemap.xml' || path === '/sitemap-main.xml' || path === '/sitemap-blog.xml' || path === '/sitemap-images.xml' || path === '/sitemap-news.xml') {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Robots-Tag', 'index, follow');
  }
  next();
};

export const seoRobotsMiddleware = function(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Robots-Tag', 'index, follow');
  }
  next();
};

export const seoManifestMiddleware = function(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/manifest.webmanifest') {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
};

// ====================================================================================================
// SECTION 5: GENERATEUR DE ROBOTS.TXT - SERVER SIDE
// ====================================================================================================

export const generateRobotsTxt = function(): string {
  var today = new Date().toISOString().split('T')[0];
  
  return '# ====================================================================================================\n' +
    '# ROBOTS.TXT - SV PRESSING MADAGASCAR\n' +
    '# VERSION ULTIME - ' + today + '\n' +
    '# ====================================================================================================\n' +
    '# CONTACT: ' + SEO_CONFIG.siteEmail + '\n' +
    '# TELEPHONE: ' + SEO_CONFIG.sitePhone + '\n' +
    '# ====================================================================================================\n\n' +
    'User-agent: *\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /blanchisserie-couette\n' +
    'Allow: /blanchisserie-rideaux\n' +
    'Allow: /blanchisserie-tapis\n' +
    'Allow: /blanchisserie-industrielle\n' +
    'Allow: /blanchisserie-linge-maison\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /pressing-robe-soiree\n' +
    'Allow: /pressing-linge-maison\n' +
    'Allow: /pressing-entreprise\n' +
    'Allow: /pressing-hotel\n' +
    'Allow: /pressing-restaurant\n' +
    'Allow: /nettoyage-soie\n' +
    'Allow: /nettoyage-laine\n' +
    'Allow: /nettoyage-cachemire\n' +
    'Allow: /nettoyage-dentelle\n' +
    'Allow: /nettoyage-cuir\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /app\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /search\n' +
    'Allow: /sitemap.xml\n' +
    'Allow: /sitemap-main.xml\n' +
    'Allow: /sitemap-blog.xml\n' +
    'Allow: /sitemap-images.xml\n' +
    'Allow: /sitemap-news.xml\n' +
    'Allow: /sitemap-videos.xml\n' +
    'Allow: /sitemap-products.xml\n' +
    'Allow: /sitemap-locations.xml\n' +
    'Allow: /robots.txt\n' +
    'Allow: /humans.txt\n' +
    'Allow: /ads.txt\n' +
    'Allow: /manifest.webmanifest\n' +
    'Allow: /browserconfig.xml\n' +
    'Allow: /.well-known/\n' +
    'Allow: /assets/\n' +
    'Allow: /images/\n' +
    'Allow: /fonts/\n' +
    'Allow: /css/\n' +
    'Allow: /js/\n' +
    'Allow: /api/public/\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /api/admin/\n' +
    'Disallow: /api/private/\n' +
    'Disallow: /auth/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Disallow: /login-info\n' +
    'Disallow: /private/\n' +
    'Disallow: /_next/\n' +
    'Disallow: /static/\n' +
    'Disallow: /temp/\n' +
    'Disallow: /logs/\n' +
    'Disallow: /tmp/\n' +
    'Disallow: /backup/\n' +
    'Disallow: /cache/\n' +
    'Disallow: /config/\n' +
    'Disallow: /database/\n' +
    'Disallow: /migrations/\n' +
    'Disallow: /node_modules/\n' +
    'Disallow: /vendor/\n' +
    'Disallow: /*?\n' +
    'Disallow: /?*\n\n' +
    '# ====================================================================================================\n' +
    '# GOOGLEBOT\n' +
    '# ====================================================================================================\n' +
    'User-agent: Googlebot\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /blanchisserie-couette\n' +
    'Allow: /blanchisserie-rideaux\n' +
    'Allow: /blanchisserie-tapis\n' +
    'Allow: /blanchisserie-industrielle\n' +
    'Allow: /blanchisserie-linge-maison\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /pressing-robe-soiree\n' +
    'Allow: /pressing-linge-maison\n' +
    'Allow: /pressing-entreprise\n' +
    'Allow: /pressing-hotel\n' +
    'Allow: /pressing-restaurant\n' +
    'Allow: /nettoyage-soie\n' +
    'Allow: /nettoyage-laine\n' +
    'Allow: /nettoyage-cachemire\n' +
    'Allow: /nettoyage-dentelle\n' +
    'Allow: /nettoyage-cuir\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /app\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /search\n' +
    'Allow: /sitemap.xml\n' +
    'Allow: /sitemap-main.xml\n' +
    'Allow: /sitemap-blog.xml\n' +
    'Allow: /sitemap-images.xml\n' +
    'Allow: /sitemap-news.xml\n' +
    'Allow: /sitemap-videos.xml\n' +
    'Allow: /sitemap-products.xml\n' +
    'Allow: /sitemap-locations.xml\n' +
    'Allow: /robots.txt\n' +
    'Allow: /humans.txt\n' +
    'Allow: /ads.txt\n' +
    'Allow: /manifest.webmanifest\n' +
    'Allow: /browserconfig.xml\n' +
    'Allow: /.well-known/\n' +
    'Allow: /assets/\n' +
    'Allow: /images/\n' +
    'Allow: /fonts/\n' +
    'Allow: /css/\n' +
    'Allow: /js/\n' +
    'Allow: /api/public/\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /api/admin/\n' +
    'Disallow: /api/private/\n' +
    'Disallow: /auth/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Disallow: /login-info\n' +
    'Disallow: /private/\n' +
    'Disallow: /_next/\n' +
    'Disallow: /static/\n' +
    'Disallow: /temp/\n' +
    'Disallow: /logs/\n' +
    'Disallow: /tmp/\n' +
    'Disallow: /backup/\n' +
    'Disallow: /cache/\n' +
    'Disallow: /config/\n' +
    'Disallow: /database/\n' +
    'Disallow: /migrations/\n' +
    'Disallow: /node_modules/\n' +
    'Disallow: /vendor/\n' +
    'Disallow: /*?\n' +
    'Disallow: /?*\n' +
    'Crawl-delay: 1\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-main.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-blog.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-images.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-news.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-videos.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-products.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-locations.xml\n\n' +
    '# ====================================================================================================\n' +
    '# BINGBOT\n' +
    '# ====================================================================================================\n' +
    'User-agent: Bingbot\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /blanchisserie-couette\n' +
    'Allow: /blanchisserie-rideaux\n' +
    'Allow: /blanchisserie-tapis\n' +
    'Allow: /blanchisserie-industrielle\n' +
    'Allow: /blanchisserie-linge-maison\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /pressing-robe-soiree\n' +
    'Allow: /pressing-linge-maison\n' +
    'Allow: /pressing-entreprise\n' +
    'Allow: /pressing-hotel\n' +
    'Allow: /pressing-restaurant\n' +
    'Allow: /nettoyage-soie\n' +
    'Allow: /nettoyage-laine\n' +
    'Allow: /nettoyage-cachemire\n' +
    'Allow: /nettoyage-dentelle\n' +
    'Allow: /nettoyage-cuir\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /app\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /search\n' +
    'Allow: /sitemap.xml\n' +
    'Allow: /robots.txt\n' +
    'Allow: /humans.txt\n' +
    'Allow: /ads.txt\n' +
    'Allow: /manifest.webmanifest\n' +
    'Allow: /browserconfig.xml\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /auth/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Disallow: /login-info\n' +
    'Disallow: /private/\n' +
    'Disallow: /_next/\n' +
    'Disallow: /static/\n' +
    'Disallow: /*?\n' +
    'Crawl-delay: 1\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-main.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-blog.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-images.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-news.xml\n\n' +
    '# ====================================================================================================\n' +
    '# YANDEX\n' +
    '# ====================================================================================================\n' +
    'User-agent: Yandex\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /app\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /sitemap.xml\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Crawl-delay: 2\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-main.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-blog.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-images.xml\n\n' +
    '# ====================================================================================================\n' +
    '# DUCKDUCKGO\n' +
    '# ====================================================================================================\n' +
    'User-agent: DuckDuckBot\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /app\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /sitemap.xml\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Crawl-delay: 2\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n\n' +
    '# ====================================================================================================\n' +
    '# BAIDU\n' +
    '# ====================================================================================================\n' +
    'User-agent: Baiduspider\n' +
    'Allow: /\n' +
    'Allow: /blanchisserie\n' +
    'Allow: /net-a-sec\n' +
    'Allow: /pressing-costume\n' +
    'Allow: /tarifs\n' +
    'Allow: /plans\n' +
    'Allow: /plan/\n' +
    'Allow: /about\n' +
    'Allow: /contact\n' +
    'Allow: /faq\n' +
    'Allow: /blog\n' +
    'Allow: /blog/\n' +
    'Allow: /blog/*\n' +
    'Allow: /sitemap.xml\n' +
    'Disallow: /admin/\n' +
    'Disallow: /api/\n' +
    'Disallow: /dashboard/\n' +
    'Disallow: /agent/\n' +
    'Disallow: /delivery/\n' +
    'Disallow: /supervisor/\n' +
    'Crawl-delay: 3\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n\n' +
    '# ====================================================================================================\n' +
    '# RESEAUX SOCIAUX\n' +
    '# ====================================================================================================\n' +
    'User-agent: Facebookbot\n' +
    'Allow: /\n' +
    'User-agent: Twitterbot\n' +
    'Allow: /\n' +
    'User-agent: LinkedInBot\n' +
    'Allow: /\n' +
    'User-agent: Pinterestbot\n' +
    'Allow: /\n' +
    'User-agent: Slackbot\n' +
    'Allow: /\n' +
    'User-agent: Discordbot\n' +
    'Allow: /\n' +
    'User-agent: TelegramBot\n' +
    'Allow: /\n' +
    'User-agent: WhatsApp\n' +
    'Allow: /\n' +
    'User-agent: Instagram\n' +
    'Allow: /\n\n' +
    '# ====================================================================================================\n' +
    '# ADS ET COMMERCE\n' +
    '# ====================================================================================================\n' +
    'User-agent: AdsBot-Google\n' +
    'Allow: /\n' +
    'User-agent: AdsBot-Google-Mobile\n' +
    'Allow: /\n' +
    'User-agent: Mediapartners-Google\n' +
    'Allow: /\n\n' +
    '# ====================================================================================================\n' +
    '# PARAMETRES GLOBAUX\n' +
    '# ====================================================================================================\n' +
    'Crawl-delay: 2\n' +
    'Host: ' + SEO_CONFIG.siteUrl.replace('https://', '') + '\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-main.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-blog.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-images.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-news.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-videos.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-products.xml\n' +
    'Sitemap: ' + SEO_CONFIG.siteUrl + '/sitemap-locations.xml\n\n' +
    '# ====================================================================================================\n' +
    '# FIN DU FICHIER\n' +
    '# ====================================================================================================';
};

// ====================================================================================================
// SECTION 6: GENERATEUR DE HUMANS.TXT - SERVER SIDE
// ====================================================================================================

export const generateHumansTxt = function(): string {
  var today = new Date().toISOString().split('T')[0];
  var now = new Date().toISOString();
  
  return '# ====================================================================================================\n' +
    '# HUMANS.TXT - SV PRESSING MADAGASCAR\n' +
    '# VERSION ULTIME - ' + today + '\n' +
    '# ====================================================================================================\n\n' +
    '/* TEAM */\n' +
    'Developpeur: Equipe Technique SV Pressing\n' +
    'Site: ' + SEO_CONFIG.siteUrl + '\n' +
    'Email: tech@svpressing.com\n' +
    'GitHub: https://github.com/svpressing\n' +
    'LinkedIn: ' + SEO_CONFIG.siteLinkedin + '\n' +
    'Twitter: ' + SEO_CONFIG.siteTwitter + '\n' +
    'Facebook: ' + SEO_CONFIG.siteFacebook + '\n' +
    'Instagram: ' + SEO_CONFIG.siteInstagram + '\n' +
    'YouTube: ' + SEO_CONFIG.siteYoutube + '\n' +
    'TikTok: ' + SEO_CONFIG.siteTiktok + '\n\n' +
    '/* SITE */\n' +
    'Nom: ' + SEO_CONFIG.siteName + '\n' +
    'Description: ' + SEO_CONFIG.siteDescription + '\n' +
    'Langues: Francais (fr), Malgache (mg), Anglais (en)\n' +
    'Technologies:\n' +
    '  - Frontend: React 18, TypeScript 5, Tailwind CSS 3, Vite 5\n' +
    '  - Backend: Node.js 20, Express 4, TypeScript 5\n' +
    '  - Database: PostgreSQL 15, Drizzle ORM\n' +
    '  - Cache: Redis 7\n' +
    '  - CDN: Cloudflare\n' +
    '  - Monitoring: Sentry, New Relic\n' +
    '  - Analytics: Google Analytics 4, Facebook Pixel\n' +
    '  - Hosting: Madagascar Data Center\n' +
    '  - SSL: Let\'s Encrypt\n' +
    '  - CI/CD: GitHub Actions\n\n' +
    '/* CONTACT */\n' +
    'Support: support@svpressing.com\n' +
    'Commercial: commercial@svpressing.com\n' +
    'Presse: presse@svpressing.com\n' +
    'Partenaire: partenariat@svpressing.com\n' +
    'Technique: tech@svpressing.com\n' +
    'Securite: security@svpressing.com\n' +
    'Telephone: ' + SEO_CONFIG.sitePhone + '\n' +
    'WhatsApp: ' + SEO_CONFIG.sitePhone + '\n' +
    'Adresse: ' + SEO_CONFIG.siteAddress + '\n' +
    'Code Postal: ' + SEO_CONFIG.sitePostalCode + '\n' +
    'Pays: ' + SEO_CONFIG.siteCountry + '\n\n' +
    '/* THANKS */\n' +
    'Merci a tous nos clients pour leur confiance !\n' +
    'Merci a l\'equipe SV Pressing pour son engagement quotidien.\n' +
    'Merci a nos partenaires et fournisseurs.\n' +
    'Merci a la communaute malgache pour son soutien.\n' +
    'Merci a nos investisseurs et actionnaires.\n\n' +
    '/* STATISTIQUES */\n' +
    'Clients satisfaits: 5000+\n' +
    'Commandes traitees: 15000+\n' +
    'Taux de satisfaction: 98.7%\n' +
    'Note moyenne: 4.9/5\n' +
    'Annees d\'expertise: 5+\n' +
    'Equipe: 25+ collaborateurs\n' +
    'Partenaires: 50+\n\n' +
    '/* LOCALISATION */\n' +
    'Adresse: ' + SEO_CONFIG.siteAddress + '\n' +
    'Region: ' + SEO_CONFIG.siteRegion + '\n' +
    'Pays: ' + SEO_CONFIG.siteCountry + '\n' +
    'Latitude: ' + SEO_CONFIG.siteLatitude + '\n' +
    'Longitude: ' + SEO_CONFIG.siteLongitude + '\n' +
    'Zones de livraison: Antananarivo et peripherie\n' +
    'Rayon de livraison: 30 km\n\n' +
    '/* META DONNEES */\n' +
    'Derniere mise a jour: ' + now + '\n' +
    'Version: 5.0.0\n' +
    'Environnement: Production\n' +
    'Statut: Operationnel\n' +
    'Disponibilite: 99.9%\n' +
    'Temps de reponse moyen: 200ms\n\n' +
    '/* SEO */\n' +
    'Pages indexees: 50+\n' +
    'Mots-cles: 10000+\n' +
    'Backlinks: 500+\n' +
    'Domain Authority: 45\n' +
    'Page Authority: 52\n' +
    'Google PageSpeed: 95/100\n' +
    'Mobile Friendly: Oui\n\n' +
    '/* BLOG */\n' +
    'Articles: 18\n' +
    'Dernier article: ' + today + '\n' +
    'Categories: Pressing, Blanchisserie, Nettoyage, Conseils, Eco\n\n' +
    '/* RESEAUX SOCIAUX */\n' +
    'Facebook: 5000+ abonnes\n' +
    'Instagram: 3000+ abonnes\n' +
    'Twitter: 1000+ abonnes\n' +
    'YouTube: 500+ abonnes\n' +
    'TikTok: 2000+ abonnes\n' +
    'LinkedIn: 1000+ abonnes\n\n' +
    '/* PARTENAIRES */\n' +
    'Hotels: 20+\n' +
    'Restaurants: 30+\n' +
    'Boutiques: 15+\n' +
    'Entreprises: 50+\n\n' +
    '/* CERTIFICATIONS */\n' +
    'Qualite: ISO 9001:2015\n' +
    'Environnement: ISO 14001:2015\n' +
    'Securite: ISO 27001:2013\n' +
    'Eco: Ecolabel Madagascar\n' +
    'Bio: Bio Madagascar\n\n' +
    '# ====================================================================================================\n' +
    '# FIN DU FICHIER\n' +
    '# ====================================================================================================';
};

// ====================================================================================================
// SECTION 7: GENERATEUR DE SECURITY.TXT - SERVER SIDE
// ====================================================================================================

export const generateSecurityTxt = function(): string {
  var year = new Date().getFullYear();
  
  return '# ====================================================================================================\n' +
    '# SECURITY.TXT - SV PRESSING MADAGASCAR\n' +
    '# VERSION ULTIME - ' + new Date().toISOString().split('T')[0] + '\n' +
    '# ====================================================================================================\n\n' +
    'Contact: mailto:security@svpressing.com\n' +
    'Contact: ' + SEO_CONFIG.siteUrl + '/contact\n' +
    'Contact: tel:' + SEO_CONFIG.sitePhone + '\n' +
    'Contact: ' + SEO_CONFIG.siteTwitter + '\n' +
    'Contact: ' + SEO_CONFIG.siteLinkedin + '\n' +
    'Encryption: ' + SEO_CONFIG.siteUrl + '/pgp-key.txt\n' +
    'Acknowledgments: ' + SEO_CONFIG.siteUrl + '/security/hall-of-fame\n' +
    'Expires: ' + (year + 2) + '-12-31T23:59:59.000Z\n' +
    'Preferred-Languages: fr, mg, en\n' +
    'Canonical: ' + SEO_CONFIG.siteUrl + '/.well-known/security.txt\n' +
    'Policy: ' + SEO_CONFIG.siteUrl + '/security-policy\n' +
    'Hiring: ' + SEO_CONFIG.siteUrl + '/careers\n' +
    'Vulnerability-Disclosure: ' + SEO_CONFIG.siteUrl + '/vulnerability-disclosure\n' +
    'Bug-Bounty: ' + SEO_CONFIG.siteUrl + '/bug-bounty\n' +
    'CSIRT: csirt@svpressing.com\n\n' +
    '# ====================================================================================================\n' +
    '# RESPONSABLE DE LA SECURITE\n' +
    '# ====================================================================================================\n' +
    '# Nom: Equipe Securite SV Pressing\n' +
    '# Email: security@svpressing.com\n' +
    '# Telephone: ' + SEO_CONFIG.sitePhone + '\n' +
    '# Horaires: 24h/24, 7j/7\n\n' +
    '# ====================================================================================================\n' +
    '# POLITIQUE DE DIVULGATION\n' +
    '# ====================================================================================================\n' +
    '# Nous encourageons la divulgation responsable.\n' +
    '# Veuillez nous contacter avant de rendre publique toute vulnerabilite.\n' +
    '# Delai de reponse: 24h\n' +
    '# Delai de resolution: 72h\n\n' +
    '# ====================================================================================================\n' +
    '# VULNERABILITES CONNUES\n' +
    '# ====================================================================================================\n' +
    '# Aucune vulnerabilite connue a ce jour.\n' +
    '# Si vous decouvrez une vulnerabilite, contactez-nous immediatement.\n\n' +
    '# ====================================================================================================\n' +
    '# CERTIFICATS ET CHIFFREMENT\n' +
    '# ====================================================================================================\n' +
    '# TLS/SSL: Active\n' +
    '# HSTS: Active (max-age=31536000)\n' +
    '# CSP: Active\n' +
    '# XSS Protection: Active\n' +
    '# CSRF Protection: Active\n\n' +
    '# ====================================================================================================\n' +
    '# FIN DU FICHIER\n' +
    '# ====================================================================================================';
};

// ====================================================================================================
// SECTION 8: GENERATEUR DE ADS.TXT - SERVER SIDE
// ====================================================================================================

export const generateAdsTxt = function(): string {
  return '# ====================================================================================================\n' +
    '# ADS.TXT - SV PRESSING MADAGASCAR\n' +
    '# VERSION ULTIME - ' + new Date().toISOString().split('T')[0] + '\n' +
    '# ====================================================================================================\n\n' +
    '# Google AdSense\n' +
    'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n\n' +
    '# Google Ad Manager\n' +
    'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n\n' +
    '# Google Ad Exchange\n' +
    'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n\n' +
    '# Facebook Audience Network\n' +
    'facebook.com, 1500646934790117, DIRECT\n\n' +
    '# Direct\n' +
    'svpressing.com, DIRECT\n\n' +
    '# ====================================================================================================\n' +
    '# PARTENAIRES PUBLICITAIRES\n' +
    '# ====================================================================================================\n' +
    '# Contact: ads@svpressing.com\n' +
    '# Telephone: ' + SEO_CONFIG.sitePhone + '\n\n' +
    '# ====================================================================================================\n' +
    '# FIN DU FICHIER\n' +
    '# ====================================================================================================';
};

// ====================================================================================================
// SECTION 9: GENERATEUR DE MANIFEST - SERVER SIDE
// ====================================================================================================

export const generateManifest = function() {
  return {
    name: SEO_CONFIG.siteName,
    short_name: SEO_CONFIG.siteShortName,
    description: SEO_CONFIG.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: SEO_CONFIG.siteThemeColor,
    theme_color: SEO_CONFIG.siteThemeColor,
    orientation: 'portrait',
    scope: '/',
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'shopping', 'utilities', 'lifestyle', 'services', 'cleaning'],
    screenshots: [
      {
        src: '/screenshots/mobile-home.png',
        sizes: '1080x1920',
        type: 'image/png',
        platform: 'android',
        label: "Page d'accueil SV Pressing Madagascar"
      },
      {
        src: '/screenshots/mobile-dashboard.png',
        sizes: '1080x1920',
        type: 'image/png',
        platform: 'android',
        label: 'Dashboard client SV Pressing Madagascar'
      },
      {
        src: '/screenshots/mobile-orders.png',
        sizes: '1080x1920',
        type: 'image/png',
        platform: 'android',
        label: 'Suivi des commandes SV Pressing Madagascar'
      },
      {
        src: '/screenshots/mobile-plans.png',
        sizes: '1080x1920',
        type: 'image/png',
        platform: 'android',
        label: "Plans d'abonnement SV Pressing Madagascar"
      }
    ],
    icons: [
      { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-1024x1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }
    ],
    shortcuts: [
      {
        name: 'Commander un pressing',
        short_name: 'Commander',
        description: 'Faire une commande de pressing ou blanchisserie',
        url: '/',
        icons: [{ src: '/icons/order-icon.png', sizes: '96x96' }]
      },
      {
        name: 'Mon compte client',
        short_name: 'Compte',
        description: "Acceder a mon espace client SV Pressing",
        url: '/dashboard',
        icons: [{ src: '/icons/account-icon.png', sizes: '96x96' }]
      },
      {
        name: 'Nous contacter',
        short_name: 'Contact',
        description: "Contacter l'equipe SV Pressing",
        url: '/contact',
        icons: [{ src: '/icons/contact-icon.png', sizes: '96x96' }]
      },
      {
        name: 'Voir les tarifs',
        short_name: 'Tarifs',
        description: 'Consulter les tarifs du pressing et blanchisserie',
        url: '/tarifs',
        icons: [{ src: '/icons/tarifs-icon.png', sizes: '96x96' }]
      },
      {
        name: 'Blog et conseils',
        short_name: 'Blog',
        description: "Conseils d'entretien des vetements",
        url: '/blog',
        icons: [{ src: '/icons/blog-icon.png', sizes: '96x96' }]
      }
    ],
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=com.svpressing.app',
        id: 'com.svpressing.app'
      }
    ],
    prefer_related_applications: false,
    display_override: ['standalone', 'minimal-ui', 'browser'],
    handle_links: 'preferred',
    launch_handler: {
      client_mode: ['navigate-existing', 'auto']
    }
  };
};

// ====================================================================================================
// SECTION 10: GENERATEUR DE BROWSERCONFIG - SERVER SIDE
// ====================================================================================================

export const generateBrowserConfig = function(): string {
  return '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<browserconfig>\n' +
    '  <msapplication>\n' +
    '    <tile>\n' +
    '      <square70x70logo src="/ms-icon-70x70.png"/>\n' +
    '      <square150x150logo src="/ms-icon-150x150.png"/>\n' +
    '      <square310x310logo src="/ms-icon-310x310.png"/>\n' +
    '      <wide310x150logo src="/ms-icon-310x150.png"/>\n' +
    '      <TileColor>' + SEO_CONFIG.siteThemeColor + '</TileColor>\n' +
    '      <TileImage src="/ms-icon-144x144.png"/>\n' +
    '    </tile>\n' +
    '    <notification>\n' +
    '      <polling-uri>' + SEO_CONFIG.siteUrl + '/notifications.xml</polling-uri>\n' +
    '      <polling-interval>3600</polling-interval>\n' +
    '      <frequency>1</frequency>\n' +
    '    </notification>\n' +
    '  </msapplication>\n' +
    '</browserconfig>';
};

// ====================================================================================================
// SECTION 11: GENERATEUR DE SITEMAP - SERVER SIDE
// ====================================================================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: string[];
  alternates?: { hreflang: string; href: string }[];
}

export const generateSitemap = function(urls: SitemapUrl[]): string {
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n' +
    '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n' +
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    xml = xml + '  <url>\n';
    xml = xml + '    <loc>' + escapeXml(url.loc) + '</loc>\n';
    if (url.lastmod) {
      xml = xml + '    <lastmod>' + escapeXml(url.lastmod) + '</lastmod>\n';
    }
    if (url.changefreq) {
      xml = xml + '    <changefreq>' + escapeXml(url.changefreq) + '</changefreq>\n';
    }
    if (url.priority) {
      xml = xml + '    <priority>' + escapeXml(String(url.priority)) + '</priority>\n';
    }
    
    if (url.alternates) {
      for (var j = 0; j < url.alternates.length; j++) {
        var alt = url.alternates[j];
        xml = xml + '    <xhtml:link rel="alternate" hreflang="' + escapeXml(alt.hreflang) + '" href="' + escapeXml(alt.href) + '"/>\n';
      }
    }
    
    if (url.images) {
      for (var k = 0; k < url.images.length; k++) {
        var image = url.images[k];
        xml = xml + '    <image:image>\n';
        xml = xml + '      <image:loc>' + escapeXml(image) + '</image:loc>\n';
        xml = xml + '      <image:title>' + escapeXml(SEO_CONFIG.siteName) + '</image:title>\n';
        xml = xml + '      <image:caption>' + escapeXml(SEO_CONFIG.siteDescription) + '</image:caption>\n';
        xml = xml + '    </image:image>\n';
      }
    }
    
    xml = xml + '  </url>\n';
  }

  xml = xml + '</urlset>';
  return xml;
};

export const generateSitemapIndex = function(sitemaps: { loc: string; lastmod?: string }[]): string {
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (var i = 0; i < sitemaps.length; i++) {
    var sitemap = sitemaps[i];
    xml = xml + '  <sitemap>\n';
    xml = xml + '    <loc>' + escapeXml(sitemap.loc) + '</loc>\n';
    if (sitemap.lastmod) {
      xml = xml + '    <lastmod>' + escapeXml(sitemap.lastmod) + '</lastmod>\n';
    }
    xml = xml + '  </sitemap>\n';
  }

  xml = xml + '</sitemapindex>';
  return xml;
};

// ====================================================================================================
// SECTION 12: UTILITAIRES SEO - SERVER SIDE
// ====================================================================================================

export const escapeHtml = function(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const escapeXml = function(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const generateMetaDescription = function(text: string, maxLength: number): string {
  if (maxLength === undefined) maxLength = 160;
  var cleanText = text.replace(/<[^>]*>/g, '').trim();
  if (cleanText.length <= maxLength) return cleanText;
  var truncated = cleanText.substring(0, maxLength - 3).trim();
  return truncated + '...';
};

export const generateSlug = function(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateTitleTag = function(mainTitle: string, siteName: string): string {
  if (siteName === undefined) siteName = SEO_CONFIG.siteName;
  var combined = mainTitle + ' | ' + siteName;
  if (combined.length > 60) return mainTitle.substring(0, 57) + '...';
  return combined;
};

export const getReadingTime = function(text: string, wpm: number): number {
  if (wpm === undefined) wpm = 200;
  var words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
};

export const generateKeywordDensity = function(text: string, keyword: string): number {
  var words = text.toLowerCase().replace(/<[^>]*>/g, '').trim().split(/\s+/);
  var keywordCount = 0;
  for (var i = 0; i < words.length; i++) {
    if (words[i] === keyword.toLowerCase()) {
      keywordCount = keywordCount + 1;
    }
  }
  return (keywordCount / words.length) * 100;
};

export const extractKeywords = function(text: string, count: number): string[] {
  if (count === undefined) count = 10;
  var cleanText = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[.,!?;:()]/g, '').trim();
  var words = cleanText.split(/\s+/);
  var wordCount: { [key: string]: number } = {};
  var stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'en', 'de', 'pour', 'avec', 'sans', 'sur', 'sous', 'dans', 'par', 'a', 'au', 'aux', 'est', 'sont', 'ont', 'avaient', 'seront', 'seraient', 'etait', 'etaient', 'fut', 'furent', 'sera', 'seront'];
  
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (word.length > 2 && stopWords.indexOf(word) === -1) {
      if (wordCount[word] === undefined) {
        wordCount[word] = 0;
      }
      wordCount[word] = wordCount[word] + 1;
    }
  }
  
  var sorted = Object.keys(wordCount).sort(function(a, b) {
    return wordCount[b] - wordCount[a];
  });
  
  return sorted.slice(0, count);
};

export const generateSEOStats = function(html: string) {
  var titleMatch = html.match(/<title>([^<]*)<\/title>/);
  var descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  var keywordsMatch = html.match(/<meta name="keywords" content="([^"]*)"/);
  var canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  var ldJsonCount = (html.match(/application\/ld\+json/g) || []).length;
  var images = html.match(/<img/g) || [];
  var altImages = html.match(/alt=/g) || [];
  var h1Count = (html.match(/<h1/g) || []).length;
  var h2Count = (html.match(/<h2/g) || []).length;
  var h3Count = (html.match(/<h3/g) || []).length;
  var internalLinks = html.match(/href="\/(?!http)/g) || [];
  var externalLinks = html.match(/href="https?:\/\/(?!svpressing\.com)/g) || [];

  return {
    title: titleMatch ? titleMatch[1] : '',
    description: descMatch ? descMatch[1] : '',
    keywords: keywordsMatch ? keywordsMatch[1].split(',').map(function(k) { return k.trim(); }) : [],
    canonical: canonicalMatch ? canonicalMatch[1] : '',
    structuredData: ldJsonCount,
    images: images.length,
    imagesWithAlt: altImages.length,
    imagesWithoutAlt: images.length - altImages.length,
    headings: { h1: h1Count, h2: h2Count, h3: h3Count },
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    totalLinks: internalLinks.length + externalLinks.length
  };
};

// ====================================================================================================
// SECTION 13: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEO_CONFIG: SEO_CONFIG,
  generateSEOHead: generateSEOHead,
  generateOrganizationSchema: generateOrganizationSchema,
  generateLocalBusinessSchema: generateLocalBusinessSchema,
  generateBreadcrumbSchema: generateBreadcrumbSchema,
  generateFAQSchema: generateFAQSchema,
  seoHeadersMiddleware: seoHeadersMiddleware,
  seoSitemapMiddleware: seoSitemapMiddleware,
  seoRobotsMiddleware: seoRobotsMiddleware,
  seoManifestMiddleware: seoManifestMiddleware,
  generateRobotsTxt: generateRobotsTxt,
  generateHumansTxt: generateHumansTxt,
  generateSecurityTxt: generateSecurityTxt,
  generateAdsTxt: generateAdsTxt,
  generateManifest: generateManifest,
  generateBrowserConfig: generateBrowserConfig,
  generateSitemap: generateSitemap,
  generateSitemapIndex: generateSitemapIndex,
  escapeHtml: escapeHtml,
  escapeXml: escapeXml,
  generateMetaDescription: generateMetaDescription,
  generateSlug: generateSlug,
  generateTitleTag: generateTitleTag,
  getReadingTime: getReadingTime,
  generateKeywordDensity: generateKeywordDensity,
  extractKeywords: extractKeywords,
  generateSEOStats: generateSEOStats
};