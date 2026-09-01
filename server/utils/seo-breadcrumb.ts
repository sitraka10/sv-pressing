// server/utils/seo-breadcrumb.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO BREADCRUMB ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE GESTION DES BREADCRUMBS
// ====================================================================================================

import crypto from 'crypto';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
  active?: boolean;
  icon?: string;
  description?: string;
  image?: string;
}

export interface BreadcrumbConfig {
  separator: string;
  homeName: string;
  homeUrl: string;
  showHome: boolean;
  showCurrent: boolean;
  maxItems: number;
  truncateLength: number;
  includeStructuredData: boolean;
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item: string;
  }[];
}

export interface BreadcrumbRenderOptions {
  format: 'html' | 'json' | 'text' | 'object';
  withStructuredData: boolean;
  withIcons: boolean;
  withDescriptions: boolean;
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  separatorClassName?: string;
}

// ====================================================================================================
// SECTION 2: CONFIGURATION PAR DEFAUT
// ====================================================================================================

export const DEFAULT_BREADCRUMB_CONFIG: BreadcrumbConfig = {
  separator: '»',
  homeName: 'Accueil',
  homeUrl: '/',
  showHome: true,
  showCurrent: true,
  maxItems: 10,
  truncateLength: 30,
  includeStructuredData: true
};

// ====================================================================================================
// SECTION 3: GESTIONNAIRE DE BREADCRUMBS
// ====================================================================================================

export class BreadcrumbManager {
  private items: BreadcrumbItem[];
  private config: BreadcrumbConfig;

  constructor(config: BreadcrumbConfig = DEFAULT_BREADCRUMB_CONFIG) {
    this.items = [];
    this.config = config;
    
    // Ajouter la page d'accueil par défaut
    if (this.config.showHome) {
      this.addItem({
        name: this.config.homeName,
        url: this.config.homeUrl,
       
      });
    }
  }

  // ================================================================================================
  // 3.1: AJOUT D'UN ELEMENT
  // ================================================================================================

  public addItem(item: Omit<BreadcrumbItem, 'position'>): void {
    var newItem: BreadcrumbItem = {
      name: item.name,
      url: item.url,
      position: this.items.length,
      active: item.active || false,
      icon: item.icon || '',
      description: item.description || '',
      image: item.image || ''
    };
    this.items.push(newItem);
  }

  public addItems(items: Omit<BreadcrumbItem, 'position'>[]): void {
    for (var i = 0; i < items.length; i++) {
      this.addItem(items[i]);
    }
  }

  public setItems(items: BreadcrumbItem[]): void {
    this.items = items;
  }

  // ================================================================================================
  // 3.2: CONSTRUCTION A PARTIR D'UNE URL
  // ================================================================================================

  public buildFromUrl(url: string, labels: { [key: string]: string }): void {
    var segments = url.split('/').filter(function(s) { return s.length > 0; });
    var currentUrl = '';
    
    // Réinitialiser avec la page d'accueil
    this.items = [];
    if (this.config.showHome) {
      this.addItem({
        name: this.config.homeName,
        url: this.config.homeUrl,
        active: false
      });
    }

    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i];
      currentUrl = currentUrl + '/' + segment;
      
      var label = labels[segment] || this.formatSegment(segment);
      var isLast = (i === segments.length - 1);
      
