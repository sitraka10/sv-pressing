import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEOManager } from "@/lib/seo-manager";
import { useAnalytics } from "@/components/seo/analytics-provider";
import FloatingChat from "@/components/floating-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  Package, Clock, Clipboard ,Truck, Star, Shield, CheckCircle, ArrowRight,
  Mail, Phone, MapPin, User, FileText, Loader2, Sparkles, Share2,
  ArrowUp, Menu, Globe,MessageCircle , Facebook, X, Download, Smartphone, Copy,
  Bookmark, ChevronDown, ShoppingBag, Info, MessageSquare, Send,
  Headphones, Calendar, Award, Home, Layers, Droplet, Scissors, Shirt,
  WashingMachine
} from "lucide-react";

// ============================================================================
// INTERFACES & SCHEMAS
// ============================================================================
interface SubscriptionPlan {
  id: number;
  name: string;
  type: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features: string[];
  isActive: boolean;
}

const customQuoteSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phoneConfirm: z.string().min(10, "Confirmation du numéro requise"),
  address: z.string().min(5, "Adresse invalide"),
  itemsPerWeek: z.number().min(1, "Au moins 1 pièce par semaine"),
  pickupsPerWeek: z.number().min(1, "Au moins 1 ramassage par semaine"),
  specialRequirements: z.string().optional(),
}).refine((data) => data.phone === data.phoneConfirm, {
  message: "Les numéros de téléphone ne correspondent pas",
  path: ["phoneConfirm"],
});

