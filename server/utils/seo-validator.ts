// server/utils/seo-validator.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO VALIDATOR ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT TOUTES LES FONCTIONS DE VALIDATION SEO
// ====================================================================================================

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEOValidationResult {
  isValid: boolean;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  errors: SEOValidationError[];
  warnings: SEOValidationWarning[];
  recommendations: SEOValidationRecommendation[];
  metadata: SEOValidationMetadata;
}

export interface SEOValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SEOValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning' | 'info';
}

export interface SEOValidationRecommendation {
  code: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface SEOValidationMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  images: number;
  imagesWithAlt: number;
  links: number;
  internalLinks: number;
  externalLinks: number;
  structuredData: number;
  wordCount: number;
  readability: number;
  mobileFriendly: boolean;
  ssl: boolean;
  loadTime: number;
  lastModified: string;
}

export interface SEOValidationConfig {
  maxTitleLength: number;
  minTitleLength: number;
  maxDescriptionLength: number;
  minDescriptionLength: number;
  maxKeywords: number;
  minKeywords: number;
  maxH1Count: number;
  minH1Count: number;
  maxImagesWithoutAlt: number;
  minInternalLinks: number;
  minExternalLinks: number;
  minStructuredData: number;
  minWordCount: number;
  maxLoadTime: number;
  requireSSL: boolean;
  requireMobileFriendly: boolean;
  requireCanonical: boolean;
  requireRobots: boolean;
  requireOpenGraph: boolean;
  requireTwitterCards: boolean;
  requireStructuredData: boolean;
}

// ====================================================================================================
// SECTION 2: CONFIGURATION PAR DEFAUT
// ====================================================================================================

export const DEFAULT_SEO_CONFIG: SEOValidationConfig = {
  maxTitleLength: 60,
  minTitleLength: 30,
  maxDescriptionLength: 160,
  minDescriptionLength: 80,
  maxKeywords: 30,
  minKeywords: 5,
  maxH1Count: 1,
  minH1Count: 1,
  maxImagesWithoutAlt: 0,
  minInternalLinks: 5,
  minExternalLinks: 2,
  minStructuredData: 3,
  minWordCount: 300,
  maxLoadTime: 3000,
  requireSSL: true,
  requireMobileFriendly: true,
  requireCanonical: true,
  requireRobots: true,
  requireOpenGraph: true,
  requireTwitterCards: true,
  requireStructuredData: true
};

// ====================================================================================================
// SECTION 3: VALIDATEUR SEO PRINCIPAL
// ====================================================================================================

