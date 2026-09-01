// server/utils/seo-report.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO REPORT ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE GENERATION DE RAPPORTS SEO
// ====================================================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEOReportConfig {
  title: string;
  company: string;
  website: string;
  date: string;
  author: string;
  includeCharts: boolean;
  includeRecommendations: boolean;
  format: 'html' | 'json' | 'text';
}

export interface SEOReportSection {
  title: string;
  content: string;
  items?: SEOReportItem[];
}

export interface SEOReportItem {
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

export interface SEOReportData {
  summary: {
    totalPages: number;
    averageScore: number;
    grade: string;
    issues: number;
    warnings: number;
    recommendations: number;
  };
  pages: SEOReportPageData[];
  metrics: SEOReportMetrics;
  recommendations: SEOReportRecommendation[];
}

export interface SEOReportPageData {
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

export interface SEOReportMetrics {
  averageTitleLength: number;
  averageDescriptionLength: number;
  averageWordCount: number;
  averageLoadTime: number;
  averageScore: number;
  totalPages: number;
  pagesWithIssues: number;
  pagesWithWarnings: number;
  pagesWithoutSSL: number;
  pagesNotMobileFriendly: number;
}

export interface SEOReportRecommendation {
  id: string;
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  affectedPages: string[];
}

// ====================================================================================================
// SECTION 2: GENERATEUR DE RAPPORT
// ====================================================================================================

export class SEOReportGenerator {
  private config: SEOReportConfig;
  private data: SEOReportData;

  constructor(config: SEOReportConfig, data: SEOReportData) {
    this.config = config;
    this.data = data;
  }

  public generate(): string {
    switch (this.config.format) {
      case 'html':
        return this.generateHTML();
      case 'json':
        return this.generateJSON();
      case 'text':
        return this.generateText();
      default:
        return this.generateHTML();
    }
  }

  // ================================================================================================
  // 2.1: GENERATEUR HTML
  // ================================================================================================

  private generateHTML(): string {
    var html = '';
    
    html = html + '<!DOCTYPE html>\n';
    html = html + '<html lang="fr">\n';
    html = html + '<head>\n';
    html = html + '  <meta charset="UTF-8">\n';
    html = html + '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html = html + '  <title>' + this.config.title + ' - ' + this.config.company + '</title>\n';
    html = html + '  <style>\n';
    html = html + this.getStyles();
    html = html + '  </style>\n';
    html = html + '</head>\n';
    html = html + '<body>\n';
    
    // Header
    html = html + this.generateHTMLHeader();
    
    // Summary
    html = html + this.generateHTMLSummary();
    
    // Metrics
    html = html + this.generateHTMLMetrics();
    
    // Pages
    html = html + this.generateHTMLPages();
    
    // Recommendations
    if (this.config.includeRecommendations) {
      html = html + this.generateHTMLRecommendations();
    }
    
    // Footer
    html = html + this.generateHTMLFooter();
    
    html = html + '</body>\n';
    html = html + '</html>';
    
    return html;
  }

