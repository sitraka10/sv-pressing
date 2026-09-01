import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Package, 
  Clock, 
  Truck, 
  Star, 
  Shield,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Leaf,
  User,
  FileText,
  Sparkles,
  Zap,
  Target,
  Award,
  Users,
  TrendingUp,
  HeartHandshake,
  Droplet,
  Wind,
  ShoppingBag
} from "lucide-react";

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
  message: "Les numéros de téléphone doivent correspondre",
  path: ["phoneConfirm"],
});

const planSelectionSchema = z.object({
  planId: z.number(),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phoneConfirm: z.string().min(10, "Confirmation du numéro requise"),
  address: z.string().min(5, "Adresse invalide"),
  specialRequirements: z.string().optional(),
}).refine((data) => data.phone === data.phoneConfirm, {
  message: "Les numéros de téléphone doivent correspondre",
  path: ["phoneConfirm"],
});

const processSteps = [
  { icon: ShoppingBag, title: "Ramassage", description: "Collecte de vos vêtements à domicile", color: "bg-blue-500" },
  { icon: Package, title: "Tri", description: "Classification par type et couleur", color: "bg-indigo-500" },
  { icon: Droplet, title: "Lavage", description: "Nettoyage professionnel adapté", color: "bg-cyan-500" },
  { icon: Wind, title: "Séchage", description: "Séchage optimal selon le tissu", color: "bg-teal-500" },
  { icon: Zap, title: "Repassage", description: "Finition impeccable et pliage", color: "bg-purple-500" },
  { icon: CheckCircle, title: "Contrôle", description: "Vérification qualité finale", color: "bg-green-500" },
  { icon: Truck, title: "Livraison", description: "Retour à domicile sous 48h", color: "bg-orange-500" },
  { icon: Star, title: "Satisfaction", description: "Service garanti et suivi", color: "bg-yellow-500" }
];

