// server/utils/seo-analyzer.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO ANALYZER ULTIME LEVEL GOD
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS D'ANALYSE SEO AVANCEE
// ====================================================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateSEO, extractSEOMetadata, DEFAULT_SEO_CONFIG } from './seo-validator';
import { SitemapGenerator, SitemapValidator } from './seo-sitemap-generator';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEOAnalysisResult {
  id: string;
  url: string;
  timestamp: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: SEOAnalysisSummary;
  details: SEOAnalysisDetails;
  issues: SEOAnalysisIssue[];
  warnings: SEOAnalysisWarning[];
  recommendations: SEOAnalysisRecommendation[];
  performance: SEOAnalysisPerformance;
  competitors: SEOAnalysisCompetitor[];
  opportunities: SEOAnalysisOpportunity[];
  history: SEOAnalysisHistory;
}

export interface SEOAnalysisSummary {
  totalIssues: number;
  totalWarnings: number;
  totalRecommendations: number;
  criticalIssues: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  seoScore: number;
  contentScore: number;
  technicalScore: number;
  userExperienceScore: number;
}

export interface SEOAnalysisDetails {
  title: {
    content: string;
    length: number;
    hasKeywords: boolean;
    isOptimized: boolean;
  };
  description: {
    content: string;
    length: number;
    hasKeywords: boolean;
    isOptimized: boolean;
  };
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    hasH1: boolean;
    hasMultipleH1: boolean;
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    altTexts: string[];
  };
  links: {
    internal: number;
    external: number;
    broken: number;
    nofollow: number;
    dofollow: number;
  };
  content: {
    wordCount: number;
    keywordDensity: { [key: string]: number };
    readability: number;
    uniqueWords: number;
    averageWordLength: number;
    sentenceCount: number;
    averageSentenceLength: number;
  };
  structuredData: {
    total: number;
    types: string[];
    valid: boolean;
    errors: string[];
  };
  mobile: {
    friendly: boolean;
    viewport: string;
    touchElements: number;
  };
  security: {
    ssl: boolean;
    hsts: boolean;
    csp: boolean;
    xss: boolean;
    csrf: boolean;
  };
  performance: {
    loadTime: number;
    ttfb: number;
    domContentLoaded: number;
    fullyLoaded: number;
    pageSize: number;
    requests: number;
  };
}

export interface SEOAnalysisIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
  solution: string;
  impact: string;
}

export interface SEOAnalysisWarning {
  id: string;
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  location?: string;
  suggestion: string;
}

export interface SEOAnalysisRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  action: string;
  resources: string[];
}

export interface SEOAnalysisPerformance {
  score: number;
  grade: string;
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
  };
}

export interface SEOAnalysisCompetitor {
  name: string;
  url: string;
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  gap: number;
}

export interface SEOAnalysisOpportunity {
  id: string;
  title: string;
  description: string;
  potentialTraffic: 'low' | 'medium' | 'high';
  difficulty: 'low' | 'medium' | 'high';
  estimatedImpact: number;
  keywords: string[];
  action: string;
}

export interface SEOAnalysisHistory {
  previousScores: { date: string; score: number }[];
  trend: 'improving' | 'declining' | 'stable';
  averageScore: number;
  bestScore: number;
  worstScore: number;
}

// ====================================================================================================
// SECTION 2: ANALYSEUR SEO PRINCIPAL
// ====================================================================================================

export class SEOAnalyzer {
  private config: any;
  private cache: { [key: string]: SEOAnalysisResult };

  constructor(config: any = DEFAULT_SEO_CONFIG) {
    this.config = config;
    this.cache = {};
  }

  public analyze(html: string, url: string): SEOAnalysisResult {
    var id = crypto.randomBytes(16).toString('hex');
    var timestamp = new Date().toISOString();

    // Analyse de base
    var validation = validateSEO(html, this.config);
    var metadata = extractSEOMetadata(html);

    // Analyse détaillée
    var details = this.analyzeDetails(html, url);
    var issues = this.analyzeIssues(html, url, validation, details);
    var warnings = this.analyzeWarnings(html, url, validation, details);
    var recommendations = this.generateRecommendations(issues, warnings, details);
    var summary = this.generateSummary(issues, warnings, recommendations, details);
    var performance = this.analyzePerformance(html);
    var competitors = this.analyzeCompetitors(url);
    var opportunities = this.identifyOpportunities(details, issues, recommendations);
    var history = this.getHistory(url);

    var result: SEOAnalysisResult = {
      id: id,
      url: url,
      timestamp: timestamp,
      score: validation.score,
      grade: validation.grade,
      summary: summary,
      details: details,
      issues: issues,
      warnings: warnings,
      recommendations: recommendations,
      performance: performance,
      competitors: competitors,
      opportunities: opportunities,
      history: history
    };

    // Mettre en cache
    this.cache[id] = result;

    return result;
  }

  // ================================================================================================
  // 2.1: ANALYSE DES DETAILS
  // ================================================================================================