  private getStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; color: #333; padding: 40px; }
      .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 40px; }
      .header { text-align: center; padding-bottom: 30px; border-bottom: 2px solid #e8ecf1; margin-bottom: 30px; }
      .header h1 { font-size: 28px; color: #0B676E; }
      .header .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
      .header .company { color: #0B676E; font-weight: bold; }
      
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
      .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #0B676E; }
      .summary-card .value { font-size: 32px; font-weight: bold; color: #0B676E; }
      .summary-card .label { font-size: 14px; color: #666; margin-top: 5px; }
      .summary-card.error { border-left-color: #dc3545; }
      .summary-card.warning { border-left-color: #ffc107; }
      .summary-card.success { border-left-color: #28a745; }
      
      .section { margin-bottom: 30px; }
      .section-title { font-size: 20px; font-weight: bold; color: #0B676E; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e8ecf1; }
      
      .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
      .metric-item { background: #f8f9fa; padding: 15px; border-radius: 6px; }
      .metric-item .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
      .metric-item .metric-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
      .metric-item .metric-unit { font-size: 12px; color: #666; }
      
      .page-item { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
      .page-item .page-url { font-weight: bold; color: #0B676E; }
      .page-item .page-score { float: right; padding: 2px 10px; border-radius: 12px; font-weight: bold; }
      .page-item .page-score.A { background: #d4edda; color: #155724; }
      .page-item .page-score.B { background: #cce5ff; color: #004085; }
      .page-item .page-score.C { background: #fff3cd; color: #856404; }
      .page-item .page-score.D { background: #ffe5d0; color: #e67e22; }
      .page-item .page-score.F { background: #f8d7da; color: #721c24; }
      .page-item .page-details { margin-top: 10px; font-size: 13px; color: #666; }
      
      .recommendation-item { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #0B676E; }
      .recommendation-item.high { border-left-color: #dc3545; }
      .recommendation-item.medium { border-left-color: #ffc107; }
      .recommendation-item.low { border-left-color: #28a745; }
      .recommendation-item .rec-title { font-weight: bold; }
      .recommendation-item .rec-action { color: #666; font-size: 13px; margin-top: 5px; }
      .recommendation-item .rec-pages { font-size: 12px; color: #999; margin-top: 5px; }
      
      .footer { text-align: center; padding-top: 30px; border-top: 2px solid #e8ecf1; margin-top: 30px; color: #999; font-size: 12px; }
      
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      .badge.success { background: #d4edda; color: #155724; }
      .badge.warning { background: #fff3cd; color: #856404; }
      .badge.error { background: #f8d7da; color: #721c24; }
      .badge.info { background: #cce5ff; color: #004085; }
      
      @media print {
        body { padding: 0; background: white; }
        .container { box-shadow: none; padding: 20px; }
      }
    `;
  }

  private generateHTMLHeader(): string {
    return `
      <div class="container">
        <div class="header">
          <h1>${this.config.title}</h1>
          <p class="subtitle">
            <span class="company">${this.config.company}</span> · 
            ${this.config.website} · 
            ${this.config.date}
          </p>
          <p class="subtitle">Auteur: ${this.config.author}</p>
        </div>
    `;
  }

  private generateHTMLSummary(): string {
    var summary = this.data.summary;
    
    return `
      <div class="section">
        <h2 class="section-title">Résumé Exécutif</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="value">${summary.totalPages}</div>
            <div class="label">Pages analysées</div>
          </div>
          <div class="summary-card ${summary.averageScore < 70 ? 'error' : summary.averageScore < 85 ? 'warning' : 'success'}">
            <div class="value">${summary.averageScore}%</div>
            <div class="label">Score moyen (${summary.grade})</div>
          </div>
          <div class="summary-card error">
            <div class="value">${summary.issues}</div>
            <div class="label">Erreurs SEO</div>
          </div>
          <div class="summary-card warning">
            <div class="value">${summary.warnings}</div>
            <div class="label">Avertissements</div>
          </div>
          <div class="summary-card success">
            <div class="value">${summary.recommendations}</div>
            <div class="label">Recommandations</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateHTMLMetrics(): string {
    var metrics = this.data.metrics;
    
    return `
      <div class="section">
        <h2 class="section-title">Métriques Globales</h2>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Titre moyen</div>
            <div class="metric-value">${metrics.averageTitleLength} <span class="metric-unit">caractères</span></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Description moyenne</div>
            <div class="metric-value">${metrics.averageDescriptionLength} <span class="metric-unit">caractères</span></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Mots par page</div>
            <div class="metric-value">${metrics.averageWordCount} <span class="metric-unit">mots</span></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Temps de chargement</div>
            <div class="metric-value">${metrics.averageLoadTime} <span class="metric-unit">ms</span></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Pages avec problèmes</div>
            <div class="metric-value">${metrics.pagesWithIssues} / ${metrics.totalPages}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Pages sans SSL</div>
            <div class="metric-value">${metrics.pagesWithoutSSL}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Pages non mobiles</div>
            <div class="metric-value">${metrics.pagesNotMobileFriendly}</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateHTMLPages(): string {
    var html = `
      <div class="section">
        <h2 class="section-title">Pages Analysées</h2>
    `;
    
    for (var i = 0; i < this.data.pages.length; i++) {
      var page = this.data.pages[i];
      var issuesHTML = '';
      if (page.issues.length > 0) {
        issuesHTML = '<div class="page-details"><strong>Erreurs:</strong> ' + page.issues.join(', ') + '</div>';
      }
      if (page.warnings.length > 0) {
        issuesHTML = issuesHTML + '<div class="page-details"><strong>Avertissements:</strong> ' + page.warnings.join(', ') + '</div>';
      }
      
      html = html + `
        <div class="page-item">
          <span class="page-url">${page.url}</span>
          <span class="page-score ${page.grade}">${page.score}% (${page.grade})</span>
          <div class="page-details">
            Titre: ${page.metadata.titleLength} caractères · 
            H1: ${page.metadata.h1Count} · 
            Images: ${page.metadata.images} (${page.metadata.imagesWithAlt} avec alt) · 
            Mots: ${page.metadata.wordCount}
          </div>
          ${issuesHTML}
        </div>
      `;
    }
    
    html = html + '</div>';
    return html;
  }

  private generateHTMLRecommendations(): string {
    var html = `
      <div class="section">
        <h2 class="section-title">Recommandations SEO</h2>
    `;
    
    for (var i = 0; i < this.data.recommendations.length; i++) {
      var rec = this.data.recommendations[i];
      var pagesText = rec.affectedPages.length > 0 ? 'Pages: ' + rec.affectedPages.join(', ') : '';
      
      html = html + `
        <div class="recommendation-item ${rec.priority}">
          <div class="rec-title">[${rec.priority.toUpperCase()}] ${rec.category}: ${rec.message}</div>
          <div class="rec-action">Action: ${rec.action}</div>
          ${pagesText ? '<div class="rec-pages">' + pagesText + '</div>' : ''}
        </div>
      `;
    }
    
    html = html + '</div>';
    return html;
  }

  private generateHTMLFooter(): string {
    return `
        <div class="footer">
          <p>Rapport généré le ${new Date().toISOString()} · ${this.config.company}</p>
          <p>${this.config.website}</p>
        </div>
      </div>
    `;
  }

  // ================================================================================================
  // 2.2: GENERATEUR JSON
  // ================================================================================================

  private generateJSON(): string {
    return JSON.stringify({
      config: this.config,
      data: this.data,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  // ================================================================================================
  // 2.3: GENERATEUR TEXTE
  // ================================================================================================

  private generateText(): string {
    var text = '';
    
    text = text + '================================================================================\n';
    text = text + '                ' + this.config.title + '\n';
    text = text + '================================================================================\n\n';
    
    text = text + 'Entreprise: ' + this.config.company + '\n';
    text = text + 'Site web: ' + this.config.website + '\n';
    text = text + 'Date: ' + this.config.date + '\n';
    text = text + 'Auteur: ' + this.config.author + '\n\n';
    
    text = text + '--------------------------------------------------------------------------------\n';
    text = text + 'RESUME EXECUTIF\n';
    text = text + '--------------------------------------------------------------------------------\n';
    text = text + 'Pages analysées: ' + this.data.summary.totalPages + '\n';
    text = text + 'Score moyen: ' + this.data.summary.averageScore + '% (' + this.data.summary.grade + ')\n';
    text = text + 'Erreurs: ' + this.data.summary.issues + '\n';
    text = text + 'Avertissements: ' + this.data.summary.warnings + '\n';
    text = text + 'Recommandations: ' + this.data.summary.recommendations + '\n\n';
    
    text = text + '--------------------------------------------------------------------------------\n';
    text = text + 'METRIQUES GLOBALES\n';
    text = text + '--------------------------------------------------------------------------------\n';
    text = text + 'Titre moyen: ' + this.data.metrics.averageTitleLength + ' caractères\n';
    text = text + 'Description moyenne: ' + this.data.metrics.averageDescriptionLength + ' caractères\n';
    text = text + 'Mots par page: ' + this.data.metrics.averageWordCount + ' mots\n';
    text = text + 'Temps de chargement: ' + this.data.metrics.averageLoadTime + ' ms\n';
    text = text + 'Pages avec problèmes: ' + this.data.metrics.pagesWithIssues + '\n';
    text = text + 'Pages sans SSL: ' + this.data.metrics.pagesWithoutSSL + '\n';
    text = text + 'Pages non mobiles: ' + this.data.metrics.pagesNotMobileFriendly + '\n\n';
    
    text = text + '--------------------------------------------------------------------------------\n';
    text = text + 'PAGES ANALYSEES\n';
    text = text + '--------------------------------------------------------------------------------\n';
    for (var i = 0; i < this.data.pages.length; i++) {
      var page = this.data.pages[i];
      text = text + '\n[' + (i + 1) + '] ' + page.url + '\n';
      text = text + '    Score: ' + page.score + '% (' + page.grade + ')\n';
      text = text + '    Titre: ' + page.metadata.titleLength + ' caractères\n';
      text = text + '    H1: ' + page.metadata.h1Count + '\n';
      text = text + '    Images: ' + page.metadata.images + ' (' + page.metadata.imagesWithAlt + ' avec alt)\n';
      text = text + '    Mots: ' + page.metadata.wordCount + '\n';
      if (page.issues.length > 0) {
        text = text + '    Erreurs: ' + page.issues.join(', ') + '\n';
      }
      if (page.warnings.length > 0) {
        text = text + '    Avertissements: ' + page.warnings.join(', ') + '\n';
      }
    }
    
    if (this.config.includeRecommendations && this.data.recommendations.length > 0) {
      text = text + '\n--------------------------------------------------------------------------------\n';
      text = text + 'RECOMMANDATIONS SEO\n';
      text = text + '--------------------------------------------------------------------------------\n';
      for (var j = 0; j < this.data.recommendations.length; j++) {
        var rec = this.data.recommendations[j];
        text = text + '\n[' + rec.priority.toUpperCase() + '] ' + rec.category + ': ' + rec.message + '\n';
        text = text + '    Action: ' + rec.action + '\n';
        if (rec.affectedPages.length > 0) {
          text = text + '    Pages: ' + rec.affectedPages.join(', ') + '\n';
        }
      }
    }
    
    text = text + '\n================================================================================\n';
    text = text + 'FIN DU RAPPORT\n';
    text = text + '================================================================================\n';
    
    return text;
  }
}

// ====================================================================================================
// SECTION 3: CONSTRUCTEUR DE DONNEES DE RAPPORT
// ====================================================================================================

export class SEOReportDataBuilder {
  private data: SEOReportData;

  constructor() {
    this.data = {
      summary: {
        totalPages: 0,
        averageScore: 0,
        grade: 'F',
        issues: 0,
        warnings: 0,
        recommendations: 0
      },
      pages: [],
      metrics: {
        averageTitleLength: 0,
        averageDescriptionLength: 0,
        averageWordCount: 0,
        averageLoadTime: 0,
        averageScore: 0,
        totalPages: 0,
        pagesWithIssues: 0,
        pagesWithWarnings: 0,
        pagesWithoutSSL: 0,
        pagesNotMobileFriendly: 0
      },
      recommendations: []
    };
  }

  public addPage(page: SEOReportPageData): SEOReportDataBuilder {
    this.data.pages.push(page);
    return this;
  }

  public addRecommendation(recommendation: SEOReportRecommendation): SEOReportDataBuilder {
    this.data.recommendations.push(recommendation);
    return this;
  }

  public build(): SEOReportData {
    var totalPages = this.data.pages.length;
    if (totalPages === 0) return this.data;

    var totalScore = 0;
    var totalTitleLength = 0;
    var totalDescriptionLength = 0;
    var totalWordCount = 0;
    var totalLoadTime = 0;
    var pagesWithIssues = 0;
    var pagesWithWarnings = 0;
    var pagesWithoutSSL = 0;
    var pagesNotMobileFriendly = 0;
    var totalIssues = 0;
    var totalWarnings = 0;

    for (var i = 0; i < this.data.pages.length; i++) {
      var page = this.data.pages[i];
      totalScore = totalScore + page.score;
      totalTitleLength = totalTitleLength + page.metadata.titleLength;
      totalDescriptionLength = totalDescriptionLength + page.metadata.descriptionLength;
      totalWordCount = totalWordCount + page.metadata.wordCount;
      totalLoadTime = totalLoadTime + page.metadata.loadTime;
      
      if (page.issues.length > 0) {
        pagesWithIssues++;
        totalIssues = totalIssues + page.issues.length;
      }
      if (page.warnings.length > 0) {
        pagesWithWarnings++;
        totalWarnings = totalWarnings + page.warnings.length;
      }
      if (!page.metadata.ssl) {
        pagesWithoutSSL++;
      }
      if (!page.metadata.mobileFriendly) {
        pagesNotMobileFriendly++;
      }
    }

    var averageScore = Math.round(totalScore / totalPages);
    var averageTitleLength = Math.round(totalTitleLength / totalPages);
    var averageDescriptionLength = Math.round(totalDescriptionLength / totalPages);
    var averageWordCount = Math.round(totalWordCount / totalPages);
    var averageLoadTime = Math.round(totalLoadTime / totalPages);

    var grade = 'F';
    if (averageScore >= 90) grade = 'A';
    else if (averageScore >= 80) grade = 'B';
    else if (averageScore >= 70) grade = 'C';
    else if (averageScore >= 60) grade = 'D';

    this.data.summary = {
      totalPages: totalPages,
      averageScore: averageScore,
      grade: grade,
      issues: totalIssues,
      warnings: totalWarnings,
      recommendations: this.data.recommendations.length
    };

    this.data.metrics = {
      averageTitleLength: averageTitleLength,
      averageDescriptionLength: averageDescriptionLength,
      averageWordCount: averageWordCount,
      averageLoadTime: averageLoadTime,
      averageScore: averageScore,
      totalPages: totalPages,
      pagesWithIssues: pagesWithIssues,
      pagesWithWarnings: pagesWithWarnings,
      pagesWithoutSSL: pagesWithoutSSL,
      pagesNotMobileFriendly: pagesNotMobileFriendly
    };

    return this.data;
  }
}

// ====================================================================================================
// SECTION 4: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEOReportGenerator: SEOReportGenerator,
  SEOReportDataBuilder: SEOReportDataBuilder
};