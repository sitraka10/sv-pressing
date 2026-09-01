// client/src/lib/seo-manager.tsx
// ====================================================================================================
// SV PRESSING MADAGASCAR - SEO MANAGER ULTIME
// ====================================================================================================
// FICHIER PRINCIPAL DE GESTION SEO POUR TOUTE L'APPLICATION
// ====================================================================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';

// ====================================================================================================
// SECTION 1: IMPORTS DES HELPERS SEO
// ====================================================================================================

import {
  SITE_CONFIG,
  SEO_KEYWORDS,
  generateAllKeywords,
  generateMetaTags,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateProductSchema,
  generateServiceSchema,
  generateReviewSchema,
  generateWebPageSchema,
  generateArticleSchema,
  generatePressingServiceSchema,
  generateBlanchisserieServiceSchema,
  generateNetASecServiceSchema,
  analyzeSEO,
  SEO_CONSTANTS,
  generateMetaDescription,
  generateSlug,
  generateTitleTag,
  getReadingTime,
  getKeywordDensity,
  extractKeywords,
  getPageSchemas,
  getHomePageMeta,
  getBlanchisseriePageMeta,
  getNetASecPageMeta,
  getPressingCostumePageMeta,
  getPressingRobeSoireePageMeta,
  getPressingLingeMaisonPageMeta,
  getPressingEntreprisePageMeta,
  getBlanchisserieCouettePageMeta,
  getBlanchisserieRideauxPageMeta,
  getBlanchisserieTapisPageMeta,
  getBlanchisserieIndustriellePageMeta,
  getNettoyageSoiePageMeta,
  getNettoyageLainePageMeta,
  getNettoyageCachemirePageMeta,
  getContactPageMeta,
  getFAQPageMeta,
  getPlansPageMeta,
  getAboutPageMeta,
  getTarifsPageMeta,
  getBlogPageMeta
} from './seo.helpers';

// ====================================================================================================
// SECTION 2: TYPES SEO
// ====================================================================================================

export interface SEOManagerProps {
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
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
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
  children?: React.ReactNode;
  pageType?: 'home' | 'service' | 'blog' | 'product' | 'about' | 'contact' | 'faq' | 'legal';
  serviceType?: 'pressing' | 'blanchisserie' | 'net-a-sec' | 'costume' | 'robe' | 'linge' | 'entreprise' | 'couette' | 'rideaux' | 'tapis' | 'industrielle' | 'soie' | 'laine' | 'cachemire';
  autoGenerate?: boolean;
  enableAnalytics?: boolean;
  enableStructuredData?: boolean;
  enableOpenGraph?: boolean;
  enableTwitterCards?: boolean;
  enableAlternates?: boolean;
  enableKeywords?: boolean;
  enableCanonical?: boolean;
  enableRobots?: boolean;
}

// ====================================================================================================
// SECTION 3: CONTEXTE SEO
// ====================================================================================================

interface SEOContextType {
  siteConfig: typeof SITE_CONFIG;
  currentPage: string;
  pageType: string;
  serviceType: string;
  seoScore: number;
  seoGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  refreshSEO: () => void;
  analyzeCurrentPage: () => void;
}

const SEOContext = React.createContext<SEOContextType>({
  siteConfig: SITE_CONFIG,
  currentPage: '',
  pageType: '',
  serviceType: '',
  seoScore: 100,
  seoGrade: 'A',
  refreshSEO: () => {},
  analyzeCurrentPage: () => {}
});

export const useSEO = () => React.useContext(SEOContext);

// ====================================================================================================
// SECTION 4: PROVIDER SEO
// ====================================================================================================

