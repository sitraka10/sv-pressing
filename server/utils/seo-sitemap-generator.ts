// server/utils/seo-sitemap-generator.ts
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO SITEMAP GENERATOR ULTIME
// VERSION NON COMPRESSÉE
// ====================================================================================================
// CE FICHIER CONTIENT LES FONCTIONS DE GENERATION DE SITEMAPS
// ====================================================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';

// ====================================================================================================
// SECTION 1: INTERFACES ET TYPES
// ====================================================================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
  news?: SitemapNews;
  alternates?: SitemapAlternate[];
  mobile?: boolean;
}

export interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
  geo_location?: string;
  license?: string;
}

export interface SitemapVideo {
  thumbnail_loc: string;
  title: string;
  description: string;
  content_loc?: string;
  player_loc?: string;
  duration?: number;
  publication_date?: string;
  family_friendly?: 'yes' | 'no';
  category?: string;
  tags?: string[];
  rating?: number;
}

export interface SitemapNews {
  publication_name: string;
  publication_language: string;
  publication_date: string;
  title: string;
  keywords?: string[];
  genres?: string[];
  stock_tickers?: string[];
}

export interface SitemapAlternate {
  hreflang: string;
  href: string;
}

export interface SitemapIndex {
  sitemaps: {
    loc: string;
    lastmod?: string;
  }[];
}

// ====================================================================================================
// SECTION 2: GENERATEUR DE SITEMAP
// ====================================================================================================

export class SitemapGenerator {

  // MODIFICATION :
  // protected permet à AdvancedSitemapGenerator d'accéder à ces propriétés
  protected urls: SitemapUrl[];
  protected baseUrl: string;

  private maxUrls: number;

  constructor(baseUrl: string, maxUrls: number = 50000) {
    this.urls = [];
    this.baseUrl = baseUrl;
    this.maxUrls = maxUrls;
  }

  public addUrl(url: SitemapUrl): void {
    this.urls.push(url);
  }

  public addUrls(urls: SitemapUrl[]): void {
    for (var i = 0; i < urls.length; i++) {
      this.urls.push(urls[i]);
    }
  }

  // MODIFICATION :
  // Permet de modifier urls depuis l'extérieur sans accéder directement
  // à la propriété protected.
  public setUrls(urls: SitemapUrl[]): void {
    this.urls = urls;
  }

  public generateSitemap(): string {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml = xml + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml = xml + '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml = xml + '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml = xml + '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    xml = xml + '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    xml = xml + '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';

    for (var i = 0; i < this.urls.length; i++) {
      var url = this.urls[i];
      xml = xml + this.generateUrlElement(url);
    }

    xml = xml + '</urlset>';
    return xml;
  }

  public generateSitemapIndex(): string {
    var total = this.urls.length;
    var sitemapCount = Math.ceil(total / this.maxUrls);
    var index = '<?xml version="1.0" encoding="UTF-8"?>\n';
    index = index + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (var i = 0; i < sitemapCount; i++) {
      index = index + '  <sitemap>\n';
      index = index + '    <loc>' + this.baseUrl + '/sitemap-' + (i + 1) + '.xml</loc>\n';
      index = index + '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
      index = index + '  </sitemap>\n';
    }

    index = index + '</sitemapindex>';
    return index;
  }

  public generateSitemapChunked(): { name: string; content: string }[] {
    var total = this.urls.length;
    var chunkSize = this.maxUrls;
    var chunks: { name: string; content: string }[] = [];

    for (var i = 0; i < total; i = i + chunkSize) {
      var chunk = this.urls.slice(i, i + chunkSize);

      var generator = new SitemapGenerator(this.baseUrl);

      // MODIFICATION :
      // Au lieu de generator.urls = chunk
      generator.setUrls(chunk);

      chunks.push({
        name: 'sitemap-' + (Math.floor(i / chunkSize) + 1) + '.xml',
        content: generator.generateSitemap()
      });
    }

    return chunks;
  }

