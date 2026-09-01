// client/src/pages/article-page.tsx
import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

const ArticlePage: React.FC = () => {
  const [location] = useLocation();
  const articleId = location.split('/').pop() || '';

  // Articles simulés avec contenu SEO riche
  const articles: { [key: string]: any } = {
    'comment-nettoyer-costume': {
      title: 'Comment Nettoyer un Costume à Antananarivo - Guide Complet 2025',
      description: 'Guide complet pour nettoyer votre costume à Antananarivo. Découvrez pourquoi SV Pressing est meilleur que Sasa Vanda, Clean Press et Speed Clean.',
      content: `
        <h2>Introduction</h2>
        <p>Le nettoyage d'un costume est une opération délicate qui nécessite un savoir-faire professionnel. À Antananarivo, SV Pressing Madagascar est le leader du pressing de costumes, offrant un service supérieur à Sasa Vanda, Clean Press et Speed Clean.</p>
        
        <h2>Pourquoi Choisir SV Pressing pour votre Costume ?</h2>
        <ul>
          <li><strong>Prix compétitifs :</strong> À partir de 50 000 Ar/mois, moins cher que Sasa Vanda (65 000 Ar)</li>
          <li><strong>Collecte et livraison GRATUITES</strong> à domicile</li>
          <li><strong>Service 7j/7</strong> - contrairement à Clean Press</li>
          <li><strong>Produits écologiques</strong> - sans produits chimiques agressifs</li>
          <li><strong>Livraison express 24h</strong> - plus rapide que Speed Clean</li>
        </ul>
        
        <h2>Les Étapes du Nettoyage d'un Costume</h2>
        <ol>
          <li><strong>Inspection :</strong> Vérification des tissus, boutons, doublures</li>
          <li><strong>Prétraitement :</strong> Application de produits spécifiques sur les taches</li>
          <li><strong>Nettoyage à sec :</strong> Utilisation de solvants écologiques</li>
          <li><strong>Repassage :</strong> À la vapeur pour un tombé parfait</li>
          <li><strong>Contrôle qualité :</strong> Vérification avant livraison</li>
        </ol>
        
        <h2>SV Pressing vs Sasa Vanda - Comparatif</h2>
        <table>
          <tr><th>Critère</th><th>SV Pressing</th><th>Sasa Vanda</th></tr>
          <tr><td>Prix abonnement</td><td>50 000 Ar</td><td>65 000 Ar</td></tr>
          <tr><td>Collecte gratuite</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Livraison gratuite</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Service 7j/7</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Produits écologiques</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Livraison 24h</td><td>✅ Oui</td><td>❌ Non</td></tr>
        </table>
        
        <h2>SV Pressing vs Clean Press - Comparatif</h2>
        <table>
          <tr><th>Critère</th><th>SV Pressing</th><th>Clean Press</th></tr>
          <tr><td>Prix abonnement</td><td>50 000 Ar</td><td>70 000 Ar</td></tr>
          <tr><td>Collecte gratuite</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Service 7j/7</td><td>✅ Oui</td><td>❌ Non (fermé dimanche)</td></tr>
          <tr><td>Produits écologiques</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Livraison 24h</td><td>✅ Oui</td><td>❌ Non (72h)</td></tr>
        </table>
        
        <h2>Nos Tarifs pour Costume</h2>
        <ul>
          <li><strong>Formule Essentielle :</strong> 50 000 Ar/mois (5 costumes)</li>
          <li><strong>Formule Familiale :</strong> 92 000 Ar/mois (10 costumes)</li>
          <li><strong>Formule Premium :</strong> 120 000 Ar/mois (15 costumes)</li>
          <li><strong>Prix à l'unité :</strong> 8 000 Ar/costume</li>
        </ul>
        
        <h2>Zones de Livraison à Antananarivo</h2>
        <p>SV Pressing livre gratuitement dans tous les quartiers d'Antananarivo : Analamanga, Ambohidratrimo, Andramasina, Anjozorobe, Manjakandriana, Ivato, Ambatobe, Ampefiloha, Analakely, Anosy, Ankorondrano, et tous les autres quartiers.</p>
        
        <h2>Conclusion</h2>
        <p>Pour le nettoyage de votre costume à Antananarivo, SV Pressing Madagascar est le meilleur choix. Moins cher que Sasa Vanda, plus professionnel que Clean Press, plus rapide que Speed Clean, nous offrons un service de qualité supérieure avec collecte et livraison gratuites.</p>
        
        <p><strong>Contactez-nous dès maintenant :</strong></p>
        <p>📱 Téléphone/WhatsApp : <a href="tel:+261349948301">+261 34 99 483 01</a></p>
        <p>✉️ Email : <a href="mailto:contact.sasavanda@gmail.com">contact.sasavanda@gmail.com</a></p>
        <p>🌐 Site web : <a href="https://svpressing.com">https://svpressing.com</a></p>
      `
    },
    'blanchisserie-couette-guide': {
      title: 'Guide Complet de la Blanchisserie Couette à Madagascar - SV Pressing',
      description: 'Guide complet pour le nettoyage des couettes à Antananarivo. SV Pressing, meilleur que Sasa Vanda et Clean Press.',
      content: `
        <h2>Introduction</h2>
        <p>La blanchisserie de couettes est un service essentiel à Antananarivo. SV Pressing Madagascar est le leader de la blanchisserie de couettes, offrant un service supérieur à Sasa Vanda et Clean Press.</p>
        
        <h2>Pourquoi SV Pressing pour vos Couettes ?</h2>
        <ul>
          <li><strong>Prix compétitifs :</strong> À partir de 8 000 Ar/couette</li>
          <li><strong>Collecte et livraison GRATUITES</strong></li>
          <li><strong>Service 7j/7</strong></li>
          <li><strong>Produits hypoallergéniques</strong></li>
          <li><strong>Séchage professionnel</strong></li>
        </ul>
        
        <h2>SV Pressing vs Sasa Vanda pour Couette</h2>
        <table>
          <tr><th>Critère</th><th>SV Pressing</th><th>Sasa Vanda</th></tr>
          <tr><td>Prix couette</td><td>8 000 Ar</td><td>12 000 Ar</td></tr>
          <tr><td>Collecte gratuite</td><td>✅ Oui</td><td>❌ Non</td></tr>
          <tr><td>Service 7j/7</td><td>✅ Oui</td><td>❌ Non</td></tr>
        </table>
        
        <h2>Nos Tarifs Blanchisserie</h2>
        <ul>
          <li><strong>Couette simple :</strong> 8 000 Ar</li>
          <li><strong>Couette double :</strong> 12 000 Ar</li>
          <li><strong>Édredon :</strong> 10 000 Ar</li>
          <li><strong>Plaid :</strong> 6 000 Ar</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Pour la blanchisserie de vos couettes à Antananarivo, SV Pressing Madagascar est le meilleur choix. Contactez-nous dès maintenant !</p>
      `
    },
    'nettoyage-soie-laine': {
      title: 'Nettoyage Soie et Laine - Guide Expert Madagascar - SV Pressing',
      description: 'Guide expert pour le nettoyage de la soie et de la laine à Antananarivo. SV Pressing, leader du nettoyage délicat.',
      content: `
        <h2>Introduction</h2>
        <p>Le nettoyage de la soie et de la laine nécessite une expertise particulière. SV Pressing Madagascar est le leader du nettoyage délicat à Antananarivo.</p>
        
        <h2>Pourquoi SV Pressing pour Soie et Laine ?</h2>
        <ul>
          <li>Experts en textiles délicats</li>
          <li>Produits spécifiques pour soie et laine</li>
          <li>Collecte et livraison gratuites</li>
          <li>Service 7j/7</li>
        </ul>
        
        <h2>Nos Services pour Textiles Délicats</h2>
        <ul>
          <li><strong>Nettoyage soie :</strong> À partir de 10 000 Ar/pièce</li>
          <li><strong>Nettoyage laine :</strong> À partir de 8 000 Ar/pièce</li>
          <li><strong>Nettoyage cachemire :</strong> À partir de 12 000 Ar/pièce</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Pour le nettoyage de vos vêtements en soie et laine à Antananarivo, SV Pressing est votre meilleur choix.</p>
      `
    },
    'pressing-entreprise-b2b': {
      title: 'Pressing B2B pour Entreprise - Guide Complet Madagascar - SV Pressing',
      description: 'Guide du pressing B2B pour hôtels, restaurants et entreprises à Antananarivo. SV Pressing, meilleur que Sasa Vanda.',
      content: `
        <h2>Introduction</h2>
        <p>Le pressing B2B est un service essentiel pour les hôtels, restaurants et entreprises à Antananarivo. SV Pressing Madagascar est le leader du pressing B2B.</p>
        
        <h2>Pourquoi SV Pressing pour votre Entreprise ?</h2>
        <ul>
          <li>Devis personnalisés</li>
          <li>Collecte et livraison GRATUITES</li>
          <li>Service 7j/7</li>
          <li>Qualité professionnelle</li>
        </ul>
        
        <h2>Nos Services B2B</h2>
        <ul>
          <li><strong>Hôtels :</strong> Nettoyage linge de maison, serviettes, nappes</li>
          <li><strong>Restaurants :</strong> Nappes, serviettes, uniformes</li>
          <li><strong>Boutiques :</strong> Vêtements professionnels</li>
          <li><strong>Bureaux :</strong> Uniformes, textiles d'entreprise</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Pour votre pressing B2B à Antananarivo, SV Pressing Madagascar est le meilleur choix. Contactez-nous pour un devis personnalisé !</p>
      `
    }
  };

  const article = articles[articleId] || articles['comment-nettoyer-costume'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>{article.title} | SV Pressing Madagascar</title>
        <meta name="description" content={article.description} />
        <link rel="canonical" href={`https://svpressing.com/blog/${articleId}`} />
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back to blog */}
        <Link href="/blog">
          <div className="inline-flex items-center text-[#0B676E] hover:underline mb-6 cursor-pointer">
            ← Retour au blog
          </div>
        </Link>

        {/* Article */}
        <article className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0B676E] mb-6">
            {article.title}
          </h1>
          
          <div 
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Call to Action */}
          <div className="mt-12 p-6 bg-[#D0EBF4] rounded-xl">
            <h3 className="text-xl font-bold text-[#0B676E] mb-4">
              Prêt à essayer SV Pressing Madagascar ?
            </h3>
            <p className="text-gray-700 mb-4">
              Contactez-nous dès maintenant pour un devis gratuit ou un abonnement pressing !
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:+261349948301"
                className="px-6 py-3 bg-[#0B676E] text-white rounded-xl hover:bg-[#0a5d64] transition-colors"
              >
                📞 Appeler maintenant
              </a>
              <a 
                href="/contact"
                className="px-6 py-3 bg-[#EF761B] text-white rounded-xl hover:bg-[#d66817] transition-colors"
              >
                ✉️ Demander un devis
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default ArticlePage;