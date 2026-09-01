// client/src/App.tsx - VERSION OPTIMISÉE POUR ADMIN
import React, { useEffect, Suspense, useMemo } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner'; // ✅ Ovaina ho sonner
import { TooltipProvider } from '@/components/ui/tooltip';
import { SEOProvider, SEOManager } from '@/lib/seo-manager';
import { AnalyticsProvider, useAnalytics } from '@/components/seo/analytics-provider';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/lib/protected-route';
import { JsonLd, organizationSchema, localBusinessSchema } from '@/components/seo/JsonLd';

// ============================================================
// OPTIMISATION : Détection des routes admin
// ============================================================
const useIsAdminRoute = (location: string): boolean => {
  return location.startsWith('/admin') || 
         location.startsWith('/dashboard') ||
         location.startsWith('/agent') ||
         location.startsWith('/supervisor') ||
         location.startsWith('/delivery');
};

// Lazy loading des pages
const HomePage = React.lazy(() => import('@/pages/home-page'));
const AuthPage = React.lazy(() => import('@/pages/auth-page'));
const ClientDashboard = React.lazy(() => import('@/pages/client-dashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/admin-dashboard-complete'));
const SupervisorDashboard = React.lazy(() => import('@/pages/supervisor-dashboard'));
const ClientLoginInfo = React.lazy(() => import('@/pages/client-login-info'));
const AgentDashboard = React.lazy(() => import('@/pages/agent-dashboard'));
const DeliveryDashboard = React.lazy(() => import('@/pages/delivery-dashboard'));
const NotFound = React.lazy(() => import('@/pages/not-found'));
const BlogPage = React.lazy(() => import('@/pages/blog/blog-page'));
const BlogPostPage = React.lazy(() => import('@/pages/blog/blog-post'));

// ============================================================
// LOADER
// ============================================================
const PageLoader: React.FC = () => (
  <div 
    role="status" 
    aria-live="polite" 
    className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100"
    style={{ minHeight: '100vh' }}
  >
    <div className="animate-pulse space-y-4 w-full max-w-md p-8">
      <div className="h-8 bg-gray-200 rounded-full w-3/4 mx-auto"></div>
      <div className="h-4 bg-gray-200 rounded-full w-1/2 mx-auto"></div>
      <div className="h-32 bg-gray-200 rounded-2xl mt-8"></div>
      <div className="h-2 bg-gray-200 rounded-full w-full mt-4"></div>
      <div className="h-2 bg-gray-200 rounded-full w-5/6 mx-auto"></div>
    </div>
    <p className="sr-only">Chargement de SV Pressing Madagascar</p>
  </div>
);

// ============================================================
// GÉNÉRATEUR DE MOTS-CLÉS (UNIQUEMENT POUR PAGES PUBLIQUES)
// ============================================================
const generateAllKeywords = (): string[] => {
  const services = [
    'pressing', 'blanchisserie', 'net à sec', 'nettoyage à sec', 'laundry service',
    'fanasan-damba', 'lavage', 'repassage', 'nettoyage professionnel', 'blanchiment'
  ];
  const concurrents = [
    'Sasa Vanda', 'Clean Press', 'Speed Clean', 'Express Pressing',
    'Top Clean', 'Laundry Service MG', 'Pressing de Luxe'
  ];
  const quartiers = [
    'Analamanga', 'Ambohidratrimo', 'Andramasina', 'Anjozorobe',
    'Manjakandriana', 'Antananarivo', 'Ivato', 'Ambatobe',
    'Ampefiloha', 'Analakely', 'Anosy', 'Ankorondrano'
  ];

  let allKeywords: string[] = [];

  for (var s = 0; s < services.length; s++) {
    for (var c = 0; c < concurrents.length; c++) {
      for (var q = 0; q < quartiers.length; q++) {
        allKeywords.push(services[s] + ' ' + concurrents[c] + ' ' + quartiers[q]);
        allKeywords.push(services[s] + ' meilleur que ' + concurrents[c] + ' ' + quartiers[q]);
        allKeywords.push(concurrents[c] + ' vs ' + services[s] + ' ' + quartiers[q]);
      }
    }
  }

  var uniqueKeywords: string[] = [];
  var seen: { [key: string]: boolean } = {};
  for (var i = 0; i < allKeywords.length; i++) {
    var keyword = allKeywords[i];
    if (!seen[keyword]) {
      seen[keyword] = true;
      uniqueKeywords.push(keyword);
    }
  }
  return uniqueKeywords.slice(0, 3000);
};

