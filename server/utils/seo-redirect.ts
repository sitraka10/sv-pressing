// server/utils/seo-redirect.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO REDIRECT ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE GESTION DES REDIRECTIONS
// ====================================================================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface RedirectRule {
  id: string;
  source: string;
  target: string;
  type: 301 | 302 | 307 | 308;
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  conditions?: RedirectCondition[];
  queryParams?: 'preserve' | 'discard' | 'custom';
  customQuery?: { [key: string]: string };
  notes?: string;
}

export interface RedirectCondition {
  field: 'host' | 'path' | 'query' | 'header' | 'cookie' | 'ip' | 'user-agent';
  operator: 'equals' | 'contains' | 'starts-with' | 'ends-with' | 'matches' | 'exists' | 'not-exists';
  value: string;
  caseSensitive: boolean;
}

export interface RedirectStats {
  id: string;
  totalHits: number;
  lastHit: string;
  dailyHits: { date: string; count: number }[];
  hourlyHits: { hour: string; count: number }[];
  referers: { referer: string; count: number }[];
}

export interface RedirectBulkResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
  rules: RedirectRule[];
}

export interface RedirectImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  rules: RedirectRule[];
}

// ====================================================================================================
// SECTION 2: GESTIONNAIRE DE REDIRECTIONS
// ====================================================================================================

export class RedirectManager {
  private rules: RedirectRule[];
  private stats: { [key: string]: RedirectStats };
  private storagePath: string;

  constructor(storagePath?: string) {
    this.rules = [];
    this.stats = {};
    this.storagePath = storagePath || './redirects.json';
    this.load();
  }

  // ================================================================================================
  // 2.1: AJOUT DE REDIRECTIONS
  // ================================================================================================

  public addRule(rule: Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'>): RedirectRule {
    var newRule: RedirectRule = {
      id: crypto.randomBytes(8).toString('hex'),
      source: this.normalizePath(rule.source),
      target: rule.target,
      type: rule.type || 301,
      active: rule.active !== undefined ? rule.active : true,
      priority: rule.priority || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: rule.expiresAt || undefined,
      conditions: rule.conditions || [],
      queryParams: rule.queryParams || 'discard',
      customQuery: rule.customQuery || {},
      notes: rule.notes || ''
    };

    this.rules.push(newRule);
    this.save();
    return newRule;
  }

  public addRules(rules: Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'>[]): RedirectRule[] {
    var added: RedirectRule[] = [];
    for (var i = 0; i < rules.length; i++) {
      added.push(this.addRule(rules[i]));
    }
    return added;
  }

  // ================================================================================================
  // 2.2: SUPPRESSION DE REDIRECTIONS
  // ================================================================================================

  public removeRule(id: string): boolean {
    var index = -1;
    for (var i = 0; i < this.rules.length; i++) {
      if (this.rules[i].id === id) {
        index = i;
        break;
      }
    }
    if (index === -1) return false;
    this.rules.splice(index, 1);
    delete this.stats[id];
    this.save();
    return true;
  }

  public removeRules(ids: string[]): number {
    var removed = 0;
    for (var i = 0; i < ids.length; i++) {
      if (this.removeRule(ids[i])) {
        removed++;
      }
    }
    return removed;
  }

  public clearAll(): void {
    this.rules = [];
    this.stats = {};
    this.save();
  }

  // ================================================================================================
  // 2.3: MISE A JOUR DE REDIRECTIONS
  // ================================================================================================

  public updateRule(id: string, updates: Partial<RedirectRule>): RedirectRule | null {
    var rule = this.getRule(id);
    if (!rule) return null;

    if (updates.source) {
      rule.source = this.normalizePath(updates.source);
    }
    if (updates.target) {
      rule.target = updates.target;
    }
    if (updates.type) {
      rule.type = updates.type;
    }
    if (updates.active !== undefined) {
      rule.active = updates.active;
    }
    if (updates.priority !== undefined) {
      rule.priority = updates.priority;
    }
    if (updates.expiresAt !== undefined) {
      rule.expiresAt = updates.expiresAt;
    }
    if (updates.conditions !== undefined) {
      rule.conditions = updates.conditions;
    }
    if (updates.queryParams !== undefined) {
      rule.queryParams = updates.queryParams;
    }
    if (updates.customQuery !== undefined) {
      rule.customQuery = updates.customQuery;
    }
    if (updates.notes !== undefined) {
      rule.notes = updates.notes;
    }

    rule.updatedAt = new Date().toISOString();
    this.save();
    return rule;
  }