  private generateUrlElement(url: SitemapUrl): string {
    var xml = '  <url>\n';
    xml = xml + '    <loc>' + this.escapeXml(url.loc) + '</loc>\n';

    if (url.lastmod) {
      xml = xml + '    <lastmod>' + this.escapeXml(url.lastmod) + '</lastmod>\n';
    }

    if (url.changefreq) {
      xml = xml + '    <changefreq>' + this.escapeXml(url.changefreq) + '</changefreq>\n';
    }

    if (url.priority) {
      xml = xml + '    <priority>' + this.escapeXml(String(url.priority)) + '</priority>\n';
    }

    // Images
    if (url.images && url.images.length > 0) {
      for (var i = 0; i < url.images.length; i++) {
        var image = url.images[i];

        xml = xml + '    <image:image>\n';
        xml = xml + '      <image:loc>' + this.escapeXml(image.loc) + '</image:loc>\n';

        if (image.title) {
          xml = xml + '      <image:title>' + this.escapeXml(image.title) + '</image:title>\n';
        }

        if (image.caption) {
          xml = xml + '      <image:caption>' + this.escapeXml(image.caption) + '</image:caption>\n';
        }

        if (image.geo_location) {
          xml = xml + '      <image:geo_location>' + this.escapeXml(image.geo_location) + '</image:geo_location>\n';
        }

        if (image.license) {
          xml = xml + '      <image:license>' + this.escapeXml(image.license) + '</image:license>\n';
        }

        xml = xml + '    </image:image>\n';
      }
    }

    // Videos
    if (url.videos && url.videos.length > 0) {
      for (var j = 0; j < url.videos.length; j++) {
        var video = url.videos[j];

        xml = xml + '    <video:video>\n';
        xml = xml + '      <video:thumbnail_loc>' + this.escapeXml(video.thumbnail_loc) + '</video:thumbnail_loc>\n';
        xml = xml + '      <video:title>' + this.escapeXml(video.title) + '</video:title>\n';
        xml = xml + '      <video:description>' + this.escapeXml(video.description) + '</video:description>\n';

        if (video.content_loc) {
          xml = xml + '      <video:content_loc>' + this.escapeXml(video.content_loc) + '</video:content_loc>\n';
        }

        if (video.player_loc) {
          xml = xml + '      <video:player_loc>' + this.escapeXml(video.player_loc) + '</video:player_loc>\n';
        }

        if (video.duration) {
          xml = xml + '      <video:duration>' + video.duration + '</video:duration>\n';
        }

        if (video.publication_date) {
          xml = xml + '      <video:publication_date>' + this.escapeXml(video.publication_date) + '</video:publication_date>\n';
        }

        if (video.family_friendly) {
          xml = xml + '      <video:family_friendly>' + video.family_friendly + '</video:family_friendly>\n';
        }

        if (video.category) {
          xml = xml + '      <video:category>' + this.escapeXml(video.category) + '</video:category>\n';
        }

        if (video.tags && video.tags.length > 0) {
          for (var k = 0; k < video.tags.length; k++) {
            xml = xml + '      <video:tag>' + this.escapeXml(video.tags[k]) + '</video:tag>\n';
          }
        }

        if (video.rating) {
          xml = xml + '      <video:rating>' + video.rating + '</video:rating>\n';
        }

        xml = xml + '    </video:video>\n';
      }
    }

    // News
    if (url.news) {
      var news = url.news;

      xml = xml + '    <news:news>\n';
      xml = xml + '      <news:publication>\n';
      xml = xml + '        <news:name>' + this.escapeXml(news.publication_name) + '</news:name>\n';
      xml = xml + '        <news:language>' + this.escapeXml(news.publication_language) + '</news:language>\n';
      xml = xml + '      </news:publication>\n';

      xml = xml + '      <news:publication_date>' + this.escapeXml(news.publication_date) + '</news:publication_date>\n';
      xml = xml + '      <news:title>' + this.escapeXml(news.title) + '</news:title>\n';

      if (news.keywords && news.keywords.length > 0) {
        xml = xml + '      <news:keywords>' + this.escapeXml(news.keywords.join(', ')) + '</news:keywords>\n';
      }

      if (news.genres && news.genres.length > 0) {
        xml = xml + '      <news:genres>' + this.escapeXml(news.genres.join(', ')) + '</news:genres>\n';
      }

      if (news.stock_tickers && news.stock_tickers.length > 0) {
        xml = xml + '      <news:stock_tickers>' + this.escapeXml(news.stock_tickers.join(', ')) + '</news:stock_tickers>\n';
      }

      xml = xml + '    </news:news>\n';
    }

    // Alternates
    if (url.alternates && url.alternates.length > 0) {
      for (var l = 0; l < url.alternates.length; l++) {
        var alt = url.alternates[l];

        xml = xml + '    <xhtml:link rel="alternate" hreflang="' +
          this.escapeXml(alt.hreflang) +
          '" href="' +
          this.escapeXml(alt.href) +
          '"/>\n';
      }
    }

    // Mobile
    if (url.mobile) {
      xml = xml + '    <mobile:mobile/>\n';
    }

    xml = xml + '  </url>\n';

    return xml;
  }