  private analyzeDetails(html: string, url: string): SEOAnalysisDetails {
    // Titre
    var titleMatch = html.match(/<title>([^<]*)<\/title>/);
    var title = titleMatch ? titleMatch[1] : '';
    var titleLength = title.length;
    var titleHasKeywords = this.hasKeywords(title, ['pressing', 'blanchisserie', 'Antananarivo', 'Madagascar']);
    var titleIsOptimized = titleLength >= 30 && titleLength <= 60 && titleHasKeywords;

    // Description
    var descMatch = html.match(/<meta name="description" content="([^"]*)"/);
    var description = descMatch ? descMatch[1] : '';
    var descLength = description.length;
    var descHasKeywords = this.hasKeywords(description, ['pressing', 'blanchisserie', 'Antananarivo', 'Madagascar']);
    var descIsOptimized = descLength >= 80 && descLength <= 160 && descHasKeywords;

    // Headings
    var h1Count = (html.match(/<h1/g) || []).length;
    var h2Count = (html.match(/<h2/g) || []).length;
    var h3Count = (html.match(/<h3/g) || []).length;
    var h4Count = (html.match(/<h4/g) || []).length;
    var h5Count = (html.match(/<h5/g) || []).length;
    var h6Count = (html.match(/<h6/g) || []).length;

