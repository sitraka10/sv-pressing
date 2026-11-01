// client/src/lib/seo.helpers.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO HELPERS ULTIME
// VERSION COMPLETE NON COMPRESSÉE
// ====================================================================================================

import React from 'react';
import { Helmet } from 'react-helmet-async';

// ====================================================================================================
// SECTION 1: CONFIGURATION SEO DE BASE
// ====================================================================================================

export const SITE_CONFIG = {
  name: 'SV Pressing Madagascar',
  shortName: 'SV Pressing',
  description: 'Service de pressing professionnel, blanchisserie et nettoyage à sec à Antananarivo, Madagascar - Leader du marché, meilleur que Sasa Vanda, Clean Press, Speed Clean, Express Pressing, Top Clean, Laundry Service MG',
  url: 'https://svpressing.com',
  logo: 'https://svpressing.com/logo-svpressing.png',
  ogImage: 'https://svpressing.com/og-image-svpressing-ultimate.jpg',
  twitterHandle: '@svpressing',
  locale: 'fr_MG',
  alternates: ['fr', 'mg', 'en'],
  phone: '+261 34 99 483 01',
  email: 'contact.sasavanda@gmail.com',
  address: 'Antananarivo, Analamanga, Madagascar',
  postalCode: '101',
  country: 'Madagascar',
  region: 'Analamanga',
  city: 'Antananarivo',
  latitude: '-18.8792',
  longitude: '47.5079',
  facebook: 'https://www.facebook.com/sasavandapressing',
  instagram: 'https://www.instagram.com/svpressing',
  twitter: 'https://twitter.com/svpressing',
  linkedin: 'https://www.linkedin.com/company/svpressing',
  youtube: 'https://youtube.com/@svpressing',
  tiktok: 'https://tiktok.com/@svpressing'
};

// ====================================================================================================
// SECTION 2: MOTS-CLES
// ====================================================================================================

export const SEO_KEYWORDS = {
  services: [
    'pressing', 'blanchisserie', 'net a sec', 'nettoyage a sec',
    'laundry service', 'fanasan damba', 'lavage', 'repassage',
    'nettoyage professionnel', 'blanchiment', 'desinfection',
    'sechage', 'entretien vetements', 'restauration textile',
    'conservation vetements'
  ],
  textiles: [
    'costume', 'robe de soiree', 'soie', 'laine', 'cachemire',
    'coton', 'lin', 'velours', 'daim', 'cuir', 'dentelle',
    'tulle', 'organza', 'satin', 'jersey', 'maille', 'polaire'
  ],
  quartiers: [
    'Analamanga', 'Ambohidratrimo', 'Andramasina', 'Anjozorobe',
    'Manjakandriana', 'Antananarivo Centre', 'Ivato Aeroport',
    'Ambatobe', 'Ampefiloha', 'Analakely', 'Anosy',
    'Ankorondrano', 'Ankadifotsy', 'Ankadimbahoaka'
  ],
  concurrents: [
    'Sasa Vanda', 'Clean Press', 'Speed Clean', 'Express Pressing',
    'Top Clean', 'Laundry Service MG', 'Pressing de Luxe'
  ],
  adjectifs: [
    'meilleur', 'moins cher', 'plus rapide', 'ecologique',
    'professionnel', 'confiance', 'recommande', 'premium'
  ]
};

// ====================================================================================================
// SECTION 3: GENERATEUR DE MOTS-CLES
// ====================================================================================================

export const generateAllKeywords = function(): string[] {
  var services = SEO_KEYWORDS.services;
  var textiles = SEO_KEYWORDS.textiles;
  var quartiers = SEO_KEYWORDS.quartiers;
  var concurrents = SEO_KEYWORDS.concurrents;
  var adjectifs = SEO_KEYWORDS.adjectifs;
  
  var allKeywords: string[] = [];

  for (var s = 0; s < services.length; s++) {
    for (var c = 0; c < concurrents.length; c++) {
      for (var q = 0; q < quartiers.length; q++) {
        allKeywords.push(services[s] + ' ' + concurrents[c] + ' ' + quartiers[q]);
        allKeywords.push(services[s] + ' meilleur que ' + concurrents[c] + ' ' + quartiers[q]);
        allKeywords.push(concurrents[c] + ' vs ' + services[s] + ' ' + quartiers[q]);
      }
    }
  }

  for (var s2 = 0; s2 < services.length; s2++) {
    for (var t = 0; t < textiles.length; t++) {
      for (var q2 = 0; q2 < quartiers.length; q2++) {
        allKeywords.push(services[s2] + ' ' + textiles[t] + ' ' + quartiers[q2]);
        allKeywords.push(textiles[t] + ' ' + services[s2] + ' ' + quartiers[q2]);
      }
    }
  }

  for (var a = 0; a < adjectifs.length; a++) {
    for (var s3 = 0; s3 < services.length; s3++) {
      for (var c2 = 0; c2 < concurrents.length; c2++) {
        allKeywords.push(adjectifs[a] + ' ' + services[s3] + ' ' + concurrents[c2]);
        allKeywords.push(services[s3] + ' ' + adjectifs[a] + ' ' + concurrents[c2]);
      }
    }
  }

  var phrases = [
    'SV Pressing est le meilleur pressing a Antananarivo',
    'SV Pressing moins cher que Sasa Vanda',
    'SV Pressing meilleur que Clean Press',
    'SV Pressing offre un service superieur a Speed Clean',
    'SV Pressing recommande par les clients'
  ];
  
  for (var p = 0; p < phrases.length; p++) {
    allKeywords.push(phrases[p]);
  }

  var uniqueKeywords: string[] = [];
  var seen: { [key: string]: boolean } = {};
  for (var k = 0; k < allKeywords.length; k++) {
    var keyword = allKeywords[k];
    if (!seen[keyword]) {
      seen[keyword] = true;
      uniqueKeywords.push(keyword);
    }
  }
  
  return uniqueKeywords.slice(0, 10000);
};

