import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

interface MetaManagerProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  jsonLd?: unknown;
  canonicalUrl?: string;
  keywords?: string[];
}

type PageType = "home" | "plans" | "app";

interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

const BASE_URL = "https://svpressing.com";

/* =========================
   STRUCTURED DATA
========================= */

const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SV Pressing",
    url: BASE_URL,
    logo: `${BASE_URL}/assets/img/SV_Pattern_Gris.svg`,
    description:
      "Service de pressing professionnel avec collecte et livraison à domicile à Antananarivo.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Antananarivo",
      addressCountry: "MG",
    },
  } as StructuredData,

  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SV Pressing",
    url: BASE_URL,
  } as StructuredData,

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "SV Pressing",
    url: BASE_URL,
    description:
      "Service de pressing professionnel à Antananarivo avec collecte et livraison.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Antananarivo",
      addressCountry: "MG",
    },
    areaServed: {
      "@type": "City",
      name: "Antananarivo",
    },
  } as StructuredData,

  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que SV Pressing ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SV Pressing est un service de pressing professionnel avec collecte et livraison à domicile à Antananarivo.",
        },
      },
      {
        "@type": "Question",
        name: "SV Pressing propose-t-il la livraison ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, SV Pressing propose un service de collecte et de livraison.",
        },
      },
    ],
  } as StructuredData,

  breadcrumb: (path: string): StructuredData => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: `${BASE_URL}/`,
      },
      ...(path !== "/"
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: path.includes("plans")
                ? "Plans"
                : path.includes("app")
                ? "Application"
                : "Page",
              item: `${BASE_URL}${path}`,
            },
          ]
        : []),
    ],
  }),
};

/* =========================
   PAGE TYPE
========================= */

function getPageType(pathname: string): PageType {
  if (
    pathname.includes("/plans") ||
    pathname.includes("#plans")
  ) {
    return "plans";
  }

  if (
    pathname.includes("/app") ||
    pathname.includes("#download-app")
  ) {
    return "app";
  }

  return "home";
}

/* =========================
   STRUCTURED DATA PAR PAGE
========================= */

function generatePageStructuredData(
  pageType: PageType,
  jsonLd?: unknown
): unknown[] {
  if (jsonLd) {
    return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  }

  if (pageType === "home") {
    return [
      structuredData.organization,
      structuredData.website,
      structuredData.localBusiness,
      structuredData.faq,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Accueil SV Pressing",
        description:
          "Page d'accueil du service de pressing SV Pressing à Antananarivo.",
        url: BASE_URL,
        breadcrumb: structuredData.breadcrumb("/"),
      },
    ];
  }

  if (pageType === "plans") {
    return [
      structuredData.localBusiness,
      structuredData.breadcrumb("/plans"),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Plans d'abonnement SV Pressing",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@type": "Product",
              name: "Formule Essentielle",
              description:
                "Abonnement pressing économique pour les besoins basiques.",
              offers: {
                "@type": "Offer",
                price: "15000",
                priceCurrency: "MGA",
              },
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@type": "Product",
              name: "Formule Familiale",
              description:
                "Abonnement pressing idéal pour les familles.",
              offers: {
                "@type": "Offer",
                price: "20000",
                priceCurrency: "MGA",
              },
            },
          },
          {
            "@type": "ListItem",
            position: 3,
            item: {
              "@type": "Product",
              name: "Formule Premium",
              description:
                "Abonnement pressing premium avec services optimisés.",
              offers: {
                "@type": "Offer",
                price: "35000",
                priceCurrency: "MGA",
              },
            },
          },
        ],
      },
    ];
  }

  if (pageType === "app") {
    return [
      structuredData.organization,
      structuredData.breadcrumb("/app"),
      {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        name: "SV Pressing",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Android",
        description:
          "Application mobile SV Pressing pour gérer les commandes, collectes et livraisons.",
      },
    ];
  }

  return [];
}

/* =========================
   META MANAGER
========================= */