    // Images
    var images = html.match(/<img/g) || [];
    var imagesWithAlt = html.match(/alt=/g) || [];
    var altTexts: string[] = [];
    var altMatches = html.match(/alt="([^"]*)"/g) || [];
    for (var i = 0; i < altMatches.length; i++) {
      var match = altMatches[i].match(/alt="([^"]*)"/);
      if (match) altTexts.push(match[1]);
    }

    // Links
    var internalLinks = html.match(/href="\/(?!http)/g) || [];
    var externalLinks = html.match(/href="https?:\/\/(?!svpressing\.com)/g) || [];
    var nofollowLinks = html.match(/rel="nofollow"/g) || [];
    var dofollowLinks = html.match(/rel="dofollow"/g) || [];

    // Content
    var cleanText = html.replace(/<[^>]*>/g, '').trim();
    var words = cleanText.split(/\s+/);
    var wordCount = words.length;
    var uniqueWords = new Set(words).size;
    var averageWordLength = words.reduce(function(sum, w) { return sum + w.length; }, 0) / (words.length || 1);
    var sentences = cleanText.split(/[.!?]+/);
    var sentenceCount = sentences.length;
    var averageSentenceLength = wordCount / (sentenceCount || 1);

    // Keyword density
    var keywordDensity: { [key: string]: number } = {};
    var keywords = ['pressing', 'blanchisserie', 'nettoyage', 'Antananarivo', 'Madagascar', 'Sasa Vanda', 'Clean Press'];
    for (var k = 0; k < keywords.length; k++) {
      var keyword = keywords[k];
      var count = 0;
      for (var w = 0; w < words.length; w++) {
        if (words[w].toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
          count++;
        }
      }
      keywordDensity[keyword] = (count / (wordCount || 1)) * 100;
    }

    // Readability
    var readability = this.calculateReadability(cleanText);

    // Structured Data
    var jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    var structuredDataTypes: string[] = [];
    for (var s = 0; s < jsonLdMatches.length; s++) {
      try {
        var jsonStr = jsonLdMatches[s].replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
        var data = JSON.parse(jsonStr);
        if (data['@type']) {
          var types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
          for (var t = 0; t < types.length; t++) {
            structuredDataTypes.push(types[t]);
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    // Mobile
    var mobileFriendly = html.indexOf('viewport') !== -1;
    var viewportMatch = html.match(/<meta name="viewport" content="([^"]*)"/);
    var viewport = viewportMatch ? viewportMatch[1] : '';
    var touchElements = (html.match(/<input|button|a/g) || []).length;

    // Security
    var ssl = url.indexOf('https') !== -1;
    var hsts = html.indexOf('Strict-Transport-Security') !== -1;
    var csp = html.indexOf('Content-Security-Policy') !== -1;
    var xss = html.indexOf('X-XSS-Protection') !== -1;

    // Performance (simulé)
    var loadTime = this.estimateLoadTime(html);
    var ttfb = loadTime * 0.3;
    var domContentLoaded = loadTime * 0.5;
    var fullyLoaded = loadTime;
    var pageSize = html.length / 1024;
    var requests = Math.ceil(pageSize / 50) + 10;

    return {
      title: {
        content: title,
        length: titleLength,
        hasKeywords: titleHasKeywords,
        isOptimized: titleIsOptimized
      },
      description: {
        content: description,
        length: descLength,
        hasKeywords: descHasKeywords,
        isOptimized: descIsOptimized
      },
      headings: {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count,
        h4: h4Count,
        h5: h5Count,
        h6: h6Count,
        hasH1: h1Count > 0,
        hasMultipleH1: h1Count > 1
      },
      images: {
        total: images.length,
        withAlt: imagesWithAlt.length,
        withoutAlt: images.length - imagesWithAlt.length,
        altTexts: altTexts
      },
      links: {
        internal: internalLinks.length,
        external: externalLinks.length,
        broken: 0,
        nofollow: nofollowLinks.length,
        dofollow: dofollowLinks.length
      },
      content: {
        wordCount: wordCount,
        keywordDensity: keywordDensity,
        readability: readability,
        uniqueWords: uniqueWords,
        averageWordLength: Math.round(averageWordLength * 100) / 100,
        sentenceCount: sentenceCount,
        averageSentenceLength: Math.round(averageSentenceLength * 100) / 100
      },
      structuredData: {
        total: jsonLdMatches.length,
        types: structuredDataTypes,
        valid: jsonLdMatches.length > 0,
        errors: []
      },
      mobile: {
        friendly: mobileFriendly,
        viewport: viewport,
        touchElements: touchElements
      },
      security: {
        ssl: ssl,
        hsts: hsts,
        csp: csp,
        xss: xss,
        csrf: false
      },
      performance: {
        loadTime: loadTime,
        ttfb: Math.round(ttfb),
        domContentLoaded: Math.round(domContentLoaded),
        fullyLoaded: Math.round(fullyLoaded),
        pageSize: Math.round(pageSize * 100) / 100,
        requests: requests
      }
    };
  }

  // ================================================================================================
  // 2.2: ANALYSE DES PROBLEMES
  // ================================================================================================

  private analyzeIssues(
    html: string,
    url: string,
    validation: any,
    details: SEOAnalysisDetails
  ): SEOAnalysisIssue[] {
    var issues: SEOAnalysisIssue[] = [];

    // Titre manquant
    if (!details.title.content) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'title',
        message: 'Balise title manquante',
        priority: 'critical',
        solution: 'Ajouter une balise title avec des mots-clés pertinents',
        impact: 'Le titre est un facteur de ranking majeur'
      });
    }

    // Titre trop court
    if (details.title.content && details.title.length < 30) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'title',
        message: 'Titre trop court (' + details.title.length + ' caractères)',
        priority: 'high',
        solution: 'Allonger le titre à 30-60 caractères',
        impact: 'Un titre court peut réduire le CTR'
      });
    }

    // Titre trop long
    if (details.title.content && details.title.length > 60) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'title',
        message: 'Titre trop long (' + details.title.length + ' caractères)',
        priority: 'high',
        solution: 'Réduire le titre à 30-60 caractères',
        impact: 'Un titre long peut être tronqué dans les SERP'
      });
    }

    // Description manquante
    if (!details.description.content) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'description',
        message: 'Meta description manquante',
        priority: 'high',
        solution: 'Ajouter une meta description de 80-160 caractères',
        impact: 'La description influence le CTR'
      });
    }

    // Description trop courte
    if (details.description.content && details.description.length < 80) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'description',
        message: 'Meta description trop courte (' + details.description.length + ' caractères)',
        priority: 'medium',
        solution: 'Allonger la description à 80-160 caractères',
        impact: 'Une description courte peut réduire le CTR'
      });
    }

    // Description trop longue
    if (details.description.content && details.description.length > 160) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'description',
        message: 'Meta description trop longue (' + details.description.length + ' caractères)',
        priority: 'medium',
        solution: 'Réduire la description à 80-160 caractères',
        impact: 'Une description longue peut être tronquée'
      });
    }

    // Pas de H1
    if (!details.headings.hasH1) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'headings',
        message: 'Aucune balise H1 trouvée',
        priority: 'critical',
        solution: 'Ajouter une balise H1 avec le titre principal',
        impact: 'Le H1 est important pour la structure sémantique'
      });
    }

    // Plusieurs H1
    if (details.headings.hasMultipleH1) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'headings',
        message: 'Plusieurs balises H1 trouvées (' + details.headings.h1 + ')',
        priority: 'high',
        solution: 'Utiliser une seule balise H1',
        impact: 'Plusieurs H1 peuvent créer de la confusion'
      });
    }

    // Images sans alt
    if (details.images.withoutAlt > 0) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'images',
        message: details.images.withoutAlt + ' image(s) sans attribut alt',
        priority: 'medium',
        solution: 'Ajouter des attributs alt descriptifs',
        impact: 'Les alt sont importants pour l\'accessibilité et le SEO'
      });
    }

    // Pas de données structurées
    if (details.structuredData.total === 0) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'structuredData',
        message: 'Aucune donnée structurée trouvée',
        priority: 'critical',
        solution: 'Ajouter des données structurées (JSON-LD)',
        impact: 'Les données structurées améliorent les rich snippets'
      });
    }

    // Peu de données structurées
    if (details.structuredData.total > 0 && details.structuredData.total < 3) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'structuredData',
        message: 'Peu de données structurées (' + details.structuredData.total + ')',
        priority: 'medium',
        solution: 'Ajouter plus de types de données structurées',
        impact: 'Plus de données structurées = meilleure visibilité'
      });
    }

    // Pas de SSL
    if (!details.security.ssl) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'security',
        message: 'SSL/HTTPS non activé',
        priority: 'critical',
        solution: 'Activer SSL/HTTPS sur le serveur',
        impact: 'Le SSL est un facteur de ranking'
      });
    }

    // Pas mobile friendly
    if (!details.mobile.friendly) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        category: 'mobile',
        message: 'Page non optimisée pour mobile',
        priority: 'critical',
        solution: 'Ajouter une meta viewport et un design responsive',
        impact: 'Le mobile-first est prioritaire pour Google'
      });
    }

    // Peu de contenu
    if (details.content.wordCount < 300) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'content',
        message: 'Peu de contenu (' + details.content.wordCount + ' mots)',
        priority: 'high',
        solution: 'Ajouter plus de contenu pertinent (300+ mots)',
        impact: 'Le contenu est essentiel pour le ranking'
      });
    }

    // Peu de liens internes
    if (details.links.internal < 3) {
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        category: 'links',
        message: 'Peu de liens internes (' + details.links.internal + ')',
        priority: 'medium',
        solution: 'Ajouter des liens internes vers d\'autres pages',
        impact: 'Les liens internes aident à la navigation'
      });
    }

    return issues;
  }

  // ================================================================================================
  // 2.3: ANALYSE DES AVERTISSEMENTS
  // ================================================================================================

  private analyzeWarnings(
    html: string,
    url: string,
    validation: any,
    details: SEOAnalysisDetails
  ): SEOAnalysisWarning[] {
    var warnings: SEOAnalysisWarning[] = [];

    // Title sans mots-clés
    if (details.title.content && !details.title.hasKeywords) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'title',
        message: 'Le titre ne contient pas de mots-clés principaux',
        priority: 'high',
        suggestion: 'Ajouter "pressing" ou "blanchisserie" dans le titre'
      });
    }

    // Description sans mots-clés
    if (details.description.content && !details.description.hasKeywords) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'description',
        message: 'La description ne contient pas de mots-clés principaux',
        priority: 'medium',
        suggestion: 'Ajouter des mots-clés dans la description'
      });
    }

    // Pas de H2
    if (details.headings.h2 === 0) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'headings',
        message: 'Aucune balise H2 trouvée',
        priority: 'medium',
        suggestion: 'Ajouter des balises H2 pour structurer le contenu'
      });
    }

    // Pas de liens externes
    if (details.links.external === 0) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'links',
        message: 'Aucun lien externe trouvé',
        priority: 'low',
        suggestion: 'Ajouter des liens vers des sources de confiance'
      });
    }

    // Faible lisibilité
    if (details.content.readability < 50) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'content',
        message: 'Faible lisibilité du contenu (' + details.content.readability + '%)',
        priority: 'medium',
        suggestion: 'Simplifier le langage et utiliser des phrases plus courtes'
      });
    }

    // Pas de viewport
    if (!details.mobile.viewport) {
      warnings.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'mobile',
        message: 'Meta viewport manquante',
        priority: 'high',
        suggestion: 'Ajouter <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      });
    }

    return warnings;
  }

  // ================================================================================================
  // 2.4: GENERATION DES RECOMMANDATIONS
  // ================================================================================================

  private generateRecommendations(
    issues: SEOAnalysisIssue[],
    warnings: SEOAnalysisWarning[],
    details: SEOAnalysisDetails
  ): SEOAnalysisRecommendation[] {
    var recommendations: SEOAnalysisRecommendation[] = [];

    // Recommandation sur le titre
    if (details.title.content) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'title',
        title: 'Optimiser le titre',
        description: 'Le titre actuel est de ' + details.title.length + ' caractères',
        priority: details.title.isOptimized ? 'low' : 'high',
        effort: 'low',
        impact: 'high',
        action: 'Rédiger un titre de 30-60 caractères incluant "SV Pressing" et "Antananarivo"',
        resources: ['https://moz.com/learn/seo/title-tag']
      });
    }

    // Recommandation sur la description
    if (details.description.content) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'description',
        title: 'Optimiser la meta description',
        description: 'La description actuelle est de ' + details.description.length + ' caractères',
        priority: details.description.isOptimized ? 'low' : 'high',
        effort: 'low',
        impact: 'high',
        action: 'Rédiger une description de 80-160 caractères avec les mots-clés principaux',
        resources: ['https://moz.com/learn/seo/meta-description']
      });
    }

    // Recommandation sur les headings
    if (!details.headings.hasH1) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'headings',
        title: 'Ajouter une balise H1',
        description: 'Aucune balise H1 trouvée sur la page',
        priority: 'critical',
        effort: 'low',
        impact: 'high',
        action: 'Ajouter une balise H1 avec le titre principal de la page',
        resources: ['https://moz.com/learn/seo/header-tags']
      });
    }

    if (details.headings.h2 === 0) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'headings',
        title: 'Ajouter des balises H2',
        description: 'Aucune balise H2 trouvée pour structurer le contenu',
        priority: 'medium',
        effort: 'low',
        impact: 'medium',
        action: 'Ajouter des balises H2 pour organiser le contenu en sections',
        resources: ['https://moz.com/learn/seo/header-tags']
      });
    }

    // Recommandation sur les images
    if (details.images.withoutAlt > 0) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'images',
        title: 'Ajouter des attributs alt',
        description: details.images.withoutAlt + ' images sans attribut alt',
        priority: 'medium',
        effort: 'low',
        impact: 'medium',
        action: 'Ajouter un attribut alt descriptif pour chaque image',
        resources: ['https://moz.com/learn/seo/alt-text']
      });
    }

    // Recommandation sur les données structurées
    if (details.structuredData.total === 0) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'structuredData',
        title: 'Ajouter des données structurées JSON-LD',
        description: 'Aucune donnée structurée trouvée sur la page',
        priority: 'critical',
        effort: 'medium',
        impact: 'high',
        action: 'Ajouter Organization, LocalBusiness, Product et Service schemas',
        resources: ['https://schema.org/', 'https://developers.google.com/search/docs/appearance/structured-data']
      });
    }

    // Recommandation sur SSL
    if (!details.security.ssl) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'security',
        title: 'Activer SSL/HTTPS',
        description: 'La page n\'utilise pas HTTPS',
        priority: 'critical',
        effort: 'medium',
        impact: 'high',
        action: 'Installer un certificat SSL et forcer le HTTPS',
        resources: ['https://letsencrypt.org/', 'https://www.ssl.com/']
      });
    }

    // Recommandation sur mobile
    if (!details.mobile.friendly) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'mobile',
        title: 'Optimiser pour mobile',
        description: 'La page n\'est pas optimisée pour mobile',
        priority: 'critical',
        effort: 'high',
        impact: 'high',
        action: 'Ajouter une viewport et un design responsive',
        resources: ['https://developers.google.com/search/docs/appearance/mobile-friendly']
      });
    }

    // Recommandation sur le contenu
    if (details.content.wordCount < 300) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'content',
        title: 'Augmenter le contenu',
        description: 'Page avec seulement ' + details.content.wordCount + ' mots',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        action: 'Ajouter plus de contenu pertinent (300+ mots)',
        resources: ['https://moz.com/learn/seo/on-page-factors']
      });
    }

    // Recommandation sur la lisibilité
    if (details.content.readability < 50) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: 'content',
        title: 'Améliorer la lisibilité',
        description: 'Score de lisibilité de ' + details.content.readability + '%',
        priority: 'medium',
        effort: 'medium',
        impact: 'medium',
        action: 'Utiliser des phrases plus courtes et un langage plus simple',
        resources: ['https://yoast.com/readability-analysis/']
      });
    }

    return recommendations;
  }

  // ================================================================================================
  // 2.5: GENERATION DU RESUME
  // ================================================================================================

  private generateSummary(
    issues: SEOAnalysisIssue[],
    warnings: SEOAnalysisWarning[],
    recommendations: SEOAnalysisRecommendation[],
    details: SEOAnalysisDetails
  ): SEOAnalysisSummary {
    var criticalIssues = issues.filter(function(i) { return i.priority === 'critical'; }).length;
    var highPriority = issues.filter(function(i) { return i.priority === 'high'; }).length +
                       warnings.filter(function(w) { return w.priority === 'high'; }).length;
    var mediumPriority = issues.filter(function(i) { return i.priority === 'medium'; }).length +
                         warnings.filter(function(w) { return w.priority === 'medium'; }).length;
    var lowPriority = issues.filter(function(i) { return i.priority === 'low'; }).length +
                      warnings.filter(function(w) { return w.priority === 'low'; }).length;

    var seoScore = this.calculateSEOScore(details);
    var contentScore = this.calculateContentScore(details);
    var technicalScore = this.calculateTechnicalScore(details);
    var userExperienceScore = this.calculateUXScore(details);

    return {
      totalIssues: issues.length,
      totalWarnings: warnings.length,
      totalRecommendations: recommendations.length,
      criticalIssues: criticalIssues,
      highPriority: highPriority,
      mediumPriority: mediumPriority,
      lowPriority: lowPriority,
      seoScore: seoScore,
      contentScore: contentScore,
      technicalScore: technicalScore,
      userExperienceScore: userExperienceScore
    };
  }

  // ================================================================================================
  // 2.6: CALCUL DES SCORES
  // ================================================================================================

  private calculateSEOScore(details: SEOAnalysisDetails): number {
    var score = 0;
    var maxScore = 100;

    // Titre (20%)
    if (details.title.content) {
      score = score + 10;
      if (details.title.isOptimized) score = score + 10;
    }

    // Description (20%)
    if (details.description.content) {
      score = score + 10;
      if (details.description.isOptimized) score = score + 10;
    }

    // Headings (15%)
    if (details.headings.hasH1) score = score + 10;
    if (details.headings.h2 > 0) score = score + 5;

    // Images (10%)
    var imageScore = 0;
    if (details.images.total > 0) {
      imageScore = (details.images.withAlt / details.images.total) * 10;
    }
    score = score + Math.round(imageScore);

    // Liens internes (10%)
    if (details.links.internal >= 3) score = score + 10;

    // Données structurées (10%)
    if (details.structuredData.total >= 3) score = score + 10;
    else if (details.structuredData.total > 0) score = score + 5;

    // Mobile (10%)
    if (details.mobile.friendly) score = score + 10;

    // SSL (5%)
    if (details.security.ssl) score = score + 5;

    return Math.min(score, maxScore);
  }

  private calculateContentScore(details: SEOAnalysisDetails): number {
    var score = 0;

    // Nombre de mots (40%)
    if (details.content.wordCount >= 500) score = score + 40;
    else if (details.content.wordCount >= 300) score = score + 30;
    else if (details.content.wordCount >= 200) score = score + 20;
    else if (details.content.wordCount >= 100) score = score + 10;

    // Lisibilité (30%)
    if (details.content.readability >= 80) score = score + 30;
    else if (details.content.readability >= 60) score = score + 20;
    else if (details.content.readability >= 40) score = score + 10;

    // Mots-clés (30%)
    var keywordScore = 0;
    for (var key in details.content.keywordDensity) {
      var density = details.content.keywordDensity[key];
      if (density >= 0.5 && density <= 3) keywordScore = keywordScore + 5;
    }
    score = score + Math.min(keywordScore, 30);

    return Math.min(score, 100);
  }

  private calculateTechnicalScore(details: SEOAnalysisDetails): number {
    var score = 0;

    // SSL (20%)
    if (details.security.ssl) score = score + 20;

    // Mobile friendly (20%)
    if (details.mobile.friendly) score = score + 20;

    // Données structurées (20%)
    if (details.structuredData.total >= 3) score = score + 20;
    else if (details.structuredData.total > 0) score = score + 10;

    // Images (20%)
    var imageScore = 0;
    if (details.images.total > 0) {
      imageScore = (details.images.withAlt / details.images.total) * 20;
    }
    score = score + Math.round(imageScore);

    // Headings (20%)
    if (details.headings.hasH1) score = score + 15;
    if (details.headings.h2 > 0) score = score + 5;

    return Math.min(score, 100);
  }

  private calculateUXScore(details: SEOAnalysisDetails): number {
    var score = 0;

    // Temps de chargement (40%)
    if (details.performance.loadTime < 1000) score = score + 40;
    else if (details.performance.loadTime < 2000) score = score + 30;
    else if (details.performance.loadTime < 3000) score = score + 20;
    else if (details.performance.loadTime < 4000) score = score + 10;

    // Mobile friendly (30%)
    if (details.mobile.friendly) score = score + 30;

    // Liens internes (15%)
    if (details.links.internal >= 3) score = score + 15;
    else if (details.links.internal > 0) score = score + 5;

    // Images avec alt (15%)
    var imageScore = 0;
    if (details.images.total > 0) {
      imageScore = (details.images.withAlt / details.images.total) * 15;
    }
    score = score + Math.round(imageScore);

    return Math.min(score, 100);
  }

  // ================================================================================================
  // 2.7: ANALYSE DE PERFORMANCE
  // ================================================================================================

  private analyzePerformance(html: string): SEOAnalysisPerformance {
    var loadTime = this.estimateLoadTime(html);
    var score = 0;

    if (loadTime < 1000) score = 90;
    else if (loadTime < 2000) score = 80;
    else if (loadTime < 3000) score = 70;
    else if (loadTime < 4000) score = 60;
    else score = 50;

    var grade = 'A';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: score,
      grade: grade,
      metrics: {
        firstContentfulPaint: Math.round(loadTime * 0.3),
        largestContentfulPaint: Math.round(loadTime * 0.7),
        totalBlockingTime: Math.round(loadTime * 0.1),
        cumulativeLayoutShift: Math.round((Math.random() * 0.1 + 0.01) * 100) / 100,
        speedIndex: Math.round(loadTime * 0.5),
        timeToInteractive: Math.round(loadTime * 0.8)
      }
    };
  }

  // ================================================================================================
  // 2.8: ANALYSE DES CONCURRENTS
  // ================================================================================================

  private analyzeCompetitors(url: string): SEOAnalysisCompetitor[] {
    // Dans une vraie implémentation, on analyserait les sites concurrents
    // Ici on retourne des données simulées
    var competitors: SEOAnalysisCompetitor[] = [
      {
        name: 'Sasa Vanda',
        url: 'https://sasavanda.com',
        score: 72,
        grade: 'C',
        strengths: ['Marque établie', 'Notoriété'],
        weaknesses: ['Pas de livraison gratuite', 'Prix plus élevés'],
        gap: 15
      },
      {
        name: 'Clean Press',
        url: 'https://cleanpress.mg',
        score: 68,
        grade: 'D',
        strengths: ['Service rapide'],
        weaknesses: ['Pas de collecte', 'Produits chimiques'],
        gap: 19
      },
      {
        name: 'Speed Clean',
        url: 'https://speedclean.mg',
        score: 65,
        grade: 'D',
        strengths: ['Prix compétitifs'],
        weaknesses: ['Qualité variable', 'Pas de service 7j/7'],
        gap: 22
      }
    ];

    return competitors;
  }

  // ================================================================================================
  // 2.9: IDENTIFICATION DES OPPORTUNITES
  // ================================================================================================

  private identifyOpportunities(
    details: SEOAnalysisDetails,
    issues: SEOAnalysisIssue[],
    recommendations: SEOAnalysisRecommendation[]
  ): SEOAnalysisOpportunity[] {
    var opportunities: SEOAnalysisOpportunity[] = [];

    // Opportunité sur le contenu
    if (details.content.wordCount < 500) {
      opportunities.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Augmenter le contenu de la page',
        description: 'Ajouter du contenu détaillé sur les services de pressing',
        potentialTraffic: 'high',
        difficulty: 'low',
        estimatedImpact: 85,
        keywords: ['pressing Antananarivo', 'blanchisserie Madagascar', 'nettoyage à sec'],
        action: 'Rédiger un article complet de 500+ mots sur les services'
      });
    }

    // Opportunité sur les données structurées
    if (details.structuredData.total < 3) {
      opportunities.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Ajouter des données structurées avancées',
        description: 'Ajouter Organization, LocalBusiness, Product schemas',
        potentialTraffic: 'high',
        difficulty: 'medium',
        estimatedImpact: 75,
        keywords: ['rich snippets', 'schema.org'],
        action: 'Intégrer JSON-LD pour les services et produits'
      });
    }

    // Opportunité sur les backlinks
    if (details.links.external < 2) {
      opportunities.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Créer des backlinks de qualité',
        description: 'Obtenir des liens depuis des sites d\'autorité',
        potentialTraffic: 'high',
        difficulty: 'high',
        estimatedImpact: 90,
        keywords: ['backlinks', 'autorité'],
        action: 'Contacter des partenaires et blogs pour des liens'
      });
    }

    // Opportunité sur les mots-clés longue traîne
    opportunities.push({
      id: crypto.randomBytes(8).toString('hex'),
      title: 'Cibler des mots-clés longue traîne',
      description: 'Optimiser pour des requêtes spécifiques',
      potentialTraffic: 'medium',
      difficulty: 'low',
      estimatedImpact: 60,
      keywords: ['pressing pas cher Antananarivo', 'meilleur blanchisserie Madagascar'],
      action: 'Créer du contenu pour des mots-clés spécifiques'
    });

    // Opportunité sur le local SEO
    opportunities.push({
      id: crypto.randomBytes(8).toString('hex'),
      title: 'Optimiser le SEO local',
      description: 'Cibler les recherches locales à Antananarivo',
      potentialTraffic: 'high',
      difficulty: 'medium',
      estimatedImpact: 80,
      keywords: ['pressing Analamanga', 'blanchisserie Ambohidratrimo'],
      action: 'Ajouter des pages spécifiques par quartier'
    });

    // Opportunité sur le blog
    opportunities.push({
      id: crypto.randomBytes(8).toString('hex'),
      title: 'Créer un blog avec des articles de fond',
      description: 'Publier des articles informatifs sur le pressing',
      potentialTraffic: 'high',
      difficulty: 'medium',
      estimatedImpact: 85,
      keywords: ['conseils pressing', 'entretien vêtements', 'guide nettoyage'],
      action: 'Rédiger 10 articles de blog SEO'
    });

    return opportunities;
  }

  // ================================================================================================
  // 2.10: HISTORIQUE
  // ================================================================================================

  private getHistory(url: string): SEOAnalysisHistory {
    // Dans une vraie implémentation, on récupérerait l'historique depuis une base de données
    var today = new Date();
    var previousScores: { date: string; score: number }[] = [];

    for (var i = 30; i >= 0; i--) {
      var date = new Date(today);
      date.setDate(date.getDate() - i);
      var score = 70 + Math.floor(Math.random() * 20);
      previousScores.push({
        date: date.toISOString().split('T')[0],
        score: score
      });
    }

    return {
      previousScores: previousScores,
      trend: 'improving',
      averageScore: 78,
      bestScore: 92,
      worstScore: 65
    };
  }

  // ================================================================================================
  // 2.11: UTILITAIRES
  // ================================================================================================

  private hasKeywords(text: string, keywords: string[]): boolean {
    for (var i = 0; i < keywords.length; i++) {
      if (text.toLowerCase().indexOf(keywords[i].toLowerCase()) !== -1) {
        return true;
      }
    }
    return false;
  }

  private calculateReadability(text: string): number {
    var sentences = text.split(/[.!?]+/);
    var words = text.split(/\s+/);
    var sentenceCount = sentences.length;
    var wordCount = words.length;

    if (sentenceCount === 0 || wordCount === 0) return 0;

    var avgWordsPerSentence = wordCount / sentenceCount;
    var avgSyllablesPerWord = this.averageSyllables(text);

    // Formule de Flesch-Kincaid simplifiée
    var score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private averageSyllables(text: string): number {
    var words = text.toLowerCase().match(/[a-z]+/g) || [];
    var totalSyllables = 0;
    for (var i = 0; i < words.length; i++) {
      totalSyllables = totalSyllables + this.countSyllables(words[i]);
    }
    return totalSyllables / (words.length || 1);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    var vowels = word.match(/[aeiouy]/g);
    if (!vowels) return 1;
    return vowels.length;
  }

  private estimateLoadTime(html: string): number {
    var size = html.length;
    var baseTime = 500;
    var sizeFactor = size / 100000;
    return Math.round(baseTime + sizeFactor * 2000);
  }

  public getCache(): { [key: string]: SEOAnalysisResult } {
    return this.cache;
  }

  public getCachedAnalysis(id: string): SEOAnalysisResult | null {
    return this.cache[id] || null;
  }

  public clearCache(): void {
    this.cache = {};
  }

  public generateReport(analysis: SEOAnalysisResult): string {
    var report = '';
    
    report = report + '================================================================================\n';
    report = report + '                 SEO ANALYSIS REPORT - SV PRESSING MADAGASCAR\n';
    report = report + '================================================================================\n\n';
    
    report = report + 'URL: ' + analysis.url + '\n';
    report = report + 'Date: ' + analysis.timestamp + '\n';
    report = report + 'Score: ' + analysis.score + '% (' + analysis.grade + ')\n\n';
    
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'RESUME\n';
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'Erreurs: ' + analysis.summary.totalIssues + '\n';
    report = report + 'Avertissements: ' + analysis.summary.totalWarnings + '\n';
    report = report + 'Recommandations: ' + analysis.summary.totalRecommendations + '\n';
    report = report + 'Critique: ' + analysis.summary.criticalIssues + '\n';
    report = report + 'Haute priorité: ' + analysis.summary.highPriority + '\n';
    report = report + 'Score SEO: ' + analysis.summary.seoScore + '%\n';
    report = report + 'Score Contenu: ' + analysis.summary.contentScore + '%\n';
    report = report + 'Score Technique: ' + analysis.summary.technicalScore + '%\n';
    report = report + 'Score UX: ' + analysis.summary.userExperienceScore + '%\n\n';
    
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'DETAILS\n';
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'Titre: ' + analysis.details.title.content + '\n';
    report = report + 'Description: ' + analysis.details.description.content + '\n';
    report = report + 'Mots: ' + analysis.details.content.wordCount + '\n';
    report = report + 'Lisibilité: ' + analysis.details.content.readability + '%\n';
    report = report + 'Images: ' + analysis.details.images.total + ' (' + analysis.details.images.withAlt + ' avec alt)\n';
    report = report + 'Liens internes: ' + analysis.details.links.internal + '\n';
    report = report + 'Liens externes: ' + analysis.details.links.external + '\n';
    report = report + 'Données structurées: ' + analysis.details.structuredData.total + '\n';
    report = report + 'Mobile friendly: ' + (analysis.details.mobile.friendly ? 'Oui' : 'Non') + '\n';
    report = report + 'SSL: ' + (analysis.details.security.ssl ? 'Oui' : 'Non') + '\n';
    report = report + 'Temps de chargement: ' + analysis.details.performance.loadTime + 'ms\n\n';
    
    if (analysis.issues.length > 0) {
      report = report + '--------------------------------------------------------------------------------\n';
      report = report + 'PROBLEMES (' + analysis.issues.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var i = 0; i < analysis.issues.length; i++) {
        var issue = analysis.issues[i];
        report = report + '[' + issue.priority.toUpperCase() + '] ' + issue.message + '\n';
        report = report + '    Solution: ' + issue.solution + '\n';
        report = report + '    Impact: ' + issue.impact + '\n\n';
      }
    }
    
    if (analysis.warnings.length > 0) {
      report = report + '--------------------------------------------------------------------------------\n';
      report = report + 'AVERTISSEMENTS (' + analysis.warnings.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var j = 0; j < analysis.warnings.length; j++) {
        var warning = analysis.warnings[j];
        report = report + '[' + warning.priority.toUpperCase() + '] ' + warning.message + '\n';
        report = report + '    Suggestion: ' + warning.suggestion + '\n\n';
      }
    }
    
    if (analysis.recommendations.length > 0) {
      report = report + '--------------------------------------------------------------------------------\n';
      report = report + 'RECOMMANDATIONS (' + analysis.recommendations.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var k = 0; k < analysis.recommendations.length; k++) {
        var rec = analysis.recommendations[k];
        report = report + '[' + rec.priority.toUpperCase() + '] ' + rec.title + '\n';
        report = report + '    Description: ' + rec.description + '\n';
        report = report + '    Action: ' + rec.action + '\n';
        report = report + '    Effort: ' + rec.effort + ' | Impact: ' + rec.impact + '\n\n';
      }
    }
    
    if (analysis.opportunities.length > 0) {
      report = report + '--------------------------------------------------------------------------------\n';
      report = report + 'OPPORTUNITES (' + analysis.opportunities.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var l = 0; l < analysis.opportunities.length; l++) {
        var opp = analysis.opportunities[l];
        report = report + '[' + opp.potentialTraffic.toUpperCase() + '] ' + opp.title + '\n';
        report = report + '    Description: ' + opp.description + '\n';
        report = report + '    Action: ' + opp.action + '\n';
        report = report + '    Impact estimé: ' + opp.estimatedImpact + '%\n\n';
      }
    }
    
    report = report + '================================================================================\n';
    report = report + 'FIN DU RAPPORT\n';
    report = report + '================================================================================\n';
    
    return report;
  }
}

// ====================================================================================================
// SECTION 3: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEOAnalyzer: SEOAnalyzer
};