export const validateSEO = function(
  html: string,
  config: SEOValidationConfig = DEFAULT_SEO_CONFIG
): SEOValidationResult {
  var errors: SEOValidationError[] = [];
  var warnings: SEOValidationWarning[] = [];
  var recommendations: SEOValidationRecommendation[] = [];
  var score = 100;
  var metadata = extractSEOMetadata(html);

  // ================================================================================================
  // 3.1: VALIDATION DU TITRE
  // ================================================================================================
  if (metadata.title.length === 0) {
    errors.push({
      code: 'TITLE_MISSING',
      message: 'La balise title est manquante',
      severity: 'error'
    });
    score = score - 20;
  } else {
    if (metadata.title.length < config.minTitleLength) {
      warnings.push({
        code: 'TITLE_TOO_SHORT',
        message: 'Le titre est trop court (' + metadata.title.length + ' caractères). Minimum recommandé: ' + config.minTitleLength,
        severity: 'warning'
      });
      score = score - 5;
    }
    if (metadata.title.length > config.maxTitleLength) {
      warnings.push({
        code: 'TITLE_TOO_LONG',
        message: 'Le titre est trop long (' + metadata.title.length + ' caractères). Maximum recommandé: ' + config.maxTitleLength,
        severity: 'warning'
      });
      score = score - 5;
    }
    if (metadata.title.indexOf('SV Pressing') === -1) {
      warnings.push({
        code: 'TITLE_MISSING_BRAND',
        message: 'Le titre ne contient pas "SV Pressing"',
        severity: 'warning'
      });
      score = score - 3;
    }
    if (metadata.title.indexOf('Antananarivo') === -1) {
      warnings.push({
        code: 'TITLE_MISSING_LOCATION',
        message: 'Le titre ne contient pas "Antananarivo"',
        severity: 'warning'
      });
      score = score - 3;
    }
  }

  // ================================================================================================
  // 3.2: VALIDATION DE LA META DESCRIPTION
  // ================================================================================================
  if (metadata.description.length === 0) {
    errors.push({
      code: 'DESCRIPTION_MISSING',
      message: 'La meta description est manquante',
      severity: 'error'
    });
    score = score - 20;
  } else {
    if (metadata.description.length < config.minDescriptionLength) {
      warnings.push({
        code: 'DESCRIPTION_TOO_SHORT',
        message: 'La meta description est trop courte (' + metadata.description.length + ' caractères). Minimum recommandé: ' + config.minDescriptionLength,
        severity: 'warning'
      });
      score = score - 5;
    }
    if (metadata.description.length > config.maxDescriptionLength) {
      warnings.push({
        code: 'DESCRIPTION_TOO_LONG',
        message: 'La meta description est trop longue (' + metadata.description.length + ' caractères). Maximum recommandé: ' + config.maxDescriptionLength,
        severity: 'warning'
      });
      score = score - 5;
    }
    if (metadata.description.indexOf('pressing') === -1 && metadata.description.indexOf('blanchisserie') === -1) {
      warnings.push({
        code: 'DESCRIPTION_MISSING_KEYWORDS',
        message: 'La meta description ne contient pas de mots-clés principaux',
        severity: 'warning'
      });
      score = score - 3;
    }
  }

  // ================================================================================================
  // 3.3: VALIDATION DES MOTS-CLES
  // ================================================================================================
  if (metadata.keywords.length < config.minKeywords) {
    warnings.push({
      code: 'KEYWORDS_TOO_FEW',
      message: 'Peu de mots-clés (' + metadata.keywords.length + '). Minimum recommandé: ' + config.minKeywords,
      severity: 'warning'
    });
    score = score - 3;
  }
  if (metadata.keywords.length > config.maxKeywords) {
    warnings.push({
      code: 'KEYWORDS_TOO_MANY',
      message: 'Trop de mots-clés (' + metadata.keywords.length + '). Maximum recommandé: ' + config.maxKeywords,
      severity: 'warning'
    });
    score = score - 3;
  }

  // ================================================================================================
  // 3.4: VALIDATION DE LA BALISE CANONICAL
  // ================================================================================================
  if (config.requireCanonical) {
    if (metadata.canonical.length === 0) {
      errors.push({
        code: 'CANONICAL_MISSING',
        message: 'La balise canonical est manquante',
        severity: 'error'
      });
      score = score - 15;
    }
  }

  // ================================================================================================
  // 3.5: VALIDATION DES HEADINGS
  // ================================================================================================
  if (metadata.h1Count < config.minH1Count) {
    warnings.push({
      code: 'H1_MISSING',
      message: 'Aucune balise H1 trouvée',
      severity: 'warning'
    });
    score = score - 10;
  }
  if (metadata.h1Count > config.maxH1Count) {
    warnings.push({
      code: 'H1_TOO_MANY',
      message: 'Plusieurs balises H1 trouvées (' + metadata.h1Count + '). Une seule est recommandée',
      severity: 'warning'
    });
    score = score - 5;
  }
  if (metadata.h2Count === 0) {
    warnings.push({
      code: 'H2_MISSING',
      message: 'Aucune balise H2 trouvée',
      severity: 'warning'
    });
    score = score - 5;
  }
  if (metadata.h3Count === 0) {
    warnings.push({
      code: 'H3_MISSING',
      message: 'Aucune balise H3 trouvée',
      severity: 'warning'
    });
    score = score - 3;
  }

  // ================================================================================================
  // 3.6: VALIDATION DES IMAGES
  // ================================================================================================
  var imagesWithoutAlt = metadata.images - metadata.imagesWithAlt;
  if (imagesWithoutAlt > config.maxImagesWithoutAlt) {
    warnings.push({
      code: 'IMAGES_WITHOUT_ALT',
      message: imagesWithoutAlt + ' image(s) sans attribut alt',
      severity: 'warning'
    });
    score = score - 5 * imagesWithoutAlt;
  }

  // ================================================================================================
  // 3.7: VALIDATION DES LIENS
  // ================================================================================================
  if (metadata.internalLinks < config.minInternalLinks) {
    warnings.push({
      code: 'INTERNAL_LINKS_TOO_FEW',
      message: 'Peu de liens internes (' + metadata.internalLinks + '). Minimum recommandé: ' + config.minInternalLinks,
      severity: 'warning'
    });
    score = score - 5;
  }
  if (metadata.externalLinks < config.minExternalLinks) {
    warnings.push({
      code: 'EXTERNAL_LINKS_TOO_FEW',
      message: 'Peu de liens externes (' + metadata.externalLinks + '). Minimum recommandé: ' + config.minExternalLinks,
      severity: 'warning'
    });
    score = score - 3;
  }

  // ================================================================================================
  // 3.8: VALIDATION DES DONNEES STRUCTUREES
  // ================================================================================================
  if (config.requireStructuredData) {
    if (metadata.structuredData < config.minStructuredData) {
      warnings.push({
        code: 'STRUCTURED_DATA_TOO_FEW',
        message: 'Peu de données structurées (' + metadata.structuredData + '). Minimum recommandé: ' + config.minStructuredData,
        severity: 'warning'
      });
      score = score - 10;
    }
    if (metadata.structuredData === 0) {
      errors.push({
        code: 'STRUCTURED_DATA_MISSING',
        message: 'Aucune donnée structurée (JSON-LD) trouvée',
        severity: 'error'
      });
      score = score - 20;
    }
  }

  // ================================================================================================
  // 3.9: VALIDATION DU CONTENU
  // ================================================================================================
  if (metadata.wordCount < config.minWordCount) {
    warnings.push({
      code: 'WORD_COUNT_TOO_LOW',
      message: 'Peu de contenu (' + metadata.wordCount + ' mots). Minimum recommandé: ' + config.minWordCount,
      severity: 'warning'
    });
    score = score - 5;
  }

  // ================================================================================================
  // 3.10: VALIDATION DU TEMPS DE CHARGEMENT
  // ================================================================================================
  if (metadata.loadTime > config.maxLoadTime) {
    warnings.push({
      code: 'LOAD_TIME_TOO_HIGH',
      message: 'Temps de chargement élevé (' + metadata.loadTime + 'ms). Maximum recommandé: ' + config.maxLoadTime,
      severity: 'warning'
    });
    score = score - 5;
  }

  // ================================================================================================
  // 3.11: VALIDATION SSL
  // ================================================================================================
  if (config.requireSSL && !metadata.ssl) {
    errors.push({
      code: 'SSL_MISSING',
      message: 'SSL/HTTPS non activé',
      severity: 'error'
    });
    score = score - 15;
  }

  // ================================================================================================
  // 3.12: VALIDATION MOBILE FRIENDLY
  // ================================================================================================
  if (config.requireMobileFriendly && !metadata.mobileFriendly) {
    errors.push({
      code: 'MOBILE_FRIENDLY_MISSING',
      message: 'La page n\'est pas optimisée pour mobile',
      severity: 'error'
    });
    score = score - 15;
  }

  // ================================================================================================
  // 3.13: VALIDATION OPEN GRAPH
  // ================================================================================================
  if (config.requireOpenGraph) {
    if (html.indexOf('og:title') === -1) {
      warnings.push({
        code: 'OPEN_GRAPH_TITLE_MISSING',
        message: 'Open Graph title manquant',
        severity: 'warning'
      });
      score = score - 5;
    }
    if (html.indexOf('og:description') === -1) {
      warnings.push({
        code: 'OPEN_GRAPH_DESCRIPTION_MISSING',
        message: 'Open Graph description manquant',
        severity: 'warning'
      });
      score = score - 5;
    }
    if (html.indexOf('og:image') === -1) {
      warnings.push({
        code: 'OPEN_GRAPH_IMAGE_MISSING',
        message: 'Open Graph image manquant',
        severity: 'warning'
      });
      score = score - 5;
    }
  }

  // ================================================================================================
  // 3.14: VALIDATION TWITTER CARDS
  // ================================================================================================
  if (config.requireTwitterCards) {
    if (html.indexOf('twitter:card') === -1) {
      warnings.push({
        code: 'TWITTER_CARD_MISSING',
        message: 'Twitter Card manquante',
        severity: 'warning'
      });
      score = score - 5;
    }
  }

  // ================================================================================================
  // 3.15: GENERATION DES RECOMMANDATIONS
  // ================================================================================================
  if (score < 100) {
    if (metadata.title.length === 0 || metadata.title.length < config.minTitleLength) {
      recommendations.push({
        code: 'REC_TITLE',
        message: 'Optimiser la balise title avec des mots-clés pertinents',
        priority: 'high',
        action: 'Ajouter "SV Pressing" et "Antananarivo" dans le titre'
      });
    }
    if (metadata.description.length === 0 || metadata.description.length < config.minDescriptionLength) {
      recommendations.push({
        code: 'REC_DESCRIPTION',
        message: 'Optimiser la meta description',
        priority: 'high',
        action: 'Rédiger une description de 80-160 caractères avec les mots-clés principaux'
      });
    }
    if (metadata.h1Count === 0) {
      recommendations.push({
        code: 'REC_H1',
        message: 'Ajouter une balise H1',
        priority: 'high',
        action: 'Ajouter un titre principal avec la balise H1'
      });
    }
    if (metadata.structuredData < config.minStructuredData) {
      recommendations.push({
        code: 'REC_STRUCTURED_DATA',
        message: 'Ajouter plus de données structurées',
        priority: 'high',
        action: 'Ajouter Organization, LocalBusiness, Product et Service schemas'
      });
    }
    if (imagesWithoutAlt > 0) {
      recommendations.push({
        code: 'REC_IMAGE_ALT',
        message: 'Ajouter des attributs alt aux images',
        priority: 'medium',
        action: 'Ajouter un texte alternatif descriptif pour chaque image'
      });
    }
    if (metadata.internalLinks < config.minInternalLinks) {
      recommendations.push({
        code: 'REC_INTERNAL_LINKS',
        message: 'Ajouter plus de liens internes',
        priority: 'medium',
        action: 'Ajouter des liens vers les pages principales du site'
      });
    }
    if (metadata.wordCount < config.minWordCount) {
      recommendations.push({
        code: 'REC_WORD_COUNT',
        message: 'Augmenter le contenu textuel',
        priority: 'medium',
        action: 'Ajouter plus de contenu descriptif avec des mots-clés'
      });
    }
    if (metadata.loadTime > config.maxLoadTime) {
      recommendations.push({
        code: 'REC_LOAD_TIME',
        message: 'Optimiser le temps de chargement',
        priority: 'high',
        action: 'Compresser les images, utiliser le lazy loading, optimiser le code'
      });
    }
    if (!metadata.mobileFriendly) {
      recommendations.push({
        code: 'REC_MOBILE_FRIENDLY',
        message: 'Optimiser pour mobile',
        priority: 'high',
        action: 'Utiliser un design responsive et une viewport adaptée'
      });
    }
    if (!metadata.ssl) {
      recommendations.push({
        code: 'REC_SSL',
        message: 'Activer SSL/HTTPS',
        priority: 'high',
        action: 'Installer un certificat SSL et forcer le HTTPS'
      });
    }
    if (metadata.h2Count === 0) {
      recommendations.push({
        code: 'REC_H2',
        message: 'Ajouter des balises H2',
        priority: 'medium',
        action: 'Structurer le contenu avec des sous-titres H2'
      });
    }
    if (metadata.externalLinks < config.minExternalLinks) {
      recommendations.push({
        code: 'REC_EXTERNAL_LINKS',
        message: 'Ajouter des liens externes',
        priority: 'low',
        action: 'Ajouter des liens vers des sources de confiance'
      });
    }
    if (metadata.keywords.length < config.minKeywords) {
      recommendations.push({
        code: 'REC_KEYWORDS',
        message: 'Ajouter plus de mots-clés',
        priority: 'medium',
        action: 'Ajouter des mots-clés pertinents dans la balise keywords'
      });
    }
    if (!config.requireOpenGraph) {
      recommendations.push({
        code: 'REC_OPEN_GRAPH',
        message: 'Ajouter les balises Open Graph',
        priority: 'medium',
        action: 'Ajouter og:title, og:description, og:image pour le partage social'
      });
    }
    if (!config.requireTwitterCards) {
      recommendations.push({
        code: 'REC_TWITTER_CARDS',
        message: 'Ajouter les Twitter Cards',
        priority: 'low',
        action: 'Ajouter twitter:card, twitter:site, twitter:title, twitter:description'
      });
    }
  }

  // ================================================================================================
  // 3.16: CALCUL DU GRADE
  // ================================================================================================
  var grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  // ================================================================================================
  // 3.17: RETOUR DU RESULTAT
  // ================================================================================================
  return {
    isValid: errors.length === 0,
    score: Math.max(0, Math.min(100, score)),
    grade: grade,
    errors: errors,
    warnings: warnings,
    recommendations: recommendations,
    metadata: metadata
  };
};

