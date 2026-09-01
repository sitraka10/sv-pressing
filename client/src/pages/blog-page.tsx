// client/src/pages/blog-page.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { blogPosts, getCategories, getTags, getRecentPosts, getPostsByCategory, BlogPost } from './blog/blog-data';

const BlogPage: React.FC = () => {
  const [location] = useLocation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function() {
    var allPosts = blogPosts;
    setPosts(allPosts);
    setCategories(getCategories());
    setTags(getTags());
    setRecentPosts(getRecentPosts(5));
    setFeaturedPosts(getFeaturedPosts(allPosts));
    setIsLoading(false);
  }, []);

  useEffect(function() {
    var filtered = blogPosts;
    
    if (selectedCategory) {
      filtered = getPostsByCategory(selectedCategory);
    }
    
    if (searchTerm && searchTerm.length > 0) {
      var searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(function(p) {
        return p.title.toLowerCase().indexOf(searchLower) !== -1 ||
               p.excerpt.toLowerCase().indexOf(searchLower) !== -1 ||
               p.tags.some(function(tag) { return tag.toLowerCase().indexOf(searchLower) !== -1; });
      });
    }
    
    setPosts(filtered);
  }, [selectedCategory, searchTerm]);

  function handleCategoryClick(category: string): void {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    setSearchTerm(e.target.value);
  }

  function getFeaturedPosts(allPosts: BlogPost[]): BlogPost[] {
    return allPosts.filter(function(p) {
      return p.id === '1' || p.id === '2' || p.id === '3';
    });
  }

  function formatDate(dateString: string): string {
    var date = new Date(dateString);
    var options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  function getEmojiForCategory(category: string): string {
    var emojis: { [key: string]: string } = {
      'Pressing Costume': '👔',
      'Blanchisserie': '🧺',
      'Nettoyage Delicat': '✨',
      'Pressing Entreprise': '🏢',
      'Ecologie': '🌿',
      'Robe de Mariee': '👰',
      'Nettoyage Tapis': '🧹',
      'Tarifs': '💰',
      'Blanchisserie Industrielle': '🏭',
      'Conseils': '💡'
    };
    return emojis[category] || '📄';
  }

  function getGradientForCategory(category: string): string {
    var gradients: { [key: string]: string } = {
      'Pressing Costume': 'from-[#0B676E] to-[#389FA4]',
      'Blanchisserie': 'from-[#389FA4] to-[#5FB8C4]',
      'Nettoyage Delicat': 'from-[#EF761B] to-[#F5A623]',
      'Pressing Entreprise': 'from-[#0B676E] to-[#1A8A92]',
      'Ecologie': 'from-[#2E7D32] to-[#43A047]',
      'Robe de Mariee': 'from-[#E91E63] to-[#F06292]',
      'Nettoyage Tapis': 'from-[#6D4C41] to-[#8D6E63]',
      'Tarifs': 'from-[#F9A825] to-[#FBC02D]',
      'Blanchisserie Industrielle': 'from-[#37474F] to-[#546E7A]',
      'Conseils': 'from-[#1565C0] to-[#1E88E5]'
    };
    return gradients[category] || 'from-[#0B676E] to-[#389FA4]';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl p-8">
          <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================================
      HELMET POUR SEO
      ============================================================ */}
      <Helmet>
        <title>Blog - Conseils Pressing et Blanchisserie | SV Pressing Madagascar</title>
        <meta name="description" content="Blog SV Pressing Madagascar - Conseils pour entretenir vos vêtements, guides pressing professionnel, blanchisserie et nettoyage à sec à Antananarivo." />
        <meta name="keywords" content="blog pressing, conseils blanchisserie, entretien vetements, pressing Antananarivo, pressing Madagascar, nettoyage à sec" />
        <link rel="canonical" href="https://svpressing.com/blog" />
        <meta property="og:title" content="Blog - Conseils Pressing et Blanchisserie | SV Pressing Madagascar" />
        <meta property="og:description" content="Blog SV Pressing Madagascar - Conseils pour entretenir vos vêtements et votre linge de maison." />
        <meta property="og:url" content="https://svpressing.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://svpressing.com/blog-banner.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog - Conseils Pressing et Blanchisserie | SV Pressing Madagascar" />
        <meta name="twitter:description" content="Blog SV Pressing Madagascar - Conseils pour entretenir vos vêtements." />
        <meta name="twitter:image" content="https://svpressing.com/blog-banner.jpg" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Blog SV Pressing Madagascar",
            "description": "Conseils et guides sur le pressing, la blanchisserie et l'entretien des vêtements à Madagascar",
            "url": "https://svpressing.com/blog",
            "publisher": {
              "@type": "Organization",
              "name": "SV Pressing Madagascar",
              "logo": {
                "@type": "ImageObject",
                "url": "https://svpressing.com/logo-svpressing.png"
              }
            },
            "blogPost": blogPosts.map(function(post) {
              return {
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "url": "https://svpressing.com/blog/" + post.slug,
                "datePublished": post.date,
                "author": {
                  "@type": "Person",
                  "name": post.author
                }
              };
            })
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Accueil",
                "item": "https://svpressing.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://svpressing.com/blog"
              }
            ]
          })}
        </script>
      </Helmet>

      {/* ============================================================
      HEADER HERO
      ============================================================ */}
      <header className="relative bg-gradient-to-r from-[#0B676E] to-[#389FA4] text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 max-w-6xl text-center relative z-10">
          <div className="flex justify-center mb-6">
            <span className="text-6xl">📚</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Blog SV Pressing Madagascar
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Conseils, guides et astuces pour entretenir vos vêtements, costumes, soie, laine et linge de maison à Antananarivo
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              👔 Pressing Costume
            </span>
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              🧺 Blanchisserie
            </span>
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              ✨ Nettoyage à sec
            </span>
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              💡 Conseils
            </span>
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              🏢 Pressing Entreprise
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================
      MAIN CONTENT
      ============================================================ */}
      <main className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ============================================================
          COLONNE PRINCIPALE - ARTICLES
          ============================================================ */}
          <div className="lg:col-span-3">
            
            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un article sur le pressing, la blanchisserie ou l'entretien..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-4 pl-14 bg-white rounded-2xl shadow-md border-2 border-transparent focus:border-[#0B676E] focus:ring-4 focus:ring-[#0B676E]/20 outline-none transition-all text-gray-700"
                />
                <svg className="absolute left-5 top-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && searchTerm.length > 0 && (
                  <button
                    onClick={function() { setSearchTerm(''); }}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Résultats et filtres */}
            <div className="flex flex-wrap justify-between items-center mb-6">
              <p className="text-gray-600 text-sm">
                {posts.length} article{posts.length > 1 ? 's' : ''} trouvé{posts.length > 1 ? 's' : ''}
                {selectedCategory && ' dans la catégorie "' + selectedCategory + '"'}
                {searchTerm && searchTerm.length > 0 && ' pour "' + searchTerm + '"'}
              </p>
              {selectedCategory && (
                <button
                  onClick={function() { setSelectedCategory(null); }}
                  className="text-[#0B676E] hover:underline text-sm font-medium"
                >
                  ✕ Voir tous les articles
                </button>
              )}
            </div>

            {/* Grille des articles */}
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map(function(post) {
                  var gradientClass = getGradientForCategory(post.category);
                  var emoji = getEmojiForCategory(post.category);
                  var formattedDate = formatDate(post.date);
                  
                  return (
                    <Link key={post.id} href={'/blog/' + post.slug}>
                      <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:-translate-y-1">
                        <div className={'relative h-48 bg-gradient-to-r ' + gradientClass + ' flex items-center justify-center text-white text-6xl'}>
                          <span>{emoji}</span>
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                              {post.category}
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <span className="px-3 py-1 bg-black/30 backdrop-blur-sm text-white text-xs rounded-full">
                              {post.readingTime} min de lecture
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <span>{formattedDate}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>Par {post.author}</span>
                          </div>
                          <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#0B676E] transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h2>
                          <p className="text-gray-600 text-sm line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-4">
                            {post.tags.slice(0, 3).map(function(tag) {
                              return (
                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  #{tag}
                                </span>
                              );
                            })}
                            {post.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[#0B676E] font-medium text-sm group-hover:underline">
                              Lire l'article →
                            </span>
                            <span className="text-xs text-gray-400">
                              {post.readingTime} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Aucun article trouvé</h3>
                <p className="text-gray-500 mb-6">
                  Aucun article ne correspond à votre recherche sur le pressing ou la blanchisserie.
                </p>
                <button
                  onClick={function() { setSearchTerm(''); setSelectedCategory(null); }}
                  className="px-6 py-3 bg-[#0B676E] text-white rounded-xl hover:bg-[#0a5d64] transition-colors font-medium"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}

            {/* Articles à la une */}
            {!selectedCategory && !searchTerm && featuredPosts.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-[#0B676E] mb-6 flex items-center gap-2">
                  <span>⭐</span> Articles à la une
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredPosts.map(function(post) {
                    var gradientClass = getGradientForCategory(post.category);
                    var emoji = getEmojiForCategory(post.category);
                    
                    return (
                      <Link key={post.id} href={'/blog/' + post.slug}>
                        <div className={'group bg-gradient-to-r ' + gradientClass + ' rounded-2xl shadow-md overflow-hidden cursor-pointer p-6 text-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02]'}>
                          <div className="text-4xl mb-3">{emoji}</div>
                          <h3 className="font-bold text-lg group-hover:underline line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-white/80 mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-white/70 text-xs">
                            <span>{formatDate(post.date)}</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                            <span>{post.readingTime} min</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
          SIDEBAR
          ============================================================ */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Catégories */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#0B676E] mb-4 flex items-center gap-2">
                <span>📂</span> Catégories
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={function() { setSelectedCategory(null); }}
                    className={'w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium flex justify-between items-center ' + (
                      !selectedCategory
                        ? 'bg-[#0B676E] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <span>Tous les articles</span>
                    <span className={'text-xs ' + (!selectedCategory ? 'text-white/70' : 'text-gray-400')}>
                      ({blogPosts.length})
                    </span>
                  </button>
                </li>
                {categories.map(function(category) {
                  var count = blogPosts.filter(function(p) { return p.category === category; }).length;
                  var emoji = getEmojiForCategory(category);
                  var isSelected = selectedCategory === category;
                  
                  return (
                    <li key={category}>
                      <button
                        onClick={function() { handleCategoryClick(category); }}
                        className={'w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm flex justify-between items-center ' + (
                          isSelected
                            ? 'bg-[#0B676E] text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <span>
                          <span className="mr-2">{emoji}</span>
                          {category}
                        </span>
                        <span className={'text-xs ' + (isSelected ? 'text-white/70' : 'text-gray-400')}>
                          ({count})
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Tags populaires */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#0B676E] mb-4 flex items-center gap-2">
                <span>🏷️</span> Tags populaires
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map(function(tag) {
                  return (
                    <button
                      key={tag}
                      onClick={function() { setSearchTerm(tag); }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-[#0B676E] hover:text-white transition-all hover:scale-105"
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Articles récents */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#0B676E] mb-4 flex items-center gap-2">
                <span>🕐</span> Articles récents
              </h3>
              <ul className="space-y-3">
                {recentPosts.map(function(post) {
                  var emoji = getEmojiForCategory(post.category);
                  
                  return (
                    <li key={post.id}>
                      <Link href={'/blog/' + post.slug}>
                        <div className="group cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-all">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-800 group-hover:text-[#0B676E] transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(post.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-[#0B676E] to-[#389FA4] rounded-2xl shadow-md p-6 text-white">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-xl font-bold mb-2">Besoin d'un pressing de confiance ?</h3>
              <p className="text-sm text-white/80 mb-4">
                SV Pressing Madagascar - Collecte et livraison gratuites à Antananarivo
              </p>
              <div className="space-y-2">
                <a
                  href="/contact"
                  className="block w-full text-center px-4 py-3 bg-white text-[#0B676E] rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                  📩 Demander un devis gratuit
                </a>
                <a
                  href="tel:+261349948301"
                  className="block w-full text-center px-4 py-3 bg-[#EF761B] text-white rounded-xl font-semibold hover:bg-[#d66817] transition-all"
                >
                  📞 Appeler maintenant
                </a>
              </div>
            </div>

            {/* Pourquoi SV Pressing */}
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-[#0B676E]">
              <h3 className="text-lg font-bold text-[#0B676E] mb-3 flex items-center gap-2">
                <span>🌟</span> Pourquoi SV Pressing ?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Service professionnel et fiable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Collecte et livraison gratuites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Produits écologiques et hypoallergéniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Service 7j/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Plus de 5000 clients satisfaits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E]">✓</span>
                  <span>Experts en textiles délicats</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================
        SECTION SEO
        ============================================================ */}
        <div className="mt-12 bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#0B676E] mb-4">
            Pourquoi Choisir SV Pressing Madagascar ?
          </h2>
          <div className="prose max-w-none text-gray-700">
            <p>
              SV Pressing Madagascar est le service de pressing professionnel de référence à Antananarivo.
              Nous proposons des prestations de qualité supérieure pour tous types de vêtements et textiles,
              avec une attention particulière pour les matières délicates comme la soie, la laine et le cachemire.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Service complet :</strong> Pressing, blanchisserie, nettoyage à sec, repassage professionnel
              </li>
              <li>
                <strong>Qualité professionnelle :</strong> Équipe expérimentée et équipements modernes
              </li>
              <li>
                <strong>Produits écologiques :</strong> Respectueux de l'environnement et des peaux sensibles
              </li>
              <li>
                <strong>Service 7j/7 :</strong> Disponible pour vous servir toute la semaine
              </li>
              <li>
                <strong>Livraison express :</strong> Retour de vos vêtements en 24h
              </li>
              <li>
                <strong>Collecte et livraison gratuites :</strong> Dans toute l'agglomération d'Antananarivo
              </li>
            </ul>
            <p className="mt-4">
              Que vous ayez besoin d'un nettoyage de costume, d'une blanchisserie de couette,
              d'un nettoyage à sec de soie ou d'un pressing pour votre entreprise,
              SV Pressing Madagascar est votre partenaire de confiance à Antananarivo.
              Faites confiance à notre expertise pour prendre soin de vos textiles les plus précieux.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-[#D0EBF4] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#0B676E] mb-4">
            Questions Fréquentes sur le Pressing à Antananarivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <span>❓</span> Comment fonctionne le service de pressing SV Pressing ?
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                SV Pressing propose un service simple et efficace : choix du service, collecte gratuite à domicile,
                nettoyage professionnel par nos experts, livraison express 24h.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <span>❓</span> Quels types de textiles pouvez-vous nettoyer ?
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Nous nettoyons tous types de textiles : costumes, robes de soirée, soie, laine, cachemire,
                couettes, rideaux, tapis, linge de maison et bien plus encore.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <span>❓</span> Quelles sont les zones de livraison à Antananarivo ?
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Nous livrons gratuitement dans toute l'agglomération d'Antananarivo :
                Analamanga, Ambohidratrimo, Andramasina, Anjozorobe, Ivato et tous les quartiers.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <span>❓</span> Quels produits utilisez-vous pour le nettoyage ?
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Nous utilisons des produits écologiques, hypoallergéniques et sans produits chimiques agressifs,
                respectueux de l'environnement et de votre peau.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================
      FOOTER
      ============================================================ */}
      <footer className="bg-[#0B676E] text-white py-10 mt-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-3">SV Pressing Madagascar</h4>
              <p className="text-sm text-white/70">
                Service de pressing, blanchisserie et nettoyage à sec à Antananarivo.
                Collecte et livraison gratuites. Service 7j/7.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3">Nos Services</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li><Link href="/blanchisserie"><div className="hover:text-white transition-colors cursor-pointer">Blanchisserie</div></Link></li>
                <li><Link href="/net-a-sec"><div className="hover:text-white transition-colors cursor-pointer">Net à Sec</div></Link></li>
                <li><Link href="/pressing-costume"><div className="hover:text-white transition-colors cursor-pointer">Pressing Costume</div></Link></li>
                <li><Link href="/pressing-entreprise"><div className="hover:text-white transition-colors cursor-pointer">Pressing Entreprise</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3">Contact</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>+261 34 99 483 01</li>
                <li>contact.sasavanda@gmail.com</li>
                <li>Antananarivo, Madagascar</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20 text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} SV Pressing Madagascar. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;