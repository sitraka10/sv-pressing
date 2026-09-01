// client/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Déclaration des types globaux pour TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Configuration de QueryClient (sans logger - supprimé dans v5)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
  // ✅ logger nofoanana - ESORINA
});

// Fonction pour détecter les bots crawlers
const isCrawler = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const crawlers = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    'exabot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'whatsapp',
    'slackbot',
    'applebot',
    'discordbot',
    'telegrambot',
  ];

  return crawlers.some(crawler => userAgent.includes(crawler));
};

// Fonction pour initialiser les analytics
const initializeAnalytics = () => {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  
  if (window.performance && window.performance.timing) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: 'page_load',
        value: pageLoadTime,
        event_category: 'Performance',
      });
      
      window.gtag('event', 'timing_complete', {
        name: 'dom_ready',
        value: domReadyTime,
        event_category: 'Performance',
      });
    }
  }
  
  if (isCrawler()) {
    console.log('🤖 Bot/Crawler détecté - Mode SEO activé');
  }
};

// Fonction pour injecter les scripts SEO
const injectSEOScripts = () => {
  if (typeof document === 'undefined') return;
  
  const structuredDataScript = document.createElement('script');
  structuredDataScript.type = 'application/ld+json';
  structuredDataScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SV Pressing Madagascar",
    "url": "https://svpressing.com/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://svpressing.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  });
  document.head.appendChild(structuredDataScript);
  
  const dynamicMetaTags: Array<{ property?: string; name?: string; content: string }> = [
    { property: 'og:updated_time', content: new Date().toISOString() },
    { name: 'last-modified', content: new Date().toISOString() },
  ];
  
  dynamicMetaTags.forEach(tag => {
    const meta = document.createElement('meta');
    // ✅ Mampiasa ny property na name, miaraka amin'ny fallback
    const attributeName = tag.property ? 'property' : 'name';
    const attributeValue = tag.property || tag.name || ''; // ✅ tsy ho undefined
    meta.setAttribute(attributeName, attributeValue);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });
};

// Point d'entrée principal
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

initializeAnalytics();
injectSEOScripts();

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Performance monitoring
const monitorPerformance = () => {
  if (process.env.NODE_ENV === 'development') {
    if (window.performance) {
      const perfEntries = window.performance.getEntriesByType('navigation');
      if (perfEntries.length > 0) {
        const navEntry = perfEntries[0] as PerformanceNavigationTiming;
        console.log('Performance metrics:', {
          'DNS Lookup': navEntry.domainLookupEnd - navEntry.domainLookupStart,
          'TCP Connection': navEntry.connectEnd - navEntry.connectStart,
          'Time to First Byte': navEntry.responseStart - navEntry.requestStart,
          'DOM Content Loaded': navEntry.domContentLoadedEventEnd - navEntry.startTime,
          'Full Load': navEntry.loadEventEnd - navEntry.startTime,
        });
      }
    }
  }
};

monitorPerformance();

// Service Worker registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);
      },
      (error) => {
        console.log('ServiceWorker registration failed:', error);
      }
    );
  });
}

// Error boundary global
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: event.error?.message || 'Unknown error',
      fatal: true,
    });
  }
});

// Uncaught promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: event.reason?.message || 'Unhandled promise rejection',
      fatal: false,
    });
  }
});

// Log pour le SEO
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  SV PRESSING MADAGASCAR                      ║
║            Service de Pressing Professionnel                 ║
║        Collecte & Livraison à Domicile à Antananarivo        ║
║                                                              ║
║          📞 +261 34 99 483 01 | 📧 contact.sasavanda@gmail.com    ║
║          🌐 https://svpressing.com                           ║
╚══════════════════════════════════════════════════════════════╝
`);