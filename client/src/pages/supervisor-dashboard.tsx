const alerts: Array<{ userId: number; [key: string]: any }> = [];import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInMinutes, differenceInHours, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composants UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icônes Lucide
import {
  Package,
  Truck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  BarChart3,
  Gauge,
  UserCheck,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Brain,
  Lightbulb,
  Zap,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  Bell,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Menu,
  Grid,
  List,
  ThumbsUp,
  Star,
  Crown,
  Sparkles,
  Wind,
  AlertOctagon,
  Info,
  WashingMachine,
  Timer,
  ChevronsLeft,
  ChevronsRight,
  BellRing,
  BellOff,
  Navigation2,
  Map,
  User,
  BarChart,
  Cloud,
  Settings,  
  Volume,
  ArrowUpDown,
  Hand as HandIcon,
} from 'lucide-react';

// ============ CONFIGURATION ============

const WORKFLOW_STEPS = [
  { 
    status: 'to_pickup', 
    label: 'À ramasser', 
    icon: HandIcon, 
    color: 'orange', 
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-50',
    progressColor: 'bg-orange-500',
    sla: 8,
    description: 'En attente de collecte chez le client',
    longDescription: 'Le livreur doit se rendre chez le client pour récupérer les vêtements.',
    tips: [
      'Vérifier la disponibilité du livreur',
      'Confirmer l\'adresse avec le client',
      'Préparer les sacs de collecte'
    ],
    kpi: 'Temps moyen: 45min'
  },
  { 
    status: 'to_sort', 
    label: 'À trier', 
    icon: Filter, 
    color: 'yellow', 
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    hoverColor: 'hover:bg-yellow-50',
    progressColor: 'bg-yellow-500',
    sla: 4,
    description: 'Tri des vêtements par type et couleur',
    longDescription: 'Séparer les vêtements par couleur, type de tissu et niveau de saleté.',
    tips: [
      'Séparer blanc/couleur/délicat',
      'Vérifier les poches',
      'Noter les taches spécifiques'
    ],
    kpi: '15-20 articles/heure'
  },
  { 
    status: 'to_wash', 
    label: 'En lavage', 
    icon: WashingMachine, 
    color: 'blue', 
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-50',
    progressColor: 'bg-blue-500',
    sla: 6,
    description: 'Lavage en cours',
    longDescription: 'Lavage adapté au type de tissu et au niveau de saleté.',
    tips: [
      'Programme adapté au tissu',
      'Température appropriée',
      'Produits spécifiques si besoin'
    ],
    kpi: 'Cycle: 45-90min'
  },
  { 
    status: 'to_dry', 
    label: 'En séchage', 
    icon: Wind, 
    color: 'cyan', 
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    hoverColor: 'hover:bg-cyan-50',
    progressColor: 'bg-cyan-500',
    sla: 4,
    description: 'Séchage des vêtements',
    longDescription: 'Séchage adapté à chaque type de tissu pour éviter la détérioration.',
    tips: [
      'Séchage à l\'air pour les délicats',
      'Séchage machine pour le coton',
      'Éviter le sur-séchage'
    ],
    kpi: '30-60min par lot'
  },
  { 
    status: 'to_iron', 
    label: 'En repassage', 
    icon: Sparkles, 
    color: 'purple', 
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:bg-purple-50',
    progressColor: 'bg-purple-500',
    sla: 5,
    description: 'Repassage et pliage',
    longDescription: 'Repassage professionnel et pliage soigné des vêtements.',
    tips: [
      'Température adaptée au tissu',
      'Vapeur pour les tissus délicats',
      'Pliage soigné'
    ],
    kpi: '20-30 pièces/heure'
  },
  { 
    status: 'ready_to_deliver', 
    label: 'Prêt à livrer', 
    icon: Package, 
    color: 'indigo', 
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    hoverColor: 'hover:bg-indigo-50',
    progressColor: 'bg-indigo-500',
    sla: 2,
    description: 'Emballé et prêt pour la livraison',
    longDescription: 'Commandes emballées et étiquetées, en attente de livraison.',
    tips: [
      'Vérifier la quantité',
      'Emballage protecteur',
      'Étiqueter correctement'
    ],
    kpi: 'Temps d\'attente moyen: 30min'
  },
  { 
    status: 'to_deliver', 
    label: 'En livraison', 
    icon: Truck, 
    color: 'blue', 
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-50',
    progressColor: 'bg-blue-500',
    sla: 8,
    description: 'En cours de livraison',
    longDescription: 'Le livreur est en route pour livrer la commande au client.',
    tips: [
      'Optimiser l\'itinéraire',
      'Contacter le client avant livraison',
      'Préparer la monnaie si nécessaire'
    ],
    kpi: '3-5 livraisons/tournée'
  },
  { 
    status: 'delivered', 
    label: 'Livré', 
    icon: CheckCircle2, 
    color: 'green', 
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-50',
    progressColor: 'bg-green-500',
    sla: 0,
    description: 'Commande livrée au client',
    longDescription: 'Commande livrée avec succès au client.',
    tips: [],
    kpi: 'Taux satisfaction: 98%'
  },
];

const SLA_LEVELS = {
  normal: { 
    label: 'Sous contrôle', 
    color: 'green', 
    icon: CheckCircle2, 
    threshold: 0.6,
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    borderClass: 'border-green-200',
    progressClass: 'bg-green-500',
    gradient: 'from-green-500 to-green-600',
    lightGradient: 'from-green-50 to-green-100',
    description: 'Dans les temps',
    action: 'Surveillance normale'
  },
  attention: { 
    label: 'À surveiller', 
    color: 'yellow', 
    icon: AlertTriangle, 
    threshold: 0.8,
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-200',
    progressClass: 'bg-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600',
    lightGradient: 'from-yellow-50 to-yellow-100',
    description: 'Approche du seuil',
    action: 'Surveillance renforcée'
  },
  urgent: { 
    label: 'Prioritaire', 
    color: 'orange', 
    icon: Zap, 
    threshold: 1.0,
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
    progressClass: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
    lightGradient: 'from-orange-50 to-orange-100',
    description: 'Action requise',
    action: 'Intervention rapide'
  },
  retard: { 
    label: 'En retard', 
    color: 'red', 
    icon: XCircle, 
    threshold: Infinity,
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    progressClass: 'bg-red-500',
    gradient: 'from-red-500 to-red-600',
    lightGradient: 'from-red-50 to-red-100',
    description: 'Délai dépassé',
    action: 'Action immédiate'
  }
};

const CLIENT_PRIORITY = {
  vip: { 
    label: 'VIP', 
    color: 'purple',
    icon: Crown,
    bgClass: 'bg-purple-100 text-purple-700 border-purple-200',
    gradient: 'from-purple-500 to-purple-600',
    lightGradient: 'from-purple-50 to-purple-100',
    description: 'Client prioritaire - Traitement accéléré',
    slaBonus: -2
  },
  premium: { 
    label: 'Premium', 
    color: 'blue',
    icon: Star,
    bgClass: 'bg-blue-100 text-blue-700 border-blue-200',
    gradient: 'from-blue-500 to-blue-600',
    lightGradient: 'from-blue-50 to-blue-100',
    description: 'Client fidèle - Suivi personnalisé',
    slaBonus: -1
  },
  standard: { 
    label: 'Standard', 
    color: 'green',
    icon: UserCheck,
    bgClass: 'bg-green-100 text-green-700 border-green-200',
    gradient: 'from-green-500 to-green-600',
    lightGradient: 'from-green-50 to-green-100',
    description: 'Client standard - Traitement normal',
    slaBonus: 0
  },
  occasionnel: { 
    label: 'Occasionnel', 
    color: 'gray',
    icon: User,
    bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
    gradient: 'from-gray-500 to-gray-600',
    lightGradient: 'from-gray-50 to-gray-100',
    description: 'Client occasionnel',
    slaBonus: 1
  }
};

const RISK_LEVELS = {
  critical: {
    label: 'Critique',
    color: 'red',
    icon: AlertOctagon,
    threshold: 80,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    action: 'Action immédiate requise',
    description: 'Retard majeur probable'
  },
  high: {
    label: 'Élevé',
    color: 'orange',
    icon: AlertTriangle,
    threshold: 60,
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
    action: 'Intervention rapide',
    description: 'Risque significatif de retard'
  },
  medium: {
    label: 'Moyen',
    color: 'yellow',
    icon: AlertCircle,
    threshold: 40,
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-200',
    action: 'Surveillance renforcée',
    description: 'À surveiller'
  },
  low: {
    label: 'Faible',
    color: 'green',
    icon: Info,
    threshold: 0,
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-200',
    action: 'Surveillance normale',
    description: 'Sous contrôle'
  }
};

const TEAM_PERFORMANCE = {
  excellent: { label: 'Excellent', color: 'green', icon: Star, threshold: 90 },
  good: { label: 'Bon', color: 'blue', icon: ThumbsUp, threshold: 75 },
  average: { label: 'Moyen', color: 'yellow', icon: User, threshold: 60 },
  below: { label: 'À améliorer', color: 'orange', icon: TrendingDown, threshold: 40 },
  poor: { label: 'Critique', color: 'red', icon: AlertTriangle, threshold: 0 }
};

// ============ TYPES ============

interface Order {
  id: number;
  clientId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  itemCount?: number;
  specialInstructions?: string;
  clientName?: string;
  clientPhone?: string;
  clientNeighborhood?: string;
  clientPriority?: string;
  sla_level?: string;
  sla_progress?: number;
  risk_score?: number;
  time_in_status?: number;
  anomaly_detected?: boolean;
  estimated_completion?: string;
  timeRemaining?: string;
  nextAction?: string;
  lateType?: string;
  lateHours?: number;
  isLate?: boolean;
  priority?: string;
  tags?: string[];
  history?: StatusHistory[];
  notes?: Note[];
  assignedTo?: number;
}

interface StatusHistory {
  status: string;
  timestamp: string;
  user: string;
  note?: string;
}

interface Note {
  id: number;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'supervisor' | 'agent' | 'delivery' | 'client';
  isActive: boolean;
  neighborhood?: string;
  priority?: string;
  avatar?: string;
  performance?: {
    onTime: number;
    completed: number;
    rating: number;
    productivity: number;
    satisfaction: number;
    trends: {
      daily: number[];
      weekly: number[];
      monthly: number[];
    };
  };
  stats?: {
    totalOrders: number;
    completedToday: number;
    avgTime: number;
    lateCount: number;
  };
  schedule?: {
    today: Delivery[];
    tomorrow: Delivery[];
    week: Delivery[];
  };
  location?: {
    lat: number;
    lng: number;
    lastUpdate: string;
  };
}

interface Delivery {
  id: number;
  orderId: number;
  deliveryPersonId?: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  distance?: number;
  clientAddress?: string;
  clientPhone?: string;
  clientName?: string;
}

interface SLAMetrics {
  byLevel: {
    normal: number;
    attention: number;
    urgent: number;
    retard: number;
  };
  byStatus: Record<string, {
    total: number;
    normal: number;
    attention: number;
    urgent: number;
    retard: number;
    avgProgress: number;
  }>;
  averageRiskScore: number;
  anomalies: number;
  estimatedRecovery: {
    time: string;
    confidence: 'low' | 'medium' | 'high';
    actions: string[];
  };
  bottlenecks: Array<{
    status: string;
    count: number;
    avgTime: number;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    recommendation: string;
  }>;
  trends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
  predictions: {
    nextHour: number;
    nextDay: number;
    nextWeek: number;
  };
}

interface Prediction {
  orderId: number;
  riskScore: number;
  predictedDelay: number;
  timeInStatus: number;
  suggestedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  impact: string;
  timeline: string;
  alternatives?: string[];
}

interface Recommendation {
  type: 'bottleneck' | 'risk' | 'optimization' | 'resource' | 'traffic' | 'weather' | 'quality';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  timeline: string;
  actionable: boolean;
  savings?: string;
  roi?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TeamStats {
  total: number;
  active: number;
  onDuty: number;
  offDuty: number;
  performance: {
    overall: number;
    byRole: Record<string, number>;
  };
  distribution: {
    byRole: Record<string, number>;
    byZone: Record<string, number>;
  };
  topPerformers: User[];
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    userId?: number;
  }>;
}

// ============ FONCTIONS UTILITAIRES ============

const formatDate = (date: string | undefined, formatStr: string): string => {
  if (!date) return 'Non défini';
  try {
    return format(parseISO(date), formatStr, { locale: fr });
  } catch {
    return 'Date invalide';
  }
};