// ====================================================================================================
// SECTION 4: GENERATEUR DE STRUCTURED DATA - SCHEMAS
// ====================================================================================================

export const generateOrganizationSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE_CONFIG.url + '/#organization',
    'name': SITE_CONFIG.name,
    'alternateName': ['SV Pressing', 'Net a Sec SV'],
    'url': SITE_CONFIG.url,
    'logo': SITE_CONFIG.logo,
    'description': SITE_CONFIG.description,
    'email': SITE_CONFIG.email,
    'telephone': SITE_CONFIG.phone,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': SITE_CONFIG.city,
      'addressRegion': SITE_CONFIG.region,
      'addressCountry': SITE_CONFIG.country,
      'postalCode': SITE_CONFIG.postalCode
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': SITE_CONFIG.phone,
      'contactType': 'customer service',
      'email': SITE_CONFIG.email,
      'availableLanguage': ['French', 'Malagasy', 'English']
    },
    'sameAs': [
      SITE_CONFIG.facebook,
      SITE_CONFIG.instagram,
      SITE_CONFIG.twitter,
      SITE_CONFIG.linkedin,
      SITE_CONFIG.youtube,
      SITE_CONFIG.tiktok
    ]
  };
};

export const generateLocalBusinessSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Laundry',
    '@id': SITE_CONFIG.url + '/#localbusiness',
    'name': SITE_CONFIG.name,
    'description': SITE_CONFIG.description,
    'url': SITE_CONFIG.url,
    'telephone': SITE_CONFIG.phone,
    'email': SITE_CONFIG.email,
    'priceRange': '$$',
    'currenciesAccepted': 'MGA',
    'paymentAccepted': 'Cash, Mobile Money, Credit Card, Bank Transfer',
    'openingHours': 'Mo-Su 08:00-20:00',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': SITE_CONFIG.city,
      'addressRegion': SITE_CONFIG.region,
      'addressCountry': SITE_CONFIG.country,
      'postalCode': SITE_CONFIG.postalCode
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': SITE_CONFIG.latitude,
      'longitude': SITE_CONFIG.longitude
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
// SECTION 5: SCHEMAS SUPPLEMENTAIRES
// ====================================================================================================

export const generateWebPageSchema = function(config: {
  name: string;
  description: string;
  url: string;
  primaryImage?: string;
}) {
  var schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': config.name,
    'description': config.description,
    'url': config.url,
    'inLanguage': ['fr', 'mg', 'en'],
    'isPartOf': {
      '@type': 'WebSite',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.url
    }
  };
  if (config.primaryImage) {
    schema.primaryImageOfPage = {
      '@type': 'ImageObject',
      'url': config.primaryImage
    };
  }
  return schema;
};

export const generateArticleSchema = function(config: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  publisher: string;
  keywords?: string[];
  section?: string;
}) {
  var schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': config.headline,
    'description': config.description,
    'url': config.url,
    'datePublished': config.datePublished,
    'author': {
      '@type': 'Person',
      'name': config.author
    },
    'publisher': {
      '@type': 'Organization',
      'name': config.publisher,
      'logo': {
        '@type': 'ImageObject',
        'url': SITE_CONFIG.logo
      }
    },
    'inLanguage': 'fr',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': config.url
    }
  };
  if (config.image) {
    schema.image = config.image;
  }
  if (config.dateModified) {
    schema.dateModified = config.dateModified;
  }
  if (config.keywords) {
    schema.keywords = config.keywords.join(', ');
  }
  if (config.section) {
    schema.articleSection = config.section;
  }
  return schema;
};