  private escapeXml(text: string): string {
    if (!text) return '';

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  public getUrlCount(): number {
    return this.urls.length;
  }

  public clear(): void {
    this.urls = [];
  }
}

// ====================================================================================================
// SECTION 3: GENERATEUR DE SITEMAP AVANCE
// ====================================================================================================

export class AdvancedSitemapGenerator extends SitemapGenerator {
  private categories: { [key: string]: SitemapUrl[] };
  private priorityMap: { [key: string]: number };

  constructor(baseUrl: string) {
    super(baseUrl);

    this.categories = {};
    this.priorityMap = {
      'home': 1.0,
      'service': 0.9,
      'product': 0.85,
      'blog': 0.6,
      'about': 0.7,
      'contact': 0.8,
      'faq': 0.7,
      'legal': 0.3
    };
  }

  public addUrlWithCategory(url: SitemapUrl, category: string): void {
    if (!this.categories[category]) {
      this.categories[category] = [];
    }

    this.categories[category].push(url);
    this.addUrl(url);
  }

  public generateCategorySitemap(category: string): string {
    var urls = this.categories[category] || [];

    var generator = new SitemapGenerator(this.baseUrl);

    // MODIFICATION :
    // Au lieu de generator.urls = urls
    generator.setUrls(urls);

    return generator.generateSitemap();
  }

  public generateAllCategorySitemaps(): { category: string; content: string }[] {
    var result: { category: string; content: string }[] = [];

    for (var category in this.categories) {
      result.push({
        category: category,
        content: this.generateCategorySitemap(category)
      });
    }

    return result;
  }

  public generateSitemapWithPriorities(): string {
    for (var i = 0; i < this.urls.length; i++) {
      var url = this.urls[i];

      if (!url.priority) {
        var priority = this.getPriorityForUrl(url.loc);
        url.priority = priority;
      }
    }

    return this.generateSitemap();
  }

  private getPriorityForUrl(url: string): number {
    for (var key in this.priorityMap) {
      if (url.indexOf('/' + key) !== -1) {
        return this.priorityMap[key];
      }

      if (
        key === 'home' &&
        (url === this.baseUrl || url === this.baseUrl + '/')
      ) {
        return this.priorityMap[key];
      }
    }

    return 0.5;
  }

  public setPriorityMap(map: { [key: string]: number }): void {
    this.priorityMap = map;
  }

  public getCategories(): string[] {
    return Object.keys(this.categories);
  }

  public getCategoryCount(category: string): number {
    return (this.categories[category] || []).length;
  }

