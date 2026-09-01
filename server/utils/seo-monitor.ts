// server/utils/seo-monitor.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO MONITOR ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE MONITORING SEO EN TEMPS REEL
// ====================================================================================================

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SEOMonitorConfig {
  interval: number;
  maxLogs: number;
  alerts: SEOMonitorAlert[];
  metrics: SEOMonitorMetric[];
}

export interface SEOMonitorMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SEOMonitorAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SEOMonitorSnapshot {
  timestamp: string;
  url: string;
  score: number;
  grade: string;
  metrics: SEOMonitorMetric[];
  errors: number;
  warnings: number;
}

export interface SEOMonitorHistory {
  snapshots: SEOMonitorSnapshot[];
  alerts: SEOMonitorAlert[];
  trends: SEOMonitorTrend[];
}

export interface SEOMonitorTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
}

// ====================================================================================================
// SECTION 2: CONFIGURATION PAR DEFAUT
// ====================================================================================================

export const DEFAULT_MONITOR_CONFIG: SEOMonitorConfig = {
  interval: 3600000,
  maxLogs: 1000,
  alerts: [],
  metrics: [
    { name: 'title_length', value: 0, unit: 'chars', threshold: 30, severity: 'medium' },
    { name: 'description_length', value: 0, unit: 'chars', threshold: 80, severity: 'medium' },
    { name: 'h1_count', value: 0, unit: 'count', threshold: 1, severity: 'high' },
    { name: 'images_without_alt', value: 0, unit: 'count', threshold: 0, severity: 'medium' },
    { name: 'internal_links', value: 0, unit: 'count', threshold: 5, severity: 'low' },
    { name: 'structured_data', value: 0, unit: 'count', threshold: 3, severity: 'high' },
    { name: 'word_count', value: 0, unit: 'words', threshold: 300, severity: 'medium' },
    { name: 'load_time', value: 0, unit: 'ms', threshold: 3000, severity: 'high' }
  ]
};

// ====================================================================================================
// SECTION 3: MONITOR PRINCIPAL
// ====================================================================================================

export class SEOMonitor {
  private config: SEOMonitorConfig;
  private history: SEOMonitorHistory;
  private intervalId: NodeJS.Timeout | null;
  private isRunning: boolean;

