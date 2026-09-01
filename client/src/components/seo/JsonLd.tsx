// client/src/components/seo/JsonLd.tsx
import React, { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  useEffect(() => {
    const scriptId = 'json-ld-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [data]);
  
  return null;
};

// Données structurées prédéfinies pour Organisation
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SV Pressing Madagascar",
  "alternateName": ["SV Pressing", "Net à Sec SV"],
  "url": "https://svpressing.com/",
  "logo": "https://svpressing.com/logo-svpressing.png",
  "description": "Service de pressing professionnel avec collecte et livraison à domicile à Antananarivo, Madagascar",
  "email": "contact.sasavanda@gmail.com",
  "telephone": "+261-34-99-483-01",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Antananarivo",
    "addressRegion": "Analamanga",
    "addressCountry": "MG",
    "postalCode": "101"
  },
  "sameAs": [
    "https://www.facebook.com/sasavandapressing",
    "https://www.instagram.com/svpressing",
    "https://twitter.com/svpressing"
  ]
};

// Données structurées pour LocalBusiness
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Laundry",
  "name": "SV Pressing Madagascar",
  "description": "Service de pressing professionnel avec collecte et livraison",
  "url": "https://svpressing.com/",
  "telephone": "+261-34-99-483-01",
  "email": "contact.sasavanda@gmail.com",
  "priceRange": "15,000 Ar - 50,000 Ar",
  "currenciesAccepted": "MGA",
  "paymentAccepted": "Cash, Mobile Money, Credit Card",
  "openingHours": "Mo-Su 08:00-20:00",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Antananarivo",
    "addressRegion": "Analamanga",
    "addressCountry": "MG"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-18.8792",
    "longitude": "47.5079"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "847",
    "bestRating": "5"
  }
};

// Données structurées pour FAQ
export const faqSchema = (questions: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": questions.map(q => ({
    "@type": "Question",
    "name": q.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": q.answer
    }
  }))
});

// Données structurées pour BreadcrumbList
export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});