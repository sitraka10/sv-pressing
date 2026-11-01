// client/src/pages/blog-post.tsx
// ====================================================================================================
// SV PRESSING MADAGASCAR - BLOG POST PAGE
// NEOMORPHIC STYLE - PROFESSIONAL DESIGN - NO EMOJIS
// ====================================================================================================

import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { blogPosts, getBlogPost, getRelatedPosts, getRecentPosts, getCategories, getTags, BlogPost } from './blog-data';

const BlogPostPage: React.FC = () => {
  const [location] = useLocation();
  var slug = location.split('/').pop() || '';
  var [post, setPost] = useState<BlogPost | null>(null);
  var [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  var [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  var [categories, setCategories] = useState<string[]>([]);
  var [tags, setTags] = useState<string[]>([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    var foundPost = getBlogPost(slug);
    if (foundPost) {
      setPost(foundPost);
      setRelatedPosts(getRelatedPosts(foundPost));
      setRecentPosts(getRecentPosts(5));
      setCategories(getCategories());
      setTags(getTags());
    }
    setLoading(false);
  }, [slug]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
        <div className="neumorphic-loader p-8 rounded-3xl">
          <div className="w-16 h-16 border-4 border-[#0B676E] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#0B676E] font-medium text-center">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
        <div className="neumorphic-card p-12 rounded-3xl text-center max-w-md">
          <div className="text-6xl mb-4 text-gray-400">
            <i className="fa-regular fa-file"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#0B676E] mb-4">Article non trouvé</h1>
          <p className="text-gray-600 mb-8">L'article que vous recherchez n'existe pas ou a été déplacé.</p>
          <Link href="/blog">
            <div className="inline-block px-6 py-3 bg-[#0B676E] text-white rounded-xl neumorphic-btn hover:bg-[#0a5d64] transition-colors cursor-pointer">
              Retour au blog
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const currentPost = post;

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      {/* ============================================================
      HELMET FOR SEO
      ============================================================ */}
      <Helmet>
        <title>{post.title} | SV Pressing Madagascar</title>
        <meta name="description" content={post.excerpt + ' - Découvrez les conseils de SV Pressing Madagascar pour entretenir vos vêtements à Antananarivo.'} />
        <meta name="keywords" content={post.tags.join(', ') + ', pressing Antananarivo, blanchisserie Madagascar, nettoyage à sec'} />
        <link rel="canonical" href={'https://svpressing.com/blog/' + post.slug} />
        <meta property="og:title" content={post.title + ' | SV Pressing Madagascar'} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={'https://svpressing.com/blog/' + post.slug} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={'https://svpressing.com' + post.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={'https://svpressing.com' + post.image} />
        <meta name="author" content={post.author} />
        <meta name="article:published_time" content={post.date} />
        <meta name="article:author" content={post.author} />
        <meta name="article:section" content={post.category} />
        {post.tags.map(function(tag) {
          return (
            <meta key={tag} name="article:tag" content={tag} />
          );
        })}
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": "https://svpressing.com" + post.image,
            "datePublished": post.date,
            "dateModified": post.date,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "SV Pressing Madagascar",
              "logo": {
                "@type": "ImageObject",
                "url": "https://svpressing.com/logo-svpressing.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://svpressing.com/blog/" + post.slug
            },
            "keywords": post.tags.join(', '),
            "articleSection": post.category,
            "inLanguage": "fr"
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
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": "https://svpressing.com/blog/" + post.slug
              }
            ]
          })}
        </script>
      </Helmet>

      {/* ============================================================
      HEADER - NEOMORPHIC
      ============================================================ */}
      <header className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="neumorphic-card p-8 rounded-2xl">
            <Link href="/blog">
              <div className="inline-flex items-center text-[#0B676E] hover:text-[#0a5d64] transition-colors cursor-pointer mb-4 font-medium">
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Retour au blog
              </div>
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
              <span>{formatDate(post.date)}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Par {post.author}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="px-3 py-1 bg-[#d5dbe3] text-[#0B676E] rounded-full text-xs font-semibold">
                {post.category}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span><i className="fa-regular fa-clock mr-1"></i>{post.readingTime} min de lecture</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
      MAIN CONTENT
      ============================================================ */}
      <main className="container mx-auto px-4 max-w-6xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ============================================================
          MAIN ARTICLE
          ============================================================ */}
          <div className="lg:col-span-3">
            <div className="neumorphic-card rounded-2xl overflow-hidden">
              {/* Article image */}
              <div className={'relative h-64 md:h-96 bg-gradient-to-r ' + getGradientForCategory(post.category) + ' flex items-center justify-center text-white text-8xl'}>
                <i className={getCategoryIcon(post.category)}></i>
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-2 bg-white/30 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <span className="px-4 py-2 bg-black/30 backdrop-blur-sm text-white text-sm rounded-full">
                    <i className="fa-regular fa-clock mr-1"></i>{post.readingTime} min de lecture
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 md:p-8 bg-[#e0e5ec]">
                <div 
                  className="prose prose-lg max-w-none text-gray-700 prose-headings:text-[#0B676E] prose-a:text-[#EF761B] prose-strong:text-[#0B676E] prose-table:border prose-table:border-gray-200 prose-td:p-3 prose-th:p-3 prose-th:bg-[#d5dbe3] prose-th:text-[#0B676E]"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Tags :</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(function(tag) {
                      return (
                        <Link key={tag} href={'/blog/tag/' + tag.toLowerCase().replace(/\s+/g, '-')}>
                          <div className="px-3 py-1 bg-[#e0e5ec] text-[#0B676E] text-sm rounded-full neumorphic-pill hover:text-white hover:bg-[#0B676E] transition-colors cursor-pointer">
                            #{tag}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Share buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Partager cet article :</h3>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={'https://www.facebook.com/sharer/sharer.php?u=https://svpressing.com/blog/' + post.slug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1666D6] transition-colors text-sm"
                    >
                      <i className="fa-brands fa-facebook mr-2"></i>Facebook
                    </a>
                    <a 
                      href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(post.title) + '&url=https://svpressing.com/blog/' + post.slug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A8CD8] transition-colors text-sm"
                    >
                      <i className="fa-brands fa-twitter mr-2"></i>Twitter
                    </a>
                    <a 
                      href={'https://www.linkedin.com/sharing/share-offsite/?url=https://svpressing.com/blog/' + post.slug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#0958A8] transition-colors text-sm"
                    >
                      <i className="fa-brands fa-linkedin mr-2"></i>LinkedIn
                    </a>
                    <a 
                      href={'https://wa.me/?text=' + encodeURIComponent(post.title + ' - https://svpressing.com/blog/' + post.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20B85A] transition-colors text-sm"
                    >
                      <i className="fa-brands fa-whatsapp mr-2"></i>WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-[#0B676E] mb-4">Articles similaires</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.slice(0, 3).map(function(related) {
                    var iconClass = getCategoryIcon(related.category);
                    var gradientClass = getGradientForCategory(related.category);
                    
                    return (
                      <Link key={related.id} href={'/blog/' + related.slug}>
                        <div className="neumorphic-card rounded-xl overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all duration-300">
                          <div className={'h-24 bg-gradient-to-r ' + gradientClass + ' flex items-center justify-center text-white text-3xl'}>
                            <i className={iconClass}></i>
                          </div>
                          <div className="p-4 bg-[#e0e5ec]">
                            <h3 className="font-semibold text-gray-800 group-hover:text-[#0B676E] transition-colors line-clamp-2 text-sm">
                              {related.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(related.date)}</p>
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
          SIDEBAR - NEOMORPHIC
          ============================================================ */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Categories */}
            <div className="neumorphic-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-folder text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Catégories</h3>
              </div>
              <ul className="space-y-2">
                {categories.map(function(category) {
                  var iconClass = getCategoryIcon(category);
                  return (
                    <li key={category}>
                      <Link href={'/blog/categorie/' + category.toLowerCase().replace(/\s+/g, '-')}>
                        <div className="text-gray-600 hover:text-[#0B676E] transition-colors cursor-pointer text-sm flex items-center gap-2 p-2 rounded-lg hover:bg-[#e8edf5]">
                          <i className={iconClass}></i>
                          {category}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="neumorphic-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-tags text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Tags populaires</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 15).map(function(tag) {
                  return (
                    <Link key={tag} href={'/blog/tag/' + tag.toLowerCase().replace(/\s+/g, '-')}>
                      <div className="px-3 py-1 bg-[#e0e5ec] text-gray-600 text-xs rounded-full neumorphic-pill hover:text-[#0B676E] transition-colors cursor-pointer">
                        #{tag}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Articles */}
            <div className="neumorphic-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-regular fa-clock text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">Articles récents</h3>
              </div>
              <ul className="space-y-3">
                {recentPosts.filter(function(p) { return p.id !== currentPost.id; }).slice(0, 5).map(function(recent) {
                  var iconClass = getCategoryIcon(recent.category);
                  return (
                    <li key={recent.id}>
                      <Link href={'/blog/' + recent.slug}>
                        <div className="group cursor-pointer p-2 rounded-lg hover:bg-[#e8edf5] transition-all">
                          <div className="flex items-start gap-2">
                            <i className={iconClass + ' text-xl text-[#0B676E]'}></i>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-800 group-hover:text-[#0B676E] transition-colors line-clamp-2">
                                {recent.title}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(recent.date)}</p>
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
            <div className="neumorphic-card p-5 rounded-2xl bg-gradient-to-r from-[#0B676E] to-[#389FA4] text-white">
              <div className="text-4xl mb-3">
                <i className="fa-regular fa-star"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">Besoin d'un pressing professionnel ?</h3>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">
                SV Pressing Madagascar - Collecte et livraison gratuites à Antananarivo
              </p>
              <div className="space-y-2">
                <a 
                  href="/contact"
                  className="block w-full text-center px-4 py-2 bg-white text-[#0B676E] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                >
                  Demander un devis gratuit
                </a>
                <a 
                  href="tel:+261349948301"
                  className="block w-full text-center px-4 py-2 bg-[#EF761B] text-white rounded-lg font-semibold hover:bg-[#d66817] transition-colors text-sm"
                >
                  Appeler maintenant
                </a>
              </div>
            </div>

            {/* SV Pressing Information */}
            <div className="neumorphic-card p-5 rounded-2xl border-l-4 border-[#0B676E]">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-regular fa-circle-check text-xl text-[#0B676E]"></i>
                <h3 className="text-lg font-bold text-[#0B676E]">SV Pressing Madagascar</h3>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Pressing professionnel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Blanchisserie de qualité</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Nettoyage à sec écologique</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Collecte et livraison gratuites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0B676E] font-bold">✓</span>
                  <span>Service 7j/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================
      FOOTER - NEOMORPHIC
      ============================================================ */}
      <footer className="bg-[#0B676E] text-white py-10 mt-8">
        <div className="container mx-auto px-4 max-w-6xl">
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
                <li><Link href="/blanchisserie"><div className="hover:text-white transition-colors cursor-pointer">Blanchisserie</div></Link></li>
                <li><Link href="/net-a-sec"><div className="hover:text-white transition-colors cursor-pointer">Net à Sec</div></Link></li>
                <li><Link href="/pressing-costume"><div className="hover:text-white transition-colors cursor-pointer">Pressing Costume</div></Link></li>
                <li><Link href="/pressing-entreprise"><div className="hover:text-white transition-colors cursor-pointer">Pressing Entreprise</div></Link></li>
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

      {/* ============================================================
      NEOMORPHIC STYLES
      ============================================================ */}
      <style>{`
        .neumorphic-card {
          background: #e0e5ec;
          box-shadow: 9px 9px 16px rgb(163, 177, 198), -9px -9px 16px rgb(255, 255, 255);
        }
        
        .neumorphic-card:hover {
          box-shadow: 6px 6px 12px rgb(163, 177, 198), -6px -6px 12px rgb(255, 255, 255);
        }
        
        .neumorphic-pill {
          background: #e0e5ec;
          box-shadow: 3px 3px 6px rgb(163, 177, 198), -3px -3px 6px rgb(255, 255, 255);
        }
        
        .neumorphic-pill:hover {
          box-shadow: 2px 2px 4px rgb(163, 177, 198), -2px -2px 4px rgb(255, 255, 255);
        }
        
        .neumorphic-loader {
          background: #e0e5ec;
          box-shadow: 9px 9px 16px rgb(163, 177, 198), -9px -9px 16px rgb(255, 255, 255);
        }
      `}</style>
    </div>
  );
};

export default BlogPostPage;