// ============================================================
// ROUTER PRINCIPAL AVEC OPTIMISATIONS
// ============================================================
const AppRouter: React.FC = () => {
  const [location] = useLocation();
  const { trackPageView } = useAnalytics();
  const isAdminRoute = useIsAdminRoute(location);
  
  var allKeywords = useMemo(function() {
    if (isAdminRoute) {
      return [];
    }
    return generateAllKeywords();
  }, [isAdminRoute]);

  useEffect(function() {
    trackPageView(document.title, window.location.href);
  }, [location, trackPageView]);

  useEffect(function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  useEffect(function() {
    if (isAdminRoute) {
      return;
    }

    var orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.id = 'org-schema';
    orgScript.textContent = JSON.stringify(organizationSchema);
    if (!document.getElementById('org-schema')) {
      document.head.appendChild(orgScript);
    }
    
    var businessScript = document.createElement('script');
    businessScript.type = 'application/ld+json';
    businessScript.id = 'business-schema';
    businessScript.textContent = JSON.stringify(localBusinessSchema);
    if (!document.getElementById('business-schema')) {
      document.head.appendChild(businessScript);
    }
    
    return function() {
      // Nettoyage
    };
  }, [location, isAdminRoute]);

  return (
    <Switch>
      {/* Pages publiques avec SEO - ACCUEIL */}
      <Route path="/">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="SV Pressing Madagascar | N°1 Pressing, Blanchisserie & Net à Sec - Antananarivo"
            description="SV Pressing Madagascar - Leader du pressing, blanchisserie et nettoyage à sec. Collecte & livraison GRATUITES à Antananarivo."
            keywords={allKeywords}
            canonical="https://svpressing.com/"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLANCHISSERIE */}
      <Route path="/blanchisserie">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blanchisserie Professionnelle Antananarivo - SV Pressing"
            description="Service de blanchisserie professionnelle à Antananarivo."
            keywords={allKeywords}
            canonical="https://svpressing.com/blanchisserie"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* NET A SEC */}
      <Route path="/net-a-sec">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Net à Sec Professionnel Antananarivo - SV Pressing"
            description="Service Net à Sec professionnel à Antananarivo."
            keywords={allKeywords}
            canonical="https://svpressing.com/net-a-sec"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLANCHISSERIE COUETTE */}
      <Route path="/blanchisserie-couette">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blanchisserie Couette Antananarivo - SV Pressing"
            description="Service de blanchisserie professionnelle pour couettes."
            keywords={allKeywords}
            canonical="https://svpressing.com/blanchisserie-couette"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLANCHISSERIE RIDEAUX */}
      <Route path="/blanchisserie-rideaux">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blanchisserie Rideaux Antananarivo - SV Pressing"
            description="Service de blanchisserie pour rideaux."
            keywords={allKeywords}
            canonical="https://svpressing.com/blanchisserie-rideaux"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLANCHISSERIE TAPIS */}
      <Route path="/blanchisserie-tapis">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blanchisserie Tapis Antananarivo - SV Pressing"
            description="Service de blanchisserie pour tapis."
            keywords={allKeywords}
            canonical="https://svpressing.com/blanchisserie-tapis"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLANCHISSERIE INDUSTRIELLE */}
      <Route path="/blanchisserie-industrielle">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blanchisserie Industrielle Antananarivo - SV Pressing"
            description="Service de blanchisserie industrielle B2B."
            keywords={allKeywords}
            canonical="https://svpressing.com/blanchisserie-industrielle"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* PRESSING COSTUME */}
      <Route path="/pressing-costume">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Pressing Costume Antananarivo - SV Pressing"
            description="Service professionnel de nettoyage de costumes."
            keywords={allKeywords}
            canonical="https://svpressing.com/pressing-costume"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* PRESSING ROBE DE SOIREE */}
      <Route path="/pressing-robe-soiree">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Pressing Robe de Soirée Antananarivo - SV Pressing"
            description="Service de nettoyage délicat pour robes."
            keywords={allKeywords}
            canonical="https://svpressing.com/pressing-robe-soiree"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* PRESSING LINGE MAISON */}
      <Route path="/pressing-linge-maison">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Pressing Linge de Maison Antananarivo - SV Pressing"
            description="Service de pressing et blanchisserie pour linge de maison."
            keywords={allKeywords}
            canonical="https://svpressing.com/pressing-linge-maison"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* PRESSING ENTREPRISE */}
      <Route path="/pressing-entreprise">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Pressing Entreprise B2B Antananarivo - SV Pressing"
            description="Service de pressing B2B pour entreprises."
            keywords={allKeywords}
            canonical="https://svpressing.com/pressing-entreprise"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* NETTOYAGE SOIE */}
      <Route path="/nettoyage-soie">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Nettoyage Soie Antananarivo - SV Pressing"
            description="Service professionnel de nettoyage de soie."
            keywords={allKeywords}
            canonical="https://svpressing.com/nettoyage-soie"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* NETTOYAGE LAINE */}
      <Route path="/nettoyage-laine">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Nettoyage Laine Antananarivo - SV Pressing"
            description="Service professionnel de nettoyage de laine."
            keywords={allKeywords}
            canonical="https://svpressing.com/nettoyage-laine"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* NETTOYAGE CACHEMIRE */}
      <Route path="/nettoyage-cachemire">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Nettoyage Cachemire Antananarivo - SV Pressing"
            description="Service professionnel de nettoyage de cachemire."
            keywords={allKeywords}
            canonical="https://svpressing.com/nettoyage-cachemire"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* TARIFS */}
      <Route path="/tarifs">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Tarifs Pressing et Blanchisserie - SV Pressing Madagascar"
            description="Tarifs transparents. Abonnements dès 50 000 Ar."
            keywords={allKeywords}
            canonical="https://svpressing.com/tarifs"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* PLANS */}
      <Route path="/plans">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Formules d'Abonnement Pressing - SV Pressing Madagascar"
            description="Formules d'abonnement pressing."
            keywords={allKeywords}
            canonical="https://svpressing.com/plans"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* ABOUT */}
      <Route path="/about">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="À propos - SV Pressing Madagascar"
            description="Découvrez SV Pressing, leader du pressing à Madagascar."
            keywords={allKeywords}
            canonical="https://svpressing.com/about"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* CONTACT */}
      <Route path="/contact">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Contact - SV Pressing Madagascar"
            description="Contactez SV Pressing. Service client 7j/7."
            keywords={allKeywords}
            canonical="https://svpressing.com/contact"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* FAQ */}
      <Route path="/faq">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="FAQ - SV Pressing Madagascar"
            description="Questions fréquentes sur le pressing."
            keywords={allKeywords}
            canonical="https://svpressing.com/faq"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* APP */}
      <Route path="/app">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Application Mobile SV Pressing"
            description="Téléchargez l'application SV Pressing."
            keywords={allKeywords}
            canonical="https://svpressing.com/app"
          />
          <HomePage />
        </Suspense>
      </Route>

      {/* BLOG - Liste des articles */}
      <Route path="/blog">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Blog - SV Pressing Madagascar"
            description="Conseils pour entretenir vos vêtements à Antananarivo. Guides pratiques sur le pressing, la blanchisserie et le nettoyage à sec."
            keywords={allKeywords}
            canonical="https://svpressing.com/blog"
          />
          <BlogPage />
        </Suspense>
      </Route>

      {/* BLOG - Article individuel */}
      <Route path="/blog/:slug">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Article - SV Pressing Madagascar"
            description="Article sur le pressing et la blanchisserie à Antananarivo."
            keywords={allKeywords}
            canonical={"https://svpressing.com/blog/" + location.split('/').pop()}
          />
          <BlogPostPage />
        </Suspense>
      </Route>

      {/* BLOG - Catégorie */}
      <Route path="/blog/categorie/:category">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Articles par catégorie - SV Pressing Madagascar"
            description="Articles du blog SV Pressing Madagascar par catégorie."
            keywords={allKeywords}
            canonical={"https://svpressing.com/blog/categorie/" + location.split('/').pop()}
          />
          <BlogPage />
        </Suspense>
      </Route>

      {/* BLOG - Tag */}
      <Route path="/blog/tag/:tag">
        <Suspense fallback={<PageLoader />}>
          <SEOManager
            title="Articles par tag - SV Pressing Madagascar"
            description="Articles du blog SV Pressing Madagascar par tag."
            keywords={allKeywords}
            canonical={"https://svpressing.com/blog/tag/" + location.split('/').pop()}
          />
          <BlogPage />
        </Suspense>
      </Route>

      {/* ============================================================
          ROUTES ADMIN - NOINDEX ET OPTIMISÉES
      ============================================================ */}
      
      <ProtectedRoute path="/dashboard">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Tableau de Bord Client - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <ClientDashboard />
        </Suspense>
      </ProtectedRoute>

      <ProtectedRoute path="/admin">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Administration - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <AdminDashboard />
        </Suspense>
      </ProtectedRoute>

      <ProtectedRoute path="/agent">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Espace Agent - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <AgentDashboard />
        </Suspense>
      </ProtectedRoute>

      <ProtectedRoute path="/supervisor">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Supervision - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <SupervisorDashboard />
        </Suspense>
      </ProtectedRoute>

      <ProtectedRoute path="/delivery">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Espace Livreur - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <DeliveryDashboard />
        </Suspense>
      </ProtectedRoute>

      <Route path="/auth">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Connexion - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow" 
          />
          <AuthPage />
        </Suspense>
      </Route>

      <Route path="/login-info">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Informations de Connexion - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <ClientLoginInfo />
        </Suspense>
      </Route>

      <Route path="/terms">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Conditions Générales - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <HomePage />
        </Suspense>
      </Route>

      <Route path="/privacy">
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Politique de Confidentialité - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <HomePage />
        </Suspense>
      </Route>

      <Route>
        <Suspense fallback={<PageLoader />}>
          <SEOManager 
            title="Page non trouvée - SV Pressing" 
            noIndex={true} 
            robots="noindex, nofollow"
          />
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
};