  public toggleRule(id: string): RedirectRule | null {
    var rule = this.getRule(id);
    if (!rule) return null;
    rule.active = !rule.active;
    rule.updatedAt = new Date().toISOString();
    this.save();
    return rule;
  }

  // ================================================================================================
  // 2.4: RECHERCHE DE REDIRECTIONS
  // ================================================================================================

  public getRule(id: string): RedirectRule | null {
    for (var i = 0; i < this.rules.length; i++) {
      if (this.rules[i].id === id) {
        return this.rules[i];
      }
    }
    return null;
  }

  public getRules(): RedirectRule[] {
    return this.rules;
  }

  public getActiveRules(): RedirectRule[] {
    return this.rules.filter(function(r) { return r.active; });
  }

  public getExpiredRules(): RedirectRule[] {
    var now = new Date().toISOString();
    return this.rules.filter(function(r) {
      return r.expiresAt && r.expiresAt < now;
    });
  }

  public findRedirect(source: string): RedirectRule | null {
    var normalized = this.normalizePath(source);
    var candidates = this.rules.filter(function(r) {
      return r.active && r.source === normalized;
    });
    if (candidates.length === 0) return null;
    
    // Trier par priorité (plus haut = plus prioritaire)
    candidates.sort(function(a, b) {
      return b.priority - a.priority;
    });
    
    return candidates[0];
  }

  public findRedirects(source: string): RedirectRule[] {
    var normalized = this.normalizePath(source);
    return this.rules.filter(function(r) {
      return r.active && r.source === normalized;
    });
  }

  public searchRules(query: string): RedirectRule[] {
    var q = query.toLowerCase();
    return this.rules.filter(function(r) {
      return r.source.toLowerCase().indexOf(q) !== -1 ||
             r.target.toLowerCase().indexOf(q) !== -1 ||
             (r.notes && r.notes.toLowerCase().indexOf(q) !== -1);
    });
  }

  // ================================================================================================
  // 2.5: RESOLUTION DE REDIRECTION
  // ================================================================================================

  public resolve(url: string, req?: Request): string | null {
    var normalized = this.normalizePath(url);
    var rule = this.findRedirect(normalized);
    
    if (!rule) return null;
    if (rule.expiresAt && rule.expiresAt < new Date().toISOString()) {
      return null;
    }
    if (rule.conditions && rule.conditions.length > 0 && req) {
      if (!this.checkConditions(rule.conditions, req)) {
        return null;
      }
    }

    // Enregistrer les statistiques
    this.recordHit(rule.id);

    var target = rule.target;
    
    // Gestion des paramètres de requête
    if (rule.queryParams === 'preserve') {
      var queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        target = target + url.substring(queryIndex);
      }
    } else if (rule.queryParams === 'custom' && rule.customQuery) {
      var query = '';
      for (var key in rule.customQuery) {
        if (query.length > 0) query = query + '&';
        query = query + key + '=' + encodeURIComponent(rule.customQuery[key]);
      }
      if (query.length > 0) {
        target = target + '?' + query;
      }
    }

