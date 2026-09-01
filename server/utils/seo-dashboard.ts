// server/utils/seo-dashboard.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO DASHBOARD ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE DASHBOARD SEO
// ====================================================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEODashboardConfig {
  title: string;
  company: string;
  website: string;
  refreshInterval: number;
  maxHistory: number;
  metrics: string[];
  widgets: string[];
}

export interface SEODashboardData {
  timestamp: string;
  summary: SEODashboardSummary;
  metrics: SEODashboardMetrics;
  charts: SEODashboardCharts;
  alerts: SEODashboardAlert[];
  recentActivity: SEODashboardActivity[];
  topPages: SEODashboardTopPage[];
  competitors: SEODashboardCompetitor[];
  recommendations: SEODashboardRecommendation[];
}

export interface SEODashboardSummary {
  overallScore: number;
  grade: string;
  totalPages: number;
  issuesCount: number;
  warningsCount: number;
  improvements: number;
  deteriorations: number;
}

export interface SEODashboardMetrics {
  averageTitleLength: number;
  averageDescriptionLength: number;
  averageWordCount: number;
  averageLoadTime: number;
  pagesWithSSL: number;
  pagesMobileFriendly: number;
  pagesWithStructuredData: number;
  averageInternalLinks: number;
  averageExternalLinks: number;
  totalImages: number;
  totalImagesWithAlt: number;
}

export interface SEODashboardCharts {
  scoresOverTime: { date: string; score: number }[];
  issuesByCategory: { category: string; count: number }[];
  pagesByGrade: { grade: string; count: number }[];
  metricsEvolution: { metric: string; values: number[] }[];
}

export interface SEODashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
  action?: string;
}

export interface SEODashboardActivity {
  id: string;
  type: 'check' | 'update' | 'fix' | 'alert';
  message: string;
  timestamp: string;
  user: string;
}

export interface SEODashboardTopPage {
  url: string;
  score: number;
  grade: string;
  issues: number;
  warnings: number;
  lastCheck: string;
}

export interface SEODashboardCompetitor {
  name: string;
  url: string;
  score: number;
  grade: string;
  difference: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SEODashboardRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  deadline?: string;
}

// ====================================================================================================
// SECTION 2: DASHBOARD SEO PRINCIPAL
// ====================================================================================================

export class SEODashboard {
  private config: SEODashboardConfig;
  private data: SEODashboardData;
  private updateInterval: NodeJS.Timeout | null;

  constructor(config: SEODashboardConfig) {
    this.config = config;
    this.updateInterval = null;
    this.data = this.initializeData();
  }