// ============================================================
// APP PRINCIPAL
// ============================================================
const App: React.FC = () => {
  useEffect(function() {
    var domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://www.google-analytics.com'
    ];

    for (var d = 0; d < domains.length; d++) {
      var domain = domains[d];
      if (!document.querySelector('link[rel="preconnect"][href="' + domain + '"]')) {
        var link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }

    if (!document.querySelector('link[rel="manifest"]')) {
      var manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.webmanifest';
      document.head.appendChild(manifestLink);
    }
  }, []);

  return (
    <SEOProvider>
      <AnalyticsProvider>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={300}>
                <JsonLd data={organizationSchema} />
                <JsonLd data={localBusinessSchema} />
                {/* ✅ Mampiasa sonner izao */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#0B676E',
                      color: 'white',
                      borderRadius: '12px'
                    }
                  }}
                />
                <AppRouter />
              </TooltipProvider>
            </AuthProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </AnalyticsProvider>
    </SEOProvider>
  );
};

// ============================================================
// ERROR BOUNDARY
// ============================================================
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erreur:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen flex flex-col justify-center items-center text-center p-8" 
          style={{ background: 'linear-gradient(135deg, #0B676E 0%, #0a5d64 100%)', color: 'white' }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Une erreur est survenue</h1>
          <p className="text-xl mb-8 max-w-md">Désolé, une erreur technique s'est produite.</p>
          <div className="bg-white rounded-2xl p-6 max-w-md text-gray-800">
            <h2 className="text-xl font-bold text-[#0B676E] mb-4">Contactez SV Pressing</h2>
            <p className="mb-2">
              <i className="fa-solid fa-phone mr-2"></i>
              Téléphone/WhatsApp : 
              <a href="tel:+261349948301" className="text-[#0B676E] font-semibold ml-1">+261 34 99 483 01</a>
            </p>
            <p className="mb-4">
              <i className="fa-regular fa-envelope mr-2"></i>
              Email : 
              <a href="mailto:contact.sasavanda@gmail.com" className="text-[#0B676E] font-semibold ml-1">contact.sasavanda@gmail.com</a>
            </p>
            <button 
              onClick={function() { window.location.reload(); }} 
              className="mt-2 px-6 py-2 bg-[#0B676E] text-white rounded-xl hover:bg-[#0a5d64] transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppWithErrorBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}