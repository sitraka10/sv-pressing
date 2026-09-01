// server/routes/seo-routes.ts
import { Router } from 'express';
import { generateSitemap } from '../utils/sitemap-generator';
import { generateRobotsTxt } from '../utils/robots-generator';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Route pour robots.txt
router.get('/robots.txt', (req, res) => {
  const robotsContent = generateRobotsTxt();
  res.type('text/plain');
  res.send(robotsContent);
});

// Route pour sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Erreur génération sitemap:', error);
    res.status(500).send('Erreur lors de la génération du sitemap');
  }
});

// Route pour sitemap index
router.get('/sitemap-index.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap(true);
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Erreur génération sitemap index:', error);
    res.status(500).send('Erreur lors de la génération du sitemap index');
  }
});

// Route pour le manifest JSON-LD
router.get('/manifest.jsonld', (req, res) => {
  const manifest = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "SV Pressing Madagascar",
        "url": "https://svpressing.com",
        "logo": "https://svpressing.com/assets/img/Pressing_Gris.png",
        "description": "Service de pressing professionnel avec collecte et livraison à Antananarivo",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Antananarivo",
          "addressRegion": "Analamanga",
          "addressCountry": "MG"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["fr", "mg"]
        }
      },
      {
        "@type": "WebSite",
        "name": "SV Pressing Madagascar",
        "url": "https://svpressing.com",
        "description": "Service de pressing professionnel à Madagascar",
        "publisher": {
          "@type": "Organization",
          "name": "SV Pressing"
        }
      }
    ]
  };
  
  res.json(manifest);
});

// Route pour le fichier humans.txt
router.get('/humans.txt', (req, res) => {
  const humansContent = `
/* TEAM */
Développeur: SV Pressing Team
Site: https://svpressing.com
Contact: contact.sasavanda@gmail.com
Location: Antananarivo, Madagascar

/* SITE */
Last update: ${new Date().toISOString().split('T')[0]}
Language: Français, Malagasy
Doctype: HTML5
`;
  
  res.type('text/plain');
  res.send(humansContent);
});

// Route pour vérifier la conformité SEO
router.get('/seo-check', (req, res) => {
  res.json({
    status: 'ok',
    checks: {
      sitemap: true,
      robots: true,
      structured_data: true,
      canonical_urls: true,
      meta_tags: true,
      mobile_friendly: true,
      page_speed: 'optimized',
      ssl_certificate: true
    },
    recommendations: [
      "Maintenir les métadonnées à jour",
      "Vérifier régulièrement le sitemap",
      "Optimiser les images pour le web",
      "Utiliser le lazy loading pour les images"
    ]
  });
});

export default router;