    return target;
  }

  private checkConditions(conditions: RedirectCondition[], req: Request): boolean {
    for (var i = 0; i < conditions.length; i++) {
      var cond = conditions[i];
      var value = this.getConditionValue(cond.field, req);
      if (!this.checkCondition(cond, value)) {
        return false;
      }
    }
    return true;
  }

  private getConditionValue(field: string, req: Request): string {
    switch (field) {
      case 'host':
        return req.hostname;
      case 'path':
        return req.path;
      case 'query':
        return JSON.stringify(req.query);
      case 'header':
        return JSON.stringify(req.headers);
      case 'cookie':
        return JSON.stringify(req.cookies);
      case 'ip':
        return req.ip || req.connection.remoteAddress || '';
      case 'user-agent':
        return req.headers['user-agent'] || '';
      default:
        return '';
    }
  }

  private checkCondition(cond: RedirectCondition, value: string): boolean {
    var compareValue = cond.caseSensitive ? value : value.toLowerCase();
    var compareCond = cond.caseSensitive ? cond.value : cond.value.toLowerCase();

    switch (cond.operator) {
      case 'equals':
        return compareValue === compareCond;
      case 'contains':
        return compareValue.indexOf(compareCond) !== -1;
      case 'starts-with':
        return compareValue.indexOf(compareCond) === 0;
      case 'ends-with':
        return compareValue.indexOf(compareCond) === compareValue.length - compareCond.length;
      case 'matches':
        try {
          var regex = new RegExp(cond.value, cond.caseSensitive ? '' : 'i');
          return regex.test(value);
        } catch (e) {
          return false;
        }
      case 'exists':
        return value.length > 0;
      case 'not-exists':
        return value.length === 0;
      default:
        return false;
    }
  }

  // ================================================================================================
  // 2.6: STATISTIQUES
  // ================================================================================================

  private recordHit(id: string): void {
    if (!this.stats[id]) {
      this.stats[id] = {
        id: id,
        totalHits: 0,
        lastHit: new Date().toISOString(),
        dailyHits: [],
        hourlyHits: [],
        referers: []
      };
    }

    var stat = this.stats[id];
    stat.totalHits++;
    stat.lastHit = new Date().toISOString();

    // Daily hits
    var today = new Date().toISOString().split('T')[0];
    var dailyFound = false;
    for (var i = 0; i < stat.dailyHits.length; i++) {
      if (stat.dailyHits[i].date === today) {
        stat.dailyHits[i].count++;
        dailyFound = true;
        break;
      }
    }
    if (!dailyFound) {
      stat.dailyHits.push({ date: today, count: 1 });
    }

    // Hourly hits
    var hour = new Date().toISOString().substring(0, 13);
    var hourlyFound = false;
    for (var j = 0; j < stat.hourlyHits.length; j++) {
      if (stat.hourlyHits[j].hour === hour) {
        stat.hourlyHits[j].count++;
        hourlyFound = true;
        break;
      }
    }
    if (!hourlyFound) {
      stat.hourlyHits.push({ hour: hour, count: 1 });
    }

    // Limiter l'historique
    if (stat.dailyHits.length > 30) {
      stat.dailyHits = stat.dailyHits.slice(stat.dailyHits.length - 30);
    }
    if (stat.hourlyHits.length > 24) {
      stat.hourlyHits = stat.hourlyHits.slice(stat.hourlyHits.length - 24);
    }

    this.save();
  }

  public getStats(id: string): RedirectStats | null {
    return this.stats[id] || null;
  }

  public getAllStats(): { [key: string]: RedirectStats } {
    return this.stats;
  }