  public getTotalCategoryCount(): { [key: string]: number } {
    var result: { [key: string]: number } = {};

    for (var category in this.categories) {
      result[category] = this.categories[category].length;
    }

    return result;
  }
}

// ====================================================================================================
// SECTION 4: VALIDATEUR DE SITEMAP
// ====================================================================================================

export class SitemapValidator {
  public validate(url: SitemapUrl): { valid: boolean; errors: string[] } {
    var errors: string[] = [];

    if (!url.loc) {
      errors.push('URL manquante');
    }

    if (url.loc && url.loc.length > 2048) {
      errors.push('URL trop longue (> 2048 caractères)');
    }

    if (url.loc && url.loc.indexOf('http') !== 0) {
      errors.push('URL doit commencer par http ou https');
    }

    if (
      url.priority !== undefined &&
      (url.priority < 0 || url.priority > 1)
    ) {
      errors.push('Priorité doit être entre 0 et 1');
    }

    if (url.changefreq) {
      var validFreq = [
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never'
      ];

      if (validFreq.indexOf(url.changefreq) === -1) {
        errors.push('Fréquence de changement invalide');
      }
    }

    if (url.images && url.images.length > 1000) {
      errors.push('Trop d\'images (> 1000)');
    }

    if (url.videos && url.videos.length > 1000) {
      errors.push('Trop de vidéos (> 1000)');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  public validateAll(
    urls: SitemapUrl[]
  ): { valid: boolean; errors: string[] }[] {
    var results: { valid: boolean; errors: string[] }[] = [];

    for (var i = 0; i < urls.length; i++) {
      results.push(this.validate(urls[i]));
    }

    return results;
  }

  public getInvalidUrls(urls: SitemapUrl[]): SitemapUrl[] {
    var invalid: SitemapUrl[] = [];

    for (var i = 0; i < urls.length; i++) {
      var result = this.validate(urls[i]);

      if (!result.valid) {
        invalid.push(urls[i]);
      }
    }

    return invalid;
  }

  public getValidationReport(urls: SitemapUrl[]): {
    total: number;
    valid: number;
    invalid: number;
    errors: { [key: string]: number };
  } {
    var total = urls.length;
    var valid = 0;
    var invalid = 0;
    var errorCount: { [key: string]: number } = {};

    for (var i = 0; i < urls.length; i++) {
      var result = this.validate(urls[i]);

      if (result.valid) {
        valid++;
      } else {
        invalid++;

        for (var j = 0; j < result.errors.length; j++) {
          var error = result.errors[j];

          if (!errorCount[error]) {
            errorCount[error] = 0;
          }

          errorCount[error]++;
        }
      }
    }

    return {
      total: total,
      valid: valid,
      invalid: invalid,
      errors: errorCount
    };
  }
}

// ====================================================================================================
// SECTION 5: COMPRESSEUR DE SITEMAP
// ====================================================================================================

export class SitemapCompressor {
  public compress(xml: string): Buffer {
    return zlib.gzipSync(xml);
  }

  public decompress(compressed: Buffer): string {
    return zlib.gunzipSync(compressed).toString('utf8');
  }

  public saveCompressed(xml: string, filepath: string): void {
    var compressed = this.compress(xml);
    fs.writeFileSync(filepath + '.gz', compressed);
  }

  public loadCompressed(filepath: string): string {
    var compressed = fs.readFileSync(filepath + '.gz');
    return this.decompress(compressed);
  }

  public getCompressionRatio(xml: string): number {
    var originalSize = Buffer.byteLength(xml, 'utf8');
    var compressedSize = this.compress(xml).length;

    return (1 - compressedSize / originalSize) * 100;
  }
}

// ====================================================================================================
// SECTION 6: EXPORT DU MODULE
// ====================================================================================================

export default {
  SitemapGenerator: SitemapGenerator,
  AdvancedSitemapGenerator: AdvancedSitemapGenerator,
  SitemapValidator: SitemapValidator,
  SitemapCompressor: SitemapCompressor
};