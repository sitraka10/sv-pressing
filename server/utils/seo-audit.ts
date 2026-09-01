// server/utils/seo-audit.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO AUDIT ULTIME LEVEL GOD
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS D'AUDIT SEO COMPLET
// ====================================================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateSEO, extractSEOMetadata, DEFAULT_SEO_CONFIG } from './seo-validator';
import { SEOAnalyzer } from './seo-analyzer';
import { SitemapGenerator, SitemapValidator } from './seo-sitemap-generator';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEOAuditConfig {
  name: string;
  website: string;
  date: string;
  scope: 'full' | 'quick' | 'custom';
  includePages: string[];
  excludePages: string[];
  maxPages: number;
  checkMobile: boolean;
  checkSSL: boolean;
  checkPerformance: boolean;
  checkStructuredData: boolean;
  checkContent: boolean;
  checkLinks: boolean;
  checkImages: boolean;
  checkHeadings: boolean;
  checkMetaTags: boolean;
}

export interface SEOAuditResult {
  id: string;
  timestamp: string;
  config: SEOAuditConfig;
  summary: SEOAuditSummary;
  categories: SEOAuditCategory[];
  pages: SEOAuditPage[];
  issues: SEOAuditIssue[];
  recommendations: SEOAuditRecommendation[];
  score: number;
  grade: string;
}

export interface SEOAuditSummary {
  totalPages: number;
  pagesChecked: number;
  pagesWithIssues: number;
  totalIssues: number;
  totalWarnings: number;
  totalRecommendations: number;
  averageScore: number;
  grade: string;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface SEOAuditCategory {
  name: string;
  score: number;
  grade: string;
  issues: number;
  warnings: number;
  description: string;
  subcategories: SEOAuditSubcategory[];
}

export interface SEOAuditSubcategory {
  name: string;
  score: number;
  grade: string;
  issues: number;
  warnings: number;
  details: string[];
}

export interface SEOAuditPage {
  url: string;
  title: string;
  score: number;
  grade: string;
  issues: string[];
  warnings: string[];
  metadata: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    images: number;
    imagesWithAlt: number;
    internalLinks: number;
    externalLinks: number;
    structuredData: number;
    wordCount: number;
    loadTime: number;
    mobileFriendly: boolean;
    ssl: boolean;
  };
}

export interface SEOAuditIssue {
  id: string;
  category: string;
  subcategory: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  description: string;
  solution: string;
  affectedPages: string[];
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface SEOAuditRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  action: string;
  affectedPages: string[];
  resources: string[];
  estimatedTime: string;
}

// ====================================================================================================
// SECTION 2: AUDIT SEO PRINCIPAL
// ====================================================================================================

export class SEOAudit {
  private config: SEOAuditConfig;
  private analyzer: SEOAnalyzer;
  private results: SEOAuditResult;
  private pages: { url: string; html: string }[];

  constructor(config: SEOAuditConfig) {
    this.config = config;
    this.analyzer = new SEOAnalyzer(DEFAULT_SEO_CONFIG);
    this.pages = [];
    this.results = this.initializeResults();
  }

  private initializeResults(): SEOAuditResult {
    return {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: {
        totalPages: 0,
        pagesChecked: 0,
        pagesWithIssues: 0,
        totalIssues: 0,
        totalWarnings: 0,
        totalRecommendations: 0,
        averageScore: 0,
        grade: 'F',
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      },
      categories: [],
      pages: [],
      issues: [],
      recommendations: [],
      score: 0,
      grade: 'F'
    };
  }

  // ================================================================================================
  // 2.1: AJOUT DE PAGES A AUDITER
  // ================================================================================================

  public addPage(url: string, html: string): void {
    this.pages.push({ url: url, html: html });
  }

  public addPages(pages: { url: string; html: string }[]): void {
    for (var i = 0; i < pages.length; i++) {
      this.pages.push(pages[i]);
    }
  }

  // ================================================================================================
  // 2.2: EXECUTION DE L'AUDIT
  // ================================================================================================