public getTopRedirects(limit: number): { rule: RedirectRule; stats: RedirectStats }[] {
  var sorted: { rule: RedirectRule; stats: RedirectStats }[] = [];

  Object.keys(this.stats).forEach((id: string) => {
    var rule = this.getRule(id);

    if (rule) {
      sorted.push({
        rule: rule,
        stats: this.stats[id]
      });
    }
  });

  sorted.sort((a, b) => {
    return b.stats.totalHits - a.stats.totalHits;
  });

  return sorted.slice(0, limit);
}

  // ================================================================================================
  // 2.7: IMPORT ET EXPORT
  // ================================================================================================

  public importRules(data: any[]): RedirectImportResult {
    var imported = 0;
    var skipped = 0;
    var errors: string[] = [];
    var rules: RedirectRule[] = [];

    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      try {
        if (!item.source || !item.target) {
          skipped++;
          errors.push('Ligne ' + (i + 1) + ': source ou target manquant');
          continue;
        }

        // Vérifier si la règle existe déjà
        var exists = false;
        for (var j = 0; j < this.rules.length; j++) {
          if (this.rules[j].source === this.normalizePath(item.source)) {
            exists = true;
            break;
          }
        }
        if (exists) {
          skipped++;
          errors.push('Ligne ' + (i + 1) + ': règle déjà existante pour ' + item.source);
          continue;
        }

        var rule = this.addRule({
          source: item.source,
          target: item.target,
          type: item.type || 301,
          active: item.active !== undefined ? item.active : true,
          priority: item.priority || 0,
          expiresAt: item.expiresAt || undefined,
          conditions: item.conditions || [],
          queryParams: item.queryParams || 'discard',
          customQuery: item.customQuery || {},
          notes: item.notes || ''
        });

        rules.push(rule);
        imported++;
      } catch (error) {
        skipped++;
        errors.push('Ligne ' + (i + 1) + ': ' + (error as Error).message);
      }
    }

    return {
      imported: imported,
      skipped: skipped,
      errors: errors,
      rules: rules
    };
  }

  public exportRules(): any[] {
    return this.rules.map(function(r) {
      return {
        source: r.source,
        target: r.target,
        type: r.type,
        active: r.active,
        priority: r.priority,
        expiresAt: r.expiresAt,
        conditions: r.conditions,
        queryParams: r.queryParams,
        customQuery: r.customQuery,
        notes: r.notes
      };
    });
  }

  public exportStats(): any {
    return this.stats;
  }

  // ================================================================================================
  // 2.8: IMPORT DEPUIS CSV
  // ================================================================================================

  public importFromCSV(csv: string): RedirectImportResult {
    var lines = csv.split('\n').filter(function(l) { return l.trim().length > 0; });
    var data: any[] = [];

    for (var i = 1; i < lines.length; i++) {
      var parts = lines[i].split(',');
      if (parts.length >= 2) {
        data.push({
          source: parts[0].trim(),
          target: parts[1].trim(),
          type: parseInt(parts[2]) || 301
        });
      }
    }

    return this.importRules(data);
  }

  // ================================================================================================
  // 2.9: SAUVEGARDE ET CHARGEMENT
  // ================================================================================================

  private save(): void {
    var data = {
      rules: this.rules,
      stats: this.stats,
      savedAt: new Date().toISOString()
    };
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[RedirectManager] Erreur de sauvegarde:', error);
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        var content = fs.readFileSync(this.storagePath, 'utf8');
        var data = JSON.parse(content);
        this.rules = data.rules || [];
        this.stats = data.stats || {};
      }
    } catch (error) {
      console.error('[RedirectManager] Erreur de chargement:', error);
      this.rules = [];
      this.stats = {};
    }
  }

  // ================================================================================================
  // 2.10: UTILITAIRES
  // ================================================================================================

  private normalizePath(path: string): string {
    if (!path) return '/';
    var normalized = path;
    
    // Supprimer le protocole et le domaine
    normalized = normalized.replace(/^https?:\/\/[^/]+/, '');
    
    // Supprimer les paramètres de requête
    var queryIndex = normalized.indexOf('?');
    if (queryIndex !== -1) {
      normalized = normalized.substring(0, queryIndex);
    }
    
    // Supprimer les ancres
    var anchorIndex = normalized.indexOf('#');
    if (anchorIndex !== -1) {
      normalized = normalized.substring(0, anchorIndex);
    }
    
    // Normaliser les slashs
    normalized = normalized.replace(/\/+/g, '/');
    
    // S'assurer qu'il commence par un slash
    if (normalized.length > 0 && normalized[0] !== '/') {
      normalized = '/' + normalized;
    }
    
    // Supprimer le slash final si ce n'est pas la racine
    if (normalized.length > 1 && normalized[normalized.length - 1] === '/') {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    
    return normalized;
  }

  public isRedirect(url: string): boolean {
    var normalized = this.normalizePath(url);
    return this.findRedirect(normalized) !== null;
  }

  public getRedirectChain(url: string): RedirectRule[] {
    var chain: RedirectRule[] = [];
    var current = url;
    var visited: string[] = [];

    while (true) {
      var rule = this.findRedirect(current);
      if (!rule) break;
      if (visited.indexOf(rule.id) !== -1) {
        break; // Éviter les boucles infinies
      }
      chain.push(rule);
      visited.push(rule.id);
      current = rule.target;
    }

    return chain;
  }

  // ================================================================================================
  // 2.11: VALIDATION
  // ================================================================================================

  public validate(): { valid: boolean; errors: string[] } {
    var errors: string[] = [];
    var seenSources: { [key: string]: string[] } = {};

    for (var i = 0; i < this.rules.length; i++) {
      var rule = this.rules[i];

      // Vérifier source
      if (!rule.source || rule.source.length === 0) {
        errors.push('Règle ' + rule.id + ': source manquant');
      }

      // Vérifier target
      if (!rule.target || rule.target.length === 0) {
        errors.push('Règle ' + rule.id + ': target manquant');
      }

      // Vérifier le type
      if (rule.type !== 301 && rule.type !== 302 && rule.type !== 307 && rule.type !== 308) {
        errors.push('Règle ' + rule.id + ': type de redirection invalide (' + rule.type + ')');
      }

      // Détecter les doublons
      if (rule.source) {
        if (!seenSources[rule.source]) {
          seenSources[rule.source] = [];
        }
        seenSources[rule.source].push(rule.id);
      }

      // Détecter les boucles
      var chain = this.getRedirectChain(rule.source);
      if (chain.length > 0) {
        var lastTarget = chain[chain.length - 1].target;
        if (this.normalizePath(lastTarget) === rule.source) {
          errors.push('Règle ' + rule.id + ': boucle de redirection détectée');
        }
      }
    }

    // Vérifier les doublons
    for (var source in seenSources) {
      if (seenSources[source].length > 1) {
        errors.push('Source "' + source + '" a plusieurs règles: ' + seenSources[source].join(', '));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// ====================================================================================================
// SECTION 3: MIDDLEWARE DE REDIRECTION
// ====================================================================================================

export const redirectMiddleware = function(manager: RedirectManager) {
  return function(req: Request, res: Response, next: NextFunction) {
    var url = req.originalUrl || req.url;
    var target = manager.resolve(url, req);
    
    if (target) {
      var rule = manager.findRedirect(url);
      var statusCode = rule ? rule.type : 301;
      console.log('[Redirect] ' + url + ' -> ' + target + ' (' + statusCode + ')');
      return res.redirect(statusCode, target);
    }
    
    next();
  };
};

// ====================================================================================================
// SECTION 4: GENERATEUR DE REDIRECTIONS STANDARDS
// ====================================================================================================

export class StandardRedirectGenerator {
  public static generateForPageMove(
    oldPath: string,
    newPath: string,
    type: 301 | 302 | 307 | 308 = 301
  ): Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      source: oldPath,
      target: newPath,
      type: type,
      active: true,
      priority: 10,
      conditions: [],
      queryParams: 'preserve',
      customQuery: {},
      notes: 'Déplacement de page de ' + oldPath + ' vers ' + newPath
    };
  }

  public static generateForDomainChange(
    oldDomain: string,
    newDomain: string,
    type: 301 | 302 | 307 | 308 = 301
  ): Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      source: oldDomain,
      target: newDomain,
      type: type,
      active: true,
      priority: 20,
      conditions: [
        { field: 'host', operator: 'equals', value: oldDomain, caseSensitive: false }
      ],
      queryParams: 'preserve',
      customQuery: {},
      notes: 'Changement de domaine de ' + oldDomain + ' vers ' + newDomain
    };
  }

  public static generateForHTTPS(
    type: 301 | 302 | 307 | 308 = 301
  ): Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      source: 'http://*',
      target: 'https://*',
      type: type,
      active: true,
      priority: 30,
      conditions: [
        { field: 'host', operator: 'contains', value: 'svpressing.com', caseSensitive: false }
      ],
      queryParams: 'preserve',
      customQuery: {},
      notes: 'Redirection HTTP vers HTTPS'
    };
  }

  public static generateForWWW(
    type: 301 | 302 | 307 | 308 = 301
  ): Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      source: 'www.svpressing.com',
      target: 'svpressing.com',
      type: type,
      active: true,
      priority: 25,
      conditions: [
        { field: 'host', operator: 'equals', value: 'www.svpressing.com', caseSensitive: false }
      ],
      queryParams: 'preserve',
      customQuery: {},
      notes: 'Redirection www vers non-www'
    };
  }

  public static generateForTrailingSlash(
    type: 301 | 302 | 307 | 308 = 301
  ): Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      source: '/',
      target: '',
      type: type,
      active: true,
      priority: 5,
      conditions: [
        { field: 'path', operator: 'ends-with', value: '/', caseSensitive: false }
      ],
      queryParams: 'preserve',
      customQuery: {},
      notes: 'Redirection slash final'
    };
  }
}

// ====================================================================================================
// SECTION 5: EXPORT DU MODULE
// ====================================================================================================

export default {
  RedirectManager: RedirectManager,
  redirectMiddleware: redirectMiddleware,
  StandardRedirectGenerator: StandardRedirectGenerator
};