export const generateProductSchema = function(products: {
  name: string;
  description: string;
  price: string;
  currency: string;
  availability: string;
}[]) {
  var itemListElement = [];
  for (var i = 0; i < products.length; i++) {
    itemListElement.push({
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': 'Product',
        'name': products[i].name,
        'description': products[i].description,
        'offers': {
          '@type': 'Offer',
          'price': products[i].price,
          'priceCurrency': products[i].currency,
          'availability': products[i].availability
        }
      }
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': "Formules d'abonnement SV Pressing",
    'numberOfItems': products.length,
    'itemListElement': itemListElement
  };
};

export const generateServiceSchema = function(services: {
  name: string;
  description: string;
  url: string;
}[]) {
  var itemListElement = [];
  for (var i = 0; i < services.length; i++) {
    itemListElement.push({
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': 'Service',
        'name': services[i].name,
        'description': services[i].description,
        'url': services[i].url,
        'provider': {
          '@type': 'Organization',
          'name': SITE_CONFIG.name
        },
        'areaServed': 'Antananarivo, Madagascar',
        'availableLanguage': ['French', 'Malagasy', 'English']
      }
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Services SV Pressing Madagascar',
    'numberOfItems': services.length,
    'itemListElement': itemListElement
  };
};

export const generateReviewSchema = function(reviews: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}[]) {
  var totalRating = 0;
  var reviewList = [];
  for (var i = 0; i < reviews.length; i++) {
    totalRating = totalRating + reviews[i].rating;
    reviewList.push({
      '@type': 'Review',
      'author': {
        '@type': 'Person',
        'name': reviews[i].author
      },
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': reviews[i].rating,
        'bestRating': '5'
      },
      'reviewBody': reviews[i].reviewBody,
      'datePublished': reviews[i].datePublished
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    'ratingValue': totalRating / reviews.length,
    'reviewCount': reviews.length,
    'bestRating': '5',
    'worstRating': '1',
    'review': reviewList
  };
};

// ====================================================================================================
// SECTION 6: SCHEMAS SERVICES SPECIALISES
// ====================================================================================================

export const generatePressingServiceSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Pressing',
    'name': 'Pressing Professionnel SV Madagascar',
    'description': 'Service de pressing professionnel pour tous types de vetements a Antananarivo',
    'provider': {
      '@type': 'Organization',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.url
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Antananarivo',
      'addressCountry': 'Madagascar'
    },
    'availableLanguage': ['French', 'Malagasy', 'English']
  };
};

export const generateBlanchisserieServiceSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Blanchisserie',
    'name': 'Blanchisserie Professionnelle SV Madagascar',
    'description': 'Service de blanchisserie professionnelle pour linge de maison, couettes, rideaux, tapis a Antananarivo',
    'provider': {
      '@type': 'Organization',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.url
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Antananarivo',
      'addressCountry': 'Madagascar'
    },
    'availableLanguage': ['French', 'Malagasy', 'English']
  };
};

export const generateNetASecServiceSchema = function() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Nettoyage a Sec',
    'name': 'Net a Sec Professionnel SV Madagascar',
    'description': 'Service de nettoyage a sec professionnel pour textiles delicats a Antananarivo',
    'provider': {
      '@type': 'Organization',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.url
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Antananarivo',
      'addressCountry': 'Madagascar'
    },
    'availableLanguage': ['French', 'Malagasy', 'English']
  };
};

// ====================================================================================================
// SECTION 7: GENERATEUR DE META TAGS
// ====================================================================================================