  constructor(config: SEOMonitorConfig = DEFAULT_MONITOR_CONFIG) {
    this.config = config;
    this.history = {
      snapshots: [],
      alerts: [],
      trends: []
    };
    this.intervalId = null;
    this.isRunning = false;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.monitor();
    }, this.config.interval);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public monitor(): SEOMonitorSnapshot {
    var snapshot = this.collectSnapshot();
    this.history.snapshots.push(snapshot);
    if (this.history.snapshots.length > this.config.maxLogs) {
      this.history.snapshots.shift();
    }
    this.checkAlerts(snapshot);
    this.updateTrends(snapshot);
    return snapshot;
  }

  private collectSnapshot(): SEOMonitorSnapshot {
    var metrics: SEOMonitorMetric[] = [];
    var errors = 0;
    var warnings = 0;

    // Collecter les métriques à partir des métadonnées de la page
    var metadata = this.extractMetadata();

    for (var i = 0; i < this.config.metrics.length; i++) {
      var metricConfig = this.config.metrics[i];
      var value = this.getMetricValue(metricConfig.name, metadata);
      var metric: SEOMonitorMetric = {
        name: metricConfig.name,
        value: value,
        unit: metricConfig.unit,
        threshold: metricConfig.threshold,
        severity: metricConfig.severity
      };
      metrics.push(metric);

      if (value < metricConfig.threshold) {
        warnings++;
      }
    }

    var score = this.calculateScore(metrics);

    return {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      score: score,
      grade: this.getGrade(score),
      metrics: metrics,
      errors: errors,
      warnings: warnings
    };
  }

  private extractMetadata(): any {
    // Dans un environnement browser, extraire les métadonnées du DOM
    if (typeof document !== 'undefined') {
      var title = document.title || '';
      var description = '';
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        description = metaDesc.getAttribute('content') || '';
      }
      var h1Count = document.querySelectorAll('h1').length;
      var h2Count = document.querySelectorAll('h2').length;
      var images = document.querySelectorAll('img').length;
      var imagesWithAlt = document.querySelectorAll('img[alt]').length;
      var links = document.querySelectorAll('a').length;
      var internalLinks = document.querySelectorAll('a[href^="/"]').length;
      var structuredData = document.querySelectorAll('script[type="application/ld+json"]').length;
      var wordCount = document.body.innerText.split(/\s+/).length;

      return {
        title: title,
        description: description,
        h1Count: h1Count,
        h2Count: h2Count,
        images: images,
        imagesWithAlt: imagesWithAlt,
        links: links,
        internalLinks: internalLinks,
        structuredData: structuredData,
        wordCount: wordCount
      };
    }

    // Mode server - retourner des valeurs par défaut
    return {
      title: '',
      description: '',
      h1Count: 0,
      h2Count: 0,
      images: 0,
      imagesWithAlt: 0,
      links: 0,
      internalLinks: 0,
      structuredData: 0,
      wordCount: 0
    };
  }

  private getMetricValue(name: string, metadata: any): number {
    switch (name) {
      case 'title_length':
        return metadata.title ? metadata.title.length : 0;
      case 'description_length':
        return metadata.description ? metadata.description.length : 0;
      case 'h1_count':
        return metadata.h1Count || 0;
      case 'h2_count':
        return metadata.h2Count || 0;
      case 'images_without_alt':
        return (metadata.images || 0) - (metadata.imagesWithAlt || 0);
      case 'images':
        return metadata.images || 0;
      case 'images_with_alt':
        return metadata.imagesWithAlt || 0;
      case 'internal_links':
        return metadata.internalLinks || 0;
      case 'external_links':
        return (metadata.links || 0) - (metadata.internalLinks || 0);
      case 'structured_data':
        return metadata.structuredData || 0;
      case 'word_count':
        return metadata.wordCount || 0;
      case 'load_time':
        return this.getLoadTime();
      default:
        return 0;
    }
  }

  private getLoadTime(): number {
    if (typeof window !== 'undefined' && window.performance) {
      var perfData = window.performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    }
    return 1500;
  }

  private calculateScore(metrics: SEOMonitorMetric[]): number {
    var score = 100;
    for (var i = 0; i < metrics.length; i++) {
      var metric = metrics[i];
      if (metric.value < metric.threshold) {
        var penalty = 0;
        switch (metric.severity) {
          case 'critical':
            penalty = 15;
            break;
          case 'high':
            penalty = 10;
            break;
          case 'medium':
            penalty = 5;
            break;
          case 'low':
            penalty = 2;
            break;
        }
        score = score - penalty;
      }
    }
    return Math.max(0, Math.min(100, score));
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private checkAlerts(snapshot: SEOMonitorSnapshot): void {
    for (var i = 0; i < snapshot.metrics.length; i++) {
      var metric = snapshot.metrics[i];
      if (metric.value < metric.threshold) {
        var alert: SEOMonitorAlert = {
          id: crypto.randomBytes(8).toString('hex'),
          type: metric.severity === 'critical' ? 'error' : 'warning',
          message: 'Métrique "' + metric.name + '" sous le seuil: ' + metric.value + ' ' + metric.unit + ' (seuil: ' + metric.threshold + ')',
          timestamp: snapshot.timestamp,
          resolved: false
        };
        this.history.alerts.push(alert);
      }
    }

    if (snapshot.score < 60) {
      var criticalAlert: SEOMonitorAlert = {
        id: crypto.randomBytes(8).toString('hex'),
        type: 'error',
        message: 'Score SEO critique: ' + snapshot.score + '%',
        timestamp: snapshot.timestamp,
        resolved: false
      };
      this.history.alerts.push(criticalAlert);
    }
  }

  private updateTrends(snapshot: SEOMonitorSnapshot): void {
    var lastSnapshot = this.history.snapshots[this.history.snapshots.length - 2];
    if (!lastSnapshot) return;

    for (var i = 0; i < snapshot.metrics.length; i++) {
      var current = snapshot.metrics[i];
      var previous = lastSnapshot.metrics[i];
      if (current && previous) {
        var change = current.value - previous.value;
        var direction: 'up' | 'down' | 'stable' = 'stable';
        if (change > 0) direction = 'up';
        else if (change < 0) direction = 'down';

        var trend: SEOMonitorTrend = {
          metric: current.name,
          direction: direction,
          change: change,
          period: '1h'
        };
        this.history.trends.push(trend);
      }
    }
  }

  public getHistory(): SEOMonitorHistory {
    return this.history;
  }

  public getAlerts(): SEOMonitorAlert[] {
    return this.history.alerts.filter(function(alert) {
      return !alert.resolved;
    });
  }

  public getTrends(): SEOMonitorTrend[] {
    return this.history.trends;
  }

  public getLatestSnapshot(): SEOMonitorSnapshot | null {
    if (this.history.snapshots.length === 0) return null;
    return this.history.snapshots[this.history.snapshots.length - 1];
  }

  public getStatus(): {
    running: boolean;
    snapshots: number;
    alerts: number;
    lastCheck: string | null;
  } {
    var lastSnapshot = this.getLatestSnapshot();
    return {
      running: this.isRunning,
      snapshots: this.history.snapshots.length,
      alerts: this.getAlerts().length,
      lastCheck: lastSnapshot ? lastSnapshot.timestamp : null
    };
  }

  public resolveAlert(alertId: string): void {
    for (var i = 0; i < this.history.alerts.length; i++) {
      if (this.history.alerts[i].id === alertId) {
        this.history.alerts[i].resolved = true;
        this.history.alerts[i].resolvedAt = new Date().toISOString();
        break;
      }
    }
  }
}