export const MetaManager: React.FC<MetaManagerProps> = ({
  title,
  description,
  image,
  type = "website",
  noIndex = false,
  jsonLd,
  canonicalUrl,
  keywords = [],
}) => {
  const [location] = useLocation();

  const pathname = location || "/";
  const pageType = getPageType(pathname);

  const defaultTitles: Record<PageType, string> = {
    home:
      "SV Pressing - Service de Pressing Professionnel à Antananarivo | Madagascar",
    plans:
      "Plans d'Abonnement Pressing - Formules Mensuelles Économiques | SV Pressing",
    app:
      "Application Mobile SV Pressing - Télécharger l'App Pressing Madagascar",
  };

  const defaultDescriptions: Record<PageType, string> = {
    home:
      "SV Pressing - Service de pressing professionnel à Madagascar avec collecte et livraison à domicile à Antananarivo.",
    plans:
      "Découvrez nos formules d'abonnement pressing mensuel à Antananarivo avec collecte et livraison.",
    app:
      "Téléchargez l'application mobile SV Pressing pour gérer vos commandes et suivre vos livraisons.",
  };

  const finalTitle = title || defaultTitles[pageType];
  const finalDescription =
    description || defaultDescriptions[pageType];

  const finalCanonical =
    canonicalUrl || `${BASE_URL}${pathname === "/" ? "" : pathname}`;

  const finalKeywords = keywords.join(", ");

  const pageStructuredData = generatePageStructuredData(
    pageType,
    jsonLd
  );

  /* =========================
     ANALYTICS
  ========================= */

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
    ) {
      const gtag = (
        window as Window & {
          gtag?: (...args: unknown[]) => void;
        }
      ).gtag;

      gtag?.("config", "G-YOUR_GA_ID", {
        page_path: pathname,
      });
    }

    console.log(
      `SEO: Page changed to ${pathname}, type: ${pageType}`
    );
  }, [pathname, pageType]);

  return (
    <Helmet>
      {/* =========================
          BASIC SEO
      ========================= */}

      <title>{finalTitle}</title>

      <meta
        name="description"
        content={finalDescription}
      />

      {finalKeywords && (
        <meta
          name="keywords"
          content={finalKeywords}
        />
      )}

      <meta
        name="robots"
        content={
          noIndex
            ? "noindex, nofollow"
            : "index, follow"
        }
      />

      <link
        rel="canonical"
        href={finalCanonical}
      />

      {/* =========================
          OPEN GRAPH
      ========================= */}

      <meta
        property="og:title"
        content={finalTitle}
      />

      <meta
        property="og:description"
        content={finalDescription}
      />

      <meta
        property="og:type"
        content={type}
      />

      <meta
        property="og:url"
        content={finalCanonical}
      />

      {image && (
        <meta
          property="og:image"
          content={image}
        />
      )}

      <meta
        property="og:site_name"
        content="SV Pressing"
      />

      <meta
        property="og:locale"
        content="fr_FR"
      />

      {/* =========================
          TWITTER
      ========================= */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={finalTitle}
      />

      <meta
        name="twitter:description"
        content={finalDescription}
      />

      {image && (
        <meta
          name="twitter:image"
          content={image}
        />
      )}

      {/* =========================
          GENERAL
      ========================= */}

      <meta
        name="generator"
        content="SV Pressing Platform"
      />

      <meta
        name="rating"
        content="General"
      />

      <meta
        name="distribution"
        content="Global"
      />

      {/* =========================
          GEO
      ========================= */}

      <meta
        name="geo.region"
        content="MG-A"
      />

      <meta
        name="geo.placename"
        content="Antananarivo"
      />

      <meta
        name="geo.position"
        content="-18.8792;47.5079"
      />

      <meta
        name="ICBM"
        content="-18.8792, 47.5079"
      />

      {/* =========================
          LANGUAGE
      ========================= */}

      <meta
        httpEquiv="content-language"
        content="fr, mg, en"
      />

      {/* =========================
          PWA
      ========================= */}

      <meta
        name="mobile-web-app-capable"
        content="yes"
      />

      <meta
        name="apple-mobile-web-app-capable"
        content="yes"
      />

      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />

      <meta
        name="apple-mobile-web-app-title"
        content="SV Pressing"
      />

      {/* =========================
          STRUCTURED DATA
      ========================= */}

      {pageStructuredData.map((data, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

/* =========================
   HOME
========================= */

export const HomeMeta: React.FC = () => (
  <MetaManager
    title="SV Pressing - Service de Pressing Professionnel à Antananarivo | Madagascar"
    description="SV Pressing - Premier service de pressing par abonnement à Madagascar. Collecte et livraison à domicile à Antananarivo, qualité premium, service express. Formules économiques pour famille et entreprises."
    image="https://svpressing.com/assets/img/SV_Pattern_Gris.svg"
    canonicalUrl="https://svpressing.com/"
    keywords={[
      "pressing Madagascar",
      "pressing Antananarivo",
      "lavage vêtements",
      "pressing professionnel",
      "livraison pressing",
      "collecte pressing",
    ]}
  />
);

/* =========================
   PLANS
========================= */

export const PlansMeta: React.FC = () => (
  <MetaManager
    title="Plans d'Abonnement Pressing - Formules Mensuelles Économiques | SV Pressing"
    description="Découvrez nos formules d'abonnement pressing mensuel à Antananarivo. Formule Familiale, Premium et Essentielle avec collecte et livraison incluses."
    image="https://svpressing.com/assets/img/Pressing_Gris.png"
    canonicalUrl="https://svpressing.com/plans"
    keywords={[
      "abonnement pressing Madagascar",
      "forfait pressing mensuel",
      "prix pressing Antananarivo",
      "formule pressing économique",
      "plan pressing familial",
      "abonnement lavage repassage",
      "subscription laundry Madagascar",
      "monthly laundry plan",
      "laundry subscription prices",
    ]}
  />
);

/* =========================
   APP
========================= */

export const AppMeta: React.FC = () => (
  <MetaManager
    title="Application Mobile SV Pressing - Télécharger l'App Pressing Madagascar"
    description="Téléchargez l'application mobile SV Pressing pour Android. Gérez vos commandes de pressing, suivez vos livraisons et programmez les collectes depuis votre smartphone à Antananarivo."
    image="https://svpressing.com/assets/img/app-preview.jpg"
    canonicalUrl="https://svpressing.com/app"
    keywords={[
      "application pressing Madagascar",
      "app pressing Antananarivo",
      "télécharger app pressing",
      "mobile app laundry service",
      "SV Pressing app download",
      "application mobile pressing",
      "laundry management app",
      "on-demand laundry app",
    ]}
  />
);