export interface SEOMetaTags {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
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
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

export const generateMetaTags = function(config: SEOMetaTags): React.ReactNode {
  var allKeywords = generateAllKeywords();
  
  var title = config.title || SITE_CONFIG.name;
  var description = config.description || SITE_CONFIG.description;
  var keywords = config.keywords || allKeywords.slice(0, 30);
  var canonical = config.canonical || SITE_CONFIG.url;
  var noIndex = config.noIndex || false;
  var noFollow = config.noFollow || false;
  var ogTitle = config.ogTitle || title;
  var ogDescription = config.ogDescription || description;
  var ogImage = config.ogImage || SITE_CONFIG.ogImage;
  var ogType = config.ogType || 'website';
  var ogUrl = config.ogUrl || canonical;
  var twitterCard = config.twitterCard || 'summary_large_image';
  var twitterSite = config.twitterSite || SITE_CONFIG.twitterHandle;
  var twitterTitle = config.twitterTitle || title;
  var twitterDescription = config.twitterDescription || description;
  var twitterImage = config.twitterImage || ogImage;
  var alternates = config.alternates || [];
  var structuredData = config.structuredData || [];
  var robots = config.robots || '';
  var author = config.author || SITE_CONFIG.name;
  var publishedTime = config.publishedTime || '';
  var modifiedTime = config.modifiedTime || '';
  var section = config.section || '';
  var tags = config.tags || [];

  var robotsContent = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  if (noIndex && noFollow) {
    robotsContent = 'noindex, nofollow';
  } else if (noIndex) {
    robotsContent = 'noindex, follow';
  } else if (noFollow) {
    robotsContent = 'index, nofollow';
  } else if (robots) {
    robotsContent = robots;
  }

  var alternatesElements = [];
  if (alternates.length > 0) {
    for (var i = 0; i < alternates.length; i++) {
      alternatesElements.push(
        React.createElement('link', {
          key: 'alt-' + i,
          rel: 'alternate',
          hrefLang: alternates[i].hreflang,
          href: alternates[i].href
        })
      );
    }
  } else {
    for (var j = 0; j < SITE_CONFIG.alternates.length; j++) {
      var lang = SITE_CONFIG.alternates[j];
      alternatesElements.push(
        React.createElement('link', {
          key: 'alt-' + j,
          rel: 'alternate',
          hrefLang: lang,
          href: SITE_CONFIG.url + '/' + lang
        })
      );
    }
  }

  var articleTags = [];
  for (var t = 0; t < tags.length; t++) {
    articleTags.push(
      React.createElement('meta', {
        key: 'tag-' + t,
        name: 'article:tag',
        content: tags[t]
      })
    );
  }

  var sdElements = [];
  for (var s = 0; s < structuredData.length; s++) {
    sdElements.push(
      React.createElement('script', {
        key: 'sd-' + s,
        type: 'application/ld+json',
        dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData[s]) }
      })
    );
  }

  return React.createElement(
    Helmet,
    null,
    React.createElement('title', null, title),
    React.createElement('meta', { name: 'description', content: description }),
    React.createElement('meta', { name: 'keywords', content: Array.isArray(keywords) ? keywords.slice(0, 30).join(', ') : keywords }),
    React.createElement('meta', { name: 'robots', content: robotsContent }),
    React.createElement('meta', { name: 'googlebot', content: robotsContent }),
    React.createElement('meta', { name: 'bingbot', content: robotsContent }),
    React.createElement('meta', { name: 'yandex', content: robotsContent }),
    React.createElement('link', { rel: 'canonical', href: canonical }),
    alternatesElements,
    React.createElement('meta', { property: 'og:site_name', content: SITE_CONFIG.name }),
    React.createElement('meta', { property: 'og:title', content: ogTitle }),
    React.createElement('meta', { property: 'og:description', content: ogDescription }),
    React.createElement('meta', { property: 'og:image', content: ogImage }),
    React.createElement('meta', { property: 'og:image:width', content: '1200' }),
    React.createElement('meta', { property: 'og:image:height', content: '630' }),
    React.createElement('meta', { property: 'og:image:type', content: 'image/jpeg' }),
    React.createElement('meta', { property: 'og:type', content: ogType }),
    React.createElement('meta', { property: 'og:url', content: ogUrl }),
    React.createElement('meta', { property: 'og:locale', content: SITE_CONFIG.locale }),
    React.createElement('meta', { property: 'og:locale:alternate', content: 'mg_MG' }),
    React.createElement('meta', { property: 'og:locale:alternate', content: 'en_MG' }),
    React.createElement('meta', { property: 'og:updated_time', content: new Date().toISOString() }),
    React.createElement('meta', { name: 'twitter:card', content: twitterCard }),
    React.createElement('meta', { name: 'twitter:site', content: twitterSite }),
    React.createElement('meta', { name: 'twitter:title', content: twitterTitle }),
    React.createElement('meta', { name: 'twitter:description', content: twitterDescription }),
    React.createElement('meta', { name: 'twitter:image', content: twitterImage }),
    React.createElement('meta', { name: 'twitter:image:alt', content: SITE_CONFIG.name }),
    React.createElement('meta', { name: 'author', content: author }),
    React.createElement('meta', { name: 'copyright', content: SITE_CONFIG.name }),
    publishedTime ? React.createElement('meta', { name: 'article:published_time', content: publishedTime }) : null,
    modifiedTime ? React.createElement('meta', { name: 'article:modified_time', content: modifiedTime }) : null,
    section ? React.createElement('meta', { name: 'article:section', content: section }) : null,
    articleTags,
    React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes' }),
    React.createElement('meta', { name: 'theme-color', content: '#0B676E' }),
    React.createElement('meta', { name: 'mobile-web-app-capable', content: 'yes' }),
    React.createElement('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }),
    React.createElement('meta', { name: 'apple-mobile-web-app-title', content: SITE_CONFIG.shortName }),
    React.createElement('meta', { name: 'application-name', content: SITE_CONFIG.name }),
    React.createElement('meta', { name: 'referrer', content: 'strict-origin-when-cross-origin' }),
    React.createElement('meta', { name: 'format-detection', content: 'telephone=yes' }),
    React.createElement('meta', { name: 'msapplication-TileColor', content: '#0B676E' }),
    React.createElement('meta', { name: 'msapplication-config', content: '/browserconfig.xml' }),
    React.createElement('meta', { name: 'geo.region', content: 'MG-A' }),
    React.createElement('meta', { name: 'geo.placename', content: SITE_CONFIG.city }),
    React.createElement('meta', { name: 'geo.position', content: SITE_CONFIG.latitude + ';' + SITE_CONFIG.longitude }),
    React.createElement('meta', { name: 'ICBM', content: SITE_CONFIG.latitude + ', ' + SITE_CONFIG.longitude }),
    sdElements
  );
};

// ====================================================================================================
// SECTION 8: ANALYSE SEO
// ====================================================================================================

export interface SEOAnalysisResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[];
  warnings: string[];
  recommendations: string[];
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
    canonical: string;
  };
  structuredData: number;
  images: number;
  links: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
}