// ====================================================================================================
// SECTION 4: MIDDLEWARE DE MONITORING
// ====================================================================================================

export const seoMonitorMiddleware = function(monitor: SEOMonitor) {
  return function(req: Request, res: Response, next: NextFunction) {
    var startTime = Date.now();
    
    var originalSend = res.send;
    res.send = function(body: any) {
      var endTime = Date.now();
      var loadTime = endTime - startTime;
      
      if (typeof body === 'string' && body.indexOf('<html') !== -1) {
        // Mettre à jour le temps de chargement dans le monitor
        var metrics = monitor['config'].metrics;
        for (var i = 0; i < metrics.length; i++) {
          if (metrics[i].name === 'load_time') {
            metrics[i].value = loadTime;
            break;
          }
        }
        
        // Collecter un snapshot
        var snapshot = monitor['collectSnapshot']();
        monitor['history'].snapshots.push(snapshot);
        
        // Ajouter les métriques SEO
        res.setHeader('X-SEO-Monitor', 'active');
        res.setHeader('X-SEO-Score', snapshot.score.toString());
        res.setHeader('X-SEO-Grade', snapshot.grade);
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// ====================================================================================================
// SECTION 5: MONITORING DE PERFORMANCE
// ====================================================================================================

export class SEOPerformanceMonitor {
  private metrics: {
    [key: string]: { values: number[]; average: number; max: number; min: number; count: number };
  } = {};

  public recordMetric(name: string, value: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = {
        values: [],
        average: 0,
        max: 0,
        min: Infinity,
        count: 0
      };
    }

    var metric = this.metrics[name];
    metric.values.push(value);
    metric.count++;
    metric.average = metric.values.reduce(function(a, b) { return a + b; }, 0) / metric.count;
    metric.max = Math.max(metric.max, value);
    metric.min = Math.min(metric.min, value);

    if (metric.values.length > 100) {
      metric.values.shift();
    }
  }

  public getMetric(name: string): {
    average: number;
    max: number;
    min: number;
    count: number;
    current: number;
  } | null {
    var metric = this.metrics[name];
    if (!metric) return null;
    return {
      average: metric.average,
      max: metric.max,
      min: metric.min,
      count: metric.count,
      current: metric.values[metric.values.length - 1] || 0
    };
  }

  public getAllMetrics(): {
    [key: string]: {
      average: number;
      max: number;
      min: number;
      count: number;
      current: number;
    };
  } {
    var result: any = {};
    for (var key in this.metrics) {
      result[key] = this.getMetric(key);
    }
    return result;
  }

  public reset(): void {
    this.metrics = {};
  }
}

// ====================================================================================================
// SECTION 6: ALERTES SEO
// ====================================================================================================

export class SEOAlertManager {
  private alerts: SEOMonitorAlert[] = [];
  private listeners: ((alert: SEOMonitorAlert) => void)[] = [];

  public addAlert(alert: Omit<SEOMonitorAlert, 'id' | 'timestamp' | 'resolved'>): SEOMonitorAlert {
    var newAlert: SEOMonitorAlert = {
      id: crypto.randomBytes(8).toString('hex'),
      type: alert.type,
      message: alert.message,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    this.alerts.push(newAlert);
    
    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i](newAlert);
    }
    
    return newAlert;
  }

  public resolveAlert(id: string): void {
    for (var i = 0; i < this.alerts.length; i++) {
      if (this.alerts[i].id === id) {
        this.alerts[i].resolved = true;
        this.alerts[i].resolvedAt = new Date().toISOString();
        break;
      }
    }
  }

  public getAlerts(filter?: { type?: string; resolved?: boolean }): SEOMonitorAlert[] {
    var result = this.alerts;
    if (filter) {
      if (filter.type !== undefined) {
        result = result.filter(function(a) { return a.type === filter.type; });
      }
      if (filter.resolved !== undefined) {
        result = result.filter(function(a) { return a.resolved === filter.resolved; });
      }
    }
    return result;
  }

  public addListener(listener: (alert: SEOMonitorAlert) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (alert: SEOMonitorAlert) => void): void {
    var index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// ====================================================================================================
// SECTION 7: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEOMonitor: SEOMonitor,
  SEOPerformanceMonitor: SEOPerformanceMonitor,
  SEOAlertManager: SEOAlertManager,
  seoMonitorMiddleware: seoMonitorMiddleware,
  DEFAULT_MONITOR_CONFIG: DEFAULT_MONITOR_CONFIG
};