interface SEOProviderProps {
  children: React.ReactNode;
  enableAnalytics?: boolean;
  enableStructuredData?: boolean;
  enableOpenGraph?: boolean;
  enableTwitterCards?: boolean;
  enableAlternates?: boolean;
  enableKeywords?: boolean;
  enableCanonical?: boolean;
  enableRobots?: boolean;
  autoAnalyze?: boolean;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({
  children,
  enableAnalytics = true,
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCards = true,
  enableAlternates = true,
  enableKeywords = true,
  enableCanonical = true,
  enableRobots = true,
  autoAnalyze = false
}) => {
  const [location] = useLocation();
  const [currentPage, setCurrentPage] = useState<string>(location);
  const [pageType, setPageType] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [seoScore, setSeoScore] = useState<number>(100);
  const [seoGrade, setSeoGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshSEO = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const analyzeCurrentPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement.outerHTML;
      const result = analyzeSEO(html);
      setSeoScore(result.score);
      setSeoGrade(result.grade);
      
      if (enableAnalytics && window.gtag) {
        window.gtag('event', 'seo_analysis', {
          score: result.score,
          grade: result.grade,
          issues: result.issues.length,
          warnings: result.warnings.length,
          page: location
        });
      }
    }
  }, [location, enableAnalytics]);

  useEffect(() => {
    setCurrentPage(location);
    
    // Déterminer le type de page
    if (location === '/') {
      setPageType('home');
    } else if (location.includes('/blog')) {
      setPageType('blog');
    } else if (location.includes('/plan') || location.includes('/plans') || location.includes('/tarifs')) {
      setPageType('product');
    } else if (location.includes('/about')) {
      setPageType('about');
    } else if (location.includes('/contact')) {
      setPageType('contact');
    } else if (location.includes('/faq')) {
      setPageType('faq');
    } else if (location.includes('/terms') || location.includes('/privacy') || location.includes('/cookies')) {
      setPageType('legal');
    } else {
      setPageType('service');
    }

    // Déterminer le type de service
    if (location.includes('blanchisserie')) {
      setServiceType('blanchisserie');
    } else if (location.includes('net-a-sec') || location.includes('nettoyage')) {
      setServiceType('net-a-sec');
    } else if (location.includes('costume')) {
      setServiceType('costume');
    } else if (location.includes('robe')) {
      setServiceType('robe');
    } else if (location.includes('linge-maison')) {
      setServiceType('linge');
    } else if (location.includes('entreprise')) {
      setServiceType('entreprise');
    } else if (location.includes('couette')) {
      setServiceType('couette');
    } else if (location.includes('rideaux')) {
      setServiceType('rideaux');
    } else if (location.includes('tapis')) {
      setServiceType('tapis');
    } else if (location.includes('industrielle')) {
      setServiceType('industrielle');
    } else if (location.includes('soie')) {
      setServiceType('soie');
    } else if (location.includes('laine')) {
      setServiceType('laine');
    } else if (location.includes('cachemire')) {
      setServiceType('cachemire');
    } else {
      setServiceType('pressing');
    }

    if (autoAnalyze) {
      analyzeCurrentPage();
    }
  }, [location, autoAnalyze, analyzeCurrentPage]);

  useEffect(() => {
    if (refreshTrigger > 0 && autoAnalyze) {
      analyzeCurrentPage();
    }
  }, [refreshTrigger, autoAnalyze, analyzeCurrentPage]);

  const contextValue = useMemo(() => ({
    siteConfig: SITE_CONFIG,
    currentPage,
    pageType,
    serviceType,
    seoScore,
    seoGrade,
    refreshSEO,
    analyzeCurrentPage
  }), [currentPage, pageType, serviceType, seoScore, seoGrade, refreshSEO, analyzeCurrentPage]);

  return (
    <SEOContext.Provider value={contextValue}>
      <HelmetProvider>
        {children}
      </HelmetProvider>
    </SEOContext.Provider>
  );
};

// ====================================================================================================
// SECTION 5: COMPOSANT SEO MANAGER - ULTIME
// ====================================================================================================