export const analyzeSEO = function(html: string): SEOAnalysisResult {
  var issues: string[] = [];
  var warnings: string[] = [];
  var recommendations: string[] = [];
  var score = 100;

  var titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    var title = titleMatch[1];
    if (title.length < 30) {
      warnings.push('Le titre est trop court (< 30 caracteres)');
      score = score - 5;
    }
    if (title.length > 60) {
      warnings.push('Le titre est trop long (> 60 caracteres)');
      score = score - 5;
    }
  } else {
    issues.push('Balise title manquante');
    score = score - 20;
  }

  var descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  if (descMatch) {
    var desc = descMatch[1];
    if (desc.length < 80) {
      warnings.push('La meta description est trop courte (< 80 caracteres)');
      score = score - 5;
    }
    if (desc.length > 160) {
      warnings.push('La meta description est trop longue (> 160 caracteres)');
      score = score - 5;
    }
  } else {
    issues.push('Meta description manquante');
    score = score - 20;
  }

  if (html.indexOf('og:title') === -1) {
    warnings.push('Open Graph title manquant');
    score = score - 5;
  }
  if (html.indexOf('og:description') === -1) {
    warnings.push('Open Graph description manquant');
    score = score - 5;
  }
  if (html.indexOf('og:image') === -1) {
    warnings.push('Open Graph image manquant');
    score = score - 5;
  }
  if (html.indexOf('rel="canonical"') === -1) {
    issues.push('Balise canonical manquante');
    score = score - 15;
  }

  var ldJsonCount = (html.match(/application\/ld\+json/g) || []).length;
  if (ldJsonCount === 0) {
    warnings.push('Aucune donnee structuree (JSON-LD) trouvee');
    score = score - 10;
  }

  var images = html.match(/<img/g) || [];
  var altImages = html.match(/alt=/g) || [];
  if (images.length > 0 && altImages.length < images.length) {
    warnings.push('Certaines images n\'ont pas d\'attribut alt');
    score = score - 5;
  }

  var h1Count = (html.match(/<h1/g) || []).length;
  var h2Count = (html.match(/<h2/g) || []).length;
  var h3Count = (html.match(/<h3/g) || []).length;
  var h4Count = (html.match(/<h4/g) || []).length;
  var h5Count = (html.match(/<h5/g) || []).length;
  var h6Count = (html.match(/<h6/g) || []).length;

  if (h1Count === 0) {
    warnings.push('Aucune balise H1 trouvee');
    score = score - 10;
  }
  if (h1Count > 1) {
    warnings.push('Plusieurs balises H1 trouvees (une seule recommandee)');
    score = score - 5;
  }

  var internalLinks = html.match(/href="\/(?!http)/g) || [];
  if (internalLinks.length < 3) {
    warnings.push('Peu de liens internes (< 3)');
    score = score - 5;
  }

  var grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  if (score < 100) {
    recommendations.push('Ameliorer les metadonnees SEO');
    recommendations.push('Ajouter plus de donnees structurees');
    recommendations.push('Optimiser la structure des headings');
    recommendations.push('Ajouter des liens internes pertinents');
    recommendations.push('Optimiser les images avec des attributs alt');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    grade: grade,
    issues: issues,
    warnings: warnings,
    recommendations: recommendations,
    metaTags: {
      title: titleMatch ? titleMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      keywords: [],
      canonical: ''
    },
    structuredData: ldJsonCount,
    images: images.length,
    links: internalLinks.length,
    headings: {
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      h4: h4Count,
      h5: h5Count,
      h6: h6Count
    }
  };
};

// ====================================================================================================
// SECTION 9: META TAGS POUR PAGES SPECIFIQUES
// ====================================================================================================

export const getHomePageMeta = function() {
  return {
    title: 'SV Pressing Madagascar | N°1 Pressing, Blanchisserie et Net a Sec - Meilleur que Sasa Vanda, Clean Press, Speed Clean | Antananarivo',
    description: 'SV Pressing Madagascar - Leader du pressing, blanchisserie et nettoyage a sec. Collecte et livraison GRATUITES a Antananarivo. Meilleur que Sasa Vanda, Clean Press, Speed Clean. Service 7j/7. Produits ecologiques.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url,
    ogTitle: 'SV Pressing Madagascar - Pressing, Blanchisserie et Net a Sec',
    ogDescription: 'Leader du pressing a Madagascar. Collecte et livraison GRATUITES. Meilleur que Sasa Vanda, Clean Press.',
    ogType: 'website',
    structuredData: [
      generateOrganizationSchema(),
      generateLocalBusinessSchema(),
      generatePressingServiceSchema(),
      generateBlanchisserieServiceSchema(),
      generateNetASecServiceSchema()
    ]
  };
};

export const getBlanchisseriePageMeta = function() {
  return {
    title: 'Blanchisserie Professionnelle Antananarivo | Meilleur que Sasa Vanda, Clean Press | SV Pressing',
    description: 'Service de blanchisserie professionnelle a Antananarivo. Lavage de linge de maison, couettes, rideaux, tapis. Meilleur que Sasa Vanda, Clean Press.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/blanchisserie',
    ogTitle: 'Blanchisserie Professionnelle Antananarivo - SV Pressing',
    ogDescription: 'Service de blanchisserie professionnelle a Antananarivo.'
  };
};