const formatRelativeTime = (date: string): string => {
  try {
    return formatDistanceToNow(parseISO(date), { 
      addSuffix: true,
      locale: fr 
    });
  } catch {
    return 'Date inconnue';
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

const getPriorityIcon = (priority: string = 'standard'): React.ElementType => {
  return CLIENT_PRIORITY[priority as keyof typeof CLIENT_PRIORITY]?.icon || User;
};

const getSLAIcon = (level: string = 'normal'): React.ElementType => {
  return SLA_LEVELS[level as keyof typeof SLA_LEVELS]?.icon || AlertCircle;
};

const getSLAIndicatorColor = (level: string) => {
  const colors: Record<string, string> = {
    normal: 'border-l-green-500',
    attention: 'border-l-yellow-500',
    urgent: 'border-l-orange-500',
    retard: 'border-l-red-500'
  };
  return colors[level] || 'border-l-gray-500';
};

const getSLABackgroundColor = (level: string) => {
  return SLA_LEVELS[level as keyof typeof SLA_LEVELS]?.bgClass || 'bg-gray-50';
};

const getProgressColor = (progress: number, level?: string): string => {
  if (level && SLA_LEVELS[level as keyof typeof SLA_LEVELS]) {
    return SLA_LEVELS[level as keyof typeof SLA_LEVELS].progressClass;
  }
  if (progress >= 100) return 'bg-red-600';
  if (progress >= 80) return 'bg-orange-500';
  if (progress >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getRiskLevel = (score: number) => {
  if (score >= 80) return RISK_LEVELS.critical;
  if (score >= 60) return RISK_LEVELS.high;
  if (score >= 40) return RISK_LEVELS.medium;
  return RISK_LEVELS.low;
};

const getStatusBadge = (status: string, isLate: boolean = false) => {
  const step = WORKFLOW_STEPS.find(s => s.status === status);
  
  if (!step) {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (isLate) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs">
        <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3" />
        {step.label} (Retard)
      </Badge>
    );
  }

  return (
    <Badge className={`${step.bgColor} ${step.textColor} border ${step.borderColor} px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs`}>
      {step.label}
    </Badge>
  );
};

const getPriorityColor = (priority: string = 'standard') => {
  return CLIENT_PRIORITY[priority as keyof typeof CLIENT_PRIORITY]?.bgClass || 
    'bg-gray-100 text-gray-700 border-gray-200';
};

const getPerformanceLevel = (score: number) => {
  if (score >= 90) return TEAM_PERFORMANCE.excellent;
  if (score >= 75) return TEAM_PERFORMANCE.good;
  if (score >= 60) return TEAM_PERFORMANCE.average;
  if (score >= 40) return TEAM_PERFORMANCE.below;
  return TEAM_PERFORMANCE.poor;
};

const generateSmartAdvice = (order: Order, context: any): string[] => {
  const advice: string[] = [];
  const step = WORKFLOW_STEPS.find(s => s.status === order.status);
  
  if (!step) return [];

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  switch (order.status) {
    case 'to_pickup':
      if (order.isLate) {
        advice.push('⚠️ Retard de collecte - Contacter le client pour vous excuser et reprogrammer');
        advice.push('📞 Proposer un geste commercial (livraison offerte, réduction)');
        advice.push('📍 Vérifier la disponibilité immédiate d\'un livreur');
      } else {
        advice.push('✅ Contacter le client 30min avant pour confirmer sa présence');
        advice.push('📍 Vérifier l\'itinéraire et les conditions de circulation');
        if (order.clientPriority === 'vip') {
          advice.push('👑 Client VIP - Appel de courtoisie recommandé');
        }
      }
      break;
      
    case 'to_sort':
      advice.push('🔍 Vérifier les étiquettes pour les instructions spéciales');
      advice.push('📝 Noter les taches spécifiques pour un traitement adapté');
      advice.push('🎨 Séparer les vêtements délicats (soie, laine)');
      if (order.itemCount && order.itemCount > 30) {
        advice.push(`⚠️ Lot important (${order.itemCount} pièces) - Mobiliser 2 personnes`);
      }
      break;
      
    case 'to_wash':
      if (order.itemCount && order.itemCount > 50) {
        advice.push('⚠️ Charge importante - Envisager plusieurs cycles');
      }
      advice.push('🌡️ Température adaptée au type de tissu');
      advice.push('🧪 Utiliser les produits spécifiques si taches');
      if (order.specialInstructions?.toLowerCase().includes('tache')) {
        advice.push('🔬 Prétraitement des taches avant lavage');
      }
      break;
      
    case 'to_dry':
      advice.push('☀️ Privilégier séchage à l\'air pour les tissus délicats');
      advice.push('⏱️ Ne pas sur-sécher pour éviter le rétrécissement');
      if (hour > 18) {
        advice.push('🌙 Séchage de nuit - Vérifier l\'humidité résiduelle');
      }
      break;
      
    case 'to_iron':
      advice.push('🔥 Adapter la température au tissu (coton > lin > soie)');
      advice.push('💧 Utiliser la vapeur pour les tissus froissés');
      if (order.clientPriority === 'vip') {
        advice.push('👑 Soins particuliers pour client VIP');
      }
      break;
      
    case 'ready_to_deliver':
      advice.push('📦 Vérifier la quantité avant emballage');
      advice.push('🏷️ Étiqueter clairement avec le nom du client');
      advice.push('✅ Photo de la commande emballée pour traçabilité');
      break;
      
    case 'to_deliver':
      if (order.scheduledDeliveryDate) {
        const deliveryTime = parseISO(order.scheduledDeliveryDate);
        if (deliveryTime < now) {
          advice.push('⚠️ Retard de livraison - Contacter le client immédiatement');
          advice.push('📱 Envoyer une notification d\'excuse');
        } else {
          const timeLeft = differenceInMinutes(deliveryTime, now);
          if (timeLeft < 30) {
            advice.push(`⏰ Livraison dans ${timeLeft}min - Contacter le client`);
          }
        }
      }
      advice.push('🗺️ Optimiser l\'itinéraire pour minimiser les délais');
      advice.push('📞 Appeler le client à l\'approche');
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        advice.push('📆 Week-end - Vérifier les horaires de livraison');
      }
      break;
  }

  if (order.time_in_status) {
    const stepSla = step.sla * 60;
    const timePercent = (order.time_in_status / stepSla) * 100;
    
    if (timePercent > 80) {
      advice.push(`⏰ ${formatDuration(stepSla - order.time_in_status)} restant avant dépassement SLA`);
    }
    
    if (order.time_in_status > stepSla * 1.5) {
      advice.push('🚨 DÉPASSEMENT CRITIQUE - Action immédiate requise');
      advice.push('🔄 Réaffecter les ressources si nécessaire');
    }
  }

  if (hour >= 7 && hour <= 9) {
    advice.push('🚗 Heure de pointe matinale - Prévoir +15min de trajet');
  } else if (hour >= 12 && hour <= 14) {
    advice.push('🍽️ Heure du déjeuner - Anticiper la pause des équipes');
  } else if (hour >= 17 && hour <= 19) {
    advice.push('🚗 Heure de pointe soirée - Prévoir +20min de trajet');
  } else if (hour >= 22 || hour <= 5) {
    advice.push('🌙 Horaires de nuit - Équipe réduite');
  }

  if (order.clientPriority) {
    const priority = CLIENT_PRIORITY[order.clientPriority as keyof typeof CLIENT_PRIORITY];
    advice.push(`${priority.icon} ${priority.description}`);
  }

  if (order.risk_score) {
    const riskLevel = getRiskLevel(order.risk_score);
    advice.push(`🎯 Risque ${riskLevel.label.toLowerCase()} - ${riskLevel.action}`);
  }

  if (hour >= 14 && hour <= 17 && Math.random() > 0.7) {
    advice.push('☔ Risque d\'averses - Prévoir protection pour les livraisons');
  }

  return [...new Set(advice)].slice(0, 4);
};

const generateRiskAnalysis = (order: Order): string[] => {
  const analysis: string[] = [];
  
  if (!order.risk_score) return analysis;

  const riskLevel = getRiskLevel(order.risk_score);
  
  analysis.push(`📊 Niveau de risque: ${riskLevel.label}`);
  
  if (order.time_in_status) {
    const step = WORKFLOW_STEPS.find(s => s.status === order.status);
    if (step) {
      const expectedTime = step.sla * 60;
      const deviation = ((order.time_in_status - expectedTime) / expectedTime) * 100;
      
      if (deviation > 50) {
        analysis.push(`⚠️ Déviation: ${Math.round(deviation)}% au-dessus de la normale`);
      }
    }
  }
  
  if (order.isLate) {
    analysis.push(`⏱️ Retard: ${order.lateHours || 0}h`);
  }
  
  if (order.anomaly_detected) {
    analysis.push('🔄 Anomalie de flux détectée');
  }
  
  return analysis;
};

// Composant Carte amélioré avec données réelles
const DeliveryMap = ({ deliveries, drivers }: { deliveries: Delivery[], drivers: User[] }) => {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  
  const driverPositions = drivers
    .filter(d => d.location)
    .map(d => ({
      lat: d.location!.lat,
      lng: d.location!.lng,
      name: d.fullName,
      status: d.isActive ? 'active' : 'offline',
      deliveries: deliveries.filter(del => del.deliveryPersonId === d.id).length
    }));

  const positions = driverPositions.length > 0 ? driverPositions : [
    { lat: -18.8792, lng: 47.5079, name: 'Ivandry', status: 'active', deliveries: 3 },
    { lat: -18.8869, lng: 47.5256, name: 'Analakely', status: 'delivering', deliveries: 2 },
    { lat: -18.9000, lng: 47.5200, name: 'Isoraka', status: 'available', deliveries: 0 },
    { lat: -18.9100, lng: 47.5300, name: 'Ankorondrano', status: 'active', deliveries: 4 },
    { lat: -18.8700, lng: 47.5400, name: 'Alarobia', status: 'delivering', deliveries: 1 },
  ];

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        {positions.map((pos, idx) => (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${20 + idx * 15}%`, top: `${30 + idx * 10}%` }}
            onClick={() => setSelectedDriver(idx)}
          >
            <div className={`relative ${
              pos.status === 'delivering' ? 'animate-pulse' : ''
            }`}>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${pos.status === 'active' ? 'bg-green-500' : 
                  pos.status === 'delivering' ? 'bg-blue-500 animate-bounce' : 
                  pos.status === 'available' ? 'bg-yellow-500' :
                  'bg-gray-500'}
                shadow-lg ring-4 ring-white/20
              `}>
                {pos.status === 'delivering' ? (
                  <Truck className="h-6 w-6 text-white" />
                ) : pos.status === 'active' ? (
                  <User className="h-6 w-6 text-white" />
                ) : (
                  <Navigation2 className="h-6 w-6 text-white" />
                )}
              </div>
              
              <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
              
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                <div className="bg-white rounded-lg shadow-xl p-2 min-w-[150px]">
                  <p className="text-xs font-semibold">{pos.name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">
                    {pos.status === 'active' ? 'Actif' : 
                     pos.status === 'delivering' ? 'En livraison' : 
                     pos.status === 'available' ? 'Disponible' : 'Hors ligne'}
                  </p>
                  <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                    <span>{pos.deliveries} livraisons</span>
                    <span>E.T.A: {Math.floor(Math.random() * 20) + 5}min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
          <h4 className="text-xs font-semibold mb-2">Légende</h4>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>Actif</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse mr-2" />
              <span>En livraison</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <span>Disponible</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-lg font-bold">{drivers.filter(d => d.isActive).length}</p>
              <p className="text-[8px]">Actifs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{deliveries.filter(d => d.status === 'in_progress').length}</p>
              <p className="text-[8px]">En cours</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{deliveries.filter(d => d.status === 'completed' && 
                d.completedDate && format(parseISO(d.completedDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}</p>
              <p className="text-[8px]">Aujourd'hui</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de pagination amélioré
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];
     let l: number;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-2 py-3 sm:px-4 bg-gray-100 rounded-lg shadow-sm">
      <div className="flex items-center text-[10px] sm:text-xs text-gray-700 font-medium">
        <span>Page {currentPage} sur {totalPages}</span>
        {totalItems && (
          <span className="ml-2 text-gray-600">({totalItems} éléments)</span>
        )}
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
        >
          <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-[10px] sm:text-xs font-medium ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-1 text-gray-500 text-xs font-medium">...</span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
        >
          <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============ COMPOSANT PRINCIPAL ============

export default function SupervisorDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============ STATE ============
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedOrderForNote, setSelectedOrderForNote] = useState<Order | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false);
  const [showOnlyLate, setShowOnlyLate] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'risk' | 'status'>('priority');
  const [showAdvice, setShowAdvice] = useState(true);
  const [sortingDialogOpen, setSortingDialogOpen] = useState(false);
  const [selectedOrderForSorting, setSelectedOrderForSorting] = useState<Order | null>(null);
  const [sortingItemCount, setSortingItemCount] = useState<number>(0);
  const [sortingNotes, setSortingNotes] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [teamViewMode, setTeamViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'productivity' | 'satisfaction'>('performance');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [driversPage, setDriversPage] = useState(1);
  const [agentsPage, setAgentsPage] = useState(1);
  const [predictionsPage, setPredictionsPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // ============ QUERIES ============
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['/api/sla/orders'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<Delivery[]>({
    queryKey: ['/api/deliveries'],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: slaStats, isLoading: statsLoading } = useQuery<SLAMetrics>({
    queryKey: ['/api/sla/stats'],
    refetchInterval: autoRefresh ? 300000 : false,
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery<{ predictions: Prediction[], summary: any }>({
    queryKey: ['/api/supervisor/predictions'],
    refetchInterval: autoRefresh ? 300000 : false,
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/supervisor/recommendations'],
    refetchInterval: autoRefresh ? 3600000 : false,
  });

  const { data: teamStats, isLoading: teamStatsLoading } = useQuery<TeamStats>({
    queryKey: ['/api/team/stats'],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // ============ MUTATIONS ============
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, itemCount, notes }: { orderId: number; status: string; itemCount?: number; notes?: string }) => {
      const payload: any = { 
        status, 
        statusChangedAt: new Date().toISOString() 
      };
      
      if (status === 'to_sort' && itemCount) {
        payload.itemCount = itemCount;
      }
      
      if (notes) {
        payload.specialInstructions = notes;
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sla/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/predictions'] });
      
      const messages: Record<string, string> = {
        to_pickup: '✅ Ramassage programmé',
        to_sort: '✅ Articles comptés et tri validé',
        to_wash: '✅ Passage en lavage',
        to_dry: '✅ Passage en séchage',
        to_iron: '✅ Passage en repassage',
        ready_to_deliver: '✅ Commande prête pour livraison',
        to_deliver: '✅ En cours de livraison',
        delivered: '✅ Commande livrée',
      };
      
      toast({
        title: 'Mise à jour effectuée',
        description: messages[variables.status] || '✅ Statut mis à jour avec succès',
      });
      
      if (variables.status === 'to_sort') {
        setSortingDialogOpen(false);
        setSelectedOrderForSorting(null);
        setSortingItemCount(0);
        setSortingNotes('');
      }
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ orderId, content }: { orderId: number; content: string }) => {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          noteType: 'supervisor',
          mentions: [] 
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'ajout de la note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setNoteDialogOpen(false);
      setNewNoteContent('');
      setSelectedOrderForNote(null);
      toast({
        title: '📝 Note ajoutée',
        description: 'La note a été enregistrée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resolveLateMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/orders/${orderId}/resolve-late`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur lors de la résolution du retard');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sla/stats'] });
      toast({
        title: '⏱️ Retard résolu',
        description: 'Le retard a été marqué comme résolu',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ deliveryId, driverId }: { deliveryId: number; driverId: number }) => {
      const res = await fetch(`/api/deliveries/${deliveryId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPersonId: driverId }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'assignation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team/stats'] });
      toast({
        title: '✅ Assignation réussie',
        description: 'La livraison a été assignée au livreur',
      });
    },
  });

  const triggerSLAUpdate = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sla/update-all', { method: 'POST' });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour SLA');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sla/stats'] });
      toast({
        title: '🔄 SLA mis à jour',
        description: `${data.updated} commandes analysées, ${data.alerts} alertes`,
      });
    },
  });

  // ============ EFFECTS ============
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (predictions?.predictions?.filter(p => p.riskScore > 80).length) {
      const criticalCount = predictions.predictions.filter(p => p.riskScore > 80).length;
      
      toast({
        title: '🚨 Alertes critiques',
        description: `${criticalCount} commande(s) en danger immédiat`,
        variant: 'destructive',
      });

      if (notificationPermission === 'granted') {
        const notification = new Notification('🚨 Alertes critiques - SV Pressing', {
          body: `${criticalCount} commande(s) nécessitent une action immédiate`,
          icon: '/assets/img/Sasavanda_Gris.png',
          badge: '/favicon.ico',
          tag: 'critical-alerts',
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          setActiveTab('monitoring');
        };
      }
    }
  }, [predictions, notificationPermission, toast]);

  // ============ COMPUTED VALUES ============
  const clients = users.filter(u => u.role === 'client');
  const agents = users.filter(u => u.role === 'agent');
  const drivers = users.filter(u => u.role === 'delivery');
  const admins = users.filter(u => u.role === 'admin');
  const supervisors = users.filter(u => u.role === 'supervisor');

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const lateOrders = activeOrders.filter(o => o.isLate);
  const anomalyOrders = activeOrders.filter(o => o.anomaly_detected);

  const filteredOrders = useMemo(() => {
    return activeOrders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (slaFilter !== 'all' && order.sla_level !== slaFilter) return false;
      if (priorityFilter !== 'all' && order.clientPriority !== priorityFilter) return false;
      if (riskFilter !== 'all') {
        const riskLevel = getRiskLevel(order.risk_score || 0);
        if (riskLevel.label.toLowerCase() !== riskFilter) return false;
      }
      if (showOnlyAnomalies && !order.anomaly_detected) return false;
      if (showOnlyLate && !order.isLate) return false;
      
      if (searchQuery) {
        const client = clients.find(c => c.id === order.clientId);
        const searchLower = searchQuery.toLowerCase();
        return (
          order.id.toString().includes(searchQuery) ||
          client?.fullName.toLowerCase().includes(searchLower) ||
          client?.phone?.includes(searchQuery) ||
          client?.neighborhood?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [activeOrders, statusFilter, slaFilter, priorityFilter, riskFilter, showOnlyAnomalies, showOnlyLate, searchQuery, clients]);

  const sortedOrders = useMemo(() => {
    const orderCopy = [...filteredOrders];
    
    switch (sortBy) {
      case 'priority':
        const levelOrder: Record<string, number> = { retard: 0, urgent: 1, attention: 2, normal: 3 };
        return orderCopy.sort((a, b) => 
          (levelOrder[a.sla_level || 'normal'] - levelOrder[b.sla_level || 'normal'])
        );
      
      case 'time':
        return orderCopy.sort((a, b) => (b.time_in_status || 0) - (a.time_in_status || 0));
      
      case 'risk':
        return orderCopy.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      
      case 'status':
        return orderCopy.sort((a, b) => a.status.localeCompare(b.status));
      
      default:
        return orderCopy;
    }
  }, [filteredOrders, sortBy]);

  const paginatedOrders = sortedOrders.slice(
    (ordersPage - 1) * ordersPerPage,
    ordersPage * ordersPerPage
  );

  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);
  const urgentCount = activeOrders.filter(o => o.sla_level === 'urgent' || o.sla_level === 'retard').length;
  const anomalyCount = activeOrders.filter(o => o.anomaly_detected).length;
  const criticalCount = predictions?.predictions?.filter(p => p.riskScore > 80).length || 0;

  const driverPerformance = useMemo(() => {
    return drivers.map(driver => {
      const driverDeliveries = deliveries.filter(d => d.deliveryPersonId === driver.id);
      const completed = driverDeliveries.filter(d => d.status === 'completed').length;
      const inProgress = driverDeliveries.filter(d => d.status === 'in_progress').length;
      const onTime = driverDeliveries.filter(d => {
        if (!d.completedDate || !d.estimatedDuration) return false;
        const actual = differenceInMinutes(parseISO(d.completedDate), parseISO(d.scheduledDate || ''));
        return actual <= (d.estimatedDuration || 60);
      }).length;
      
      const totalDistance = driverDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
      const satisfaction = completed > 0 ? Math.min(100, 80 + (onTime / completed) * 20) : 100;
      
      return {
        ...driver,
        performance: {
          completed,
          inProgress,
          onTime: completed > 0 ? (onTime / completed) * 100 : 100,
          rating: completed > 0 ? Math.round((onTime / completed) * 5) : 5,
          productivity: completed > 0 ? Math.round((completed * 60) / 8) : 0,
          satisfaction: Math.round(satisfaction),
          totalDistance: Math.round(totalDistance * 10) / 10,
          trends: driver.performance?.trends || {
            daily: [65, 70, 75, 80, 85, 82, 78],
            weekly: [70, 72, 75, 78, 80, 82, 85],
            monthly: [75, 78, 80, 82, 85, 88, 90]
          }
        },
        stats: {
          totalOrders: driverDeliveries.length,
          completedToday: driverDeliveries.filter(d => 
            d.completedDate && format(parseISO(d.completedDate), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
          ).length,
          avgTime: driverDeliveries.filter(d => d.actualDuration).reduce((sum, d) => sum + (d.actualDuration || 0), 0) / Math.max(1, completed),
          lateCount: driverDeliveries.filter(d => {
            if (!d.completedDate || !d.estimatedDuration) return false;
            const actual = differenceInMinutes(parseISO(d.completedDate), parseISO(d.scheduledDate || ''));
            return actual > (d.estimatedDuration || 60);
          }).length
        }
      };
    });
  }, [drivers, deliveries, now]);

  const paginatedDrivers = useMemo(() => {
    const start = (driversPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return driverPerformance.slice(start, end);
  }, [driverPerformance, driversPage, itemsPerPage]);

  const totalDriversPages = Math.ceil(driverPerformance.length / itemsPerPage);

  const paginatedPredictions = useMemo(() => {
    if (!predictions?.predictions) return [];
    const start = (predictionsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return predictions.predictions.slice(start, end);
  }, [predictions, predictionsPage, itemsPerPage]);

  const totalPredictionsPages = Math.ceil((predictions?.predictions?.length || 0) / itemsPerPage);

  const paginatedRecommendations = useMemo(() => {
    if (!recommendations) return [];
    const start = (recommendationsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return recommendations.slice(start, end);
  }, [recommendations, recommendationsPage, itemsPerPage]);

  const totalRecommendationsPages = Math.ceil((recommendations?.length || 0) / itemsPerPage);

  const agentPerformance = useMemo(() => {
    return agents.map(agent => {
      const agentOrders = activeOrders.filter(o => o.assignedTo === agent.id);
      const completed = agentOrders.filter(o => o.status === 'delivered').length;
      
      return {
        ...agent,
        performance: {
          assigned: agentOrders.length,
          completed,
          productivity: agentOrders.length > 0 ? Math.round((completed / agentOrders.length) * 100) : 100,
          rating: agent.performance?.rating || Math.floor(Math.random() * 20) + 80,
        }
      };
    });
  }, [agents, activeOrders]);

  const paginatedAgents = useMemo(() => {
    const start = (agentsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return agentPerformance.slice(start, end);
  }, [agentPerformance, agentsPage, itemsPerPage]);

  const totalAgentsPages = Math.ceil(agentPerformance.length / itemsPerPage);

  const teamAlerts = useMemo(() => {
    const alerts: Array<{
      type: 'info' | 'warning' | 'error';
      message: string;
      userId?: number;
    }> = [];
    
    const lateDrivers = driverPerformance.filter(d => d.performance?.onTime && d.performance.onTime < 70);
    lateDrivers.forEach(d => {
      alerts.push({
        type: 'warning' as const,
        message: `${d.fullName} a un taux de ponctualité de ${Math.round(d.performance?.onTime || 0)}%`,
        userId: d.id
      });
    });
    
    const inactiveDrivers = drivers.filter(d => {
      const todayDeliveries = deliveries.filter(del => 
        del.deliveryPersonId === d.id &&
        del.scheduledDate &&
        format(parseISO(del.scheduledDate), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
      );
      return todayDeliveries.length === 0;
    });
    inactiveDrivers.forEach(d => {
      alerts.push({
        type: 'info' as const,
        message: `${d.fullName} n'a pas de livraison aujourd'hui`,
        userId: d.id
      });
    });
    
    const overloadedAgents = agentPerformance.filter(a => (a.performance?.assigned || 0) > 15);
    overloadedAgents.forEach(a => {
      alerts.push({
        type: 'warning' as const,
        message: `${a.fullName} a ${a.performance?.assigned} commandes assignées`,
        userId: a.id
      });
    });
    
    return alerts;
  }, [driverPerformance, agentPerformance, drivers, deliveries, now]);

  const getTeamStats = useMemo((): TeamStats => {
    const activeDrivers = driverPerformance.filter(d => d.performance?.inProgress && d.performance.inProgress > 0);
    const onDuty = drivers.filter(d => d.isActive).length;
    
    const performanceByRole = {
      delivery: driverPerformance.reduce((sum, d) => sum + (d.performance?.onTime || 0), 0) / Math.max(1, driverPerformance.length),
      agent: agentPerformance.reduce((sum, a) => sum + (a.performance?.productivity || 0), 0) / Math.max(1, agentPerformance.length),
    };
    
    const topPerformers = [...driverPerformance, ...agentPerformance]
      .sort((a, b) => (b.performance?.rating || 0) - (a.performance?.rating || 0))
      .slice(0, 5);
    
    const distributionByZone = drivers.reduce((acc, d) => {
      const zone = d.neighborhood || 'Non assigné';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      onDuty,
      offDuty: drivers.length - onDuty,
      performance: {
        overall: (performanceByRole.delivery + performanceByRole.agent) / 2,
        byRole: performanceByRole,
      },
      distribution: {
        byRole: {
          admin: admins.length,
          supervisor: supervisors.length,
          agent: agents.length,
          delivery: drivers.length,
          client: clients.length,
        },
        byZone: distributionByZone,
      },
      topPerformers: topPerformers as User[],
      alerts: teamAlerts,
    };
  }, [users, drivers, agents, admins, supervisors, clients, driverPerformance, agentPerformance, teamAlerts]);

  // ============ HANDLERS ============
  const handleStatusChange = (order: Order, newStatus: string) => {
    if (newStatus === 'to_sort') {
      setSelectedOrderForSorting(order);
      setSortingItemCount(order.itemCount || 0);
      setSortingNotes('');
      setSortingDialogOpen(true);
      return;
    }

    updateOrderStatusMutation.mutate({ 
      orderId: order.id, 
      status: newStatus 
    });
  };

  const handleSortingConfirm = () => {
    if (!selectedOrderForSorting) return;
    
    if (sortingItemCount <= 0) {
      toast({
        title: '❌ Erreur',
        description: 'Le nombre d\'articles doit être supérieur à 0',
        variant: 'destructive',
      });
      return;
    }

    updateOrderStatusMutation.mutate({
      orderId: selectedOrderForSorting.id,
      status: 'to_sort',
      itemCount: sortingItemCount,
      notes: sortingNotes || undefined
    });
  };

  const handleAddNote = () => {
    if (!selectedOrderForNote || !newNoteContent.trim()) return;
    addNoteMutation.mutate({
      orderId: selectedOrderForNote.id,
      content: newNoteContent.trim(),
    });
  };

  const handleResolveLate = (orderId: number) => {
    resolveLateMutation.mutate(orderId);
  };

  const handleRefresh = () => {
    refetchOrders();
    triggerSLAUpdate.mutate();
  };

  const handleOrderClick = (order: Order) => {
    console.log('✅ handleOrderClick appelé avec:', order);
    if (!order) {
      console.error('❌ Order est null');
      return;
    }
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
    console.log('✅ Dialog ouvert pour commande:', order.id);
  };

  const handleAssignDelivery = (deliveryId: number, driverId: number) => {
    assignDeliveryMutation.mutate({ deliveryId, driverId });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({
          title: '✅ Notifications activées',
          description: 'Vous recevrez les alertes en temps réel',
        });
      }
    }
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-200/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-2 sm:py-0">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  <img
                    src="/assets/img/Sasavanda_Gris.png"
                    alt="SV Pressing"
                    className="relative h-8 sm:h-10 w-auto rounded-full ring-2 ring-white"
                  />
                  <div className="absolute -top-0.5 -right-0.5">
                    <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-green-500"></span>
                    </span>
                  </div>
                </div>
                <div className="h-4 w-px sm:h-6 bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden sm:block" />
                <div className="hidden sm:block">
                  <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    Supervision Intelligente
                  </h1>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(now, 'EEEE dd MMMM • HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div className="sm:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 mt-2 sm:mt-0 w-full sm:w-auto bg-gray-50/50 p-1.5 sm:p-2 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-blue-600 scale-75 sm:scale-100"
                />
                <Label htmlFor="auto-refresh" className="text-[10px] sm:text-xs text-gray-600 font-medium">
                  Auto
                </Label>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={triggerSLAUpdate.isPending}
                      className="h-7 w-7 sm:h-9 sm:w-9 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all duration-300"
                    >
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${triggerSLAUpdate.isPending ? 'animate-spin text-blue-600' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>Actualiser les données</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 sm:h-9 sm:w-9 bg-white hover:bg-blue-50 relative"
                  onClick={handleRequestNotificationPermission}
                >
                  {notificationPermission === 'granted' ? (
                    <BellRing className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  ) : notificationPermission === 'denied' ? (
                    <BellOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  ) : (
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
                {urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-[8px] sm:text-[10px] text-white items-center justify-center font-bold">
                      {urgentCount}
                    </span>
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full p-0 hover:ring-2 hover:ring-blue-200 transition-all duration-300">
                    <Avatar className="h-7 w-7 sm:h-9 sm:w-9 bg-gradient-to-br from-blue-600 to-purple-600">
                      <AvatarFallback className="text-white text-xs sm:text-sm">
                        {user?.fullName?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 ring-2 ring-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 sm:w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base font-semibold truncate">{user?.fullName}</span>
                      <span className="text-xs text-gray-500">Superviseur Principal</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('team')} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span className="text-sm">Mon équipe</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="text-sm">Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span className="text-sm">Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Bannière d'alerte */}
      {(urgentCount > 0 || criticalCount > 0 || anomalyCount > 0) && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mt-2 sm:mt-4 animate-slideDown">
          <Alert className={`border-l-4 ${
            criticalCount > 0 ? 'border-l-red-500 bg-red-50' :
            urgentCount > 0 ? 'border-l-orange-500 bg-orange-50' :
            'border-l-yellow-500 bg-yellow-50'
          }`}>
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              {criticalCount > 0 ? (
                <AlertOctagon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse" />
              ) : urgentCount > 0 ? (
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              ) : (
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <AlertTitle className={`text-xs sm:text-sm font-semibold ${
                  criticalCount > 0 ? 'text-red-800' :
                  urgentCount > 0 ? 'text-orange-800' :
                  'text-yellow-800'
                }`}>
                  {criticalCount > 0 
                    ? `${criticalCount} commande(s) en danger immédiat !` 
                    : urgentCount > 0
                      ? `${urgentCount} commande(s) nécessitent votre attention`
                      : `${anomalyCount} anomalie(s) de flux détectée(s)`}
                </AlertTitle>
                <AlertDescription className={`text-[10px] sm:text-xs ${
                  criticalCount > 0 ? 'text-red-700' :
                  urgentCount > 0 ? 'text-orange-700' :
                  'text-yellow-700'
                }`}>
                  {criticalCount > 0 
                    ? 'Action immédiate requise pour éviter des retards majeurs'
                    : urgentCount > 0
                      ? 'Intervention rapide recommandée'
                      : 'Vérifier les commandes bloquées dans le flux'}
                </AlertDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className={`text-xs border-2 ${
                  criticalCount > 0 ? 'border-red-200 text-red-700 hover:bg-red-100' :
                  urgentCount > 0 ? 'border-orange-200 text-orange-700 hover:bg-orange-100' :
                  'border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                }`}
                onClick={() => setActiveTab('monitoring')}
              >
                Voir
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-xl p-1 rounded-2xl border border-gray-200/50 shadow-lg overflow-x-auto">
            <TabsTrigger 
              value="dashboard" 
              className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Gauge className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 relative"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Commandes</span>
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-5 sm:w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 sm:h-5 sm:w-5 bg-red-500 text-[8px] sm:text-[10px] text-white items-center justify-center font-bold">
                    {urgentCount}
                  </span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Monitoring</span>
              {criticalCount > 0 && (
                <span className="ml-1 sm:ml-2 inline-flex h-3 w-3 sm:h-5 sm:w-5 rounded-full bg-red-500 text-[8px] sm:text-[10px] text-white items-center justify-center font-bold animate-pulse">
                  {criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Analyses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Équipe</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs text-blue-100 font-medium uppercase tracking-wider">Commandes actives</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1 sm:mt-2">{activeOrders.length}</p>
                      <p className="text-[8px] sm:text-xs text-blue-200 mt-1 sm:mt-2 flex items-center">
                        <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        +{Math.round(activeOrders.length * 0.15)} aujourd'hui
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-500/30 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <Package className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-100" />
                    </div>
                  </div>
                  <Progress value={75} className="mt-2 sm:mt-4 h-1 bg-blue-500/30" indicatorClassName="bg-white" />
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs text-green-100 font-medium uppercase tracking-wider">Ponctualité</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1 sm:mt-2">
                        {activeOrders.length > 0
                          ? Math.round(((activeOrders.length - (slaStats?.byLevel?.retard || 0)) / activeOrders.length) * 100)
                          : 100}%
                      </p>
                      <p className="text-[8px] sm:text-xs text-green-200 mt-1 sm:mt-2">Objectif: 95%</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-500/30 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <Target className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-100" />
                    </div>
                  </div>
                  <Progress 
                    value={activeOrders.length > 0
                      ? ((activeOrders.length - (slaStats?.byLevel?.retard || 0)) / activeOrders.length) * 100
                      : 100} 
                    className="mt-2 sm:mt-4 h-1 bg-green-500/30" 
                    indicatorClassName="bg-white"
                  />
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs text-purple-100 font-medium uppercase tracking-wider">Risque moyen</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1 sm:mt-2">
                        {Math.round((slaStats?.averageRiskScore || 0) * 100)}%
                      </p>
                      <p className="text-[8px] sm:text-xs text-purple-200 mt-1 sm:mt-2">
                        {criticalCount} critique(s)
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-purple-500/30 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <Brain className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-100" />
                    </div>
                  </div>
                  <Progress 
                    value={(slaStats?.averageRiskScore || 0) * 100} 
                    className="mt-2 sm:mt-4 h-1 bg-purple-500/30" 
                    indicatorClassName="bg-white"
                  />
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 text-white hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs text-orange-100 font-medium uppercase tracking-wider">Temps de cycle</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1 sm:mt-2">
                        {completedOrders.length > 0
                          ? Math.round(
                              completedOrders.reduce((acc, o) => {
                                if (!o.actualDeliveryDate || !o.createdAt) return acc;
                                const diff = differenceInHours(
                                  parseISO(o.actualDeliveryDate),
                                  parseISO(o.createdAt)
                                );
                                return acc + diff;
                              }, 0) / completedOrders.length
                            )
                          : 0}h
                      </p>
                      <p className="text-[8px] sm:text-xs text-orange-200 mt-1 sm:mt-2">Objectif: 24h</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-orange-500/30 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <Timer className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-100" />
                    </div>
                  </div>
                  <Progress 
                    value={completedOrders.length > 0
                      ? (Math.round(
                          completedOrders.reduce((acc, o) => {
                            if (!o.actualDeliveryDate || !o.createdAt) return acc;
                            const diff = differenceInHours(
                              parseISO(o.actualDeliveryDate),
                              parseISO(o.createdAt)
                            );
                            return acc + diff;
                          }, 0) / completedOrders.length
                        ) / 24) * 100
                      : 0} 
                    className="mt-2 sm:mt-4 h-1 bg-orange-500/30" 
                    indicatorClassName="bg-white"
                  />
                </CardContent>
              </Card>
            </div>

            {/* État SLA */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
                <CardTitle className="text-sm sm:text-base flex items-center">
                  <Gauge className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  État des lieux SLA
                </CardTitle>
                <CardDescription className="text-blue-100 text-[10px] sm:text-xs">
                  Répartition des commandes par niveau de priorité
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {Object.entries(SLA_LEVELS).map(([key, level]) => {
                    const count = slaStats?.byLevel?.[key as keyof typeof slaStats.byLevel] || 0;
                    const Icon = level.icon;
                    
                    return (
                      <Card key={key} className={`${level.bgClass} border ${level.borderClass} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                        <CardContent className="p-2 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-[8px] sm:text-xs ${level.textClass} font-medium`}>{level.label}</p>
                              <p className={`text-sm sm:text-xl lg:text-2xl font-bold ${level.textClass}`}>{count}</p>
                            </div>
                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${level.textClass}`} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-500" />
                    Flux par étape
                  </h3>
                  
                  {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => {
                    const stepStats = slaStats?.byStatus?.[step.status];
                    if (!stepStats || stepStats.total === 0) return null;
                    
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.status} className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-${step.color}-500`} />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700">{step.label}</span>
                          </div>
                          <span className="text-[8px] sm:text-xs text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                            {stepStats.total} cmd
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[8px] sm:text-xs">
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mr-1"></span>
                            <span className="text-green-600">{stepStats.normal || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500 mr-1"></span>
                            <span className="text-yellow-600">{stepStats.attention || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 mr-1"></span>
                            <span className="text-orange-600">{stepStats.urgent || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-1"></span>
                            <span className="text-red-600">{stepStats.retard || 0}</span>
                          </div>
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative">
                                <Progress
                                  value={stepStats.avgProgress || 0}
                                  className="h-1.5 sm:h-2 cursor-help"
                                  indicatorClassName={`bg-${step.color}-500`}
                                />
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                  <div className="relative w-full h-full">
                                    <div className="absolute top-0 left-[60%] w-0.5 h-full bg-yellow-400 opacity-50" />
                                    <div className="absolute top-0 left-[80%] w-0.5 h-full bg-orange-500 opacity-50" />
                                    <div className="absolute top-0 left-[100%] w-0.5 h-full bg-red-500 opacity-50" />
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              <p>Temps moyen: {Math.round(stepStats.avgProgress)}% du SLA</p>
                              <p className="text-[10px] text-gray-400">SLA: {step.sla}h</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </div>

                {slaStats?.bottlenecks && slaStats.bottlenecks.length > 0 && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center mb-3">
                      <AlertOctagon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-red-500" />
                      Goulots d'étranglement
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {slaStats.bottlenecks.map((bottleneck, index) => {
                        const step = WORKFLOW_STEPS.find(s => s.status === bottleneck.status);
                        const severityColors = {
                          low: 'border-yellow-200 bg-yellow-50',
                          medium: 'border-orange-200 bg-orange-50',
                          high: 'border-red-200 bg-red-50'
                        };
                        
                        return (
                          <Card key={index} className={severityColors[bottleneck.severity]}>
                            <CardContent className="p-2 sm:p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {step && <step.icon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-${step.color}-600`} />}
                                  <span className="text-[10px] sm:text-xs font-medium">{step?.label}</span>
                                </div>
                                <Badge variant="outline" className={`text-[8px] sm:text-xs ${
                                  bottleneck.severity === 'high' ? 'bg-red-100 text-red-700' :
                                  bottleneck.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {bottleneck.count} en attente
                                </Badge>
                              </div>
                              <p className="text-[8px] sm:text-xs text-gray-600 mt-1">
                                Temps moyen: {formatDuration(bottleneck.avgTime)}
                              </p>
                              <p className="text-[8px] sm:text-xs text-gray-500 mt-0.5">
                                Impact: {bottleneck.impact}
                              </p>
                              <Progress 
                                value={(bottleneck.avgTime / (step?.sla ? step.sla * 60 : 240)) * 100}
                                className="h-1 sm:h-1.5 mt-1 sm:mt-2"
                                indicatorClassName={
                                  bottleneck.severity === 'high' ? 'bg-red-500' :
                                  bottleneck.severity === 'medium' ? 'bg-orange-500' :
                                  'bg-yellow-500'
                                }
                              />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prédictions et recommandations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Prédictions IA */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm sm:text-base flex items-center">
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Prédictions IA
                    </CardTitle>
                    {predictions?.predictions && predictions.predictions.length > itemsPerPage && (
                      <Pagination
                        currentPage={predictionsPage}
                        totalPages={totalPredictionsPages}
                        onPageChange={setPredictionsPage}
                      />
                    )}
                  </div>
                  <CardDescription className="text-purple-100 text-[10px] sm:text-xs">
                    Analyse prédictive des risques de retard
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                    <div className="space-y-2 sm:space-y-3">
                      {predictionsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                        ))
                      ) : paginatedPredictions.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                          </div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Aucune prédiction</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500">Toutes les commandes sont dans les temps</p>
                        </div>
                      ) : (
                        paginatedPredictions.map((pred) => {
                          const order = orders.find(o => o.id === pred.orderId);
                          const client = clients.find(c => c.id === order?.clientId);
                          const riskLevel = getRiskLevel(pred.riskScore);
                          const PriorityIcon = order?.clientPriority ? getPriorityIcon(order.clientPriority) : User;
                          
                          return (
                            <Card 
                              key={pred.orderId} 
                              className={`border-l-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                                pred.riskScore > 80 ? 'border-l-red-500' :
                                pred.riskScore > 60 ? 'border-l-orange-500' :
                                pred.riskScore > 40 ? 'border-l-yellow-500' :
                                'border-l-green-500'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Clic sur prédiction:', pred.orderId);
                                if (order) {
                                  handleOrderClick(order);
                                } else {
                                  toast({
                                    title: '❌ Erreur',
                                    description: 'Commande non trouvée',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex justify-between items-start mb-1 sm:mb-2">
                                  <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">#{pred.orderId}</span>
                                    <Badge className={`text-[8px] sm:text-xs ${riskLevel.bgClass} ${riskLevel.textClass}`}>
                                      {riskLevel.icon && <riskLevel.icon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
                                      {Math.round(pred.riskScore)}%
                                    </Badge>
                                    <Badge className={`text-[8px] sm:text-xs ${
                                      pred.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                      pred.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {pred.confidence === 'high' ? 'Élevée' :
                                       pred.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                                    </Badge>
                                  </div>
                                  <span className="text-[8px] sm:text-xs text-gray-400">
                                    {formatRelativeTime(order?.createdAt || '')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-1 sm:mb-2">
                                  <p className="text-[8px] sm:text-xs text-gray-600 truncate" title={client?.fullName}>
                                    👤 {client?.fullName || 'Inconnu'}
                                  </p>
                                  <p className="text-[8px] sm:text-xs text-gray-600">
                                    📍 {client?.neighborhood || 'N/A'}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-1 sm:mb-2">
                                  <div className="bg-gray-50 p-1 sm:p-1.5 rounded">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Temps écoulé</p>
                                    <p className="text-[8px] sm:text-xs font-medium">{formatDuration(pred.timeInStatus)}</p>
                                  </div>
                                  {pred.predictedDelay > 0 && (
                                    <div className="bg-red-50 p-1 sm:p-1.5 rounded">
                                      <p className="text-[6px] sm:text-[8px] text-red-500">Retard prévu</p>
                                      <p className="text-[8px] sm:text-xs font-medium text-red-600">{formatDuration(pred.predictedDelay)}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={`${riskLevel.bgClass} p-1.5 sm:p-2 rounded-lg`}>
                                  <p className="text-[8px] sm:text-xs flex items-start">
                                    <Lightbulb className="h-2 w-2 sm:h-3 sm:w-3 mr-1 mt-0.5 flex-shrink-0" />
                                    <span>{pred.suggestedAction}</span>
                                  </p>
                                  {pred.reasoning && pred.reasoning.length > 0 && (
                                    <div className="mt-1 text-[6px] sm:text-[8px] text-gray-600">
                                      {pred.reasoning.slice(0, 2).map((reason, idx) => (
                                        <div key={idx} className="flex items-start">
                                          <span className="mr-1">•</span>
                                          <span>{reason}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recommandations intelligentes */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-4 sm:p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm sm:text-base flex items-center">
                      <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Recommandations intelligentes
                    </CardTitle>
                    {recommendations && recommendations.length > itemsPerPage && (
                      <Pagination
                        currentPage={recommendationsPage}
                        totalPages={totalRecommendationsPages}
                        onPageChange={setRecommendationsPage}
                      />
                    )}
                  </div>
                  <CardDescription className="text-yellow-100 text-[10px] sm:text-xs">
                    Actions suggérées pour optimiser les opérations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                    <div className="space-y-2 sm:space-y-3">
                      {recommendationsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                        ))
                      ) : paginatedRecommendations.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                          </div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Tout est optimisé</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500">Aucune recommandation pour le moment</p>
                        </div>
                      ) : (
                        paginatedRecommendations.map((rec, index) => {
                          const priorityColors = {
                            critical: 'border-red-200 bg-red-50',
                            high: 'border-orange-200 bg-orange-50',
                            medium: 'border-yellow-200 bg-yellow-50',
                            low: 'border-blue-200 bg-blue-50'
                          };
                          
                          const difficultyColors = {
                            easy: 'bg-green-100 text-green-700',
                            medium: 'bg-yellow-100 text-yellow-700',
                            hard: 'bg-orange-100 text-orange-700'
                          };
                          
                          const typeIcons = {
                            bottleneck: AlertOctagon,
                            risk: AlertTriangle,
                            optimization: Zap,
                            resource: Users,
                            traffic: Truck,
                            weather: Cloud,
                            quality: Star
                          };
                          
                          const Icon = typeIcons[rec.type] || Lightbulb;
                          
                          return (
                            <Card key={index} className={`${priorityColors[rec.priority]} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex items-start space-x-2 sm:space-x-3">
                                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                                    rec.priority === 'critical' ? 'bg-red-200' :
                                    rec.priority === 'high' ? 'bg-orange-200' :
                                    rec.priority === 'medium' ? 'bg-yellow-200' :
                                    'bg-blue-200'
                                  }`}>
                                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                      rec.priority === 'critical' ? 'text-red-700' :
                                      rec.priority === 'high' ? 'text-orange-700' :
                                      rec.priority === 'medium' ? 'text-yellow-700' :
                                      'text-blue-700'
                                    }`} />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900">{rec.title}</h4>
                                      <div className="flex items-center space-x-1">
                                        <Badge className={`text-[6px] sm:text-[8px] px-1 py-0 ${
                                          rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                          rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-blue-100 text-blue-700'
                                        }`}>
                                          {rec.priority === 'critical' ? 'Critique' :
                                           rec.priority === 'high' ? 'Haute' :
                                           rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                        </Badge>
                                        <Badge className={`text-[6px] sm:text-[8px] px-1 py-0 ${difficultyColors[rec.difficulty]}`}>
                                          {rec.difficulty === 'easy' ? 'Facile' :
                                           rec.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <p className="text-[8px] sm:text-xs text-gray-600 mb-2">{rec.description}</p>
                                    
                                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2">
                                      <div className="bg-white/50 p-1 rounded">
                                        <p className="text-[6px] sm:text-[8px] text-gray-500">Impact</p>
                                        <p className="text-[8px] sm:text-xs font-medium text-gray-700 truncate" title={rec.impact}>
                                          {rec.impact}
                                        </p>
                                      </div>
                                      <div className="bg-white/50 p-1 rounded">
                                        <p className="text-[6px] sm:text-[8px] text-gray-500">Timing</p>
                                        <p className="text-[8px] sm:text-xs font-medium text-gray-700">{rec.timeline}</p>
                                      </div>
                                      {rec.savings && (
                                        <div className="bg-green-50 p-1 rounded">
                                          <p className="text-[6px] sm:text-[8px] text-green-600">Économies</p>
                                          <p className="text-[8px] sm:text-xs font-medium text-green-700">{rec.savings}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {rec.actionable && (
                                      <div className="flex items-center justify-end space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                                        <Button size="sm" variant="ghost" className="h-6 text-[8px] sm:text-xs px-2">
                                          Plus tard
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          className={`h-6 text-[8px] sm:text-xs px-2 text-white ${
                                            rec.priority === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                                            rec.priority === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                                            rec.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                                          }`}
                                          onClick={() => {
                                            toast({
                                              title: 'Action déclenchée',
                                              description: rec.action,
                                            });
                                          }}
                                        >
                                          Appliquer
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            {/* Filtres */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                    <Input
                      placeholder="Rechercher par ID, client, téléphone, quartier..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 pr-20 text-xs sm:text-sm h-8 sm:h-10 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-gray-100 rounded-full"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-[8px] sm:text-xs text-gray-400">
                      {filteredOrders.length} résultats
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-24 sm:w-32 h-7 sm:h-9 text-[10px] sm:text-xs bg-white/50 border-gray-200 focus:border-blue-300">
                        <Filter className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => (
                          <SelectItem key={step.status} value={step.status}>
                            <div className="flex items-center">
                              <step.icon className="h-3 w-3 mr-2" />
                              {step.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={slaFilter} onValueChange={setSlaFilter}>
                      <SelectTrigger className="w-24 sm:w-28 h-7 sm:h-9 text-[10px] sm:text-xs bg-white/50 border-gray-200">
                        <Gauge className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <SelectValue placeholder="SLA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous niveaux</SelectItem>
                        {Object.entries(SLA_LEVELS).map(([key, level]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <level.icon className={`h-3 w-3 mr-2 text-${level.color}-500`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-24 sm:w-28 h-7 sm:h-9 text-[10px] sm:text-xs bg-white/50 border-gray-200">
                        <Crown className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous clients</SelectItem>
                        {Object.entries(CLIENT_PRIORITY).map(([key, priority]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <priority.icon className="h-3 w-3 mr-2" />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-20 sm:w-24 h-7 sm:h-9 text-[10px] sm:text-xs bg-white/50 border-gray-200">
                        <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <SelectValue placeholder="Risque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {Object.entries(RISK_LEVELS).map(([key, level]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <level.icon className={`h-3 w-3 mr-2 text-${level.color}-500`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-1 sm:space-x-2 border rounded-lg px-1.5 sm:px-2 bg-white/50">
                      <Switch
                        id="anomalies"
                        checked={showOnlyAnomalies}
                        onCheckedChange={setShowOnlyAnomalies}
                        className="scale-75 sm:scale-100"
                      />
                      <Label htmlFor="anomalies" className="text-[8px] sm:text-xs cursor-pointer whitespace-nowrap">
                        Anomalies
                      </Label>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2 border rounded-lg px-1.5 sm:px-2 bg-white/50">
                      <Switch
                        id="late"
                        checked={showOnlyLate}
                        onCheckedChange={setShowOnlyLate}
                        className="scale-75 sm:scale-100"
                      />
                      <Label htmlFor="late" className="text-[8px] sm:text-xs cursor-pointer whitespace-nowrap">
                        Retards
                      </Label>
                    </div>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-20 sm:w-24 h-7 sm:h-9 text-[10px] sm:text-xs bg-white/50 border-gray-200">
                        <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <SelectValue placeholder="Trier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priorité</SelectItem>
                        <SelectItem value="time">Temps</SelectItem>
                        <SelectItem value="risk">Risque</SelectItem>
                        <SelectItem value="status">Statut</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex border rounded-lg overflow-hidden bg-white/50">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-none h-7 sm:h-9 w-7 sm:w-9 p-0"
                      >
                        <List className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-none h-7 sm:h-9 w-7 sm:w-9 p-0"
                      >
                        <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des commandes */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Gestion des commandes
                  </CardTitle>
                  
                  <Pagination
                    currentPage={ordersPage}
                    totalPages={totalPages}
                    onPageChange={setOrdersPage}
                    totalItems={sortedOrders.length}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-3 sm:p-4">
                {ordersLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 sm:h-28 w-full rounded-xl" />
                    ))}
                  </div>
                ) : paginatedOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                      <div className="absolute inset-0 bg-gray-400 rounded-full animate-ping opacity-20"></div>
                      <div className="relative bg-gradient-to-br from-gray-500 to-gray-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Aucune commande trouvée</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 max-w-xs mx-auto">
                      Aucune commande ne correspond à vos critères de recherche
                    </p>
                    {(searchQuery || statusFilter !== 'all' || slaFilter !== 'all' || showOnlyAnomalies || showOnlyLate) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 sm:mt-4 text-xs"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setSlaFilter('all');
                          setPriorityFilter('all');
                          setRiskFilter('all');
                          setShowOnlyAnomalies(false);
                          setShowOnlyLate(false);
                        }}
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-2 sm:space-y-3">
                    {paginatedOrders.map(order => {
                      const client = clients.find(c => c.id === order.clientId);
                      const step = WORKFLOW_STEPS.find(s => s.status === order.status);
                      const Icon = step?.icon || Package;
                      const SLAIcon = getSLAIcon(order.sla_level || 'normal');
                      const advice = generateSmartAdvice(order, { now, slaStats });
                      const PriorityIcon = order.clientPriority ? getPriorityIcon(order.clientPriority) : User;
                      const riskLevel = getRiskLevel(order.risk_score || 0);
                      
                      return (
                        <Card
                          key={order.id}
                          className={`border-l-4 ${getSLAIndicatorColor(order.sla_level || 'normal')} hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Clic sur commande:', order.id);
                            handleOrderClick(order);
                          }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-700"></div>
                          <CardContent className="p-2 sm:p-3 relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2 sm:gap-3">
                              <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${getSLABackgroundColor(order.sla_level || 'normal')} group-hover:scale-110 transition-transform duration-300`}>
                                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                    order.sla_level === 'retard' ? 'text-red-600' :
                                    order.sla_level === 'urgent' ? 'text-orange-600' :
                                    order.sla_level === 'attention' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center flex-wrap gap-1 sm:gap-2 mb-1">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                      #{order.id}
                                    </span>
                                    {getStatusBadge(order.status, order.sla_level === 'retard')}
                                    
                                    {order.clientPriority && (
                                      <Badge className={`${getPriorityColor(order.clientPriority)} text-[8px] sm:text-xs px-1.5 py-0`}>
                                        <PriorityIcon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                        {CLIENT_PRIORITY[order.clientPriority as keyof typeof CLIENT_PRIORITY]?.label}
                                      </Badge>
                                    )}

                                    {order.anomaly_detected && (
                                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[8px] sm:text-xs px-1.5 py-0 animate-pulse">
                                        <Brain className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                        Anomalie
                                      </Badge>
                                    )}
                                    
                                    {order.isLate && (
                                      <Badge className="bg-red-100 text-red-800 border-red-200 text-[8px] sm:text-xs px-1.5 py-0">
                                        <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                        Retard {order.lateHours}h
                                      </Badge>
                                    )}

                                    <Badge className={`${riskLevel.bgClass} ${riskLevel.textClass} text-[8px] sm:text-xs px-1.5 py-0`}>
                                      <riskLevel.icon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                      Risque {order.risk_score ? Math.round(order.risk_score) : 0}%
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 text-[8px] sm:text-xs mb-1 sm:mb-2">
                                    <div className="flex items-center text-gray-600">
                                      <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                                      <span className="truncate" title={client?.fullName}>
                                        {client?.fullName || 'Inconnu'}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Phone className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{client?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Package className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                                      {order.itemCount || '?'} articles
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="cursor-help">
                                              {formatRelativeTime(order.createdAt)}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="text-xs">
                                            <p>Créée le {formatDate(order.createdAt, 'dd/MM/yyyy HH:mm')}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                  
                                  {showAdvice && advice.length > 0 && (
                                    <div className="mt-1 sm:mt-2 bg-blue-50 p-1.5 sm:p-2 rounded-lg border border-blue-100">
                                      <div className="flex items-start">
                                        <Lightbulb className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600 mr-1 mt-0.5 flex-shrink-0" />
                                        <div className="text-[8px] sm:text-xs text-blue-700 space-y-0.5">
                                          {advice.slice(0, 2).map((tip, idx) => (
                                            <p key={idx}>{tip}</p>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-end gap-2 sm:gap-3">
                                <div className="w-full lg:w-48">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <div className="flex items-center">
                                      <SLAIcon className={`h-2 w-2 sm:h-3 sm:w-3 mr-1 ${
                                        order.sla_level === 'retard' ? 'text-red-600' :
                                        order.sla_level === 'urgent' ? 'text-orange-600' :
                                        order.sla_level === 'attention' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }`} />
                                      <span className="text-[8px] sm:text-xs font-medium">
                                        {SLA_LEVELS[order.sla_level as keyof typeof SLA_LEVELS]?.label}
                                      </span>
                                    </div>
                                    <span className="text-[8px] sm:text-xs text-gray-500">
                                      {order.timeRemaining || 'Calcul...'}
                                    </span>
                                  </div>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative">
                                          <Progress
                                            value={order.sla_progress || 0}
                                            className="h-1.5 sm:h-2 cursor-help"
                                            indicatorClassName={getProgressColor(order.sla_progress || 0, order.sla_level)}
                                          />
                                          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                            <div className="relative w-full h-full">
                                              <div className="absolute top-0 left-[60%] w-0.5 h-full bg-yellow-400 opacity-50" />
                                              <div className="absolute top-0 left-[80%] w-0.5 h-full bg-orange-500 opacity-50" />
                                              <div className="absolute top-0 left-[100%] w-0.5 h-full bg-red-500 opacity-50" />
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-xs">
                                        <p>Progression: {order.sla_progress?.toFixed(1)}%</p>
                                        {order.estimated_completion && (
                                          <p>Fin: {format(parseISO(order.estimated_completion), 'HH:mm')}</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

                                <div className="flex space-x-1 sm:space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Clic sur oeil commande:', order.id);
                                            handleOrderClick(order);
                                          }}
                                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-blue-50"
                                          type="button"
                                        >
                                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-xs">
                                        Voir détails
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOrderForNote(order);
                                            setNoteDialogOpen(true);
                                          }}
                                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-50"
                                        >
                                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-xs">
                                        Ajouter une note
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  {(order.sla_level === 'retard' || order.sla_level === 'urgent') && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 border-green-200 text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleResolveLate(order.id);
                                            }}
                                            disabled={resolveLateMutation.isPending}
                                          >
                                            {resolveLateMutation.isPending ? (
                                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                            ) : (
                                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                          Marquer résolu
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex flex-wrap gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                              {WORKFLOW_STEPS.filter(step => step.status !== 'delivered').map((step, index) => {
                                const currentIndex = WORKFLOW_STEPS.findIndex(s => s.status === order.status);
                                const isPast = index < currentIndex;
                                const isCurrent = index === currentIndex;
                                const isAvailable = index >= currentIndex && !isCurrent;
                                
                                return (
                                  <TooltipProvider key={step.status}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={isCurrent ? 'default' : isPast ? 'outline' : 'ghost'}
                                          className={`
                                            h-6 text-[8px] sm:text-xs px-1.5 sm:px-2
                                            ${isCurrent ? `bg-gradient-to-r from-${step.color}-600 to-${step.color}-700 text-white` : ''}
                                            ${isAvailable ? 'hover:bg-blue-50 hover:border-blue-200' : ''}
                                            transition-all duration-300
                                          `}
                                          disabled={!isAvailable || updateOrderStatusMutation.isPending}
                                          onClick={() => handleStatusChange(order, step.status)}
                                        >
                                          <step.icon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                          <span className="hidden sm:inline">{step.label}</span>
                                          <span className="sm:hidden">{step.label.substring(0, 3)}</span>
                                          {isAvailable && <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-xs">
                                        <p>{step.description}</p>
                                        {isAvailable && <p className="text-green-600">Cliquez pour passer à cette étape</p>}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {paginatedOrders.map(order => {
                      const client = clients.find(c => c.id === order.clientId);
                      const step = WORKFLOW_STEPS.find(s => s.status === order.status);
                      const Icon = step?.icon || Package;
                      const PriorityIcon = order.clientPriority ? getPriorityIcon(order.clientPriority) : User;
                      const riskLevel = getRiskLevel(order.risk_score || 0);
                      
                      return (
                        <Card
                          key={order.id}
                          className={`border-l-4 ${getSLAIndicatorColor(order.sla_level || 'normal')} hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Clic sur commande grille:', order.id);
                            handleOrderClick(order);
                          }}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-12 -translate-y-12 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-700"></div>
                          <CardContent className="p-2 sm:p-3 relative z-10">
                            <div className="flex justify-between items-start mb-1 sm:mb-2">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className={`p-1 sm:p-1.5 rounded-lg ${getSLABackgroundColor(order.sla_level || 'normal')}`}>
                                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold">#{order.id}</span>
                              </div>
                              <Badge className={`${riskLevel.bgClass} ${riskLevel.textClass} text-[8px] sm:text-xs px-1.5 py-0`}>
                                {Math.round(order.risk_score || 0)}%
                              </Badge>
                            </div>

                            <div className="space-y-1 sm:space-y-1.5 mb-1 sm:mb-2">
                              <div className="flex items-center text-[8px] sm:text-xs">
                                <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-1 text-gray-400" />
                                <span className="truncate" title={client?.fullName}>
                                  {client?.fullName}
                                </span>
                              </div>
                              <div className="flex items-center text-[8px] sm:text-xs">
                                <Phone className="h-2 w-2 sm:h-3 sm:w-3 mr-1 text-gray-400" />
                                <span className="truncate">{client?.phone}</span>
                              </div>
                              <div className="flex items-center text-[8px] sm:text-xs">
                                <Package className="h-2 w-2 sm:h-3 sm:w-3 mr-1 text-gray-400" />
                                {order.itemCount || '?'} articles
                              </div>
                              {order.clientPriority && (
                                <div className="flex items-center">
                                  <PriorityIcon className="h-2 w-2 sm:h-3 sm:w-3 mr-1 text-gray-400" />
                                  <Badge className={`${getPriorityColor(order.clientPriority)} text-[6px] sm:text-[8px] px-1 py-0`}>
                                    {CLIENT_PRIORITY[order.clientPriority as keyof typeof CLIENT_PRIORITY]?.label}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="mb-1 sm:mb-2">
                              <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5">
                                <span className="font-medium flex items-center">
                                  {React.createElement(getSLAIcon(order.sla_level || 'normal'), { 
                                    className: `h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 ${
                                      order.sla_level === 'retard' ? 'text-red-600' :
                                      order.sla_level === 'urgent' ? 'text-orange-600' :
                                      order.sla_level === 'attention' ? 'text-yellow-600' :
                                      'text-green-600'
                                    }`
                                  })}
                                  {SLA_LEVELS[order.sla_level as keyof typeof SLA_LEVELS]?.label}
                                </span>
                                <span className="text-gray-500">{order.timeRemaining}</span>
                              </div>
                              <Progress
                                value={order.sla_progress || 0}
                                className="h-1 sm:h-1.5"
                                indicatorClassName={getProgressColor(order.sla_progress || 0, order.sla_level)}
                              />
                            </div>

                            <div className="flex justify-end space-x-1 sm:space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Clic sur oeil commande grille:', order.id);
                                  handleOrderClick(order);
                                }}
                              >
                                <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderForNote(order);
                                  setNoteDialogOpen(true);
                                }}
                              >
                                <MessageSquare className="h-2 w-2 sm:h-3 sm:w-3" />
                              </Button>
                              {(order.sla_level === 'retard' || order.sla_level === 'urgent') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolveLate(order.id);
                                  }}
                                >
                                  <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring IA Tab */}
          <TabsContent value="monitoring" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Commandes à risque immédiat */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl border-l-4 border-l-red-500">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm sm:text-base flex items-center">
                      <AlertOctagon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
                      Commandes à risque immédiat
                    </CardTitle>
                    {(predictions?.predictions?.filter(p => p.riskScore > 70).length ?? 0) > itemsPerPage && (
                      <Pagination
                        currentPage={predictionsPage}
                        totalPages={totalPredictionsPages}
                        onPageChange={setPredictionsPage}
                      />
                    )}
                  </div>
                  <CardDescription className="text-red-100 text-[10px] sm:text-xs">
                    {predictions?.predictions?.filter(p => p.riskScore > 70).length || 0} commandes critiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                    <div className="space-y-2 sm:space-y-3">
                      {predictionsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                        ))
                      ) : paginatedPredictions.filter(p => p.riskScore > 70).length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                          </div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Aucune commande critique</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500">Toutes les commandes sont sous contrôle</p>
                        </div>
                      ) : (
                        paginatedPredictions.filter(p => p.riskScore > 70).map(pred => {
                          const order = orders.find(o => o.id === pred.orderId);
                          const client = clients.find(c => c.id === order?.clientId);
                          const step = WORKFLOW_STEPS.find(s => s.status === order?.status);
                          
                          return (
                            <Card 
                              key={pred.orderId} 
                              className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Clic sur commande à risque:', pred.orderId);
                                if (order) {
                                  handleOrderClick(order);
                                }
                              }}
                            >
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-xs sm:text-sm font-semibold">#{pred.orderId}</span>
                                    <Badge variant="destructive" className="text-[8px] sm:text-xs animate-pulse">
                                      {Math.round(pred.riskScore)}%
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (order) {
                                        handleOrderClick(order);
                                      }
                                    }}
                                  >
                                    <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2">
                                  <div className="bg-white/80 p-1 sm:p-1.5 rounded">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Client</p>
                                    <p className="text-[8px] sm:text-xs font-medium truncate" title={client?.fullName}>
                                      {client?.fullName}
                                    </p>
                                  </div>
                                  <div className="bg-white/80 p-1 sm:p-1.5 rounded">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Statut</p>
                                    <p className="text-[8px] sm:text-xs font-medium">{step?.label}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2">
                                  <div className="bg-red-100 p-1 sm:p-1.5 rounded">
                                    <p className="text-[6px] sm:text-[8px] text-red-600">Temps écoulé</p>
                                    <p className="text-[8px] sm:text-xs font-medium text-red-700">{formatDuration(pred.timeInStatus)}</p>
                                  </div>
                                  {pred.predictedDelay > 0 && (
                                    <div className="bg-orange-100 p-1 sm:p-1.5 rounded">
                                      <p className="text-[6px] sm:text-[8px] text-orange-600">Retard prévu</p>
                                      <p className="text-[8px] sm:text-xs font-medium text-orange-700">{formatDuration(pred.predictedDelay)}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-red-200">
                                  <p className="text-[8px] sm:text-xs text-red-700 flex items-start">
                                    <Lightbulb className="h-2 w-2 sm:h-3 sm:w-3 mr-1 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Action :</span>
                                    <span className="ml-1">{pred.suggestedAction}</span>
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Anomalies de flux */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl border-l-4 border-l-purple-500">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Anomalies de flux
                  </CardTitle>
                  <CardDescription className="text-purple-100 text-[10px] sm:text-xs">
                    {anomalyCount} commandes bloquées
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                    <div className="space-y-2 sm:space-y-3">
                      {anomalyCount === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                          </div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Aucune anomalie</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500">Tous les flux sont normaux</p>
                        </div>
                      ) : (
                        anomalyOrders.slice((predictionsPage - 1) * itemsPerPage, predictionsPage * itemsPerPage).map(order => {
                          const client = clients.find(c => c.id === order.clientId);
                          const step = WORKFLOW_STEPS.find(s => s.status === order.status);
                          
                          return (
                            <Card 
                              key={order.id} 
                              className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Clic sur anomalie:', order.id);
                                handleOrderClick(order);
                              }}
                            >
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-xs sm:text-sm font-semibold">#{order.id}</span>
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[8px] sm:text-xs">
                                      <Brain className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                      Bloquée
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOrderClick(order);
                                    }}
                                  >
                                    <Eye className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                                
                                <p className="text-[8px] sm:text-xs text-gray-700 mb-2">
                                  {client?.fullName} • {step?.label}
                                </p>
                                
                                <div className="bg-white/80 p-1.5 sm:p-2 rounded-lg mb-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[6px] sm:text-[8px] text-gray-500">Temps dans ce statut</span>
                                    <span className="text-[8px] sm:text-xs font-medium text-purple-700">
                                      {formatDuration(order.time_in_status || 0)}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={((order.time_in_status || 0) / ((step?.sla || 4) * 60)) * 100}
                                    className="h-1 sm:h-1.5 mt-1"
                                    indicatorClassName="bg-purple-500"
                                  />
                                </div>
                                
                                <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg border border-purple-200">
                                  <p className="text-[6px] sm:text-[8px] text-purple-700 flex items-start">
                                    <Brain className="h-2 w-2 sm:h-3 sm:w-3 mr-1 mt-0.5 flex-shrink-0" />
                                    <span>
                                      D'autres commandes plus récentes ont avancé
                                    </span>
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Goulots d'étranglement */}
              <Card className="lg:col-span-2 overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Goulots d'étranglement
                  </CardTitle>
                  <CardDescription className="text-yellow-100 text-[10px] sm:text-xs">
                    Étapes qui ralentissent le flux
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => {
                      const stepOrders = activeOrders.filter(o => o.status === step.status);
                      const avgTime = stepOrders.length > 0
                        ? stepOrders.reduce((sum, o) => sum + (o.time_in_status || 0), 0) / stepOrders.length
                        : 0;
                      const isBottleneck = avgTime > step.sla * 60 * 0.8;
                      const severity = avgTime > step.sla * 60 * 1.2 ? 'high' : 
                                      avgTime > step.sla * 60 * 1.0 ? 'medium' : 'low';
                      
                      const severityColors = {
                        high: 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50',
                        medium: 'border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50',
                        low: 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'
                      };
                      
                      return (
                        <Card key={step.status} className={isBottleneck ? severityColors[severity] : ''}>
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <step.icon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-${step.color}-600`} />
                                <span className="text-[10px] sm:text-xs font-medium">{step.label}</span>
                              </div>
                              {isBottleneck && (
                                <Badge variant="destructive" className="text-[6px] sm:text-[8px] px-1 py-0 animate-pulse">
                                  Goulot
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-base sm:text-lg font-bold mb-0.5">{stepOrders.length}</p>
                            <p className="text-[6px] sm:text-[8px] text-gray-500 mb-2">commandes en attente</p>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[6px] sm:text-[8px]">
                                <span className="text-gray-500">Temps moyen</span>
                                <span className={isBottleneck ? 'font-medium text-red-600' : ''}>
                                  {formatDuration(Math.round(avgTime))}
                                </span>
                              </div>
                              <Progress
                                value={step.sla > 0 ? (avgTime / (step.sla * 60)) * 100 : 0}
                                className="h-1 sm:h-1.5"
                                indicatorClassName={isBottleneck ? 
                                  (severity === 'high' ? 'bg-red-500' : 'bg-orange-500') : 
                                  'bg-blue-500'
                                }
                              />
                              <div className="flex justify-between text-[6px] sm:text-[8px]">
                                <span className="text-gray-500">SLA</span>
                                <span>{step.sla}h</span>
                              </div>
                            </div>
                            
                            {isBottleneck && (
                              <div className="mt-2 bg-white/50 p-1 sm:p-1.5 rounded-lg">
                                <p className="text-[6px] sm:text-[8px] flex items-center">
                                  <Lightbulb className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 text-orange-500" />
                                  <span className="text-gray-700">
                                    {severity === 'high' ? 'Action urgente requise' :
                                     severity === 'medium' ? 'Renforcer les ressources' :
                                     'Surveillance renforcée'}
                                  </span>
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-blue-100 font-medium uppercase tracking-wider">Volume journalier</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {Math.round(activeOrders.length / 7) || 0}
                      </p>
                    </div>
                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-600 to-green-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-green-100 font-medium uppercase tracking-wider">Temps de cycle</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {completedOrders.length > 0
                          ? Math.round(
                              completedOrders.reduce((acc, o) => {
                                if (!o.actualDeliveryDate || !o.createdAt) return acc;
                                return acc + differenceInMinutes(parseISO(o.actualDeliveryDate), parseISO(o.createdAt));
                              }, 0) / completedOrders.length
                            )
                          : 0} min
                      </p>
                    </div>
                    <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-purple-100 font-medium uppercase tracking-wider">Efficacité</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {activeOrders.length > 0
                          ? Math.round(((activeOrders.length - (slaStats?.byLevel?.retard || 0)) / activeOrders.length) * 100)
                          : 100}%
                      </p>
                    </div>
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-orange-100 font-medium uppercase tracking-wider">Satisfaction</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">94%</p>
                    </div>
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Répartition par statut</CardTitle>
                <CardDescription className="text-blue-100 text-[10px] sm:text-xs">
                  Distribution actuelle des commandes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => {
                    const count = activeOrders.filter(o => o.status === step.status).length;
                    if (count === 0) return null;
                    
                    const percentage = (count / Math.max(1, activeOrders.length)) * 100;
                    
                    return (
                      <div key={step.status} className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] sm:text-xs">
                          <div className="flex items-center">
                            <step.icon className={`h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2 text-${step.color}-500`} />
                            <span className="font-medium text-gray-700">{step.label}</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="text-gray-600">{count} cmd</span>
                            <span className="font-medium text-gray-900 w-10 sm:w-12 text-right">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-1.5 sm:h-2"
                          indicatorClassName={`bg-${step.color}-500`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Performance par quartier</CardTitle>
                  <CardDescription className="text-green-100 text-[10px] sm:text-xs">
                    Temps de livraison moyen
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {['Analakely', 'Isoraka', 'Ankorondrano', 'Ivandry', 'Alarobia'].map((neighborhood, i) => (
                      <div key={neighborhood} className="flex items-center justify-between text-[8px] sm:text-xs">
                        <span className="text-gray-600 w-16 sm:w-20 truncate">{neighborhood}</span>
                        <div className="flex items-center space-x-2 flex-1 max-w-[150px] sm:max-w-[200px]">
                          <Progress value={[85, 92, 78, 88, 95][i]} className="h-1.5 sm:h-2 flex-1" />
                          <span className="text-gray-900 font-medium w-8 sm:w-12 text-right">
                            {[45, 38, 52, 42, 35][i]}min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Prévisions de charge</CardTitle>
                  <CardDescription className="text-purple-100 text-[10px] sm:text-xs">
                    Commandes attendues
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, i) => (
                      <div key={day} className="flex items-center justify-between text-[8px] sm:text-xs">
                        <span className="text-gray-600 w-12 sm:w-16">{day}</span>
                        <div className="flex items-center space-x-2 flex-1 max-w-[150px] sm:max-w-[200px]">
                          <Progress value={[70, 85, 90, 75, 95, 60][i]} className="h-1.5 sm:h-2 flex-1" />
                          <span className="text-gray-900 font-medium w-8 sm:w-12 text-right">
                            {[28, 34, 36, 30, 38, 24][i]} cmd
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 sm:space-y-6">
            {/* Statistiques équipe */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-blue-100">Total</p>
                      <p className="text-lg sm:text-2xl font-bold">{getTeamStats.total}</p>
                    </div>
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-600 to-green-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-green-100">Actifs</p>
                      <p className="text-lg sm:text-2xl font-bold">{getTeamStats.active}</p>
                    </div>
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-orange-100">En service</p>
                      <p className="text-lg sm:text-2xl font-bold">{getTeamStats.onDuty}</p>
                    </div>
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] sm:text-xs text-purple-100">Performance</p>
                      <p className="text-lg sm:text-2xl font-bold">{Math.round(getTeamStats.performance.overall)}%</p>
                    </div>
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onglets de visualisation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 bg-white/50 p-1 rounded-lg">
                <Button
                  variant={teamViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTeamViewMode('grid')}
                  className="h-7 sm:h-8 text-xs"
                >
                  <Grid className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Grille
                </Button>
                <Button
                  variant={teamViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTeamViewMode('list')}
                  className="h-7 sm:h-8 text-xs"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Liste
                </Button>
                <Button
                  variant={teamViewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTeamViewMode('map')}
                  className="h-7 sm:h-8 text-xs"
                >
                  <Map className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Carte
                </Button>
              </div>

              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-24 sm:w-28 h-7 sm:h-8 text-xs">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alertes équipe */}
            {teamStats?.alerts && teamStats.alerts.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl border-l-4 border-l-yellow-500">
                <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Alertes équipe
                  </CardTitle>
                  <CardDescription className="text-yellow-100 text-[10px] sm:text-xs">
                    {teamStats.alerts.length} point(s) d'attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2">
                    {teamStats.alerts.map((alert, index) => (
                      <Alert key={index} className={`${
                        alert.type === 'error' ? 'bg-red-50 border-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start">
                          {alert.type === 'error' && <AlertOctagon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-2 mt-0.5" />}
                          {alert.type === 'warning' && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 mr-2 mt-0.5" />}
                          {alert.type === 'info' && <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2 mt-0.5" />}
                          <div>
                            <p className="text-[8px] sm:text-xs">{alert.message}</p>
                            {alert.userId && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-5 text-[8px] sm:text-xs p-0"
                                onClick={() => {
                                  setSelectedAgent(alert.userId ?? null);
                                }}
                              >
                                Voir le profil
                              </Button>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Livreurs */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Livreurs ({drivers.length})
                  </CardTitle>
                  {driverPerformance.length > itemsPerPage && (
                    <Pagination
                      currentPage={driversPage}
                      totalPages={totalDriversPages}
                      onPageChange={setDriversPage}
                    />
                  )}
                </div>
                <CardDescription className="text-green-100 text-[10px] sm:text-xs">
                  Performance et disponibilité
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                {teamViewMode === 'map' ? (
                  <DeliveryMap deliveries={deliveries} drivers={drivers} />
                ) : teamViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {paginatedDrivers.map(driver => {
                      const performanceLevel = getPerformanceLevel(driver.performance?.onTime || 0);
                      
                      return (
                        <Card key={driver.id} className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                <AvatarImage src={driver.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs sm:text-sm">
                                  {driver.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs sm:text-sm font-semibold truncate">{driver.fullName}</h4>
                                  <Badge className={`text-[6px] sm:text-[8px] px-1 py-0 ${
                                    driver.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {driver.isActive ? 'Actif' : 'Inactif'}
                                  </Badge>
                                </div>
                                <p className="text-[8px] sm:text-xs text-gray-500 truncate">{driver.neighborhood || 'Non assigné'}</p>
                                
                                <div className="grid grid-cols-3 gap-1 mt-1 sm:mt-2">
                                  <div className="text-center">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Livr.</p>
                                    <p className="text-[8px] sm:text-xs font-semibold">{driver.performance?.completed || 0}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Taux</p>
                                    <p className="text-[8px] sm:text-xs font-semibold">{Math.round(driver.performance?.onTime || 0)}%</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[6px] sm:text-[8px] text-gray-500">Note</p>
                                    <p className="text-[8px] sm:text-xs font-semibold">{driver.performance?.rating || 0}/5</p>
                                  </div>
                                </div>

                                <div className="mt-1 sm:mt-2">
                                  <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5">
                                    <span className="text-gray-500">Performance</span>
                                    <span className={`font-medium ${performanceLevel.color}`}>
                                      {performanceLevel.label}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={driver.performance?.onTime || 0} 
                                    className="h-1 sm:h-1.5"
                                    indicatorClassName={`bg-${performanceLevel.color}-500`}
                                  />
                                </div>

                                <div className="mt-1 sm:mt-2 flex items-center justify-between text-[6px] sm:text-[8px]">
                                  <span className="flex items-center">
                                    <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 text-gray-400" />
                                    {driver.stats?.completedToday || 0} aujourd'hui
                                  </span>
                                  {driver.performance?.inProgress ? (
                                    <Badge className="bg-blue-100 text-blue-700 text-[6px] sm:text-[8px] px-1 py-0">
                                      En livraison
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[6px] sm:text-[8px] px-1 py-0">
                                      Disponible
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedDrivers.map(driver => (
                      <Card key={driver.id} className="hover:shadow-md transition-all duration-300">
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                                  {driver.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-xs sm:text-sm font-semibold">{driver.fullName}</h4>
                                <p className="text-[8px] sm:text-xs text-gray-500">{driver.neighborhood || 'Non assigné'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                              <div className="text-right">
                                <p className="text-[8px] sm:text-xs text-gray-500">{driver.performance?.completed || 0} livraisons</p>
                                <p className="text-[8px] sm:text-xs text-gray-500">{driver.performance?.onTime?.toFixed(1)}% à l'heure</p>
                              </div>
                              <Badge className={driver.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {driver.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agents */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Agents ({agents.length})
                  </CardTitle>
                  {agentPerformance.length > itemsPerPage && (
                    <Pagination
                      currentPage={agentsPage}
                      totalPages={totalAgentsPages}
                      onPageChange={setAgentsPage}
                    />
                  )}
                </div>
                <CardDescription className="text-blue-100 text-[10px] sm:text-xs">
                  Charge de travail et productivité
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {paginatedAgents.map(agent => (
                    <Card key={agent.id} className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs sm:text-sm">
                              {agent.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold">{agent.fullName}</h4>
                            <p className="text-[8px] sm:text-xs text-gray-500">{agent.email}</p>
                            
                            <div className="grid grid-cols-3 gap-1 mt-1 sm:mt-2">
                              <div className="text-center">
                                <p className="text-[6px] sm:text-[8px] text-gray-500">Assignées</p>
                                <p className="text-[8px] sm:text-xs font-semibold">{agent.performance?.assigned || 0}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[6px] sm:text-[8px] text-gray-500">Productivité</p>
                                <p className="text-[8px] sm:text-xs font-semibold">{agent.performance?.productivity || 0}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[6px] sm:text-[8px] text-gray-500">Note</p>
                                <p className="text-[8px] sm:text-xs font-semibold">{agent.performance?.rating || 0}%</p>
                              </div>
                            </div>

                            <div className="mt-1 sm:mt-2">
                              <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5">
                                <span className="text-gray-500">Charge</span>
                                <span className="font-medium">{Math.min(100, Math.round(((agent.performance?.assigned || 0) / 15) * 100))}%</span>
                              </div>
                              <Progress 
                                value={Math.min(100, Math.round(((agent.performance?.assigned || 0) / 15) * 100))} 
                                className="h-1 sm:h-1.5"
                                indicatorClassName="bg-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            {getTeamStats.topPerformers.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base flex items-center">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Top Performers
                  </CardTitle>
                  <CardDescription className="text-yellow-100 text-[10px] sm:text-xs">
                    Meilleurs scores du mois
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {getTeamStats.topPerformers.map((performer, index) => (
                      <Card key={performer.id} className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-bl-full"></div>
                        <CardContent className="p-2 sm:p-3 relative z-10">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-yellow-400">
                                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white text-sm sm:text-base">
                                  {performer.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] sm:text-xs font-bold text-yellow-900">
                                #{index + 1}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold">{performer.fullName}</h4>
                              <p className="text-[8px] sm:text-xs text-gray-500 capitalize">{performer.role}</p>
                              <p className="text-[8px] sm:text-xs text-yellow-600 mt-1">
                                Score: {Math.round(performer.performance?.rating || 0)}/5
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogues Responsive */}

        {/* Détails commande */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open);
          setIsOrderDetailsOpen(open);
        }}>
          <DialogContent 
            className="max-w-[95vw] sm:max-w-lg md:max-w-2xl"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onPointerDownOutside={(e) => {
              e.preventDefault();
              console.log('Clic en dehors du dialog');
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base flex items-center">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Détails de la commande #{selectedOrder?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedOrder.status, selectedOrder.sla_level === 'retard')}
                    {selectedOrder.clientPriority && (
                      <Badge className={getPriorityColor(selectedOrder.clientPriority)}>
                        {React.createElement(getPriorityIcon(selectedOrder.clientPriority), { 
                          className: "h-2 w-2 sm:h-3 sm:w-3 mr-1" 
                        })}
                        {CLIENT_PRIORITY[selectedOrder.clientPriority as keyof typeof CLIENT_PRIORITY]?.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[8px] sm:text-xs text-gray-500">
                    {formatRelativeTime(selectedOrder.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Client
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {clients.find(c => c.id === selectedOrder.clientId)?.fullName}
                      </p>
                      <div className="flex items-center text-[8px] sm:text-xs text-gray-600 mt-1">
                        <Phone className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        {clients.find(c => c.id === selectedOrder.clientId)?.phone}
                      </div>
                      <div className="flex items-center text-[8px] sm:text-xs text-gray-600">
                        <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        {clients.find(c => c.id === selectedOrder.clientId)?.neighborhood || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <Gauge className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Statut SLA
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-[8px] sm:text-xs text-gray-600">Niveau</span>
                        <Badge className={SLA_LEVELS[selectedOrder.sla_level as keyof typeof SLA_LEVELS]?.bgClass}>
                          {SLA_LEVELS[selectedOrder.sla_level as keyof typeof SLA_LEVELS]?.label}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5">
                            <span className="text-gray-500">Progression</span>
                            <span className="font-medium">{selectedOrder.sla_progress?.toFixed(1)}%</span>
                          </div>
                          <Progress
                            value={selectedOrder.sla_progress || 0}
                            className="h-1 sm:h-1.5"
                            indicatorClassName={getProgressColor(selectedOrder.sla_progress || 0, selectedOrder.sla_level)}
                          />
                        </div>
                        {selectedOrder.risk_score && (
                          <div className="flex justify-between text-[6px] sm:text-[8px]">
                            <span className="text-gray-500">Risque</span>
                            <span className={selectedOrder.risk_score > 70 ? 'text-red-600 font-medium' : 'text-orange-600'}>
                              {Math.round(selectedOrder.risk_score)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <Calendar className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Dates clés
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg space-y-1">
                      <div className="flex justify-between text-[8px] sm:text-xs">
                        <span className="text-gray-500">Création:</span>
                        <span className="font-medium">{formatDate(selectedOrder.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-xs">
                        <span className="text-gray-500">Ramassage:</span>
                        <span className="font-medium">{formatDate(selectedOrder.scheduledPickupDate, 'HH:mm')}</span>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-xs">
                        <span className="text-gray-500">Livraison:</span>
                        <span className="font-medium">{formatDate(selectedOrder.scheduledDeliveryDate, 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <Package className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Articles
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 text-center">
                        {selectedOrder.itemCount || '?'}
                      </p>
                      <p className="text-[8px] sm:text-xs text-gray-500 text-center">pièces</p>
                      
                      {selectedOrder.time_in_status && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between text-[8px] sm:text-xs">
                            <span className="text-gray-500">Temps dans ce statut:</span>
                            <span className="font-medium">{formatDuration(selectedOrder.time_in_status)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedOrder.specialInstructions && (
                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <MessageSquare className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Instructions spéciales
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-200 p-2 sm:p-3 rounded-lg">
                      <p className="text-[8px] sm:text-xs text-yellow-800">{selectedOrder.specialInstructions}</p>
                    </div>
                  </div>
                )}

                {showAdvice && (
                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                      <Lightbulb className="h-2 w-2 sm:h-3 sm:w-3 mr-2 text-yellow-600" />
                      Conseils
                    </h4>
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                      <div className="space-y-1">
                        {generateSmartAdvice(selectedOrder, { now, slaStats }).map((tip, idx) => (
                          <div key={idx} className="flex items-start text-[8px] sm:text-xs text-blue-700">
                            <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1 sm:space-y-2">
                  <h4 className="text-[8px] sm:text-xs font-medium text-gray-500 flex items-center">
                    <Brain className="h-2 w-2 sm:h-3 sm:w-3 mr-2 text-purple-600" />
                    Analyse des risques
                  </h4>
                  <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-200">
                    <div className="space-y-1">
                      {generateRiskAnalysis(selectedOrder).map((item, idx) => (
                        <div key={idx} className="text-[8px] sm:text-xs text-purple-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedOrder.anomaly_detected && (
                  <Alert variant="destructive" className="bg-purple-50 border-purple-200">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <AlertTitle className="text-[8px] sm:text-xs text-purple-800">Anomalie de flux détectée</AlertTitle>
                    <AlertDescription className="text-[6px] sm:text-[8px] text-purple-700">
                      Cette commande semble bloquée par rapport au flux normal.
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOrderDetailsOpen(false)}>
                    Fermer
                  </Button>
                  <Button size="sm" onClick={() => {
                    setIsOrderDetailsOpen(false);
                    setSelectedOrderForNote(selectedOrder);
                    setNoteDialogOpen(true);
                  }}>
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Ajouter une note
                  </Button>
                  {(selectedOrder.sla_level === 'retard' || selectedOrder.sla_level === 'urgent') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        handleResolveLate(selectedOrder.id);
                        setIsOrderDetailsOpen(false);
                      }}
                      disabled={resolveLateMutation.isPending}
                    >
                      {resolveLateMutation.isPending ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      )}
                      Marquer résolu
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialogue de triage */}
        <Dialog open={sortingDialogOpen} onOpenChange={setSortingDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base flex items-center">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-600" />
                Validation du triage
              </DialogTitle>
              <DialogDescription className="text-[8px] sm:text-xs">
                Commande #{selectedOrderForSorting?.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs">Nombre d'articles *</Label>
                <Input
                  type="number"
                  min="1"
                  value={sortingItemCount}
                  onChange={(e) => setSortingItemCount(parseInt(e.target.value) || 0)}
                  className="h-8 sm:h-9 text-sm"
                  placeholder="Ex: 15"
                />
                <p className="text-[8px] sm:text-xs text-gray-500">
                  Comptez précisément le nombre de vêtements
                </p>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs">Notes de tri (optionnel)</Label>
                <Textarea
                  value={sortingNotes}
                  onChange={(e) => setSortingNotes(e.target.value)}
                  placeholder="Articles délicats, taches particulières..."
                  className="text-xs min-h-[60px] sm:min-h-[80px]"
                />
              </div>
              
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                <p className="text-[8px] sm:text-xs text-blue-700 flex items-start">
                  <Lightbulb className="h-2 w-2 sm:h-3 sm:w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>
                    Pensez à séparer les couleurs claires/foncées et à vérifier les poches avant le lavage.
                  </span>
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => setSortingDialogOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSortingConfirm} disabled={sortingItemCount <= 0}>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Valider le triage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue de note */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base flex items-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Ajouter une note
              </DialogTitle>
              <DialogDescription className="text-[8px] sm:text-xs">
                Commande #{selectedOrderForNote?.id}
              </DialogDescription>
            </DialogHeader>
            
            <Textarea
              placeholder="Saisissez votre note ici..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={4}
              className="text-xs min-h-[80px] sm:min-h-[100px]"
              autoFocus
            />
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                {addNoteMutation.isPending ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}