      this.addItem({
        name: label,
        url: currentUrl,
        active: isLast
      });
    }
  }

  public buildFromPath(path: string, labels: { [key: string]: string }): void {
    this.buildFromUrl(path, labels);
  }

  // ================================================================================================
  // 3.3: FORMATAGE DES SEGMENTS
  // ================================================================================================

  private formatSegment(segment: string): string {
    return segment
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  }

  // ================================================================================================
  // 3.4: GENERATION DES DONNEES STRUCTUREES (JSON-LD)
  // ================================================================================================

  public generateStructuredData(): BreadcrumbStructuredData | null {
    if (!this.config.includeStructuredData) return null;
    if (this.items.length === 0) return null;

    var itemListElement = [];
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      if (i === this.items.length - 1 && !this.config.showCurrent) {
        continue;
      }
      itemListElement.push({
        '@type': 'ListItem',
        position: item.position + 1,
        name: item.name,
        item: item.url
      });
    }

    if (itemListElement.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: itemListElement
    };
  }

  // ================================================================================================
  // 3.5: RENDU DES BREADCRUMBS
  // ================================================================================================

  public render(options: BreadcrumbRenderOptions): string {
    var format = options.format || 'html';
    var withStructuredData = options.withStructuredData !== undefined ? options.withStructuredData : true;
    var withIcons = options.withIcons !== undefined ? options.withIcons : false;
    var withDescriptions = options.withDescriptions !== undefined ? options.withDescriptions : false;
    var className = options.className || '';
    var itemClassName = options.itemClassName || '';
    var activeClassName = options.activeClassName || 'active';
    var separatorClassName = options.separatorClassName || '';

    switch (format) {
      case 'html':
        return this.renderHTML(withStructuredData, withIcons, withDescriptions, className, itemClassName, activeClassName, separatorClassName);
      case 'json':
        return this.renderJSON(withStructuredData);
      case 'text':
        return this.renderText();
      case 'object':
        return this.renderObject(withStructuredData);
      default:
        return this.renderHTML(withStructuredData, withIcons, withDescriptions, className, itemClassName, activeClassName, separatorClassName);
    }
  }

  // ================================================================================================
  // 3.6: RENDU HTML
  // ================================================================================================

  private renderHTML(
    withStructuredData: boolean,
    withIcons: boolean,
    withDescriptions: boolean,
    className: string,
    itemClassName: string,
    activeClassName: string,
    separatorClassName: string
  ): string {
    var html = '';
    var items = this.getDisplayItems();
    var totalItems = items.length;

    // Structured Data
    if (withStructuredData && this.config.includeStructuredData) {
      var sd = this.generateStructuredData();
      if (sd) {
        html = html + '<script type="application/ld+json">\n';
        html = html + JSON.stringify(sd, null, 2) + '\n';
        html = html + '</script>\n';
      }
    }

    // HTML du breadcrumb
    html = html + '<nav aria-label="Breadcrumb" class="' + className + '">\n';
    html = html + '  <ol class="breadcrumb-list">\n';

    for (var i = 0; i < totalItems; i++) {
      var item = items[i];
      var isLast = (i === totalItems - 1);
      var activeClass = isLast && item.active ? ' ' + activeClassName : '';
      var classes = itemClassName + activeClass;
      var icon = withIcons && item.icon ? '<span class="breadcrumb-icon">' + item.icon + '</span> ' : '';
      var description = withDescriptions && item.description ? ' title="' + this.escapeHtml(item.description) + '"' : '';

      html = html + '    <li class="breadcrumb-item' + (classes ? ' ' + classes : '') + '"' + description + '>\n';

      if (isLast && item.active) {
        html = html + '      <span class="breadcrumb-current">' + icon + this.escapeHtml(item.name) + '</span>\n';
      } else {
        html = html + '      <a href="' + this.escapeHtml(item.url) + '" class="breadcrumb-link">' + icon + this.escapeHtml(item.name) + '</a>\n';
      }

      if (!isLast) {
        var sepClass = separatorClassName ? ' ' + separatorClassName : '';
        html = html + '      <span class="breadcrumb-separator' + sepClass + '">' + this.escapeHtml(this.config.separator) + '</span>\n';
      }

      html = html + '    </li>\n';
    }

    html = html + '  </ol>\n';
    html = html + '</nav>\n';

    return html;
  }

  // ================================================================================================
  // 3.7: RENDU JSON
  // ================================================================================================

  private renderJSON(withStructuredData: boolean): string {
    var data: any = {
      items: this.getDisplayItems(),
      structuredData: withStructuredData && this.config.includeStructuredData ? this.generateStructuredData() : null,
      config: this.config
    };
    return JSON.stringify(data, null, 2);
  }

  // ================================================================================================
  // 3.8: RENDU TEXTE
  // ================================================================================================

  private renderText(): string {
    var items = this.getDisplayItems();
    var text = '';
    var totalItems = items.length;

    for (var i = 0; i < totalItems; i++) {
      var item = items[i];
      text = text + item.name;
      if (i < totalItems - 1) {
        text = text + ' ' + this.config.separator + ' ';
      }
    }

    return text;
  }

  // ================================================================================================
  // 3.9: RENDU OBJET
  // ================================================================================================

  private renderObject(withStructuredData: boolean): any {
    return {
      items: this.getDisplayItems(),
      structuredData: withStructuredData && this.config.includeStructuredData ? this.generateStructuredData() : null,
      config: this.config
    };
  }

  // ================================================================================================
  // 3.10: OBTENIR LES ELEMENTS A AFFICHER
  // ================================================================================================

  private getDisplayItems(): BreadcrumbItem[] {
    var items = this.items.slice();
    var maxItems = this.config.maxItems || 10;

    // Troncature
    if (items.length > maxItems) {
      var truncated = items.slice(0, 1);
      var lastItems = items.slice(items.length - (maxItems - 2));
      truncated.push({
        name: '...',
        url: '#',
        position: 1,
        active: false,
        icon: '',
        description: 'Pages intermédiaires'
      });
      for (var i = 0; i < lastItems.length; i++) {
        truncated.push(lastItems[i]);
      }
      items = truncated;
    }

    // Troncature des noms
    for (var j = 0; j < items.length; j++) {
      if (items[j].name.length > this.config.truncateLength) {
        items[j].name = items[j].name.substring(0, this.config.truncateLength) + '...';
      }
    }

    return items;
  }

  // ================================================================================================
  // 3.11: UTILITAIRES
  // ================================================================================================

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public getItems(): BreadcrumbItem[] {
    return this.items;
  }

  public getLastItem(): BreadcrumbItem | null {
    if (this.items.length === 0) return null;
    return this.items[this.items.length - 1];
  }

  public getItemAt(index: number): BreadcrumbItem | null {
    if (index < 0 || index >= this.items.length) return null;
    return this.items[index];
  }

  public clear(): void {
    this.items = [];
    if (this.config.showHome) {
      this.addItem({
        name: this.config.homeName,
        url: this.config.homeUrl,
        active: false
      });
    }
  }

  public getLength(): number {
    return this.items.length;
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public setConfig(config: Partial<BreadcrumbConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  public getConfig(): BreadcrumbConfig {
    return this.config;
  }

  // ================================================================================================
  // 3.12: GENERATEUR DE BREADCRUMB POUR PAGES SPECIFIQUES
  // ================================================================================================

  public generateForPage(pageType: string, params: any): void {
    this.clear();

    switch (pageType) {
      case 'home':
        this.addItem({ name: 'Accueil', url: '/', active: true });
        break;

      case 'blanchisserie':
        this.addItem({ name: 'Blanchisserie', url: '/blanchisserie', active: true });
        break;

      case 'net-a-sec':
        this.addItem({ name: 'Net à Sec', url: '/net-a-sec', active: true });
        break;

      case 'pressing-costume':
        this.addItem({ name: 'Pressing', url: '/pressing-costume', active: true });
        break;

      case 'pressing-robe-soiree':
        this.addItem({ name: 'Pressing', url: '/pressing-robe-soiree', active: true });
        break;

      case 'pressing-linge-maison':
        this.addItem({ name: 'Pressing Linge de Maison', url: '/pressing-linge-maison', active: true });
        break;

      case 'pressing-entreprise':
        this.addItem({ name: 'Pressing Entreprise', url: '/pressing-entreprise', active: true });
        break;

      case 'blanchisserie-couette':
        this.addItem({ name: 'Blanchisserie', url: '/blanchisserie-couette', active: true });
        break;

      case 'blanchisserie-rideaux':
        this.addItem({ name: 'Blanchisserie Rideaux', url: '/blanchisserie-rideaux', active: true });
        break;

      case 'blanchisserie-tapis':
        this.addItem({ name: 'Blanchisserie Tapis', url: '/blanchisserie-tapis', active: true });
        break;

      case 'blanchisserie-industrielle':
        this.addItem({ name: 'Blanchisserie Industrielle', url: '/blanchisserie-industrielle', active: true });
        break;

      case 'nettoyage-soie':
        this.addItem({ name: 'Nettoyage Soie', url: '/nettoyage-soie', active: true });
        break;

      case 'nettoyage-laine':
        this.addItem({ name: 'Nettoyage Laine', url: '/nettoyage-laine', active: true });
        break;

      case 'nettoyage-cachemire':
        this.addItem({ name: 'Nettoyage Cachemire', url: '/nettoyage-cachemire', active: true });
        break;

      case 'about':
        this.addItem({ name: 'À propos', url: '/about', active: true });
        break;

      case 'contact':
        this.addItem({ name: 'Contact', url: '/contact', active: true });
        break;

      case 'faq':
        this.addItem({ name: 'FAQ', url: '/faq', active: true });
        break;

      case 'plans':
        this.addItem({ name: 'Plans d\'abonnement', url: '/plans', active: true });
        break;

      case 'tarifs':
        this.addItem({ name: 'Tarifs', url: '/tarifs', active: true });
        break;

      case 'blog':
        this.addItem({ name: 'Blog', url: '/blog', active: true });
        break;

      case 'blog-post':
        if (params && params.title) {
          this.addItem({ name: 'Blog', url: '/blog', active: false });
          this.addItem({ name: params.title, url: '/blog/' + params.slug, active: true });
        }
        break;

      default:
        var url = params && params.url ? params.url : '/';
        this.addItem({ name: 'Accueil', url: '/', active: false });
        this.addItem({ name: 'Page', url: url, active: true });
        break;
    }
  }

  // ================================================================================================
  // 3.13: VALIDATION DES BREADCRUMBS
  // ================================================================================================

  public validate(): { valid: boolean; errors: string[] } {
    var errors: string[] = [];

    if (this.items.length === 0) {
      errors.push('Aucun élément de breadcrumb');
      return { valid: false, errors: errors };
    }

    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      
      if (!item.name || item.name.length === 0) {
        errors.push('Élément ' + i + ' : nom manquant');
      }
      
      if (!item.url || item.url.length === 0) {
        errors.push('Élément ' + i + ' : URL manquante');
      }
      
      if (item.position !== i) {
        errors.push('Élément ' + i + ' : position incorrecte (' + item.position + ' attendu ' + i + ')');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// ====================================================================================================
// SECTION 4: GENERATEUR DE BREADCRUMB POUR REACT
// ====================================================================================================

export class BreadcrumbReactGenerator {
  private manager: BreadcrumbManager;

  constructor(config: BreadcrumbConfig = DEFAULT_BREADCRUMB_CONFIG) {
    this.manager = new BreadcrumbManager(config);
  }

  public generateForRoute(path: string, labels: { [key: string]: string }): BreadcrumbItem[] {
    this.manager.buildFromPath(path, labels);
    return this.manager.getItems();
  }

  public generateStructuredDataForRoute(path: string, labels: { [key: string]: string }): any {
    this.manager.buildFromPath(path, labels);
    return this.manager.generateStructuredData();
  }

  public getManager(): BreadcrumbManager {
    return this.manager;
  }
}

// ====================================================================================================
// SECTION 5: EXPORT DU MODULE
// ====================================================================================================

export default {
  BreadcrumbManager: BreadcrumbManager,
  BreadcrumbReactGenerator: BreadcrumbReactGenerator,
  DEFAULT_BREADCRUMB_CONFIG: DEFAULT_BREADCRUMB_CONFIG
};