// ====================================================================================================
// SECTION 4: EXTRACTION DES METADONNEES SEO
// ====================================================================================================

export const extractSEOMetadata = function(html: string): SEOValidationMetadata {
  // Titre
  var titleMatch = html.match(/<title>([^<]*)<\/title>/);
  var title = titleMatch ? titleMatch[1] : '';

  // Meta Description
  var descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  var description = descMatch ? descMatch[1] : '';

  // Meta Keywords
  var keywordsMatch = html.match(/<meta name="keywords" content="([^"]*)"/);
  var keywords: string[] = [];
  if (keywordsMatch) {
    keywords = keywordsMatch[1].split(',').map(function(k) { return k.trim(); });
  }

  // Canonical
  var canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  var canonical = canonicalMatch ? canonicalMatch[1] : '';

  // Robots
  var robotsMatch = html.match(/<meta name="robots" content="([^"]*)"/);
  var robots = robotsMatch ? robotsMatch[1] : '';

  // Headings
  var h1Count = (html.match(/<h1/g) || []).length;
  var h2Count = (html.match(/<h2/g) || []).length;
  var h3Count = (html.match(/<h3/g) || []).length;

  // Images
  var images = html.match(/<img/g) || [];
  var imagesWithAlt = html.match(/alt=/g) || [];

  // Links
  var internalLinks = html.match(/href="\/(?!http)/g) || [];
  var externalLinks = html.match(/href="https?:\/\/(?!svpressing\.com)/g) || [];
  var totalLinks = internalLinks.length + externalLinks.length;

  // Structured Data
  var structuredData = (html.match(/application\/ld\+json/g) || []).length;

  // Word Count
  var wordCount = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').length;

  // Readability (simplifié)
  var readability = 0;
  var sentences = html.replace(/<[^>]*>/g, '').split(/[.!?]+/).length;
  var wordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  if (wordsPerSentence > 0 && wordsPerSentence < 20) {
    readability = 80;
  } else if (wordsPerSentence >= 20 && wordsPerSentence < 30) {
    readability = 50;
  } else {
    readability = 30;
  }

  // Mobile Friendly
  var mobileFriendly = html.indexOf('viewport') !== -1;

  // SSL
  var ssl = html.indexOf('https://') !== -1;

  // Load Time (simulé)
  var loadTime = 1500;

  // Last Modified
  var lastModified = new Date().toISOString();

  return {
    title: title,
    description: description,
    keywords: keywords,
    canonical: canonical,
    robots: robots,
    h1Count: h1Count,
    h2Count: h2Count,
    h3Count: h3Count,
    images: images.length,
    imagesWithAlt: imagesWithAlt.length,
    links: totalLinks,
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    structuredData: structuredData,
    wordCount: wordCount,
    readability: readability,
    mobileFriendly: mobileFriendly,
    ssl: ssl,
    loadTime: loadTime,
    lastModified: lastModified
  };
};

// ====================================================================================================
// SECTION 5: VALIDATEUR DE CONTENU SEO
// ====================================================================================================

export const validateContent = function(
  content: string,
  targetKeywords: string[],
  config?: { minKeywordDensity?: number; maxKeywordDensity?: number }
): {
  keywordDensity: { [key: string]: number };
  issues: string[];
  warnings: string[];
} {
  var minDensity = config && config.minKeywordDensity ? config.minKeywordDensity : 0.5;
  var maxDensity = config && config.maxKeywordDensity ? config.maxKeywordDensity : 3.0;
  
  var cleanContent = content.replace(/<[^>]*>/g, '').toLowerCase();
  var words = cleanContent.split(/\s+/);
  var totalWords = words.length;
  
  var keywordDensity: { [key: string]: number } = {};
  var issues: string[] = [];
  var warnings: string[] = [];

  for (var i = 0; i < targetKeywords.length; i++) {
    var keyword = targetKeywords[i].toLowerCase();
    var count = 0;
    for (var j = 0; j < words.length; j++) {
      if (words[j].indexOf(keyword) !== -1) {
        count = count + 1;
      }
    }
    var density = (count / totalWords) * 100;
    keywordDensity[keyword] = density;
    
    if (density < minDensity) {
      warnings.push('Densité trop faible pour "' + keyword + '": ' + density.toFixed(2) + '% (min: ' + minDensity + '%)');
    }
    if (density > maxDensity) {
      warnings.push('Densité trop élevée pour "' + keyword + '": ' + density.toFixed(2) + '% (max: ' + maxDensity + '%)');
    }
  }

  return {
    keywordDensity: keywordDensity,
    issues: issues,
    warnings: warnings
  };
};

// ====================================================================================================
// SECTION 6: VALIDATEUR DE STRUCTURED DATA
// ====================================================================================================

export const validateStructuredData = function(html: string): {
  valid: boolean;
  schemas: string[];
  errors: string[];
  warnings: string[];
} {
  var schemas: string[] = [];
  var errors: string[] = [];
  var warnings: string[] = [];
  
  var jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  
  if (jsonLdMatches.length === 0) {
    errors.push('Aucune donnée structurée trouvée');
    return { valid: false, schemas: schemas, errors: errors, warnings: warnings };
  }

  for (var i = 0; i < jsonLdMatches.length; i++) {
    try {
      var match = jsonLdMatches[i];
      var jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
      var data = JSON.parse(jsonStr);
      
      if (data['@type']) {
        var types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
        for (var j = 0; j < types.length; j++) {
          schemas.push(types[j]);
        }
      }
      
      // Vérification des champs obligatoires
      if (data['@type'] === 'Organization' || (Array.isArray(data['@type']) && data['@type'].indexOf('Organization') !== -1)) {
        if (!data.name) warnings.push('Organization schema: name manquant');
        if (!data.url) warnings.push('Organization schema: url manquant');
      }
      
      if (data['@type'] === 'LocalBusiness' || data['@type'] === 'Laundry') {
        if (!data.name) warnings.push('LocalBusiness schema: name manquant');
        if (!data.address) warnings.push('LocalBusiness schema: address manquant');
      }
      
      if (data['@type'] === 'Product') {
        if (!data.name) warnings.push('Product schema: name manquant');
        if (!data.offers) warnings.push('Product schema: offers manquant');
      }
      
      if (data['@type'] === 'Service') {
        if (!data.name) warnings.push('Service schema: name manquant');
        if (!data.provider) warnings.push('Service schema: provider manquant');
      }
      
      if (data['@type'] === 'FAQPage') {
        if (!data.mainEntity || data.mainEntity.length === 0) {
          warnings.push('FAQPage schema: mainEntity manquant ou vide');
        }
      }
      
      if (data['@type'] === 'BreadcrumbList') {
        if (!data.itemListElement || data.itemListElement.length === 0) {
          warnings.push('BreadcrumbList schema: itemListElement manquant ou vide');
        }
      }
      
      if (data['@type'] === 'Article' || data['@type'] === 'BlogPosting') {
        if (!data.headline) warnings.push('Article schema: headline manquant');
        if (!data.datePublished) warnings.push('Article schema: datePublished manquant');
      }
      
    } catch (error) {
      errors.push('Erreur de parsing JSON-LD: ' + (error as Error).message);
    }
  }

  return {
    valid: errors.length === 0,
    schemas: schemas,
    errors: errors,
    warnings: warnings
  };
};

// ====================================================================================================
// SECTION 7: MIDDLEWARE DE VALIDATION SEO
// ====================================================================================================

export const seoValidationMiddleware = function(req: Request, res: Response, next: NextFunction) {
  // Cette middleware ajoute des en-têtes de validation SEO
  res.setHeader('X-SEO-Validated', 'true');
  
  // Capturer le HTML généré pour validation
  var originalSend = res.send;
  res.send = function(body: any) {
    if (typeof body === 'string' && body.indexOf('<html') !== -1) {
      var result = validateSEO(body);
      res.setHeader('X-SEO-Score', result.score.toString());
      res.setHeader('X-SEO-Grade', result.grade);
      res.setHeader('X-SEO-Errors', result.errors.length.toString());
      res.setHeader('X-SEO-Warnings', result.warnings.length.toString());
    }
    return originalSend.call(this, body);
  };
  next();
};

// ====================================================================================================
// SECTION 8: VALIDATEUR D'URL SEO
// ====================================================================================================

export const validateURL = function(url: string): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  var issues: string[] = [];
  var recommendations: string[] = [];
  
  if (!url) {
    issues.push('URL vide');
    return { valid: false, issues: issues, recommendations: recommendations };
  }
  
  if (url.length > 100) {
    issues.push('URL trop longue (' + url.length + ' caractères)');
    recommendations.push('Raccourcir l\'URL pour une meilleure lisibilité');
  }
  
  if (url.indexOf('http') === -1) {
    issues.push('URL sans protocole (http/https)');
  }
  
  if (url.indexOf('?') !== -1) {
    issues.push('URL avec paramètres de requête');
    recommendations.push('Utiliser des URLs sans paramètres pour le SEO');
  }
  
  if (url.indexOf('#') !== -1) {
    issues.push('URL avec ancre');
    recommendations.push('Éviter les ancres dans les URLs principales');
  }
  
  if (url.indexOf(' ') !== -1) {
    issues.push('URL avec espaces');
    recommendations.push('Remplacer les espaces par des tirets (-)');
  }
  
  var hasUnderscore = url.indexOf('_') !== -1;
  if (hasUnderscore) {
    issues.push('URL avec underscores');
    recommendations.push('Remplacer les underscores par des tirets (-) pour le SEO');
  }
  
  var hasUppercase = url.match(/[A-Z]/);
  if (hasUppercase) {
    issues.push('URL avec lettres majuscules');
    recommendations.push('Utiliser des lettres minuscules dans les URLs');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues,
    recommendations: recommendations
  };
};