export default function HomePageEnhanced() {
  const { toast } = useToast();
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch subscription plans
  const { data: subscriptionPlans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Forms
  const quoteForm = useForm<z.infer<typeof customQuoteSchema>>({
    resolver: zodResolver(customQuoteSchema),
  });

  const planForm = useForm<z.infer<typeof planSelectionSchema>>({
    resolver: zodResolver(planSelectionSchema),
  });

  // Mutations
  const createQuoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customQuoteSchema>) => {
      const res = await apiRequest("POST", "/api/custom-quotes", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsQuoteDialogOpen(false);
      quoteForm.reset();
      toast({
        title: "Demande envoyée",
        description: "Votre demande de devis a été envoyée avec succès. Nous vous contacterons bientôt.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const selectPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof planSelectionSchema>) => {
      const res = await apiRequest("POST", "/api/plan-selections", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsPlanDialogOpen(false);
      planForm.reset();
      toast({
        title: "Souscription envoyée",
        description: "Votre souscription a été envoyée avec succès. Nous vous contacterons pour finaliser votre abonnement.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-blue-200/10 opacity-20"></div>
        
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-6 shadow-2xl">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              SV Pressing
            </h1>
          </div>
          
          <p className="text-2xl md:text-3xl mb-4 font-light">
            Le premier service de pressing intelligent par abonnement à Madagascar
          </p>
          <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto opacity-90">
            Révolutionnez votre quotidien avec notre service de pressing premium. 
            Ramassage à domicile, traitement professionnel et livraison sous 48h.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <FileText className="mr-3 h-6 w-6" />
                  Devis Personnalisé
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-lg px-8 py-6 rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Star className="mr-3 h-6 w-6" />
              Découvrir nos Plans
            </Button>
          </div>
          
          {/* Login button for staff access */}
          <div className="mt-12 text-center">
            <a 
              href="/auth" 
              className="inline-flex items-center px-6 py-3 text-sm text-white/80 hover:text-white border border-white/30 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              <User className="mr-2 h-5 w-5" />
              Accès Personnel / Clients
            </a>
          </div>
        </div>
      </section>

      {/* Why SV Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Pourquoi choisir <span className="text-blue-600">SV Pressing</span> ?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Une approche révolutionnaire du pressing qui combine technologie, qualité et commodité
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Service Premium</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Équipements professionnels de dernière génération et produits eco-responsables 
                  pour un résultat impeccable
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Gain de Temps</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Ramassage et livraison à domicile selon votre planning. 
                  Plus de déplacements, plus d'attente !
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Sur Mesure</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Abonnements flexibles adaptés à vos besoins. 
                  Modifiez votre plan quand vous voulez
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Garantie Qualité</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Satisfaction garantie ou re-traitement gratuit. 
                  Votre confiance est notre priorité
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Eco-Responsable</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Produits biodégradables et processus respectueux de l'environnement. 
                  Préservons Madagascar ensemble
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <HeartHandshake className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Service Local</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600">
                  Une entreprise 100% malgache qui comprend vos besoins et 
                  s'adapte à votre mode de vie
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="plans-section" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Nos <span className="text-blue-600">Abonnements</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choisissez l'abonnement qui correspond à votre style de vie
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 ${
                  plan.type === 'family' 
                    ? 'border-2 border-blue-500 shadow-2xl scale-105 bg-gradient-to-br from-blue-50 to-indigo-50' 
                    : 'border border-slate-200 hover:border-blue-300'
                }`}
              >
                {plan.type === 'family' && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-2 font-semibold">
                    <Award className="inline w-4 h-4 mr-1" />
                    PLUS POPULAIRE
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.type === 'family' ? 'pt-12' : ''}`}>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-600">{plan.pricePerMonth}</span>
                    <span className="text-slate-600"> MGA/mois</span>
                  </div>
                  <CardDescription className="text-slate-600">
                    Parfait pour {plan.type === 'essential' ? 'les célibataires' : 
                                 plan.type === 'family' ? 'les familles' : 
                                 'les professionnels'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Pièces incluses</span>
                      <span className="font-semibold text-slate-900">{plan.itemsIncluded}/semaine</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ramassages</span>
                      <span className="font-semibold text-slate-900">{plan.pickupsPerWeek}/semaine</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Délai de livraison</span>
                      <span className="font-semibold text-slate-900">{plan.deliveryTimeHours}h</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3">Inclus :</h4>
                    <ul className="space-y-2">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    className={`w-full mt-6 font-semibold py-6 rounded-full transform transition-all duration-300 ${
                      plan.type === 'family' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-slate-900 hover:bg-blue-600 text-white hover:shadow-lg'
                    }`}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsPlanDialogOpen(true);
                    }}
                  >
                    <Star className="mr-2 h-5 w-5" />
                    Choisir ce plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Quote Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Besoin d'un service <span className="text-yellow-300">sur mesure</span> ?
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Nos experts créent un devis personnalisé selon vos besoins spécifiques
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">Pourquoi un devis personnalisé ?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Grandes familles</h4>
                      <p className="text-blue-100">Plus de 5 personnes avec besoins spécifiques</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <TrendingUp className="w-6 h-6 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Entreprises</h4>
                      <p className="text-blue-100">Uniformes, linge professionnel en volume</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Target className="w-6 h-6 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Besoins spéciaux</h4>
                      <p className="text-blue-100">Tissus délicats, fréquences particulières</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-xl">Demande de devis gratuit</CardTitle>
                  <CardDescription className="text-blue-100">
                    Réponse sous 24h avec tarif personnalisé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-semibold py-6 rounded-full text-lg">
                        <FileText className="mr-2 h-5 w-5" />
                        Demander mon devis
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Notre <span className="text-blue-600">Processus</span> en 8 étapes
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Un workflow intelligent et optimisé pour garantir la qualité et la rapidité
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600 rounded-full hidden lg:block"></div>
            
            <div className="space-y-12 lg:space-y-16">
              {processSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div key={index} className={`flex items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col lg:gap-8`}>
                    {/* Content */}
                    <div className={`flex-1 ${isEven ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'} text-center lg:text-left mb-6 lg:mb-0`}>
                      <Card className="inline-block bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-none">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                          <p className="text-slate-600">{step.description}</p>
                          <Badge className="mt-3 bg-blue-100 text-blue-800 border-blue-200">
                            Étape {index + 1}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white transform hover:scale-110 transition-all duration-300`}>
                        <StepIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Spacer */}
                    <div className="flex-1 hidden lg:block"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à révolutionner votre quotidien ?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            Rejoignez les centaines de familles malgaches qui ont déjà adopté SV Pressing
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <FileText className="mr-3 h-6 w-6" />
                  Commencer maintenant
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-lg px-8 py-6 rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
            >
              <Phone className="mr-3 h-6 w-6" />
              Nous contacter
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center mb-6">
                <Package className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-bold">SV Pressing</h3>
              </div>
              <p className="text-slate-400 mb-4">
                Le service de pressing intelligent qui révolutionne Madagascar
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Pressing à domicile</li>
                <li>Nettoyage à sec</li>
                <li>Repassage premium</li>
                <li>Service express</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Abonnements</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Plan Essentiel</li>
                <li>Plan Famille</li>
                <li>Plan Premium</li>
                <li>Devis personnalisé</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+261 34 XX XX XX XX</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>contact@svpressing.mg</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Antananarivo, Madagascar</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 SV Pressing. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Custom Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-600">Demande de Devis Personnalisé</DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire pour recevoir votre devis sur mesure sous 24h
            </DialogDescription>
          </DialogHeader>
          <Form {...quoteForm}>
            <form onSubmit={quoteForm.handleSubmit((data) => createQuoteMutation.mutate(data))} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={quoteForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quoteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="votre@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={quoteForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+261 34 XX XX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quoteForm.control}
                  name="phoneConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer téléphone *</FormLabel>
                      <FormControl>
                        <Input placeholder="Confirmer votre numéro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={quoteForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète *</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre adresse de ramassage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={quoteForm.control}
                  name="itemsPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pièces par semaine *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 15"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quoteForm.control}
                  name="pickupsPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ramassages par semaine *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 2"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={quoteForm.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exigences particulières</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez vos besoins spécifiques (tissus délicats, horaires, etc.)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createQuoteMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createQuoteMutation.isPending ? "Envoi..." : "Envoyer ma demande"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Plan Selection Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-600">
              Souscrire au plan {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Finalisez votre souscription pour commencer votre abonnement pressing
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Récapitulatif de votre plan :</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Plan :</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix :</span>
                  <span className="font-semibold">{selectedPlan.pricePerMonth} MGA/mois</span>
                </div>
                <div className="flex justify-between">
                  <span>Pièces incluses :</span>
                  <span className="font-semibold">{selectedPlan.itemsIncluded}/semaine</span>
                </div>
              </div>
            </div>
          )}

          <Form {...planForm}>
            <form onSubmit={planForm.handleSubmit((data) => {
              const formData = { ...data, planId: selectedPlan?.id || 0 };
              selectPlanMutation.mutate(formData);
            })} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={planForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de famille *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de famille" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={planForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={planForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+261 34 XX XX XX XX"
                          {...field}
                          autoComplete="off"
                          inputMode="tel"
                          onPaste={(e) => e.preventDefault()}
                          onCopy={(e) => e.preventDefault()}
                          onCut={(e) => e.preventDefault()}
                          onDrop={(e) => e.preventDefault()}
                          title="Le copier-coller est désactivé pour ce champ"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={planForm.control}
                  name="phoneConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer téléphone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirmer votre numéro"
                          {...field}
                          autoComplete="off"
                          inputMode="tel"
                          onPaste={(e) => e.preventDefault()}
                          onCopy={(e) => e.preventDefault()}
                          onCut={(e) => e.preventDefault()}
                          onDrop={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          onBeforeInput={(e) => {
                            const t = (e as any).nativeEvent?.inputType;
                            if (t && t.includes('insertFromPaste')) e.preventDefault();
                          }}
                          title="Le copier-coller est désactivé pour ce champ"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={planForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète *</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre adresse de ramassage et livraison" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={planForm.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions particulières</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Horaires préférés, instructions d'accès, etc."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={selectPlanMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {selectPlanMutation.isPending ? "Envoi..." : "Confirmer ma souscription"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}