const planSelectionSchema = z.object({
  planId: z.number().min(1, "Veuillez sélectionner un plan"),
  planName: z.string().min(1, "Nom du plan requis"),
  planType: z.string().min(1, "Type de plan requis"),
  planPrice: z.string().min(1, "Prix du plan requis"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phoneConfirm: z.string().min(10, "Confirmation du numéro requise"),
  address: z.string().min(5, "Adresse invalide"),
  specialRequirements: z.string().optional(),
}).refine((data) => data.phone === data.phoneConfirm, {
  message: "Les numéros de téléphone ne correspondent pas",
  path: ["phoneConfirm"],
});

type CustomQuoteForm = z.infer<typeof customQuoteSchema>;
type PlanSelectionForm = z.infer<typeof planSelectionSchema>;

// ============================================================================
// STRUCTURED DATA
// ============================================================================
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Laundry",
  "name": "SV Pressing",
  "description": "Service de pressing professionnel avec collecte et livraison à domicile à Antananarivo, Madagascar. Abonnement mensuel économique pour familles et entreprises.",
  "url": "https://svpressing.com",
  "telephone": "+261349948301",
  "email": "contact.sasavanda@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Antananarivo",
    "addressLocality": "Antananarivo",
    "addressRegion": "Analamanga",
    "addressCountry": "MG"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "-18.8792", "longitude": "47.5079" },
  "openingHours": "Mo-Su 08:00-20:00",
  "priceRange": "À partir de 20,000 Ar",
  "sameAs": ["https://www.facebook.com/sasavandapressing", "https://svpressing.com/"],
  "serviceType": "Pressing professionnel, Lavage, Repassage, Nettoyage à sec",
  "areaServed": "Antananarivo et périphérie",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Formules d'abonnement pressing",
    "itemListElement": [
      { "@type": "Offer", "name": "Formule Familiale", "description": "Abonnement pressing pour familles", "price": "20000", "priceCurrency": "MGA" },
      { "@type": "Offer", "name": "Formule Premium", "description": "Abonnement pressing premium", "price": "35000", "priceCurrency": "MGA" },
      { "@type": "Offer", "name": "Formule Essentielle", "description": "Abonnement pressing économique", "price": "15000", "priceCurrency": "MGA" }
    ]
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function HomePage() {
  // --- STATE ---
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(1);
  const [activeSection, setActiveSection] = useState<'how-it-works' | 'plans' | 'download-app' | 'about' | ''>('');
  const [navElevated, setNavElevated] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const didInitialScrollRef = useRef(false);
  const { trackEvent } = useAnalytics();

  // --- CONSTANTS ---
  const facebookReelUrl = 'https://web.facebook.com/reel/625883270243050';
  const apkUrl: string = (import.meta as any)?.env?.VITE_APK_URL ?? '/assets/apk/sv-pressing.apk';
  const appVersion = (import.meta as any)?.env?.VITE_APP_VERSION ?? '1.2.3';
  const appSizeMb = (import.meta as any)?.env?.VITE_APP_SIZE_MB ?? '8.5';
  const lastUpdate = new Date().toLocaleDateString('fr-FR');
  const appDemoVideo: string = (import.meta as any)?.env?.VITE_APP_DEMO_VIDEO ?? '/assets/video/mobile_scenario.mp4';
  const appDemoPoster: string | undefined = (import.meta as any)?.env?.VITE_APP_DEMO_POSTER ?? '/assets/img/SV.png';
  const whatsappNumber = '+261349948301';
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  // --- HANDLERS ---
  const handlePlanClick = (planName: string) => trackEvent('Plans', 'click', `Plan: ${planName}`);
  const handleQuoteRequest = () => { trackEvent('Conversion', 'quote_request', 'Custom Quote Form Opened'); setIsQuoteDialogOpen(true); };
  const handleAppDownload = () => trackEvent('Downloads', 'click', 'App Download Button');
  const smoothScrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openWhatsApp = () => {
    trackEvent('Social', 'whatsapp_click', 'Hero WhatsApp CTA');
    window.open(whatsappUrl, '_blank');
  };
  const openMessenger = () => {
    toast({ title: "Ouvrir le chat", description: "Redirection vers Facebook Messenger...", duration: 2000 });
    trackEvent('Social', 'messenger_click', 'Open Messenger');
    window.open('https://m.me/sasavandapressing', '_blank');
  };

  // --- QUERIES & MUTATIONS ---
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({ queryKey: ["/api/subscription-plans"] });

  const customQuoteForm = useForm<CustomQuoteForm>({
    resolver: zodResolver(customQuoteSchema),
    defaultValues: { fullName: "", email: "", phone: "", phoneConfirm: "", address: "", itemsPerWeek: 10, pickupsPerWeek: 1, specialRequirements: "" }
  });

  const planSelectionForm = useForm<PlanSelectionForm>({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: { planId: 0, fullName: "", firstName: "", email: "", phone: "", phoneConfirm: "", address: "", specialRequirements: "" }
  });

  const customQuoteMutation = useMutation({
    mutationFn: async (data: CustomQuoteForm) => {
      const res = await apiRequest("POST", "/api/custom-quotes", data);
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Demande envoyée", description: "Votre demande de devis personnalisé a été reçue." });
      trackEvent('Conversion', 'quote_submitted', 'Custom Quote Form Submitted');
      setIsQuoteDialogOpen(false);
      customQuoteForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      trackEvent('Error', 'quote_error', error.message);
    }
  });

  const planSelectionMutation = useMutation({
    mutationFn: async (data: PlanSelectionForm) => {
      if (!selectedPlan) throw new Error("Aucun plan sélectionné");
      const payload = {
        planId: data.planId,
        planName: selectedPlan?.name || data.planName,
        planType: selectedPlan?.type || data.planType,
        planPrice: selectedPlan?.pricePerMonth || data.planPrice,
        fullName: data.fullName,
        firstName: data.firstName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        specialRequirements: data.specialRequirements || "",
        status: "pending"
      };
      const res = await apiRequest("POST", "/api/plan-selection", payload);
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Demande d'abonnement envoyée", description: "Votre demande a été soumise avec succès." });
      trackEvent('Conversion', 'plan_selected', `Plan: ${selectedPlan?.name}`);
      setIsPlanDialogOpen(false);
      planSelectionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan-selections"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      trackEvent('Error', 'plan_error', error.message);
    }
  });

  const handleCustomQuote = (data: CustomQuoteForm) => customQuoteMutation.mutate(data);
  const handlePlanSelection = (data: PlanSelectionForm) => planSelectionMutation.mutate(data);

  const selectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    planSelectionForm.setValue("planId", plan.id);
    planSelectionForm.setValue("planName", plan.name);
    planSelectionForm.setValue("planType", plan.type);
    planSelectionForm.setValue("planPrice", plan.pricePerMonth);
    setIsPlanDialogOpen(true);
    handlePlanClick(plan.name);
    toast({ title: "Plan sélectionné", description: `Vous avez choisi le plan "${plan.name}".`, duration: 3000 });
  };

  const formatPrice = (price: string) => new Intl.NumberFormat('fr-FR').format(parseInt(price)) + ' Ar';
  const visiblePlans = plans.filter(plan => plan.type !== 'custom').sort((a, b) => {
    const order: Record<string, number> = { family: 0, premium: 1, essential: 2 };
    return (order[a.type?.toLowerCase?.() || ''] ?? 99) - (order[b.type?.toLowerCase?.() || ''] ?? 99);
  });
  const premiumIndex = visiblePlans.findIndex(p => p.type?.toLowerCase?.() === 'premium');

  // --- EFFECTS ---
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    if (!didInitialScrollRef.current) {
      try { carouselApi.scrollTo(1, true); } catch { }
      didInitialScrollRef.current = true;
    }
    const update = () => {
      try {
        const inView = carouselApi.slidesInView();
        setHighlightedIndex(inView && inView.length ? inView[Math.floor(inView.length / 2)] : carouselApi.selectedScrollSnap());
      } catch { setHighlightedIndex(0); }
    };
    update();
    carouselApi.on('select', update);
    carouselApi.on('reInit', update);
    return () => { carouselApi.off('select', update); carouselApi.off('reInit', update); };
  }, [carouselApi]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavElevated(y > 4);
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (y / total) * 100 : 0);
      setShowBackToTop(y > 150);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ids: Array<'how-it-works' | 'plans' | 'download-app' | 'about'> = ['how-it-works', 'plans', 'download-app', 'about'];
    const elements = ids.map((id) => { const el = document.getElementById(id); return el ? { id, el } : null; }).filter((x): x is { id: typeof ids[number]; el: HTMLElement } => Boolean(x));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
      if (visible) {
        const matched = elements.find((e) => e.el === visible.target);
        if (matched) setActiveSection(matched.id);
      }
    }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: [0.25, 0.4, 0.6] });
    elements.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const { hash } = window.location;
      if (!hash) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash, { passive: true } as any);
    return () => window.removeEventListener('hashchange', scrollToHash as any);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <SEOManager pageType="home" />

      <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">

        {/* ===== NAVIGATION ===== */}
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navElevated ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/assets/img/Pressing_Gris.png" alt="SV Pressing Logo" className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                <span className={`text-xl font-bold transition-colors duration-300 ${navElevated ? 'text-slate-800' : 'text-white'}`}>SV Pressing</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                {[
                  { href: "#how-it-works", label: "Services" },
                  { href: "#about", label: "À propos" },
                  { href: "#plans", label: "Nos Plans" },
                  { href: "#download-app", label: "Application" },
                  { href: "#contact", label: "Contact" }
                ].map((item) => (
                  <a key={item.href} href={item.href} className={`text-sm font-medium transition-colors duration-300 ${navElevated ? 'text-slate-600 hover:text-slate-900' : 'text-white/90 hover:text-white'}`}>
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className={`hidden md:flex transition-colors duration-300 ${navElevated ? 'text-slate-700 hover:text-slate-900' : 'text-white hover:text-white/80'}`}>
                  <a href="/auth">
                    <User className="mr-2 h-4 w-4" />
                    Espace Client
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className={`hidden md:flex transition-all duration-300 ${
                  navElevated 
                    ? 'bg-white border-teal-600 text-teal-600 hover:bg-teal-50' 
                    : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'
                }`}>
                  <a href="#contact">Contactez-nous</a>
                </Button>
              </div>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/50 py-4 px-4 space-y-2 shadow-lg">
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">Services</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">À propos</a>
              <a href="#plans" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">Nos Plans</a>
              <a href="#download-app" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">Application</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">Contact</a>
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <a href="/auth"><User className="mr-2 h-4 w-4" />Espace Client</a>
              </Button>
            </div>
          )}
          <div className="absolute left-0 bottom-0 h-0.5 w-full bg-transparent">
            <div className="h-full bg-gradient-to-r from-teal-700 to-cyan-400 transition-[width] duration-150" style={{ width: `${scrollProgress}%` }} />
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2070&auto=format&fit=crop"
              alt="Service de pressing professionnel"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="max-w-3xl">
              <div className="mb-6 flex items-center gap-2 text-sm font-medium text-teal-300">
                <span>Pressing professionnel & Nettoyage à sec</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Des solutions de blanchisserie <br className="hidden sm:inline" />
                <span className="text-teal-300">fiables, hygiéniques et constantes</span>
              </h1>
              <p className="mt-6 text-lg text-slate-200 max-w-xl leading-relaxed">
                Service de pressing professionnel avec collecte et livraison à domicile à Antananarivo.
                Qualité premium, abonnement mensuel économique et livraison rapide.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/30" onClick={openWhatsApp}>
                <MessageCircle className="mr-2 h-5 w-5" /> Contactez-nous sur WhatsApp
              </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 shadow-sm transition-colors" 
                  onClick={handleQuoteRequest}
                >
                  <Clipboard className="mr-2 h-5 w-5" /> Demander un devis
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-teal-300" /> {whatsappNumber}</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-teal-300" /> 7h – 20h</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-300" /> Antananarivo, Madagascar</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 1: "Service de pressing – Livré à votre porte" ===== */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="order-2 md:order-1">
                <div className="p-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Service de pressing</h3>
                  <p className="text-lg text-teal-700 font-medium mt-1">Livré à votre porte</p>
                  <p className="mt-4 text-slate-600 leading-relaxed">
                    Nous collectons votre linge à domicile et vous le livrons propre et repassé,
                    directement chez vous ou au bureau. Un service sur mesure, sans contrainte.
                  </p>
                  <Button className="mt-6 bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/20" onClick={handleQuoteRequest}>
                    Demander un devis 
                  </Button>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <img
                  src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=2070&auto=format&fit=crop"
                  alt="Livraison de linge"
                  className="rounded-2xl shadow-lg max-h-64 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: "Comment ça marche" (étapes numérotées) ===== */}
        <section id="how-it-works" ref={(el) => { sectionRefs.current['how-it-works-section'] = el; }} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="mb-4 text-sm font-medium text-teal-600">
                Service de pressing
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Comment ça marche</h2>
              <p className="mt-4 text-lg text-slate-600">Un service de pressing pensé pour vous simplifier la vie, de la collecte à la livraison.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                { num: '01', title: 'Collecte à domicile', desc: 'Nous venons chercher votre linge directement chez vous ou au bureau, à l\'heure de votre choix.' },
                { num: '02', title: 'Nettoyage professionnel', desc: 'Nos experts traitent chaque pièce avec soin, éliminent les taches et repassent avec précision.' },
                { num: '03', title: 'Livraison sous 48h', desc: 'Votre linge propre et repassé vous est restitué en moins de 48h, prêt à porter.' },
                { num: '04', title: 'Livraison à votre porte', desc: 'Nous vous livrons vos vêtements à l\'adresse de votre choix, gratuitement et à l\'heure convenue.' }
              ].map((step, i) => (
                <div key={i} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200/60 transition-all hover:shadow-lg hover:-translate-y-1">
                  <span className="absolute -top-4 left-6 text-6xl font-black text-teal-700/10 select-none">{step.num}</span>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold mb-4">
                      {i + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600 mt-2">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: "Nous sommes le leader. Nous offrons des solutions attractives" ===== */}
        <section className="relative py-20 text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=2070&auto=format&fit=crop"
              alt="Service de pressing professionnel"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-teal-700/85" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-sm font-medium text-white/90 mb-4">
              Nous sommes le leader
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Nous offrons des solutions <span className="text-teal-200">attractives</span>
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Des formules flexibles, des prix compétitifs et un service irréprochable.
              Faites confiance à SV Pressing pour un linge parfaitement propre, chaque jour.
            </p>
            <Button 
              className="mt-8 bg-white text-teal-700 hover:bg-slate-100 shadow-lg shadow-black/20" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Visiter le site
            </Button>
          </div>
        </section>

        {/* ===== SECTION 4: "Nos services" (liste des services) ===== */}
        <section id="about" ref={(el) => { sectionRefs.current['about-section'] = el; }} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-sm font-medium text-teal-600 mb-4">
                Pressing
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Nos services</h2>
              <p className="mt-4 text-lg text-slate-600">Nous fournissons toutes les solutions de blanchisserie pour répondre à vos besoins.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Droplet, title: 'Nettoyage à sec', desc: 'Nettoyage à sec professionnel pour vos vêtements délicats.' },
                { icon: Layers, title: 'Blanchisserie', desc: 'Lavage en machine avec des détergents de qualité.' },
                { icon: WashingMachine, title: 'Lavage', desc: 'Prétraitement des taches et lavage soigneux.' },
                { icon: Scissors, title: 'Pliage', desc: 'Pliage soigné pour un rangement facile.' },
                { icon: Shirt, title: 'Repassage', desc: 'Repassage impeccable pour une finition parfaite.' },
                { icon: Truck, title: 'Livraison', desc: 'Livraison rapide et ponctuelle à votre domicile.' }
              ].map((service, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 transition-all hover:shadow-md hover:-translate-y-1 flex items-start gap-4">
                  <service.icon className="w-6 h-6 text-teal-700 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{service.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{service.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: Plans ===== */}
        <section id="plans" ref={(el) => { sectionRefs.current['plans-section'] = el; }} className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-sm font-medium text-teal-600 mb-4">
                Nos Formules
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Des Formules de Pressing <span className="text-teal-700">Pensées Pour Vous</span></h2>
              <p className="mt-4 text-lg text-slate-600">Simplicité, transparence et économies. Choisissez l'abonnement qui correspond à votre style de vie.</p>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-teal-700" />
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="flex justify-center gap-3 mb-8">
                    {visiblePlans.map((_, idx) => (
                      <button key={idx} onClick={() => { setHighlightedIndex(idx); carouselApi?.scrollTo(idx, true); }} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === highlightedIndex ? 'w-8 bg-teal-600' : 'bg-slate-300 hover:bg-slate-400'}`} />
                    ))}
                  </div>
                  <Carousel className="relative max-w-6xl mx-auto px-2 py-4" setApi={setCarouselApi} opts={{ align: "center", loop: true }}>
                    <CarouselContent className="-ml-4 md:-ml-6 pb-8">
                      {visiblePlans
                        .sort((a, b) => parseInt(a.pricePerMonth) - parseInt(b.pricePerMonth))
                        .map((plan, index) => {
                        const isHighlighted = index === highlightedIndex;
                        
                        // ============================================================
                        // CORRECTION : Gestion robuste de plan.features avec type assertion
                        // ============================================================
                        let planFeatures: string[] = [];
                        if (Array.isArray(plan.features)) {
                          planFeatures = plan.features;
                        } else if (typeof plan.features === 'string') {
                          try {
                            const parsed = JSON.parse(plan.features);
                            planFeatures = Array.isArray(parsed) ? parsed : [plan.features];
                          } catch {
                            // ✅ Utilisation de (plan.features as string) pour résoudre l'erreur TypeScript
                            planFeatures = (plan.features as string).split(',').map((f: string) => f.trim()).filter(Boolean);
                          }
                        }
                        
                        return (
                          <CarouselItem key={plan.id} className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                            <div 
                              className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                                isHighlighted 
                                  ? 'shadow-2xl shadow-teal-700/20 scale-[1.02] ring-2 ring-teal-600 bg-teal-50' 
                                  : 'shadow-md hover:shadow-xl hover:-translate-y-2 hover:bg-teal-50/50'
                              }`}
                              onClick={() => selectPlan(plan)}
                            >
                              {index === premiumIndex && (
                                <div className="absolute top-0 right-0">
                                  <div className="bg-teal-600 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-lg">
                                    <Star className="h-3 w-3 inline mr-1 fill-current" /> Populaire
                                  </div>
                                </div>
                              )}
                              
                              <div className="p-6 md:p-8">
                                <div className="mb-6">
                                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                  <p className="text-sm text-slate-500 mt-1">{plan.type === 'custom' ? 'Plan Personnalisé' : 'Abonnement mensuel'}</p>
                                  
                                  <div className="mt-4 relative">
                                    <div className="flex items-end gap-1">
                                      <span className="text-5xl font-extrabold text-teal-700 tracking-tight">
                                        {formatPrice(plan.pricePerMonth)}
                                      </span>
                                      <span className="text-sm font-medium text-slate-500 mb-1.5">/mois</span>
                                    </div>
                                    <div className="absolute -bottom-1 left-0 w-16 h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"></div>
                                  </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center gap-3 text-slate-700">
                                    <Package className="w-4 h-4 text-slate-700" />
                                    <span>{plan.itemsIncluded} pièces incluses</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-slate-700">
                                    <Truck className="w-4 h-4 text-slate-700" />
                                    <span>{plan.pickupsPerWeek} ramassage(s)/semaine</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-slate-700">
                                    <Clock className="w-4 h-4 text-slate-700" />
                                    <span>Livraison en {plan.deliveryTimeHours}h</span>
                                  </div>
                                </div>

                                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                  {planFeatures.slice(0, 3).map((f: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                                      <span>{String(f).replace(/^["'{]+|["'}]+$/g, '')}</span>
                                    </li>
                                  ))}
                                  {planFeatures.length > 3 && (
                                    <li className="text-teal-600 font-medium text-center pt-1">+{planFeatures.length - 3} autres avantages</li>
                                  )}
                                </ul>

                                <Button 
                                  className={`w-full mt-6 rounded-xl font-semibold transition-colors ${
                                    isHighlighted 
                                      ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/25' 
                                      : 'bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700'
                                  }`}
                                >
                                  Choisir ce Plan
                                </Button>
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 -ml-4 bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:bg-white" />
                    <CarouselNext className="right-0 -mr-4 bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:bg-white" />
                  </Carousel>
                </div>
                <div className="text-center mt-16">
                  <p className="text-slate-600 mb-6">Vous ne trouvez pas la formule idéale ?<br />Nous créons un plan personnalisé adapté à vos besoins.</p>
                  <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors" onClick={handleQuoteRequest}>
                    <MessageSquare className="h-5 w-5 mr-2" /> Demander un Devis Personnalisé
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== SECTION 6: Téléchargez l'application ===== */}
        <section id="download-app" ref={(el) => { sectionRefs.current['app-section'] = el; }} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-sm font-medium text-teal-600 mb-4">
                Application Mobile
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Téléchargez l'application <span className="text-teal-700">SV Pressing</span></h2>
              <p className="mt-4 text-lg text-slate-600">Gérez vos commandes de pressing depuis votre smartphone. Simple, rapide et pratique.</p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Carte d'information */}
                <div className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-3xl border border-slate-200/60 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-700/20">
                      <img src="/assets/img/SV_Gris.png" alt="App" className="h-9 w-9 brightness-0 invert" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">SV Pressing</h3>
                      <p className="text-sm text-slate-500">Version {appVersion} • {appSizeMb} MB</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 text-slate-700">
                      <Smartphone className="h-3.5 w-3.5 text-slate-700" /> Android 6.0+
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 text-slate-700">
                      <Shield className="h-3.5 w-3.5 text-slate-700" /> Sécurisé
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button asChild className="bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/25 rounded-xl py-6" onClick={handleAppDownload}>
                      <a href={apkUrl} download><Download className="mr-2 h-5 w-5" /> Télécharger l'APK</a>
                    </Button>
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl py-6">
                      <a href="#install-guide">Guide d'installation</a>
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">Android peut afficher un avertissement : autorisez les sources inconnues.</p>
                </div>

                {/* Aperçu vidéo */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-[15rem] group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative aspect-[9/18] rounded-[26px] border border-white/40 bg-black shadow-2xl overflow-hidden">
                      <video className="w-full h-full object-cover" src={appDemoVideo} poster={appDemoPoster} controls autoPlay muted playsInline />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guide d'installation */}
            <div className="mt-20 max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="text-sm font-medium text-teal-600 mb-2">
                  Installation
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Comment installer l'application</h3>
                <p className="mt-2 text-slate-600">Suivez ces 3 étapes simples pour installer l'application sur votre smartphone.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    num: 1, 
                    title: 'Télécharger', 
                    desc: 'Cliquez sur "Télécharger l\'APK" pour obtenir le fichier d\'installation.',
                    items: ['Fichier sauvegardé', `Taille ${appSizeMb} MB`] 
                  },
                  { 
                    num: 2, 
                    title: "Installer", 
                    desc: 'Ouvrez le fichier APK et autorisez l\'installation depuis les sources inconnues.',
                    items: ['Paramètres → Sécurité', 'Activez "Sources inconnues"'] 
                  },
                  { 
                    num: 3, 
                    title: 'Profiter', 
                    desc: 'Lancez l\'application, connectez-vous et gérez vos commandes en quelques clics.',
                    items: ['Connectez-vous', 'Gérez vos commandes'] 
                  }
                ].map((card) => (
                  <div key={card.num} className="relative bg-slate-50 p-8 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="absolute -top-4 left-6 text-5xl font-black text-teal-700/10 select-none">
                      {String(card.num).padStart(2, '0')}
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                          {card.num}
                        </span>
                        <h4 className="font-semibold text-slate-900">{card.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{card.desc}</p>
                      <ul className="space-y-1.5 text-sm text-slate-500">
                        {card.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: Contact ===== */}
        <section id="contact" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="text-sm font-medium text-teal-600 mb-4">
                Contactez-nous
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Prêt à nous confier votre linge ?</h2>
              <p className="mt-4 text-lg text-slate-600">Nous sommes à votre écoute pour toute question ou demande de devis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="group p-8 rounded-2xl bg-white border border-slate-200/60 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
                  <Phone className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Téléphone</h3>
                <p className="text-sm text-slate-600 mt-2">{whatsappNumber}</p>
                <p className="text-sm text-slate-400 mt-1">7h – 20h</p>
              </div>

              <div className="group p-8 rounded-2xl bg-white border border-slate-200/60 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
                  <Mail className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Email</h3>
                <p className="text-sm text-slate-600 mt-2">contact.sasavanda@gmail.com</p>
                <p className="text-sm text-slate-400 mt-1">Réponse sous 24h</p>
              </div>

              <div className="group p-8 rounded-2xl bg-white border border-slate-200/60 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
                  <MapPin className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Adresse</h3>
                <p className="text-sm text-slate-600 mt-2">Antananarivo, Madagascar</p>
                <p className="text-sm text-slate-400 mt-1">Collecte à domicile</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button 
                className="bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/25 rounded-xl px-8 py-6" 
                onClick={openWhatsApp}
              >
                <MessageCircle className="mr-2 h-5 w-5" /> Nous contacter sur WhatsApp
              </Button>
            </div>
          </div>
        </section>

        {/* ===== BACK TO TOP ===== */}
        {showBackToTop && (
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); trackEvent('Navigation', 'back_to_top', 'Back to Top Clicked'); }}
            className="fixed bottom-6 right-6 z-[2000] h-12 w-12 rounded-full bg-teal-700 text-white shadow-lg shadow-teal-700/20 hover:bg-teal-800 transition-all hover:scale-105 flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        <FloatingChat />

        {/* ===== FOOTER ===== */}
        <footer className="bg-white border-t border-slate-200/60 pt-12 pb-6">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* Bannière promotionnelle */}
            <section className="relative w-full rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=2070&auto=format&fit=crop"
                  alt="Service de pressing professionnel"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-700/90 to-cyan-700/85" />
              </div>
              
              <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 text-center">
                <div className="max-w-4xl mx-auto">
                  <div className="text-sm font-medium text-white/90 mb-4">
                    SV Pressing
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                    Découvrez nos nouveautés en <span className="text-teal-200">avant-première</span>
                  </h2>
                  <p className="mt-3 text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Profitez d'un service de pressing rapide, fiable et entièrement pensé pour vous.
                    Des formules flexibles et un service irréprochable.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button 
                      onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} 
                      className="bg-white text-teal-700 hover:bg-slate-100 shadow-lg shadow-black/20 rounded-xl px-8 py-6 transition-colors"
                    >
                      Découvrir Nos Plans
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white/80 bg-white/10 text-white hover:bg-white hover:text-teal-700 active:bg-white active:text-teal-700 backdrop-blur-sm shadow-sm rounded-xl px-8 py-6 transition-colors" 
                      onClick={handleQuoteRequest}
                    >
                      Devis Personnalisé
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer principal */}
            <div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/assets/img/Pressing_Gris.png" alt="SV Pressing" className="h-10 w-auto" />
                  <span className="text-xl font-bold text-slate-800">SV Pressing</span>
                </div>
                <p className="text-slate-600 leading-relaxed">Le premier service de pressing intelligent par abonnement à Madagascar.</p>
                <div className="mt-5 flex gap-4">
                  <a 
                    href="https://www.facebook.com/sasavandapressing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-teal-100 transition-all duration-300"
                  >
                    <Facebook className="h-5 w-5 text-slate-700 hover:text-teal-700 transition-colors" />
                  </a>
                  <a 
                    href="https://svpressing.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-teal-100 transition-all duration-300"
                  >
                    <Globe className="h-5 w-5 text-slate-700 hover:text-teal-700 transition-colors" />
                  </a>
                  <a 
                    href="mailto:contact.sasavanda@gmail.com" 
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-teal-100 transition-all duration-300"
                  >
                    <Mail className="h-5 w-5 text-slate-700 hover:text-teal-700 transition-colors" />
                  </a>
                  <a 
                    href="https://maps.google.com/?q=Antananarivo" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-teal-100 transition-all duration-300"
                  >
                    <MapPin className="h-5 w-5 text-slate-700 hover:text-teal-700 transition-colors" />
                  </a>
                </div>
              </div>
              <div className="md:col-span-2 md:col-start-7">
                <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li><a href="#plans" className="hover:text-teal-700 transition-colors">Nos Plans</a></li>
                  <li><a href="#how-it-works" className="hover:text-teal-700 transition-colors">Comment ça marche</a></li>
                  <li><a href="/auth" className="hover:text-teal-700 transition-colors">Espace Client</a></li>
                </ul>
              </div>
              <div className="md:col-span-3">
                <h4 className="font-semibold text-slate-900 mb-4">Contact</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><Phone size={16} className="text-slate-700" /> {whatsappNumber}</li>
                  <li className="flex items-center gap-2"><Mail size={16} className="text-slate-700" /> contact.sasavanda@gmail.com</li>
                  <li className="flex items-center gap-2"><MapPin size={16} className="text-slate-700" /> Antananarivo, Madagascar</li>
                </ul>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-10 border-t border-slate-200/60 pt-6 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} SV Pressing - Service de Pressing Professionnel à Antananarivo, Madagascar. Tous droits réservés.
            </div>
          </div>
        </footer>

        {/* ============================================================
            DIALOGS AVEC FORMULAIRES HORIZONTAUX (2 colonnes)
        ============================================================ */}

        {/* ===== DIALOG 1: Demande de Devis Personnalisé ===== */}
        <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Demande de Devis Personnalisé</DialogTitle>
              <DialogDescription>Remplissez ce formulaire pour recevoir un devis adapté à vos besoins.</DialogDescription>
            </DialogHeader>
            <Form {...customQuoteForm}>
              <form onSubmit={customQuoteForm.handleSubmit(handleCustomQuote)} className="space-y-4">
                {/* Ligne 1: Nom complet & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={customQuoteForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="Votre nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={customQuoteForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" className="bg-slate-50 rounded-xl" placeholder="votre@email.mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ligne 2: Téléphone & Confirmation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={customQuoteForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="+261 34 00 00 00" {...field} onPaste={(e) => e.preventDefault()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={customQuoteForm.control} name="phoneConfirm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le téléphone *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="Confirmez votre numéro" {...field} onPaste={(e) => e.preventDefault()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ligne 3: Adresse (pleine largeur) */}
                <FormField control={customQuoteForm.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input className="bg-slate-50 rounded-xl" placeholder="Votre adresse complète" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Ligne 4: Pièces/semaine & Ramassages/semaine */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={customQuoteForm.control} name="itemsPerWeek" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pièces/semaine *</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-slate-50 rounded-xl" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={customQuoteForm.control} name="pickupsPerWeek" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ramassages/semaine *</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-slate-50 rounded-xl" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ligne 5: Exigences spéciales (pleine largeur) */}
                <FormField control={customQuoteForm.control} name="specialRequirements" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exigences spéciales</FormLabel>
                    <FormControl>
                      <Textarea className="bg-slate-50 rounded-xl h-20" placeholder="Besoins particuliers, horaires préférés..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/20" disabled={customQuoteMutation.isPending}>
                  {customQuoteMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Envoyer la demande"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ===== DIALOG 2: Souscription au plan ===== */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ShoppingBag className="h-5 w-5 text-teal-700" /> 
                Souscrire au plan {selectedPlan?.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Info className="h-4 w-4" /> Complétez vos informations pour finaliser votre abonnement.
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Plan sélectionné</h4>
                  <Badge className="bg-teal-100 text-teal-800 border-0">{selectedPlan.type.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Formule</p>
                    <p className="font-semibold">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Prix mensuel</p>
                    <p className="font-bold text-teal-700">{formatPrice(selectedPlan.pricePerMonth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Pièces incluses</p>
                    <p className="font-semibold">{selectedPlan.itemsIncluded} pièces</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ramassages/semaine</p>
                    <p className="font-semibold">{selectedPlan.pickupsPerWeek}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Form {...planSelectionForm}>
              <form onSubmit={planSelectionForm.handleSubmit(handlePlanSelection)} className="space-y-4">
                {/* Ligne 1: Nom & Prénom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={planSelectionForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="Votre nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={planSelectionForm.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="Votre prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ligne 2: Email */}
                <FormField control={planSelectionForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" className="bg-slate-50 rounded-xl" placeholder="votre@email.mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Ligne 3: Téléphone & Confirmation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={planSelectionForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="+261 34 00 00 00" {...field} onPaste={(e) => e.preventDefault()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={planSelectionForm.control} name="phoneConfirm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-50 rounded-xl" placeholder="Confirmez votre numéro" {...field} onPaste={(e) => e.preventDefault()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ligne 4: Adresse */}
                <FormField control={planSelectionForm.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input className="bg-slate-50 rounded-xl" placeholder="Votre adresse complète" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Ligne 5: Instructions spéciales */}
                <FormField control={planSelectionForm.control} name="specialRequirements" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions spéciales</FormLabel>
                    <FormControl>
                      <Textarea className="bg-slate-50 rounded-xl h-20" placeholder="Horaires préférés, instructions particulières..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <input type="hidden" {...planSelectionForm.register("planId")} value={selectedPlan?.id || 0} />
                
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                    <p className="text-xs text-slate-600">En soumettant ce formulaire, vous acceptez nos conditions générales. Votre demande sera traitée dans les 24h.</p>
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/20" disabled={planSelectionMutation.isPending || !selectedPlan}>
                  {planSelectionMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><CheckCircle className="mr-2 h-5 w-5" />Finaliser l'abonnement</>}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}