// ====================================================================================================
// SECTION 9: GENERATEUR DE RAPPORT SEO
// ====================================================================================================

export const generateSEOReport = function(result: SEOValidationResult): string {
  var report = '';
  
  report = report + '================================================================================\n';
  report = report + '                 SEO VALIDATION REPORT - SV PRESSING MADAGASCAR\n';
  report = report + '================================================================================\n\n';
  
  report = report + 'Date: ' + new Date().toISOString() + '\n';
  report = report + 'Score: ' + result.score + '%\n';
  report = report + 'Grade: ' + result.grade + '\n';
  report = report + 'Valid: ' + (result.isValid ? 'OUI' : 'NON') + '\n\n';
  
  report = report + '--------------------------------------------------------------------------------\n';
  report = report + 'METADONNEES\n';
  report = report + '--------------------------------------------------------------------------------\n';
  report = report + 'Titre: ' + result.metadata.title + '\n';
  report = report + 'Description: ' + result.metadata.description + '\n';
  report = report + 'Mots-clés: ' + result.metadata.keywords.join(', ') + '\n';
  report = report + 'Canonical: ' + result.metadata.canonical + '\n';
  report = report + 'Robots: ' + result.metadata.robots + '\n\n';
  
  report = report + '--------------------------------------------------------------------------------\n';
  report = report + 'STATISTIQUES\n';
  report = report + '--------------------------------------------------------------------------------\n';
  report = report + 'H1: ' + result.metadata.h1Count + '\n';
  report = report + 'H2: ' + result.metadata.h2Count + '\n';
  report = report + 'H3: ' + result.metadata.h3Count + '\n';
  report = report + 'Images: ' + result.metadata.images + ' (avec alt: ' + result.metadata.imagesWithAlt + ')\n';
  report = report + 'Liens internes: ' + result.metadata.internalLinks + '\n';
  report = report + 'Liens externes: ' + result.metadata.externalLinks + '\n';
  report = report + 'Données structurées: ' + result.metadata.structuredData + '\n';
  report = report + 'Mots: ' + result.metadata.wordCount + '\n';
  report = report + 'Lisibilité: ' + result.metadata.readability + '%\n';
  report = report + 'Mobile friendly: ' + (result.metadata.mobileFriendly ? 'OUI' : 'NON') + '\n';
  report = report + 'SSL: ' + (result.metadata.ssl ? 'OUI' : 'NON') + '\n';
  report = report + 'Temps de chargement: ' + result.metadata.loadTime + 'ms\n\n';
  
  if (result.errors.length > 0) {
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'ERREURS (' + result.errors.length + ')\n';
    report = report + '--------------------------------------------------------------------------------\n';
    for (var i = 0; i < result.errors.length; i++) {
      var error = result.errors[i];
      report = report + '[' + (i + 1) + '] ' + error.code + ' - ' + error.message + '\n';
    }
    report = report + '\n';
  }
  
  if (result.warnings.length > 0) {
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'AVERTISSEMENTS (' + result.warnings.length + ')\n';
    report = report + '--------------------------------------------------------------------------------\n';
    for (var j = 0; j < result.warnings.length; j++) {
      var warning = result.warnings[j];
      report = report + '[' + (j + 1) + '] ' + warning.code + ' - ' + warning.message + '\n';
    }
    report = report + '\n';
  }
  
  if (result.recommendations.length > 0) {
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'RECOMMANDATIONS (' + result.recommendations.length + ')\n';
    report = report + '--------------------------------------------------------------------------------\n';
    for (var k = 0; k < result.recommendations.length; k++) {
      var rec = result.recommendations[k];
      report = report + '[' + rec.priority.toUpperCase() + '] ' + rec.message + '\n';
      report = report + '    Action: ' + rec.action + '\n';
    }
    report = report + '\n';
  }
  
  report = report + '================================================================================\n';
  report = report + 'FIN DU RAPPORT\n';
  report = report + '================================================================================\n';
  
  return report;
};

// ====================================================================================================
// SECTION 10: VALIDATEUR AVANCE
// ====================================================================================================

export const validateSEOAdvanced = function(
  html: string,
  url: string,
  config: SEOValidationConfig = DEFAULT_SEO_CONFIG
): SEOValidationResult & { urlValidation: any } {
  var result = validateSEO(html, config);
  var urlValidation = validateURL(url);
  
  return {
    ...result,
    urlValidation: urlValidation
  };
};

// ====================================================================================================
// SECTION 11: EXPORT DU MODULE
// ====================================================================================================

export default {
  validateSEO: validateSEO,
  extractSEOMetadata: extractSEOMetadata,
  validateContent: validateContent,
  validateStructuredData: validateStructuredData,
  validateURL: validateURL,
  validateSEOAdvanced: validateSEOAdvanced,
  generateSEOReport: generateSEOReport,
  seoValidationMiddleware: seoValidationMiddleware,
  DEFAULT_SEO_CONFIG: DEFAULT_SEO_CONFIG
};