  private initializeData(): SEODashboardData {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        overallScore: 0,
        grade: 'F',
        totalPages: 0,
        issuesCount: 0,
        warningsCount: 0,
        improvements: 0,
        deteriorations: 0
      },
      metrics: {
        averageTitleLength: 0,
        averageDescriptionLength: 0,
        averageWordCount: 0,
        averageLoadTime: 0,
        pagesWithSSL: 0,
        pagesMobileFriendly: 0,
        pagesWithStructuredData: 0,
        averageInternalLinks: 0,
        averageExternalLinks: 0,
        totalImages: 0,
        totalImagesWithAlt: 0
      },
      charts: {
        scoresOverTime: [],
        issuesByCategory: [],
        pagesByGrade: [],
        metricsEvolution: []
      },
      alerts: [],
      recentActivity: [],
      topPages: [],
      competitors: [],
      recommendations: []
    };
  }

  // ================================================================================================
  // 2.1: MISE A JOUR DU DASHBOARD
  // ================================================================================================

  public update(data: Partial<SEODashboardData>): void {
    this.data = {
      ...this.data,
      ...data,
      timestamp: new Date().toISOString()
    };
    this.generateAlerts();
    this.generateRecommendations();
  }

  public updateMetrics(metrics: Partial<SEODashboardMetrics>): void {
    this.data.metrics = {
      ...this.data.metrics,
      ...metrics
    };
  }

  public updateSummary(summary: Partial<SEODashboardSummary>): void {
    this.data.summary = {
      ...this.data.summary,
      ...summary
    };
  }

  public updateTopPages(pages: SEODashboardTopPage[]): void {
    this.data.topPages = pages;
  }

  public updateCompetitors(competitors: SEODashboardCompetitor[]): void {
    this.data.competitors = competitors;
  }

  public addActivity(activity: Omit<SEODashboardActivity, 'id' | 'timestamp'>): void {
    var newActivity: SEODashboardActivity = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      type: activity.type,
      message: activity.message,
      user: activity.user
    };
    this.data.recentActivity.unshift(newActivity);
    if (this.data.recentActivity.length > 50) {
      this.data.recentActivity = this.data.recentActivity.slice(0, 50);
    }
  }

  // ================================================================================================
  // 2.2: GENERATION DES ALERTES
  // ================================================================================================

  private generateAlerts(): void {
    var newAlerts: SEODashboardAlert[] = [];

    // Alerte sur le score global
    if (this.data.summary.overallScore < 60) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'critical',
        message: 'Score SEO global critique: ' + this.data.summary.overallScore + '%',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Exécuter un audit SEO complet'
      });
    } else if (this.data.summary.overallScore < 80) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        message: 'Score SEO à améliorer: ' + this.data.summary.overallScore + '%',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Voir les recommandations'
      });
    }

    // Alerte sur les problèmes
    if (this.data.summary.issuesCount > 10) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'critical',
        message: 'Trop de problèmes SEO: ' + this.data.summary.issuesCount,
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Corriger les problèmes prioritaires'
      });
    }

    // Alerte sur les pages
    if (this.data.summary.totalPages === 0) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        message: 'Aucune page analysée',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Lancer une analyse des pages'
      });
    }

    // Alerte SSL
    if (this.data.metrics.pagesWithSSL < this.data.summary.totalPages) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        message: 'Certaines pages n\'ont pas SSL: ' + (this.data.summary.totalPages - this.data.metrics.pagesWithSSL) + ' pages',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Activer SSL pour toutes les pages'
      });
    }

    // Alerte mobile
    if (this.data.metrics.pagesMobileFriendly < this.data.summary.totalPages) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'warning',
        message: 'Certaines pages ne sont pas mobiles: ' + (this.data.summary.totalPages - this.data.metrics.pagesMobileFriendly) + ' pages',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Optimiser les pages pour mobile'
      });
    }

    // Alerte données structurées
    if (this.data.metrics.pagesWithStructuredData < this.data.summary.totalPages) {
      newAlerts.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'info',
        message: 'Certaines pages n\'ont pas de données structurées: ' + (this.data.summary.totalPages - this.data.metrics.pagesWithStructuredData) + ' pages',
        timestamp: new Date().toISOString(),
        read: false,
        action: 'Ajouter des données structurées'
      });
    }

    this.data.alerts = newAlerts;
  }

  // ================================================================================================
  // 2.3: GENERATION DES RECOMMANDATIONS
  // ================================================================================================

  private generateRecommendations(): void {
    var recommendations: SEODashboardRecommendation[] = [];

    // Recommandation sur le score
    if (this.data.summary.overallScore < 80) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Améliorer le score SEO global',
        description: 'Le score actuel est de ' + this.data.summary.overallScore + '%',
        priority: this.data.summary.overallScore < 60 ? 'critical' : 'high',
        category: 'global',
        impact: 20,
        effort: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Recommandation sur les titres
    if (this.data.metrics.averageTitleLength < 30) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Optimiser les titres des pages',
        description: 'Titre moyen de ' + this.data.metrics.averageTitleLength + ' caractères',
        priority: 'high',
        category: 'title',
        impact: 15,
        effort: 'low'
      });
    }

    // Recommandation sur les descriptions
    if (this.data.metrics.averageDescriptionLength < 80) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Optimiser les meta descriptions',
        description: 'Description moyenne de ' + this.data.metrics.averageDescriptionLength + ' caractères',
        priority: 'high',
        category: 'description',
        impact: 15,
        effort: 'low'
      });
    }

    // Recommandation sur le contenu
    if (this.data.metrics.averageWordCount < 300) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Augmenter le contenu des pages',
        description: 'Moyenne de ' + this.data.metrics.averageWordCount + ' mots par page',
        priority: 'medium',
        category: 'content',
        impact: 10,
        effort: 'medium'
      });
    }

    // Recommandation sur SSL
    if (this.data.metrics.pagesWithSSL < this.data.summary.totalPages) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Activer SSL pour toutes les pages',
        description: this.data.metrics.pagesWithSSL + '/' + this.data.summary.totalPages + ' pages avec SSL',
        priority: 'critical',
        category: 'security',
        impact: 10,
        effort: 'medium'
      });
    }

    // Recommandation sur mobile
    if (this.data.metrics.pagesMobileFriendly < this.data.summary.totalPages) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Optimiser les pages pour mobile',
        description: this.data.metrics.pagesMobileFriendly + '/' + this.data.summary.totalPages + ' pages mobiles',
        priority: 'critical',
        category: 'mobile',
        impact: 15,
        effort: 'high'
      });
    }

    // Recommandation sur les données structurées
    if (this.data.metrics.pagesWithStructuredData < this.data.summary.totalPages) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Ajouter des données structurées',
        description: this.data.metrics.pagesWithStructuredData + '/' + this.data.summary.totalPages + ' pages avec données structurées',
        priority: 'medium',
        category: 'structuredData',
        impact: 10,
        effort: 'medium'
      });
    }

    // Recommandation sur les images
    if (this.data.metrics.totalImages > 0 && this.data.metrics.totalImagesWithAlt < this.data.metrics.totalImages) {
      var imagesWithoutAlt = this.data.metrics.totalImages - this.data.metrics.totalImagesWithAlt;
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Ajouter des attributs alt aux images',
        description: imagesWithoutAlt + ' images sans attribut alt',
        priority: 'medium',
        category: 'images',
        impact: 5,
        effort: 'low'
      });
    }

    // Recommandation sur la performance
    if (this.data.metrics.averageLoadTime > 3000) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Optimiser la vitesse de chargement',
        description: 'Temps de chargement moyen de ' + this.data.metrics.averageLoadTime + 'ms',
        priority: 'high',
        category: 'performance',
        impact: 10,
        effort: 'high'
      });
    }

    // Recommandation sur les liens internes
    if (this.data.metrics.averageInternalLinks < 3) {
      recommendations.push({
        id: crypto.randomBytes(8).toString('hex'),
        title: 'Ajouter plus de liens internes',
        description: 'Moyenne de ' + this.data.metrics.averageInternalLinks + ' liens internes',
        priority: 'medium',
        category: 'links',
        impact: 5,
        effort: 'low'
      });
    }

    // Trier par priorité
    var priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    recommendations.sort(function(a, b) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.data.recommendations = recommendations.slice(0, 10);
  }

  // ================================================================================================
  // 2.4: GENERATION DES CHARTES
  // ================================================================================================

  public generateCharts(): SEODashboardCharts {
    var charts: SEODashboardCharts = {
      scoresOverTime: [],
      issuesByCategory: [],
      pagesByGrade: [],
      metricsEvolution: []
    };

    // Scores over time (simulé)
    var today = new Date();
    for (var i = 30; i >= 0; i--) {
      var date = new Date(today);
      date.setDate(date.getDate() - i);
      var score = 65 + Math.floor(Math.random() * 30);
      charts.scoresOverTime.push({
        date: date.toISOString().split('T')[0],
        score: score
      });
    }

    // Issues by category (simulé)
    var categories = ['title', 'description', 'headings', 'images', 'links', 'content', 'structuredData', 'security', 'mobile', 'performance'];
    for (var j = 0; j < categories.length; j++) {
      charts.issuesByCategory.push({
        category: categories[j],
        count: Math.floor(Math.random() * 15)
      });
    }

    // Pages by grade (simulé)
    var grades = ['A', 'B', 'C', 'D', 'F'];
    for (var k = 0; k < grades.length; k++) {
      charts.pagesByGrade.push({
        grade: grades[k],
        count: Math.floor(Math.random() * 20) + 1
      });
    }

    // Metrics evolution (simulé)
    var metricNames = ['titleLength', 'descriptionLength', 'wordCount', 'loadTime'];
    for (var l = 0; l < metricNames.length; l++) {
      var values: number[] = [];
      for (var m = 0; m < 30; m++) {
        values.push(50 + Math.floor(Math.random() * 50));
      }
      charts.metricsEvolution.push({
        metric: metricNames[l],
        values: values
      });
    }

    return charts;
  }

  // ================================================================================================
  // 2.5: EXPORT DU DASHBOARD
  // ================================================================================================

  public getData(): SEODashboardData {
    return this.data;
  }

  public getSummary(): SEODashboardSummary {
    return this.data.summary;
  }

  public getMetrics(): SEODashboardMetrics {
    return this.data.metrics;
  }

  public getAlerts(): SEODashboardAlert[] {
    return this.data.alerts;
  }

  public getAlertsUnread(): SEODashboardAlert[] {
    return this.data.alerts.filter(function(a) { return !a.read; });
  }

  public getRecommendations(): SEODashboardRecommendation[] {
    return this.data.recommendations;
  }

  public getTopPages(): SEODashboardTopPage[] {
    return this.data.topPages;
  }

  public getCompetitors(): SEODashboardCompetitor[] {
    return this.data.competitors;
  }

  public getRecentActivity(): SEODashboardActivity[] {
    return this.data.recentActivity;
  }

  public markAlertAsRead(alertId: string): void {
    for (var i = 0; i < this.data.alerts.length; i++) {
      if (this.data.alerts[i].id === alertId) {
        this.data.alerts[i].read = true;
        break;
      }
    }
  }

  public markAllAlertsAsRead(): void {
    for (var i = 0; i < this.data.alerts.length; i++) {
      this.data.alerts[i].read = true;
    }
  }

  public resolveRecommendation(recommendationId: string): void {
    this.data.recommendations = this.data.recommendations.filter(function(r) {
      return r.id !== recommendationId;
    });
  }

  // ================================================================================================
  // 2.6: GENERATEUR DE RAPPORT HTML
  // ================================================================================================

  public generateHTML(): string {
    var html = '';
    var data = this.data;
    var charts = this.generateCharts();

    html = html + '<!DOCTYPE html>\n';
    html = html + '<html lang="fr">\n';
    html = html + '<head>\n';
    html = html + '  <meta charset="UTF-8">\n';
    html = html + '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html = html + '  <title>SEO Dashboard - ' + this.config.company + '</title>\n';
    html = html + '  <style>\n';
    html = html + this.getDashboardStyles();
    html = html + '  </style>\n';
    html = html + '</head>\n';
    html = html + '<body>\n';

    html = html + this.generateHeader();
    html = html + this.generateSummaryCards(data);
    html = html + this.generateMetricsCards(data);
    html = html + this.generateChartsSection(charts);
    html = html + this.generateAlertsSection(data);
    html = html + this.generateRecommendationsSection(data);
    html = html + this.generateTopPagesSection(data);
    html = html + this.generateCompetitorsSection(data);
    html = html + this.generateActivitySection(data);
    html = html + this.generateFooter();

    html = html + '</body>\n';
    html = html + '</html>';

    return html;
  }

  private getDashboardStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; color: #333; padding: 20px; }
      .container { max-width: 1400px; margin: 0 auto; }
      
      .header { background: linear-gradient(135deg, #0B676E, #389FA4); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
      .header h1 { font-size: 32px; }
      .header .subtitle { opacity: 0.8; margin-top: 5px; }
      .header .timestamp { float: right; font-size: 14px; opacity: 0.8; }
      
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
      .summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
      .summary-card .value { font-size: 28px; font-weight: bold; }
      .summary-card .label { font-size: 14px; color: #666; margin-top: 5px; }
      .summary-card .grade { display: inline-block; padding: 2px 12px; border-radius: 12px; font-weight: bold; font-size: 20px; }
      .grade-A { background: #d4edda; color: #155724; }
      .grade-B { background: #cce5ff; color: #004085; }
      .grade-C { background: #fff3cd; color: #856404; }
      .grade-D { background: #ffe5d0; color: #e67e22; }
      .grade-F { background: #f8d7da; color: #721c24; }
      
      .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px; }
      .metric-card { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .metric-card .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
      .metric-card .metric-value { font-size: 22px; font-weight: bold; margin-top: 5px; }
      .metric-card .metric-unit { font-size: 12px; color: #999; }
      
      .section { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 25px; }
      .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #0B676E; border-bottom: 2px solid #e8ecf1; padding-bottom: 10px; }
      
      .alert { padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
      .alert-critical { background: #f8d7da; border-color: #dc3545; color: #721c24; }
      .alert-warning { background: #fff3cd; border-color: #ffc107; color: #856404; }
      .alert-info { background: #cce5ff; border-color: #17a2b8; color: #004085; }
      .alert-success { background: #d4edda; border-color: #28a745; color: #155724; }
      .alert .alert-action { margin-top: 5px; font-size: 13px; color: #0B676E; font-weight: bold; cursor: pointer; }
      .alert .alert-action:hover { text-decoration: underline; }
      
      .recommendation { padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
      .rec-critical { border-color: #dc3545; background: #f8d7da; }
      .rec-high { border-color: #ffc107; background: #fff3cd; }
      .rec-medium { border-color: #17a2b8; background: #cce5ff; }
      .rec-low { border-color: #28a745; background: #d4edda; }
      .recommendation .rec-title { font-weight: bold; }
      .recommendation .rec-desc { font-size: 13px; color: #666; margin-top: 5px; }
      .recommendation .rec-action { margin-top: 5px; font-size: 12px; color: #0B676E; }
      
      .page-item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee; align-items: center; }
      .page-item .page-url { color: #0B676E; font-weight: 500; }
      .page-item .page-score { font-weight: bold; }
      
      .competitor-item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee; align-items: center; }
      .competitor-item .comp-name { font-weight: 500; }
      .competitor-item .comp-diff { font-weight: bold; }
      .comp-diff-positive { color: #28a745; }
      .comp-diff-negative { color: #dc3545; }
      
      .activity-item { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
      .activity-item .activity-time { color: #999; font-size: 12px; }
      
      .chart-container { margin: 20px 0; height: 200px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; }
      
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      
      .badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: bold; }
      .badge-critical { background: #f8d7da; color: #721c24; }
      .badge-high { background: #fff3cd; color: #856404; }
      .badge-medium { background: #cce5ff; color: #004085; }
      .badge-low { background: #d4edda; color: #155724; }
      
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
      
      @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
    `;
  }

  private generateHeader(): string {
    return `
      <div class="container">
        <div class="header">
          <span class="timestamp">${new Date().toISOString()}</span>
          <h1>📊 SEO Dashboard - ${this.config.company}</h1>
          <p class="subtitle">${this.config.website} · Dernière mise à jour: ${new Date().toLocaleString()}</p>
        </div>
    `;
  }

  private generateSummaryCards(data: SEODashboardData): string {
    var gradeClass = 'grade-' + data.summary.grade;
    var scoreColor = data.summary.overallScore >= 80 ? '#28a745' :
                     data.summary.overallScore >= 60 ? '#ffc107' : '#dc3545';

    return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value" style="color: ${scoreColor}">${data.summary.overallScore}%</div>
          <div class="label">Score SEO <span class="grade ${gradeClass}">${data.summary.grade}</span></div>
        </div>
        <div class="summary-card">
          <div class="value">${data.summary.totalPages}</div>
          <div class="label">Pages analysées</div>
        </div>
        <div class="summary-card">
          <div class="value" style="color: #dc3545">${data.summary.issuesCount}</div>
          <div class="label">Problèmes</div>
        </div>
        <div class="summary-card">
          <div class="value" style="color: #ffc107">${data.summary.warningsCount}</div>
          <div class="label">Avertissements</div>
        </div>
        <div class="summary-card">
          <div class="value" style="color: #28a745">${data.summary.improvements}</div>
          <div class="label">Améliorations</div>
        </div>
        <div class="summary-card">
          <div class="value" style="color: #dc3545">${data.summary.deteriorations}</div>
          <div class="label">Détériorations</div>
        </div>
      </div>
    `;
  }

  private generateMetricsCards(data: SEODashboardData): string {
    return `
      <div class="section">
        <h2 class="section-title">📈 Métriques SEO</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Titre moyen</div>
            <div class="metric-value">${data.metrics.averageTitleLength} <span class="metric-unit">caractères</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Description moyenne</div>
            <div class="metric-value">${data.metrics.averageDescriptionLength} <span class="metric-unit">caractères</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Mots par page</div>
            <div class="metric-value">${data.metrics.averageWordCount} <span class="metric-unit">mots</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Temps de chargement</div>
            <div class="metric-value">${data.metrics.averageLoadTime} <span class="metric-unit">ms</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Pages avec SSL</div>
            <div class="metric-value">${data.metrics.pagesWithSSL}/${data.summary.totalPages}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Pages mobiles</div>
            <div class="metric-value">${data.metrics.pagesMobileFriendly}/${data.summary.totalPages}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Données structurées</div>
            <div class="metric-value">${data.metrics.pagesWithStructuredData}/${data.summary.totalPages}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Images avec alt</div>
            <div class="metric-value">${data.metrics.totalImagesWithAlt}/${data.metrics.totalImages}</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateChartsSection(charts: SEODashboardCharts): string {
    return `
      <div class="section">
        <h2 class="section-title">📊 Graphiques</h2>
        <div class="grid-2">
          <div>
            <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Évolution du score</h3>
            <div class="chart-container">
              <div style="text-align: center; font-size: 14px; color: #999;">
                Score: ${charts.scoresOverTime.length > 0 ? charts.scoresOverTime[charts.scoresOverTime.length - 1].score + '%' : 'N/A'}
                <br>
                <span style="font-size: 12px;">Dernier: ${charts.scoresOverTime.length > 0 ? charts.scoresOverTime[charts.scoresOverTime.length - 1].date : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Problèmes par catégorie</h3>
            <div class="chart-container">
              <div style="text-align: center; font-size: 14px; color: #999;">
                ${charts.issuesByCategory.length > 0 ? charts.issuesByCategory.map(function(c) { return c.category + ': ' + c.count; }).join('<br>') : 'Aucune donnée'}
              </div>
            </div>
          </div>
        </div>
        <div class="grid-2" style="margin-top: 20px;">
          <div>
            <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Pages par note</h3>
            <div class="chart-container">
              <div style="text-align: center; font-size: 14px; color: #999;">
                ${charts.pagesByGrade.map(function(p) { return p.grade + ': ' + p.count; }).join(' | ')}
              </div>
            </div>
          </div>
          <div>
            <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Évolution des métriques</h3>
            <div class="chart-container">
              <div style="text-align: center; font-size: 14px; color: #999;">
                ${charts.metricsEvolution.map(function(m) { return m.metric + ' (' + m.values[m.values.length - 1] + ')'; }).join('<br>')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateAlertsSection(data: SEODashboardData): string {
    if (data.alerts.length === 0) {
      return `
        <div class="section">
          <h2 class="section-title">🔔 Alertes</h2>
          <p style="text-align: center; color: #28a745; padding: 20px;">✅ Aucune alerte - Tout va bien !</p>
        </div>
      `;
    }

    var alertsHTML = '';
    for (var i = 0; i < data.alerts.length; i++) {
      var alert = data.alerts[i];
      alertsHTML = alertsHTML + `
        <div class="alert alert-${alert.type}">
          <strong>${alert.type.toUpperCase()}</strong> ${alert.message}
          ${alert.action ? '<div class="alert-action">' + alert.action + '</div>' : ''}
          <span style="float: right; font-size: 12px; opacity: 0.7;">${alert.timestamp}</span>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">🔔 Alertes (${data.alerts.length})</h2>
        ${alertsHTML}
      </div>
    `;
  }

  private generateRecommendationsSection(data: SEODashboardData): string {
    if (data.recommendations.length === 0) {
      return `
        <div class="section">
          <h2 class="section-title">💡 Recommandations</h2>
          <p style="text-align: center; color: #28a745; padding: 20px;">✅ Aucune recommandation - Parfait !</p>
        </div>
      `;
    }

    var recHTML = '';
    for (var i = 0; i < data.recommendations.length; i++) {
      var rec = data.recommendations[i];
      recHTML = recHTML + `
        <div class="recommendation rec-${rec.priority}">
          <div class="rec-title">[${rec.priority.toUpperCase()}] ${rec.title}</div>
          <div class="rec-desc">${rec.description}</div>
          <div class="rec-action">
            Impact: ${rec.impact}% · Effort: ${rec.effort}
            ${rec.deadline ? '· Échéance: ' + rec.deadline : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">💡 Recommandations (${data.recommendations.length})</h2>
        ${recHTML}
      </div>
    `;
  }

  private generateTopPagesSection(data: SEODashboardData): string {
    if (data.topPages.length === 0) {
      return '';
    }

    var pagesHTML = '';
    for (var i = 0; i < data.topPages.length; i++) {
      var page = data.topPages[i];
      var gradeClass = 'grade-' + page.grade;
      pagesHTML = pagesHTML + `
        <div class="page-item">
          <div class="page-url">${page.url}</div>
          <div>
            <span class="page-score ${gradeClass}">${page.score}% (${page.grade})</span>
            <span style="font-size: 12px; color: #999; margin-left: 10px;">
              ${page.issues} problèmes · ${page.warnings} avertissements
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">🏆 Meilleures pages</h2>
        ${pagesHTML}
      </div>
    `;
  }

  private generateCompetitorsSection(data: SEODashboardData): string {
    if (data.competitors.length === 0) {
      return '';
    }

    var compHTML = '';
    for (var i = 0; i < data.competitors.length; i++) {
      var comp = data.competitors[i];
      var diffClass = comp.difference > 0 ? 'comp-diff-positive' : 'comp-diff-negative';
      var diffText = comp.difference > 0 ? '+' + comp.difference : '' + comp.difference;
      compHTML = compHTML + `
        <div class="competitor-item">
          <div class="comp-name">${comp.name}</div>
          <div>
            <span style="font-weight: bold;">${comp.score}% (${comp.grade})</span>
            <span class="${diffClass}" style="margin-left: 10px;">${diffText}%</span>
            <span style="font-size: 12px; color: #999; margin-left: 10px;">
              ${comp.trend === 'up' ? '📈' : comp.trend === 'down' ? '📉' : '➡️'}
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">🏁 Concurrents</h2>
        ${compHTML}
      </div>
    `;
  }

  private generateActivitySection(data: SEODashboardData): string {
    if (data.recentActivity.length === 0) {
      return '';
    }

    var activityHTML = '';
    for (var i = 0; i < Math.min(data.recentActivity.length, 10); i++) {
      var activity = data.recentActivity[i];
      var emoji = activity.type === 'check' ? '✅' : activity.type === 'update' ? '🔄' : activity.type === 'fix' ? '🔧' : '🔔';
      activityHTML = activityHTML + `
        <div class="activity-item">
          <span>${emoji}</span>
          ${activity.message}
          <span class="activity-time" style="float: right;">${new Date(activity.timestamp).toLocaleString()}</span>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">📋 Activité récente</h2>
        ${activityHTML}
      </div>
    `;
  }

  private generateFooter(): string {
    return `
        <div class="footer">
          <p>SEO Dashboard - ${this.config.company} · ${this.config.website}</p>
          <p>Généré le ${new Date().toISOString()}</p>
        </div>
      </div>
    `;
  }

  // ================================================================================================
  // 2.7: EXPORT EN JSON
  // ================================================================================================

  public exportJSON(): string {
    return JSON.stringify({
      config: this.config,
      data: this.data,
      charts: this.generateCharts(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // ================================================================================================
  // 2.8: SAUVEGARDE DU DASHBOARD
  // ================================================================================================

  public saveToFile(filepath: string): void {
    var json = this.exportJSON();
    fs.writeFileSync(filepath, json);
  }

  public loadFromFile(filepath: string): void {
    if (fs.existsSync(filepath)) {
      var content = fs.readFileSync(filepath, 'utf8');
      var data = JSON.parse(content);
      if (data.data) {
        this.data = data.data;
      }
    }
  }
}

// ====================================================================================================
// SECTION 3: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEODashboard: SEODashboard
};