export const getNetASecPageMeta = function() {
  return {
    title: 'Net a Sec Professionnel Antananarivo | Meilleur que Sasa Vanda, Clean Press | SV Pressing',
    description: 'Service Net a Sec professionnel a Antananarivo. Nettoyage a sec de costumes, robes, soie, laine.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/net-a-sec',
    ogTitle: 'Net a Sec Professionnel Antananarivo - SV Pressing',
    ogDescription: 'Service Net a Sec professionnel a Antananarivo.'
  };
};

export const getContactPageMeta = function() {
  return {
    title: 'Contact - SV Pressing Madagascar | Service Client 7j/7',
    description: 'Contactez SV Pressing Madagascar par telephone, email ou WhatsApp. Service client disponible 7j/7.',
    keywords: ['contact SV Pressing', 'telephone pressing', 'WhatsApp pressing'],
    canonical: SITE_CONFIG.url + '/contact',
    ogTitle: 'Contact - SV Pressing Madagascar',
    ogDescription: 'Contactez SV Pressing Madagascar.'
  };
};

export const getFAQPageMeta = function() {
  return {
    title: 'FAQ - Questions frequentes sur le Pressing, Blanchisserie | SV Pressing Madagascar',
    description: 'Toutes les reponses a vos questions sur le pressing, la blanchisserie, le nettoyage a sec.',
    keywords: ['FAQ pressing', 'questions blanchisserie', 'Sasa Vanda vs SV'],
    canonical: SITE_CONFIG.url + '/faq',
    ogTitle: 'FAQ - SV Pressing Madagascar',
    ogDescription: 'Toutes les reponses a vos questions.'
  };
};

export const getPlansPageMeta = function() {
  return {
    title: "Formules d'Abonnement Pressing et Blanchisserie - SV Pressing Madagascar",
    description: 'Decouvrez nos formules d\'abonnement pressing et blanchisserie. Collecte et livraison GRATUITES.',
    keywords: ['abonnement pressing', 'forfait pressing mensuel', 'Sasa Vanda'],
    canonical: SITE_CONFIG.url + '/plans',
    ogTitle: "Formules d'Abonnement - SV Pressing Madagascar",
    ogDescription: 'Decouvrez nos formules d\'abonnement.'
  };
};

export const getAboutPageMeta = function() {
  return {
    title: 'A propos - SV Pressing Madagascar | Leader du Pressing a Antananarivo',
    description: 'Decouvrez SV Pressing, le leader du pressing a Madagascar. Collecte et livraison gratuites.',
    keywords: ['a propos', 'SV Pressing', 'leader pressing Madagascar'],
    canonical: SITE_CONFIG.url + '/about',
    ogTitle: 'A propos - SV Pressing Madagascar',
    ogDescription: 'Decouvrez SV Pressing.'
  };
};

export const getTarifsPageMeta = function() {
  return {
    title: 'Tarifs Pressing et Blanchisserie - SV Pressing Madagascar',
    description: 'Tarifs transparents de SV Pressing Madagascar. Formules adaptees a tous les besoins.',
    keywords: ['tarifs pressing', 'prix blanchisserie', 'Sasa Vanda prix'],
    canonical: SITE_CONFIG.url + '/tarifs',
    ogTitle: 'Tarifs - SV Pressing Madagascar',
    ogDescription: 'Tarifs transparents.'
  };
};

export const getBlogPageMeta = function() {
  return {
    title: 'Blog - Conseils Pressing et Blanchisserie | SV Pressing Madagascar',
    description: 'Blog SV Pressing Madagascar - Conseils pour entretenir vos vetements.',
    keywords: ['blog pressing', 'conseils blanchisserie', 'entretien vetements'],
    canonical: SITE_CONFIG.url + '/blog',
    ogTitle: 'Blog - SV Pressing Madagascar',
    ogDescription: 'Conseils pour entretenir vos vetements.'
  };
};

export const getPressingCostumePageMeta = function() {
  return {
    title: 'Pressing Costume Antananarivo | Nettoyage a Sec Professionnel | SV Pressing',
    description: 'Service professionnel de nettoyage de costumes a Antananarivo. Nettoyage a sec, repassage, retouches.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/pressing-costume',
    ogTitle: 'Pressing Costume Antananarivo - SV Pressing',
    ogDescription: 'Service professionnel de nettoyage de costumes.'
  };
};

export const getPressingRobeSoireePageMeta = function() {
  return {
    title: 'Pressing Robe de Soiree Antananarivo | Nettoyage Delicat | SV Pressing',
    description: 'Service de nettoyage delicat pour robes de soiree a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/pressing-robe-soiree',
    ogTitle: 'Pressing Robe de Soiree Antananarivo - SV Pressing',
    ogDescription: 'Service de nettoyage delicat pour robes de soiree.'
  };
};