  public run(): SEOAuditResult {
    var startTime = Date.now();

    // Analyser chaque page
    var pageResults: SEOAuditPage[] = [];
    var allIssues: SEOAuditIssue[] = [];
    var allRecommendations: SEOAuditRecommendation[] = [];

    for (var i = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      var analysis = this.analyzer.analyze(page.html, page.url);
      
      var auditPage = this.createAuditPage(page.url, analysis);
      pageResults.push(auditPage);

      // Collecter les problèmes
      var issues = this.extractIssues(analysis, page.url);
      for (var j = 0; j < issues.length; j++) {
        allIssues.push(issues[j]);
      }

      // Collecter les recommandations
      var recommendations = this.extractRecommendations(analysis, page.url);
      for (var k = 0; k < recommendations.length; k++) {
        allRecommendations.push(recommendations[k]);
      }
    }

    // Générer les catégories
    var categories = this.generateCategories(allIssues);

    // Agréger les résultats
    var summary = this.generateSummary(pageResults, allIssues, allRecommendations);
    var score = this.calculateOverallScore(pageResults);
    var grade = this.getGrade(score);

    this.results = {
      id: this.results.id,
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: summary,
      categories: categories,
      pages: pageResults,
      issues: allIssues,
      recommendations: allRecommendations,
      score: score,
      grade: grade
    };

    var endTime = Date.now();
    console.log('[SEOAudit] Audit terminé en ' + (endTime - startTime) + 'ms');

    return this.results;
  }

  // ================================================================================================
  // 2.3: CREATION D'UNE PAGE D'AUDIT
  // ================================================================================================

  private createAuditPage(url: string, analysis: any): SEOAuditPage {
    var issues: string[] = [];
    var warnings: string[] = [];

    for (var i = 0; i < analysis.issues.length; i++) {
      issues.push(analysis.issues[i].message);
    }
    for (var j = 0; j < analysis.warnings.length; j++) {
      warnings.push(analysis.warnings[j].message);
    }

    return {
      url: url,
      title: analysis.details.title.content || 'Sans titre',
      score: analysis.score,
      grade: analysis.grade,
      issues: issues,
      warnings: warnings,
      metadata: {
        titleLength: analysis.details.title.length,
        descriptionLength: analysis.details.description.length,
        h1Count: analysis.details.headings.h1,
        h2Count: analysis.details.headings.h2,
        images: analysis.details.images.total,
        imagesWithAlt: analysis.details.images.withAlt,
        internalLinks: analysis.details.links.internal,
        externalLinks: analysis.details.links.external,
        structuredData: analysis.details.structuredData.total,
        wordCount: analysis.details.content.wordCount,
        loadTime: analysis.details.performance.loadTime,
        mobileFriendly: analysis.details.mobile.friendly,
        ssl: analysis.details.security.ssl
      }
    };
  }

  // ================================================================================================
  // 2.4: EXTRACTION DES PROBLEMES
  // ================================================================================================

  private extractIssues(analysis: any, url: string): SEOAuditIssue[] {
    var issues: SEOAuditIssue[] = [];
    var severityMap: { [key: string]: 'critical' | 'high' | 'medium' | 'low' } = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };

    for (var i = 0; i < analysis.issues.length; i++) {
      var issue = analysis.issues[i];
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: issue.category,
        subcategory: issue.category,
        type: 'error',
        severity: severityMap[issue.priority] || 'medium',
        message: issue.message,
        description: issue.message,
        solution: issue.solution,
        affectedPages: [url],
        impact: issue.impact,
        effort: 'medium',
        priority: this.getPriorityScore(issue.priority)
      });
    }

    for (var j = 0; j < analysis.warnings.length; j++) {
      var warning = analysis.warnings[j];
      issues.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: warning.category,
        subcategory: warning.category,
        type: 'warning',
        severity: severityMap[warning.priority] || 'low',
        message: warning.message,
        description: warning.message,
        solution: warning.suggestion,
        affectedPages: [url],
        impact: 'Faible impact sur le SEO',
        effort: 'low',
        priority: this.getPriorityScore(warning.priority)
      });
    }

    return issues;
  }

  // ================================================================================================
  // 2.5: EXTRACTION DES RECOMMANDATIONS
  // ================================================================================================

  private extractRecommendations(analysis: any, url: string): SEOAuditRecommendation[] {
    var recommendations: SEOAuditRecommendation[] = [];
    var priorityMap: { [key: string]: 'critical' | 'high' | 'medium' | 'low' } = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };

    for (var i = 0; i < analysis.recommendations.length; i++) {
      var rec = analysis.recommendations[i];
      var effortMap: { [key: string]: 'low' | 'medium' | 'high' } = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high'
      };
      var impactMap: { [key: string]: 'low' | 'medium' | 'high' } = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high'
      };

      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        category: rec.category,
        title: rec.title,
        description: rec.description,
        priority: priorityMap[rec.priority] || 'medium',
        effort: effortMap[rec.effort] || 'medium',
        impact: impactMap[rec.impact] || 'medium',
        action: rec.action,
        affectedPages: [url],
        resources: rec.resources || [],
        estimatedTime: this.estimateTime(rec.effort)
      });
    }

    return recommendations;
  }

  // ================================================================================================
  // 2.6: GENERATION DES CATEGORIES
  // ================================================================================================

  private generateCategories(issues: SEOAuditIssue[]): SEOAuditCategory[] {
    var categoryMap: { [key: string]: { issues: SEOAuditIssue[]; warnings: SEOAuditIssue[] } } = {};

    for (var i = 0; i < issues.length; i++) {
      var issue = issues[i];
      if (!categoryMap[issue.category]) {
        categoryMap[issue.category] = { issues: [], warnings: [] };
      }
      if (issue.type === 'error') {
        categoryMap[issue.category].issues.push(issue);
      } else {
        categoryMap[issue.category].warnings.push(issue);
      }
    }

    var categories: SEOAuditCategory[] = [];
    for (var categoryName in categoryMap) {
      var data = categoryMap[categoryName];
      var totalIssues = data.issues.length + data.warnings.length;
      var score = Math.max(0, 100 - totalIssues * 5);
      var grade = this.getGrade(score);

      categories.push({
        name: categoryName,
        score: score,
        grade: grade,
        issues: data.issues.length,
        warnings: data.warnings.length,
        description: this.getCategoryDescription(categoryName),
        subcategories: this.generateSubcategories(data.issues, categoryName)
      });
    }

    return categories;
  }

  private generateSubcategories(issues: SEOAuditIssue[], category: string): SEOAuditSubcategory[] {
    var subcategoryMap: { [key: string]: SEOAuditIssue[] } = {};

    for (var i = 0; i < issues.length; i++) {
      var sub = issues[i].subcategory || 'general';
      if (!subcategoryMap[sub]) {
        subcategoryMap[sub] = [];
      }
      subcategoryMap[sub].push(issues[i]);
    }

    var subcategories: SEOAuditSubcategory[] = [];
    for (var subName in subcategoryMap) {
      var items = subcategoryMap[subName];
      var score = Math.max(0, 100 - items.length * 10);
      var grade = this.getGrade(score);
      var details: string[] = [];
      for (var j = 0; j < items.length; j++) {
        details.push(items[j].message);
      }

      subcategories.push({
        name: subName,
        score: score,
        grade: grade,
        issues: items.length,
        warnings: 0,
        details: details
      });
    }

    return subcategories;
  }

  // ================================================================================================
  // 2.7: GENERATION DU RESUME
  // ================================================================================================

  private generateSummary(
    pages: SEOAuditPage[],
    issues: SEOAuditIssue[],
    recommendations: SEOAuditRecommendation[]
  ): SEOAuditSummary {
    var totalPages = pages.length;
    var pagesWithIssues = 0;
    var totalIssues = 0;
    var totalWarnings = 0;
    var totalScore = 0;
    var criticalIssues = 0;
    var highIssues = 0;
    var mediumIssues = 0;
    var lowIssues = 0;

    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      totalScore = totalScore + page.score;
      if (page.issues.length > 0) {
        pagesWithIssues++;
        totalIssues = totalIssues + page.issues.length;
      }
      if (page.warnings.length > 0) {
        totalWarnings = totalWarnings + page.warnings.length;
      }
    }

    for (var j = 0; j < issues.length; j++) {
      var issue = issues[j];
      if (issue.severity === 'critical') criticalIssues++;
      else if (issue.severity === 'high') highIssues++;
      else if (issue.severity === 'medium') mediumIssues++;
      else lowIssues++;
    }

    var averageScore = totalPages > 0 ? Math.round(totalScore / totalPages) : 0;
    var grade = this.getGrade(averageScore);

    return {
      totalPages: totalPages,
      pagesChecked: totalPages,
      pagesWithIssues: pagesWithIssues,
      totalIssues: totalIssues,
      totalWarnings: totalWarnings,
      totalRecommendations: recommendations.length,
      averageScore: averageScore,
      grade: grade,
      criticalIssues: criticalIssues,
      highIssues: highIssues,
      mediumIssues: mediumIssues,
      lowIssues: lowIssues
    };
  }

  // ================================================================================================
  // 2.8: CALCUL DES SCORES
  // ================================================================================================

  private calculateOverallScore(pages: SEOAuditPage[]): number {
    if (pages.length === 0) return 0;
    var total = 0;
    for (var i = 0; i < pages.length; i++) {
      total = total + pages[i].score;
    }
    return Math.round(total / pages.length);
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getPriorityScore(priority: string): number {
    var map: { [key: string]: number } = {
      'critical': 100,
      'high': 80,
      'medium': 50,
      'low': 20
    };
    return map[priority] || 50;
  }

  private estimateTime(effort: string): string {
    var map: { [key: string]: string } = {
      'low': '1-2 heures',
      'medium': '1-2 jours',
      'high': '3-5 jours'
    };
    return map[effort] || '1-2 jours';
  }

  private getCategoryDescription(category: string): string {
    var descriptions: { [key: string]: string } = {
      'title': 'Balises title des pages',
      'description': 'Meta descriptions des pages',
      'headings': 'Structure des headings (H1, H2, H3)',
      'images': 'Optimisation des images (alt, taille)',
      'links': 'Liens internes et externes',
      'content': 'Qualité et quantité du contenu',
      'structuredData': 'Données structurées JSON-LD',
      'security': 'Sécurité SSL et autres',
      'mobile': 'Optimisation mobile',
      'performance': 'Performance et vitesse'
    };
    return descriptions[category] || 'Catégorie SEO';
  }

  // ================================================================================================
  // 2.9: GENERATION DU RAPPORT D'AUDIT
  // ================================================================================================

  public generateReport(): string {
    var report = '';
    var result = this.results;

    report = report + '================================================================================\n';
    report = report + '              SEO AUDIT REPORT - SV PRESSING MADAGASCAR\n';
    report = report + '================================================================================\n\n';
    
    report = report + 'Audit ID: ' + result.id + '\n';
    report = report + 'Date: ' + result.timestamp + '\n';
    report = report + 'Site: ' + this.config.website + '\n';
    report = report + 'Scope: ' + this.config.scope + '\n';
    report = report + 'Score: ' + result.score + '% (' + result.grade + ')\n\n';
    
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'RESUME EXECUTIF\n';
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'Pages analysées: ' + result.summary.totalPages + '\n';
    report = report + 'Pages avec problèmes: ' + result.summary.pagesWithIssues + '\n';
    report = report + 'Score moyen: ' + result.summary.averageScore + '% (' + result.summary.grade + ')\n';
    report = report + 'Problèmes critiques: ' + result.summary.criticalIssues + '\n';
    report = report + 'Problèmes haute priorité: ' + result.summary.highIssues + '\n';
    report = report + 'Problèmes priorité moyenne: ' + result.summary.mediumIssues + '\n';
    report = report + 'Problèmes basse priorité: ' + result.summary.lowIssues + '\n';
    report = report + 'Recommandations: ' + result.summary.totalRecommendations + '\n\n';
    
    // Catégories
    report = report + '--------------------------------------------------------------------------------\n';
    report = report + 'CATEGORIES SEO\n';
    report = report + '--------------------------------------------------------------------------------\n';
    for (var i = 0; i < result.categories.length; i++) {
      var category = result.categories[i];
      report = report + '\n[' + category.grade + '] ' + category.name + ': ' + category.score + '%\n';
      report = report + '    Problèmes: ' + category.issues + ', Avertissements: ' + category.warnings + '\n';
      report = report + '    ' + category.description + '\n';
      
      for (var j = 0; j < category.subcategories.length; j++) {
        var sub = category.subcategories[j];
        report = report + '    - ' + sub.name + ': ' + sub.score + '% (' + sub.issues + ' problèmes)\n';
        for (var k = 0; k < Math.min(sub.details.length, 3); k++) {
          report = report + '      * ' + sub.details[k] + '\n';
        }
        if (sub.details.length > 3) {
          report = report + '      * ... et ' + (sub.details.length - 3) + ' autres\n';
        }
      }
    }
    
    // Pages
    report = report + '\n--------------------------------------------------------------------------------\n';
    report = report + 'PAGES ANALYSEES\n';
    report = report + '--------------------------------------------------------------------------------\n';
    for (var l = 0; l < result.pages.length; l++) {
      var page = result.pages[l];
      report = report + '\n[' + (l + 1) + '] ' + page.url + '\n';
      report = report + '    Score: ' + page.score + '% (' + page.grade + ')\n';
      report = report + '    Titre: ' + page.metadata.titleLength + ' caractères\n';
      report = report + '    Mots: ' + page.metadata.wordCount + '\n';
      report = report + '    Images: ' + page.metadata.images + ' (' + page.metadata.imagesWithAlt + ' avec alt)\n';
      report = report + '    Liens internes: ' + page.metadata.internalLinks + '\n';
      report = report + '    Données structurées: ' + page.metadata.structuredData + '\n';
      report = report + '    Mobile: ' + (page.metadata.mobileFriendly ? 'Oui' : 'Non') + '\n';
      report = report + '    SSL: ' + (page.metadata.ssl ? 'Oui' : 'Non') + '\n';
      if (page.issues.length > 0) {
        report = report + '    Problèmes: ' + page.issues.join(', ') + '\n';
      }
      if (page.warnings.length > 0) {
        report = report + '    Avertissements: ' + page.warnings.join(', ') + '\n';
      }
    }
    
    // Problèmes
    if (result.issues.length > 0) {
      report = report + '\n--------------------------------------------------------------------------------\n';
      report = report + 'PROBLEMES DETECTES (' + result.issues.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var m = 0; m < result.issues.length; m++) {
        var issue = result.issues[m];
        report = report + '\n[' + issue.severity.toUpperCase() + '] ' + issue.message + '\n';
        report = report + '    Catégorie: ' + issue.category + '\n';
        report = report + '    Solution: ' + issue.solution + '\n';
        report = report + '    Impact: ' + issue.impact + '\n';
        report = report + '    Pages: ' + issue.affectedPages.join(', ') + '\n';
      }
    }
    
    // Recommandations
    if (result.recommendations.length > 0) {
      report = report + '\n--------------------------------------------------------------------------------\n';
      report = report + 'RECOMMANDATIONS (' + result.recommendations.length + ')\n';
      report = report + '--------------------------------------------------------------------------------\n';
      for (var n = 0; n < result.recommendations.length; n++) {
        var rec = result.recommendations[n];
        report = report + '\n[' + rec.priority.toUpperCase() + '] ' + rec.title + '\n';
        report = report + '    Description: ' + rec.description + '\n';
        report = report + '    Action: ' + rec.action + '\n';
        report = report + '    Effort: ' + rec.effort + ' | Impact: ' + rec.impact + '\n';
        report = report + '    Temps estimé: ' + rec.estimatedTime + '\n';
        report = report + '    Pages: ' + rec.affectedPages.join(', ') + '\n';
        if (rec.resources.length > 0) {
          report = report + '    Ressources: ' + rec.resources.join(', ') + '\n';
        }
      }
    }
    
    report = report + '\n================================================================================\n';
    report = report + 'FIN DE L\'AUDIT\n';
    report = report + '================================================================================\n';
    
    return report;
  }

  // ================================================================================================
  // 2.10: EXPORT EN JSON
  // ================================================================================================

  public exportJSON(): string {
    return JSON.stringify(this.results, null, 2);
  }

  // ================================================================================================
  // 2.11: SAUVEGARDE DE L'AUDIT
  // ================================================================================================

  public saveToFile(filepath: string): void {
    var json = this.exportJSON();
    fs.writeFileSync(filepath, json);
  }

  // ================================================================================================
  // 2.12: CHARGEMENT D'UN AUDIT
  // ================================================================================================

  public loadFromFile(filepath: string): void {
    if (fs.existsSync(filepath)) {
      var content = fs.readFileSync(filepath, 'utf8');
      var data = JSON.parse(content);
      this.results = data;
    }
  }

  // ================================================================================================
  // 2.13: GETTERS
  // ================================================================================================

  public getResults(): SEOAuditResult {
    return this.results;
  }

  public getSummary(): SEOAuditSummary {
    return this.results.summary;
  }

  public getIssues(): SEOAuditIssue[] {
    return this.results.issues;
  }

  public getRecommendations(): SEOAuditRecommendation[] {
    return this.results.recommendations;
  }

  public getPages(): SEOAuditPage[] {
    return this.results.pages;
  }

  public getCategories(): SEOAuditCategory[] {
    return this.results.categories;
  }

  // ================================================================================================
  // 2.14: STATISTIQUES DE L'AUDIT
  // ================================================================================================

  public getStatistics(): {
    totalIssues: number;
    totalWarnings: number;
    totalRecommendations: number;
    averageScore: number;
    grade: string;
    issuesBySeverity: { critical: number; high: number; medium: number; low: number };
    issuesByCategory: { category: string; count: number }[];
  } {
    var issuesBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    var issuesByCategoryMap: { [key: string]: number } = {};

    for (var i = 0; i < this.results.issues.length; i++) {
      var issue = this.results.issues[i];
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
      issuesByCategoryMap[issue.category] = (issuesByCategoryMap[issue.category] || 0) + 1;
    }

    var issuesByCategory: { category: string; count: number }[] = [];
    for (var category in issuesByCategoryMap) {
      issuesByCategory.push({ category: category, count: issuesByCategoryMap[category] });
    }
    issuesByCategory.sort(function(a, b) { return b.count - a.count; });

    return {
      totalIssues: this.results.summary.totalIssues,
      totalWarnings: this.results.summary.totalWarnings,
      totalRecommendations: this.results.summary.totalRecommendations,
      averageScore: this.results.summary.averageScore,
      grade: this.results.summary.grade,
      issuesBySeverity: issuesBySeverity,
      issuesByCategory: issuesByCategory
    };
  }

  // ================================================================================================
  // 2.15: GENERATION DU PLAN D'ACTION
  // ================================================================================================

  public generateActionPlan(): {
    immediate: SEOAuditRecommendation[];
    shortTerm: SEOAuditRecommendation[];
    mediumTerm: SEOAuditRecommendation[];
    longTerm: SEOAuditRecommendation[];
  } {
    var immediate: SEOAuditRecommendation[] = [];
    var shortTerm: SEOAuditRecommendation[] = [];
    var mediumTerm: SEOAuditRecommendation[] = [];
    var longTerm: SEOAuditRecommendation[] = [];

    for (var i = 0; i < this.results.recommendations.length; i++) {
      var rec = this.results.recommendations[i];
      if (rec.priority === 'critical') {
        immediate.push(rec);
      } else if (rec.priority === 'high') {
        shortTerm.push(rec);
      } else if (rec.priority === 'medium') {
        mediumTerm.push(rec);
      } else {
        longTerm.push(rec);
      }
    }

    return {
      immediate: immediate,
      shortTerm: shortTerm,
      mediumTerm: mediumTerm,
      longTerm: longTerm
    };
  }
}

// ====================================================================================================
// SECTION 3: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEOAudit: SEOAudit
};