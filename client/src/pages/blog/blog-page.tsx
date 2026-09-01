// client/src/pages/blog/blog-page.tsx
// ====================================================================================================
// SV PRESSING MADAGASCAR - BLOG PAGE
// NEOMORPHIC STYLE - PROFESSIONAL DESIGN - NO EMOJIS
// ====================================================================================================

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { blogPosts, getCategories, getTags, getRecentPosts, getPostsByCategory, BlogPost } from './blog-data';

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
    // CORRECTION: utiliser getRecentPosts au lieu de getFeaturedPosts
    setFeaturedPosts(getRecentPosts(3));
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

  function formatDate(dateString: string): string {
    var date = new Date(dateString);
    var options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  function getCategoryIcon(category: string): string {
    var icons: { [key: string]: string } = {
      'Pressing Costume': 'fa-solid fa-user-tie',
      'Blanchisserie': 'fa-solid fa-soap',
      'Nettoyage Delicat': 'fa-solid fa-feather',
      'Pressing Entreprise': 'fa-solid fa-building',
      'Ecologie': 'fa-solid fa-leaf',
      'Robe de Mariee': 'fa-solid fa-gem',
      'Nettoyage Tapis': 'fa-solid fa-rug',
      'Tarifs': 'fa-solid fa-tag',
      'Blanchisserie Industrielle': 'fa-solid fa-factory',
      'Conseils': 'fa-solid fa-lightbulb'
    };
    return icons[category] || 'fa-solid fa-file-lines';
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
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
        <div className="neumorphic-loader p-8 rounded-3xl">
          <div className="w-16 h-16 border-4 border-[#0B676E] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#0B676E] font-medium">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
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

      <header className="relative py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="neumorphic-card p-12 text-center rounded-3xl">
            <div className="inline-block p-6 bg-[#e0e5ec] rounded-2xl neumorphic-inset mb-6">
              <i className="fa-solid fa-newspaper text-5xl text-[#0B676E]"></i>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B676E] mb-4 tracking-tight">
              Blog SV Pressing Madagascar
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Conseils, guides et astuces pour entretenir vos vêtements, costumes, soie, laine et linge de maison à Antananarivo
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="px-5 py-2 bg-[#e0e5ec] text-[#0B676E] rounded-full text-sm font-medium neumorphic-pill">
                Pressing Costume
              </span>
              <span className="px-5 py-2 bg-[#e0e5ec] text-[#0B676E] rounded-full text-sm font-medium neumorphic-pill">
                Blanchisserie
              </span>
              <span className="px-5 py-2 bg-[#e0e5ec] text-[#0B676E] rounded-full text-sm font-medium neumorphic-pill">
                Nettoyage à sec
              </span>
              <span className="px-5 py-2 bg-[#e0e5ec] text-[#0B676E] rounded-full text-sm font-medium neumorphic-pill">
                Conseils
              </span>
              <span className="px-5 py-2 bg-[#e0e5ec] text-[#0B676E] rounded-full text-sm font-medium neumorphic-pill">
                Pressing Entreprise
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-3">
            
            <div className="mb-8">
              <div className="neumorphic-input rounded-2xl p-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un article sur le pressing, la blanchisserie ou l'entretien..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-4 py-4 pl-14 bg-transparent text-gray-700 outline-none rounded-2xl"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute left-5 top-4 text-lg text-gray-400"></i>
                  {searchTerm && searchTerm.length > 0 && (
                    <button
                      onClick={function() { setSearchTerm(''); }}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-6">
              <p className="text-gray-600 text-sm font-medium">
                {posts.length} article{posts.length > 1 ? 's' : ''} trouvé{posts.length > 1 ? 's' : ''}
                {selectedCategory && ' dans la catégorie "' + selectedCategory + '"'}
                {searchTerm && searchTerm.length > 0 && ' pour "' + searchTerm + '"'}
              </p>
              {selectedCategory && (
                <button
                  onClick={function() { setSelectedCategory(null); }}
                  className="text-[#0B676E] hover:underline text-sm font-medium"
                >
                  <i className="fa-solid fa-xmark mr-1"></i> Voir tous les articles
                </button>
              )}
            </div>

            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map(function(post) {
                  var gradientClass = getGradientForCategory(post.category);
                  var iconClass = getCategoryIcon(post.category);
                  var formattedDate = formatDate(post.date);
                  
                  return (
                    <Link key={post.id} href={'/blog/' + post.slug}>
                      <div className="neumorphic-card group rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col transition-all duration-300 hover:-translate-y-1">
                        <div className={'relative h-48 bg-gradient-to-r ' + gradientClass + ' flex items-center justify-center text-white text-6xl'}>
                          <i className={iconClass}></i>
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                              {post.category}
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <span className="px-3 py-1 bg-black/30 backdrop-blur-sm text-white text-xs rounded-full">
                              <i className="fa-regular fa-clock mr-1"></i>{post.readingTime} min
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col bg-[#e0e5ec]">
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <span>{formattedDate}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>Par {post.author}</span>
                          </div>
                          <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#0B676E] transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h2>
                          <p className="text-gray-600 text-sm line-clamp-3 flex-1 leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-4">
                            {post.tags.slice(0, 3).map(function(tag) {
                              return (
                                <span key={tag} className="px-2 py-0.5 bg-[#e0e5ec] text-gray-600 text-xs rounded-full neumorphic-pill">
                                  #{tag}
                                </span>
                              );
                            })}
                            {post.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-[#e0e5ec] text-gray-600 text-xs rounded-full neumorphic-pill">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-[#0B676E] font-medium text-sm group-hover:underline">
                              Lire l'article
                            </span>
                            <span className="text-xs text-gray-400">
                              <i className="fa-regular fa-clock mr-1"></i>{post.readingTime} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="neumorphic-card p-12 text-center rounded-2xl">
                <div className="text-6xl mb-4 text-gray-400">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Aucun article trouvé</h3>
                <p className="text-gray-500 mb-6">
                  Aucun article ne correspond à votre recherche sur le pressing ou la blanchisserie.
                </p>
                <button
                  onClick={function() { setSearchTerm(''); setSelectedCategory(null); }}
                  className="px-6 py-3 bg-[#0B676E] text-white rounded-xl font-medium neumorphic-btn hover:bg-[#0a5d64] transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}

            {!selectedCategory && !searchTerm && featuredPosts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fa-solid fa-star text-2xl text-[#F9A825]"></i>
                  <h2 className="text-2xl font-bold text-[#0B676E]">Articles récents</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredPosts.map(function(post) {
                    var gradientClass = getGradientForCategory(post.category);
                    var iconClass = getCategoryIcon(post.category);
                    
                    return (
                      <Link key={post.id} href={'/blog/' + post.slug}>
                        <div className={'neumorphic-card group bg-gradient-to-r ' + gradientClass + ' rounded-2xl overflow-hidden cursor-pointer p-6 text-white hover:-translate-y-1 transition-all duration-300'}>
                          <div className="text-5xl mb-3"><i className={iconClass}></i></div>
                          <h3 className="font-bold text-lg group-hover:underline line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-white/80 mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-white/70 text-xs">
                            <span>{formatDate(post.date)}</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                            <span><i className="fa-regular fa-clock mr-1"></i>{post.readingTime} min</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            
            <div className="neumorphic-card p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-folder text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Catégories</h3>
              </div>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={function() { setSelectedCategory(null); }}
                    className={'w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium flex justify-between items-center ' + (
                      !selectedCategory
                        ? 'bg-[#0B676E] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-[#e8edf5]'
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
                  var iconClass = getCategoryIcon(category);
                  var isSelected = selectedCategory === category;
                  
                  return (
                    <li key={category}>
                      <button
                        onClick={function() { handleCategoryClick(category); }}
                        className={'w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm flex justify-between items-center ' + (
                          isSelected
                            ? 'bg-[#0B676E] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-[#e8edf5]'
                        )}
                      >
                        <span>
                          <i className={iconClass + ' mr-2'}></i>
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

            <div className="neumorphic-card p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-tags text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Tags populaires</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map(function(tag) {
                  return (
                    <button
                      key={tag}
                      onClick={function() { setSearchTerm(tag); }}
                      className="px-3 py-1.5 bg-[#e0e5ec] text-gray-600 text-xs rounded-full neumorphic-pill hover:text-[#0B676E] transition-colors"
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-regular fa-clock text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Articles récents</h3>
              </div>
              <ul className="space-y-3">
                {recentPosts.map(function(post) {
                  var iconClass = getCategoryIcon(post.category);
                  
                  return (
                    <li key={post.id}>
                      <Link href={'/blog/' + post.slug}>
                        <div className="group cursor-pointer p-3 rounded-xl hover:bg-[#e8edf5] transition-all">
                          <div className="flex items-start gap-3">
                            <i className={iconClass + ' text-2xl text-[#0B676E]'}></i>
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

            <div className="neumorphic-card p-6 rounded-2xl bg-gradient-to-r from-[#0B676E] to-[#389FA4] text-white">
              <div className="text-5xl mb-3">
                <i className="fa-regular fa-star"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Besoin d'un pressing de confiance ?</h3>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">
                SV Pressing Madagascar - Collecte et livraison gratuites à Antananarivo
              </p>
              <div className="space-y-2">
                <a
                  href="/contact"
                  className="block w-full text-center px-4 py-3 bg-white text-[#0B676E] rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                  Demander un devis gratuit
                </a>
                <a
                  href="tel:+261349948301"
                  className="block w-full text-center px-4 py-3 bg-[#EF761B] text-white rounded-xl font-semibold hover:bg-[#d66817] transition-all"
                >
                  Appeler maintenant
                </a>
              </div>
            </div>

            <div className="neumorphic-card p-6 rounded-2xl border-l-4 border-[#0B676E]">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-regular fa-circle-check text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Pourquoi SV Pressing ?</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Service professionnel et fiable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Collecte et livraison gratuites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Produits écologiques et hypoallergéniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Service 7j/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Plus de 5000 clients satisfaits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Experts en textiles délicats</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 neumorphic-card p-8 rounded-2xl">
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

        <div className="mt-8 neumorphic-card p-8 rounded-2xl bg-[#d5dbe3]">
          <h2 className="text-2xl font-bold text-[#0B676E] mb-4">
            Questions Fréquentes sur le Pressing à Antananarivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neumorphic-card p-5 rounded-xl bg-[#e0e5ec]">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <i className="fa-regular fa-circle-question text-xl"></i>
                Comment fonctionne le service de pressing SV Pressing ?
              </h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                SV Pressing propose un service simple et efficace : choix du service, collecte gratuite à domicile,
                nettoyage professionnel par nos experts, livraison express 24h.
              </p>
            </div>
            <div className="neumorphic-card p-5 rounded-xl bg-[#e0e5ec]">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <i className="fa-regular fa-circle-question text-xl"></i>
                Quels types de textiles pouvez-vous nettoyer ?
              </h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Nous nettoyons tous types de textiles : costumes, robes de soirée, soie, laine, cachemire,
                couettes, rideaux, tapis, linge de maison et bien plus encore.
              </p>
            </div>
            <div className="neumorphic-card p-5 rounded-xl bg-[#e0e5ec]">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <i className="fa-regular fa-circle-question text-xl"></i>
                Quelles sont les zones de livraison à Antananarivo ?
              </h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Nous livrons gratuitement dans toute l'agglomération d'Antananarivo :
                Analamanga, Ambohidratrimo, Andramasina, Anjozorobe, Ivato et tous les quartiers.
              </p>
            </div>
            <div className="neumorphic-card p-5 rounded-xl bg-[#e0e5ec]">
              <h3 className="font-semibold text-[#0B676E] flex items-center gap-2">
                <i className="fa-regular fa-circle-question text-xl"></i>
                Quels produits utilisez-vous pour le nettoyage ?
              </h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Nous utilisons des produits écologiques, hypoallergéniques et sans produits chimiques agressifs,
                respectueux de l'environnement et de votre peau.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0B676E] text-white py-12 mt-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-3">SV Pressing Madagascar</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                Service de pressing, blanchisserie et nettoyage à sec à Antananarivo.
                Collecte et livraison gratuites. Service 7j/7.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3">Nos Services</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/blanchisserie">
                    <div className="hover:text-white transition-colors cursor-pointer">Blanchisserie</div>
                  </Link>
                </li>
                <li>
                  <Link href="/net-a-sec">
                    <div className="hover:text-white transition-colors cursor-pointer">Net à Sec</div>
                  </Link>
                </li>
                <li>
                  <Link href="/pressing-costume">
                    <div className="hover:text-white transition-colors cursor-pointer">Pressing Costume</div>
                  </Link>
                </li>
                <li>
                  <Link href="/pressing-entreprise">
                    <div className="hover:text-white transition-colors cursor-pointer">Pressing Entreprise</div>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><i className="fa-solid fa-phone mr-2"></i>+261 34 99 483 01</li>
                <li><i className="fa-regular fa-envelope mr-2"></i>contact.sasavanda@gmail.com</li>
                <li><i className="fa-solid fa-location-dot mr-2"></i>Antananarivo, Madagascar</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} SV Pressing Madagascar. Tous droits réservés.
          </div>
        </div>
      </footer>

      <style>{`
        .neumorphic-card {
          background: #e0e5ec;
          box-shadow: 9px 9px 16px rgb(163, 177, 198), -9px -9px 16px rgb(255, 255, 255);
        }
        
        .neumorphic-card:hover {
          box-shadow: 6px 6px 12px rgb(163, 177, 198), -6px -6px 12px rgb(255, 255, 255);
        }
        
        .neumorphic-inset {
          box-shadow: inset 6px 6px 12px rgb(163, 177, 198), inset -6px -6px 12px rgb(255, 255, 255);
        }
        
        .neumorphic-input {
          background: #e0e5ec;
          box-shadow: inset 6px 6px 12px rgb(163, 177, 198), inset -6px -6px 12px rgb(255, 255, 255);
        }
        
        .neumorphic-pill {
          background: #e0e5ec;
          box-shadow: 3px 3px 6px rgb(163, 177, 198), -3px -3px 6px rgb(255, 255, 255);
        }
        
        .neumorphic-pill:hover {
          box-shadow: 2px 2px 4px rgb(163, 177, 198), -2px -2px 4px rgb(255, 255, 255);
        }
        
        .neumorphic-btn {
          background: #0B676E;
          box-shadow: 6px 6px 12px rgb(163, 177, 198), -6px -6px 12px rgb(255, 255, 255);
        }
        
        .neumorphic-btn:hover {
          box-shadow: 4px 4px 8px rgb(163, 177, 198), -4px -4px 8px rgb(255, 255, 255);
          transform: translateY(-1px);
        }
        
        .neumorphic-loader {
          background: #e0e5ec;
          box-shadow: 9px 9px 16px rgb(163, 177, 198), -9px -9px 16px rgb(255, 255, 255);
        }
      `}</style>
    </div>
  );
};

export default BlogPage;