export const getPressingLingeMaisonPageMeta = function() {
  return {
    title: 'Pressing Linge de Maison Antananarivo | Blanchisserie Professionnelle | SV Pressing',
    description: 'Service de pressing et blanchisserie pour linge de maison a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/pressing-linge-maison',
    ogTitle: 'Pressing Linge de Maison Antananarivo - SV Pressing',
    ogDescription: 'Service de pressing et blanchisserie pour linge de maison.'
  };
};

export const getPressingEntreprisePageMeta = function() {
  return {
    title: 'Pressing Entreprise B2B Antananarivo | Hotels, Restaurants | SV Pressing',
    description: 'Service de pressing B2B pour entreprises a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/pressing-entreprise',
    ogTitle: 'Pressing Entreprise B2B Antananarivo - SV Pressing',
    ogDescription: 'Service de pressing B2B pour entreprises.'
  };
};

export const getBlanchisserieCouettePageMeta = function() {
  return {
    title: 'Blanchisserie Couette Antananarivo | Nettoyage Couette Madagascar | SV Pressing',
    description: 'Service de blanchisserie professionnelle pour couettes a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/blanchisserie-couette',
    ogTitle: 'Blanchisserie Couette Antananarivo - SV Pressing',
    ogDescription: 'Service de blanchisserie professionnelle pour couettes.'
  };
};

export const getBlanchisserieRideauxPageMeta = function() {
  return {
    title: 'Blanchisserie Rideaux Antananarivo | Nettoyage Rideaux Madagascar | SV Pressing',
    description: 'Service de blanchisserie professionnelle pour rideaux a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/blanchisserie-rideaux',
    ogTitle: 'Blanchisserie Rideaux Antananarivo - SV Pressing',
    ogDescription: 'Service de blanchisserie professionnelle pour rideaux.'
  };
};

export const getBlanchisserieTapisPageMeta = function() {
  return {
    title: 'Blanchisserie Tapis Antananarivo | Nettoyage Tapis Madagascar | SV Pressing',
    description: 'Service de blanchisserie professionnelle pour tapis a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/blanchisserie-tapis',
    ogTitle: 'Blanchisserie Tapis Antananarivo - SV Pressing',
    ogDescription: 'Service de blanchisserie professionnelle pour tapis.'
  };
};

export const getBlanchisserieIndustriellePageMeta = function() {
  return {
    title: 'Blanchisserie Industrielle Antananarivo | Service B2B Madagascar | SV Pressing',
    description: 'Service de blanchisserie industrielle pour entreprises a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/blanchisserie-industrielle',
    ogTitle: 'Blanchisserie Industrielle Antananarivo - SV Pressing',
    ogDescription: 'Service de blanchisserie industrielle pour entreprises.'
  };
};

export const getNettoyageSoiePageMeta = function() {
  return {
    title: 'Nettoyage Soie Antananarivo | Pressing Soie Madagascar | SV Pressing',
    description: 'Service professionnel de nettoyage de soie a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/nettoyage-soie',
    ogTitle: 'Nettoyage Soie Antananarivo - SV Pressing',
    ogDescription: 'Service professionnel de nettoyage de soie.'
  };
};

export const getNettoyageLainePageMeta = function() {
  return {
    title: 'Nettoyage Laine Antananarivo | Pressing Laine Madagascar | SV Pressing',
    description: 'Service professionnel de nettoyage de laine a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/nettoyage-laine',
    ogTitle: 'Nettoyage Laine Antananarivo - SV Pressing',
    ogDescription: 'Service professionnel de nettoyage de laine.'
  };
};

export const getNettoyageCachemirePageMeta = function() {
  return {
    title: 'Nettoyage Cachemire Antananarivo | Pressing Cachemire Madagascar | SV Pressing',
    description: 'Service professionnel de nettoyage de cachemire a Antananarivo.',
    keywords: generateAllKeywords(),
    canonical: SITE_CONFIG.url + '/nettoyage-cachemire',
    ogTitle: 'Nettoyage Cachemire Antananarivo - SV Pressing',
    ogDescription: 'Service professionnel de nettoyage de cachemire.'
  };
};

// ====================================================================================================
// SECTION 10: CONSTANTES SEO
// ====================================================================================================

export const SEO_CONSTANTS = {
  MAX_TITLE_LENGTH: 60,
  MIN_TITLE_LENGTH: 30,
  MAX_DESCRIPTION_LENGTH: 160,
  MIN_DESCRIPTION_LENGTH: 80,
  RECOMMENDED_IMAGE_RATIO: 1.91,
  RECOMMENDED_IMAGE_WIDTH: 1200,
  RECOMMENDED_IMAGE_HEIGHT: 630,
  MAX_KEYWORDS: 30,
  RECOMMENDED_H1_COUNT: 1
};

// ====================================================================================================
// SECTION 11: FONCTIONS UTILITAIRES
// ====================================================================================================

export const generateMetaDescription = function(text: string, maxLength: number) {
  if (maxLength === undefined) maxLength = 160;
  var cleanText = text.replace(/<[^>]*>/g, '').trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength - 3).trim() + '...';
};