export const SEOManager: React.FC<SEOManagerProps> = ({
  title,
  description,
  keywords = [],
  canonical,
  noIndex = false,
  noFollow = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  ogUrl,
  twitterCard,
  twitterSite,
  twitterTitle,
  twitterDescription,
  twitterImage,
  alternates = [],
  structuredData = [],
  robots,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  children,
  pageType = 'service',
  serviceType = 'pressing',
  autoGenerate = true,
  enableAnalytics = true,
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCards = true,
  enableAlternates = true,
  enableKeywords = true,
  enableCanonical = true,
  enableRobots = true
}) => {
  const { currentPage, siteConfig, seoScore, seoGrade } = useSEO();
  const [location] = useLocation();
  const [pageLoaded, setPageLoaded] = useState<boolean>(false);

  // ================================================================================================
  // 5.1: GÉNÉRATION AUTOMATIQUE DES MÉTADONNÉES
  // ================================================================================================

  const getPageMeta = useCallback(() => {
    const pageMap: { [key: string]: any } = {
      'home': getHomePageMeta,
      'blanchisserie': getBlanchisseriePageMeta,
      'net-a-sec': getNetASecPageMeta,
      'pressing-costume': getPressingCostumePageMeta,
      'pressing-robe-soiree': getPressingRobeSoireePageMeta,
      'pressing-linge-maison': getPressingLingeMaisonPageMeta,
      'pressing-entreprise': getPressingEntreprisePageMeta,
      'blanchisserie-couette': getBlanchisserieCouettePageMeta,
      'blanchisserie-rideaux': getBlanchisserieRideauxPageMeta,
      'blanchisserie-tapis': getBlanchisserieTapisPageMeta,
      'blanchisserie-industrielle': getBlanchisserieIndustriellePageMeta,
      'nettoyage-soie': getNettoyageSoiePageMeta,
      'nettoyage-laine': getNettoyageLainePageMeta,
      'nettoyage-cachemire': getNettoyageCachemirePageMeta,
      'contact': getContactPageMeta,
      'faq': getFAQPageMeta,
      'plans': getPlansPageMeta,
      'about': getAboutPageMeta,
      'tarifs': getTarifsPageMeta,
      'blog': getBlogPageMeta
    };

    const pagePath = location.replace('/', '');
    const pageKey = pagePath || 'home';
    
    // Trouver la page correspondante
    for (const [key, getter] of Object.entries(pageMap)) {
      if (pageKey.includes(key)) {
        return getter();
      }
    }
    
    // Page par défaut
    return getHomePageMeta();
  }, [location]);

  // ================================================================================================
  // 5.2: CONSTRUCTION DES MÉTADONNÉES FINALES
  // ================================================================================================

  const finalMeta = useMemo(() => {
    const autoMeta = autoGenerate ? getPageMeta() : {};
    const allKeywords = generateAllKeywords();

    return {
      title: title || autoMeta.title || SITE_CONFIG.name,
      description: description || autoMeta.description || SITE_CONFIG.description,
      keywords: keywords.length > 0 ? keywords : (autoMeta.keywords || allKeywords.slice(0, 30)),
      canonical: canonical || autoMeta.canonical || `${SITE_CONFIG.url}${location}`,
      noIndex: noIndex || autoMeta.noIndex || false,
      noFollow: noFollow || autoMeta.noFollow || false,
      ogTitle: ogTitle || autoMeta.ogTitle || title || SITE_CONFIG.name,
      ogDescription: ogDescription || autoMeta.ogDescription || description || SITE_CONFIG.description,
      ogImage: ogImage || autoMeta.ogImage || SITE_CONFIG.ogImage,
      ogType: ogType || autoMeta.ogType || 'website',
      ogUrl: ogUrl || autoMeta.ogUrl || `${SITE_CONFIG.url}${location}`,
      twitterCard: twitterCard || autoMeta.twitterCard || 'summary_large_image',
      twitterSite: twitterSite || autoMeta.twitterSite || SITE_CONFIG.twitterHandle,
      twitterTitle: twitterTitle || autoMeta.twitterTitle || title || SITE_CONFIG.name,
      twitterDescription: twitterDescription || autoMeta.twitterDescription || description || SITE_CONFIG.description,
      twitterImage: twitterImage || autoMeta.twitterImage || SITE_CONFIG.ogImage,
      alternates: alternates.length > 0 ? alternates : (autoMeta.alternates || []),
      structuredData: structuredData.length > 0 ? structuredData : (autoMeta.structuredData || []),
      robots: robots || autoMeta.robots || '',
      author: author || autoMeta.author || SITE_CONFIG.name,
      publishedTime: publishedTime || autoMeta.publishedTime || '',
      modifiedTime: modifiedTime || autoMeta.modifiedTime || '',
      section: section || autoMeta.section || '',
      tags: tags.length > 0 ? tags : (autoMeta.tags || [])
    };
  }, [
    title, description, keywords, canonical, noIndex, noFollow,
    ogTitle, ogDescription, ogImage, ogType, ogUrl,
    twitterCard, twitterSite, twitterTitle, twitterDescription, twitterImage,
    alternates, structuredData, robots, author, publishedTime, modifiedTime, section, tags,
    location, autoGenerate, getPageMeta
  ]);

  // ================================================================================================
  // 5.3: ANALYSE ET TRACKING SEO
  // ================================================================================================

  useEffect(() => {
    if (enableAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: finalMeta.title,
        page_location: finalMeta.ogUrl,
        page_referrer: document.referrer,
        seo_score: seoScore,
        seo_grade: seoGrade
      });

      // Event pour le tracking des mots-clés
      if (enableKeywords && finalMeta.keywords.length > 0) {
        window.gtag('event', 'seo_keywords', {
          keywords: finalMeta.keywords.slice(0, 10).join(', '),
          count: finalMeta.keywords.length
        });
      }
    }
  }, [finalMeta, enableAnalytics, seoScore, seoGrade, enableKeywords]);

  // ================================================================================================
  // 5.4: STRUCTURED DATA SUPPLEMENTAIRE
  // ================================================================================================

  const finalStructuredData = useMemo(() => {
    let data = [...finalMeta.structuredData];

    // Ajouter les schémas de base si non présents
    const hasOrganization = data.some(d => d['@type'] === 'Organization' || d['@type'] === 'Organization');
    if (!hasOrganization) {
      data.push(generateOrganizationSchema());
    }

    const hasLocalBusiness = data.some(d => d['@type'] === 'Laundry' || d['@type'] === 'LocalBusiness');
    if (!hasLocalBusiness) {
      data.push(generateLocalBusinessSchema());
    }

    // Ajouter le schéma de service approprié
    if (enableStructuredData) {
      const serviceMap: { [key: string]: any } = {
        'pressing': generatePressingServiceSchema,
        'blanchisserie': generateBlanchisserieServiceSchema,
        'net-a-sec': generateNetASecServiceSchema,
        'costume': generatePressingServiceSchema,
        'robe': generatePressingServiceSchema,
        'linge': generateBlanchisserieServiceSchema,
        'entreprise': generatePressingServiceSchema,
        'couette': generateBlanchisserieServiceSchema,
        'rideaux': generateBlanchisserieServiceSchema,
        'tapis': generateBlanchisserieServiceSchema,
        'industrielle': generateBlanchisserieServiceSchema,
        'soie': generateNetASecServiceSchema,
        'laine': generateNetASecServiceSchema,
        'cachemire': generateNetASecServiceSchema
      };

      const serviceSchema = serviceMap[serviceType] || generatePressingServiceSchema;
      const hasService = data.some(d => d['@type'] === 'Service' && d.serviceType);
      if (!hasService) {
        data.push(serviceSchema());
      }
    }

    // Breadcrumb Schema
    const breadcrumbItems = [
      { name: 'Accueil', url: SITE_CONFIG.url }
    ];
    if (location !== '/') {
      const pageName = location.split('/').pop()?.replace(/-/g, ' ') || 'Page';
      breadcrumbItems.push({
        name: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        url: `${SITE_CONFIG.url}${location}`
      });
    }
    const hasBreadcrumb = data.some(d => d['@type'] === 'BreadcrumbList');
    if (!hasBreadcrumb) {
      data.push(generateBreadcrumbSchema(breadcrumbItems));
    }

    return data;
  }, [finalMeta.structuredData, serviceType, location, enableStructuredData]);

  // ================================================================================================
  // 5.5: GÉNÉRATION DES ALTERNATES
  // ================================================================================================

  const finalAlternates = useMemo(() => {
    if (!enableAlternates) return [];

    const baseUrl = SITE_CONFIG.url;
    const path = location;
    
    const alternates = [
      { hreflang: 'fr', href: `${baseUrl}${path}` },
      { hreflang: 'mg', href: `${baseUrl}/mg${path}` },
      { hreflang: 'en', href: `${baseUrl}/en${path}` },
      { hreflang: 'x-default', href: `${baseUrl}${path}` }
    ];

    return [...alternates, ...finalMeta.alternates];
  }, [location, enableAlternates, finalMeta.alternates]);

  // ================================================================================================
  // 5.6: RENDU
  // ================================================================================================

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  return (
    <>
      {/* Helmet principal */}
      <Helmet>
        {/* Titre */}
        <title>{finalMeta.title}</title>
        
        {/* Meta Description */}
        <meta name="description" content={finalMeta.description} />
        
        {/* Meta Keywords */}
        {enableKeywords && finalMeta.keywords.length > 0 && (
          <meta name="keywords" content={finalMeta.keywords.slice(0, 30).join(', ')} />
        )}
        
        {/* Robots */}
        {enableRobots && (
          <>
            <meta name="robots" content={finalMeta.noIndex && finalMeta.noFollow ? 'noindex, nofollow' : finalMeta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
            <meta name="googlebot" content={finalMeta.noIndex && finalMeta.noFollow ? 'noindex, nofollow' : finalMeta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
            <meta name="bingbot" content={finalMeta.noIndex && finalMeta.noFollow ? 'noindex, nofollow' : finalMeta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
            <meta name="yandex" content={finalMeta.noIndex && finalMeta.noFollow ? 'noindex, nofollow' : finalMeta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
          </>
        )}
        
        {/* Canonical */}
        {enableCanonical && (
          <link rel="canonical" href={finalMeta.canonical} />
        )}
        
        {/* Alternates */}
        {finalAlternates.map((alt) => (
          <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
        ))}
        
        {/* Open Graph */}
        {enableOpenGraph && (
          <>
            <meta property="og:site_name" content={SITE_CONFIG.name} />
            <meta property="og:title" content={finalMeta.ogTitle} />
            <meta property="og:description" content={finalMeta.ogDescription} />
            <meta property="og:image" content={finalMeta.ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/jpeg" />
            <meta property="og:type" content={finalMeta.ogType} />
            <meta property="og:url" content={finalMeta.ogUrl} />
            <meta property="og:locale" content={SITE_CONFIG.locale} />
            <meta property="og:locale:alternate" content="mg_MG" />
            <meta property="og:locale:alternate" content="en_MG" />
            <meta property="og:updated_time" content={new Date().toISOString()} />
          </>
        )}
        
        {/* Twitter Cards */}
        {enableTwitterCards && (
          <>
            <meta name="twitter:card" content={finalMeta.twitterCard} />
            <meta name="twitter:site" content={finalMeta.twitterSite} />
            <meta name="twitter:title" content={finalMeta.twitterTitle} />
            <meta name="twitter:description" content={finalMeta.twitterDescription} />
            <meta name="twitter:image" content={finalMeta.twitterImage} />
            <meta name="twitter:image:alt" content={SITE_CONFIG.name} />
          </>
        )}
        
        {/* Author */}
        {finalMeta.author && <meta name="author" content={finalMeta.author} />}
        <meta name="copyright" content={SITE_CONFIG.name} />
        
        {/* Article meta */}
        {finalMeta.publishedTime && <meta name="article:published_time" content={finalMeta.publishedTime} />}
        {finalMeta.modifiedTime && <meta name="article:modified_time" content={finalMeta.modifiedTime} />}
        {finalMeta.section && <meta name="article:section" content={finalMeta.section} />}
        {finalMeta.tags.map((tag: string) => (
          <meta key={tag} name="article:tag" content={tag} />
        ))}
        
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#0B676E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.shortName} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="application-name" content={SITE_CONFIG.name} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="msapplication-TileColor" content="#0B676E" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Geo meta tags */}
        <meta name="geo.region" content="MG-A" />
        <meta name="geo.placename" content={SITE_CONFIG.city} />
        <meta name="geo.position" content={`${SITE_CONFIG.latitude};${SITE_CONFIG.longitude}`} />
        <meta name="ICBM" content={`${SITE_CONFIG.latitude}, ${SITE_CONFIG.longitude}`} />
        
        {/* Structured Data */}
        {finalStructuredData.map((data: any, index: number) => (
          <script key={`sd-${index}`} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))}
      </Helmet>

      {/* Children */}
      {children}

      {/* SEO Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ display: 'none' }} data-seo-score={seoScore} data-seo-grade={seoGrade}>
          {/* SEO Score: {seoScore} / 100 */}
          {/* SEO Grade: {seoGrade} */}
          {/* Page Type: {pageType} */}
          {/* Service Type: {serviceType} */}
          {/* Keywords Count: {finalMeta.keywords.length} */}
          {/* Structured Data Count: {finalStructuredData.length} */}
        </div>
      )}
    </>
  );
};

// ====================================================================================================
// SECTION 6: HOOKS SEO
// ====================================================================================================

export const useSEOManager = (props?: Partial<SEOManagerProps>) => {
  const { currentPage, pageType, serviceType, seoScore, seoGrade, refreshSEO, analyzeCurrentPage } = useSEO();
  
  return {
    currentPage,
    pageType,
    serviceType,
    seoScore,
    seoGrade,
    refreshSEO,
    analyzeCurrentPage,
    ...props
  };
};

export const useSEOAnalytics = () => {
  const trackEvent = useCallback((eventName: string, params?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  }, []);

  const trackPageView = useCallback((title: string, url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: url
      });
    }
  }, []);

  const trackSEOScore = useCallback((score: number, grade: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'seo_score', {
        score,
        grade,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  return { trackEvent, trackPageView, trackSEOScore };
};

// ====================================================================================================
// SECTION 7: COMPOSANT DE VERIFICATION SEO
// ====================================================================================================

interface SEOCheckerProps {
  children?: React.ReactNode;
  showScore?: boolean;
  showIssues?: boolean;
  showRecommendations?: boolean;
}

export const SEOChecker: React.FC<SEOCheckerProps> = ({
  children,
  showScore = true,
  showIssues = true,
  showRecommendations = true
}) => {
  const { seoScore, seoGrade, analyzeCurrentPage } = useSEO();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement.outerHTML;
      const result = analyzeSEO(html);
      setAnalysis(result);
    }
  }, []);

  useEffect(() => {
    analyzeCurrentPage();
  }, [analyzeCurrentPage]);

  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-gray-700">SEO Check</h4>
          {showScore && (
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              seoGrade === 'A' ? 'bg-green-100 text-green-700' :
              seoGrade === 'B' ? 'bg-blue-100 text-blue-700' :
              seoGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
              seoGrade === 'D' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {seoScore}% ({seoGrade})
            </div>
          )}
        </div>
        
        {showIssues && analysis && analysis.issues.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-red-600">Issues ({analysis.issues.length})</p>
            <ul className="text-xs text-red-600 list-disc pl-4">
              {analysis.issues.slice(0, 3).map((issue: string, i: number) => (
                <li key={i}>{issue}</li>
              ))}
              {analysis.issues.length > 3 && (
                <li>+{analysis.issues.length - 3} autres</li>
              )}
            </ul>
          </div>
        )}
        
        {showRecommendations && analysis && analysis.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-600">Recommandations</p>
            <ul className="text-xs text-blue-600 list-disc pl-4">
              {analysis.recommendations.slice(0, 2).map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
              {analysis.recommendations.length > 2 && (
                <li>+{analysis.recommendations.length - 2} autres</li>
              )}
            </ul>
          </div>
        )}
        
        <button
          onClick={analyzeCurrentPage}
          className="mt-2 w-full text-center text-xs bg-[#0B676E] text-white rounded px-3 py-1 hover:bg-[#0a5d64] transition-colors"
        >
          Analyser la page
        </button>
      </div>
      {children}
    </div>
  );
};

// ====================================================================================================
// SECTION 8: EXPORT DU MODULE
// ====================================================================================================

export default {
  SEOManager,
  SEOProvider,
  SEOChecker,
  useSEO,
  useSEOManager,
  useSEOAnalytics,
  generateAllKeywords,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateProductSchema,
  generateServiceSchema,
  generateReviewSchema,
  generateWebPageSchema,
  generateArticleSchema,
  generatePressingServiceSchema,
  generateBlanchisserieServiceSchema,
  generateNetASecServiceSchema,
  analyzeSEO,
  SITE_CONFIG,
  SEO_CONSTANTS,
  SEO_KEYWORDS
};