export const generateSlug = function(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateTitleTag = function(mainTitle: string, siteName: string) {
  if (siteName === undefined) siteName = SITE_CONFIG.name;
  var combined = mainTitle + ' | ' + siteName;
  if (combined.length > 60) return mainTitle.substring(0, 57) + '...';
  return combined;
};

export const getReadingTime = function(text: string, wpm: number) {
  if (wpm === undefined) wpm = 200;
  var words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
};

export const getKeywordDensity = function(text: string, keyword: string) {
  var words = text.toLowerCase().replace(/<[^>]*>/g, '').trim().split(/\s+/);
  var keywordCount = 0;
  for (var i = 0; i < words.length; i++) {
    if (words[i] === keyword.toLowerCase()) {
      keywordCount = keywordCount + 1;
    }
  }
  return (keywordCount / words.length) * 100;
};

export const extractKeywords = function(text: string, count: number) {
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

export const getPageSchemas = function(page: string) {
  var baseSchemas = [
    generateOrganizationSchema(),
    generateLocalBusinessSchema()
  ];

  var serviceSchemas: { [key: string]: any } = {
    'blanchisserie': generateBlanchisserieServiceSchema(),
    'net-a-sec': generateNetASecServiceSchema(),
    'pressing-costume': generatePressingServiceSchema(),
    'pressing-robe-soiree': generatePressingServiceSchema(),
    'pressing-linge-maison': generateBlanchisserieServiceSchema(),
    'pressing-entreprise': generatePressingServiceSchema(),
    'blanchisserie-couette': generateBlanchisserieServiceSchema(),
    'blanchisserie-rideaux': generateBlanchisserieServiceSchema(),
    'blanchisserie-tapis': generateBlanchisserieServiceSchema(),
    'blanchisserie-industrielle': generateBlanchisserieServiceSchema(),
    'nettoyage-soie': generateNetASecServiceSchema(),
    'nettoyage-laine': generateNetASecServiceSchema(),
    'nettoyage-cachemire': generateNetASecServiceSchema()
  };

  var schemas = baseSchemas.slice();
  var serviceSchema = serviceSchemas[page];
  if (serviceSchema) {
    schemas.push(serviceSchema);
  }

  return schemas;
};

// ====================================================================================================
// SECTION 12: EXPORT DU MODULE - COMPLET
// ====================================================================================================

export default {
  SITE_CONFIG: SITE_CONFIG,
  SEO_KEYWORDS: SEO_KEYWORDS,
  generateAllKeywords: generateAllKeywords,
  generateMetaTags: generateMetaTags,
  generateOrganizationSchema: generateOrganizationSchema,
  generateLocalBusinessSchema: generateLocalBusinessSchema,
  generateBreadcrumbSchema: generateBreadcrumbSchema,
  generateFAQSchema: generateFAQSchema,
  generateWebPageSchema: generateWebPageSchema,
  generateArticleSchema: generateArticleSchema,
  generateProductSchema: generateProductSchema,
  generateServiceSchema: generateServiceSchema,
  generateReviewSchema: generateReviewSchema,
  generatePressingServiceSchema: generatePressingServiceSchema,
  generateBlanchisserieServiceSchema: generateBlanchisserieServiceSchema,
  generateNetASecServiceSchema: generateNetASecServiceSchema,
  analyzeSEO: analyzeSEO,
  SEO_CONSTANTS: SEO_CONSTANTS,
  generateMetaDescription: generateMetaDescription,
  generateSlug: generateSlug,
  generateTitleTag: generateTitleTag,
  getReadingTime: getReadingTime,
  getKeywordDensity: getKeywordDensity,
  extractKeywords: extractKeywords,
  getPageSchemas: getPageSchemas,
  getHomePageMeta: getHomePageMeta,
  getBlanchisseriePageMeta: getBlanchisseriePageMeta,
  getNetASecPageMeta: getNetASecPageMeta,
  getContactPageMeta: getContactPageMeta,
  getFAQPageMeta: getFAQPageMeta,
  getPlansPageMeta: getPlansPageMeta,
  getAboutPageMeta: getAboutPageMeta,
  getTarifsPageMeta: getTarifsPageMeta,
  getBlogPageMeta: getBlogPageMeta,
  getPressingCostumePageMeta: getPressingCostumePageMeta,
  getPressingRobeSoireePageMeta: getPressingRobeSoireePageMeta,
  getPressingLingeMaisonPageMeta: getPressingLingeMaisonPageMeta,
  getPressingEntreprisePageMeta: getPressingEntreprisePageMeta,
  getBlanchisserieCouettePageMeta: getBlanchisserieCouettePageMeta,
  getBlanchisserieRideauxPageMeta: getBlanchisserieRideauxPageMeta,
  getBlanchisserieTapisPageMeta: getBlanchisserieTapisPageMeta,
  getBlanchisserieIndustriellePageMeta: getBlanchisserieIndustriellePageMeta,
  getNettoyageSoiePageMeta: getNettoyageSoiePageMeta,
  getNettoyageLainePageMeta: getNettoyageLainePageMeta,
  getNettoyageCachemirePageMeta: getNettoyageCachemirePageMeta
};
