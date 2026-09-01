// client/src/components/tabs/InvoiceMatrix.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, Check, AlertTriangle, Clock, Search, User, Mail, Phone, 
  Calendar, TrendingUp, TrendingDown, FileText, ChevronLeft, ChevronRight,
  Eye, BarChart3, Filter, X, ArrowUpDown, DollarSign, Loader2
} from 'lucide-react';
import { format, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  table: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface MonthData {
  month: number;
  status: 'paid' | 'overdue' | 'pending' | 'no_invoice' | 'not_subscribed';
  hasInvoice: boolean;
  invoiceId?: number;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  isOverdue?: boolean;
}

interface ClientRow {
  clientId: number;
  clientName: string;
  email: string;
  phone: string;
  planName: string;
  planPrice: number;
  months: MonthData[];
  stats: {
    totalPaid: number;
    totalOverdue: number;
    totalPending: number;
    totalAmount: number;
    paidAmount: number;
    paymentRate: number;
  };
}

interface InvoiceMatrixProps {
  onDownloadInvoice: (invoiceId: number, invoiceNumber: string) => void;
  onViewInvoiceDetails?: (invoiceId: number) => void;
  onMarkAsPaid?: (invoiceId: number, paymentMethod: 'cash' | 'mobile_money') => void;
}

export function InvoiceMatrix({ onDownloadInvoice, onViewInvoiceDetails, onMarkAsPaid }: InvoiceMatrixProps) {
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_overdue' | 'has_pending' | 'all_paid'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['invoiceMatrix', selectedYear],
    queryFn: () => fetch(`/api/invoices/matrix/${selectedYear}`).then(r => r.json())
  });

  // Filtrer les clients selon la recherche et les filtres
  const filteredClients = useMemo(() => {
    if (!matrixData?.clients) return [];
    
    let filtered = matrixData.clients;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((client: ClientRow) => 
        client.clientName.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.planName?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    switch (statusFilter) {
      case 'has_overdue':
        filtered = filtered.filter((client: ClientRow) => client.stats.totalOverdue > 0);
        break;
      case 'has_pending':
        filtered = filtered.filter((client: ClientRow) => client.stats.totalPending > 0);
        break;
      case 'all_paid':
        filtered = filtered.filter((client: ClientRow) => 
          client.stats.totalPaid > 0 && client.stats.totalOverdue === 0 && client.stats.totalPending === 0
        );
        break;
    }

    return filtered;
  }, [matrixData, searchQuery, statusFilter]);

  // Fonction pour obtenir la couleur et l'icône selon le statut
  const getStatusConfig = (status: string): { 
    bg: string; 
    border: string; 
    text: string;
    icon: React.ReactNode;
    label: string;
  } => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100',
          border: 'border-emerald-300',
          text: 'text-emerald-700',
          icon: <Check className="h-4 w-4 text-emerald-500" />,
          label: 'Payé'
        };
      case 'overdue':
        return {
          bg: 'bg-red-50 hover:bg-red-100',
          border: 'border-red-400',
          text: 'text-red-700',
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          label: 'En retard'
        };
      case 'pending':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100',
          border: 'border-amber-300',
          text: 'text-amber-700',
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          label: 'En attente'
        };
      case 'not_subscribed':
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          text: 'text-slate-400',
          icon: <X className="h-4 w-4 text-slate-300" />,
          label: 'Non abonné'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-400',
          icon: null,
          label: '-'
        };
    }
  };

  // Obtenir le mois actuel pour mettre en évidence
  const currentMonth = new Date().getMonth();

  // Calculer les totaux par mois
  const monthlyTotals = useMemo(() => {
    if (!filteredClients) return [];
    
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthClients = filteredClients.filter((client: ClientRow) => 
        client.months[monthIndex]?.hasInvoice
      );
      
      return {
        total: monthClients.length,
        paid: monthClients.filter((c: ClientRow) => c.months[monthIndex].status === 'paid').length,
        overdue: monthClients.filter((c: ClientRow) => c.months[monthIndex].status === 'overdue').length,
        pending: monthClients.filter((c: ClientRow) => c.months[monthIndex].status === 'pending').length,
        revenue: monthClients.reduce((sum: number, c: ClientRow) => 
          sum + (c.months[monthIndex].status === 'paid' ? (c.months[monthIndex].amount || 0) : 0), 0
        )
      };
    });
  }, [filteredClients]);

  // Calculer les statistiques globales
  const globalStats = useMemo(() => {
    if (!filteredClients || filteredClients.length === 0) {
      return { totalClients: 0, totalPaid: 0, totalOverdue: 0, totalPending: 0, totalAmount: 0, paidAmount: 0, collectedRevenue: 0 };
    }

    let totalPaid = 0;
    let totalOverdue = 0;
    let totalPending = 0;
    let totalAmount = 0;
    let collectedRevenue = 0;

    filteredClients.forEach((client: any) => {
      totalPaid += client.stats.totalPaid;
      totalOverdue += client.stats.totalOverdue;
      totalPending += client.stats.totalPending;
      totalAmount += client.stats.totalAmount;
      collectedRevenue += client.stats.paidAmount;
    });

    return {
      totalClients: filteredClients.length,
      totalPaid,
      totalOverdue,
      totalPending,
      totalAmount,
      paidAmount: collectedRevenue,
      collectedRevenue,
    };
  }, [filteredClients]);

  if (isLoading) {
    return (
      <div className={NEO.card}>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#0B676E]" />
            <p className="text-slate-500">Chargement de la matrice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matrixData || !matrixData.clients || matrixData.clients.length === 0) {
    return (
      <div className={NEO.card}>
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Aucune donnée disponible</p>
          <p className="text-sm text-slate-400 mt-1">Aucun client avec factures trouvé pour {selectedYear}</p>
          <Button 
            onClick={() => setSelectedYear(getYear(new Date()))} 
            className={cn(NEO.buttonPrimary, "mt-4")}
          >
            Revenir à l'année en cours
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ==========================================================
            EN-TÊTE NEOMORPHIQUE
        ========================================================== */}
        <div className={NEO.card}>
          <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                  <BarChart3 className="h-6 w-6 text-[#0B676E]" />
                  Tableau de Bord des Paiements {selectedYear}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredClients.length} client(s) • {globalStats.totalPaid + globalStats.totalOverdue + globalStats.totalPending} factures
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className={cn(NEO.button, "gap-1")}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {selectedYear - 1}
                </Button>
                
                <span className="text-lg font-bold text-slate-900">{selectedYear}</span>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className={cn(NEO.button, "gap-1")}
                >
                  {selectedYear + 1}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="px-5 pb-5">
            {/* Filtres rapides néomorphiques */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(NEO.input, "pl-10")}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className={cn(NEO.input, "w-[200px]")}>
                  <Filter className="h-4 w-4 mr-2 text-[#0B676E]" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                  <SelectItem value="all">Tous les clients</SelectItem>
                  <SelectItem value="has_overdue">Avec retards</SelectItem>
                  <SelectItem value="has_pending">Avec en attente</SelectItem>
                  <SelectItem value="all_paid">Tout payé</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchQuery || statusFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className={cn(NEO.button, "text-red-500 hover:text-red-600")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Statistiques globales néomorphiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={cn(NEO.cardPressed, "p-3")}>
                <div className="text-xs text-slate-600 font-medium">Clients actifs</div>
                <div className="text-2xl font-bold text-slate-900">{globalStats.totalClients}</div>
              </div>
              <div className={cn(NEO.cardPressed, "p-3 bg-emerald-50/40")}>
                <div className="text-xs text-emerald-600 font-medium">Payées</div>
                <div className="text-2xl font-bold text-emerald-700">{globalStats.totalPaid}</div>
              </div>
              <div className={cn(NEO.cardPressed, "p-3 bg-red-50/40")}>
                <div className="text-xs text-red-600 font-medium">En retard</div>
                <div className="text-2xl font-bold text-red-700">{globalStats.totalOverdue}</div>
              </div>
              <div className={cn(NEO.cardPressed, "p-3")}>
                <div className="text-xs text-slate-600 font-medium">Revenus collectés</div>
                <div className="text-lg font-bold text-slate-900">
                  {(globalStats.collectedRevenue / 1000).toFixed(0)}k Ar
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================
            TABLEAU MATRICIEL NEOMORPHIQUE
        ========================================================== */}
        <div className={NEO.card}>
          <div className="overflow-x-auto">
            <div className={NEO.table}>
              <table className="w-full border-collapse min-w-[1400px]">
                <thead>
                  {/* Ligne 1 : Mois */}
                  <tr className="bg-white/20 backdrop-blur-sm border-b border-white/30">
                    <th className="p-3 text-left font-semibold text-slate-700 sticky left-0 bg-[#eef2f5] z-20 min-w-[220px] border-r-2 border-white/30">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0B676E]" />
                        Client
                      </div>
                    </th>
                    {MONTHS_SHORT.map((month, idx) => (
                      <th 
                        key={idx} 
                        className={cn(
                          "p-3 text-center font-semibold min-w-[130px] border-x border-white/10",
                          idx === currentMonth && selectedYear === getYear(new Date()) && "bg-[#0B676E]/10"
                        )}
                      >
                        <div className={cn(
                          "text-sm",
                          idx === currentMonth && selectedYear === getYear(new Date()) && "text-[#0B676E]"
                        )}>
                          {month}
                        </div>
                        <div className="text-xs text-slate-500">{selectedYear}</div>
                      </th>
                    ))}
                    <th className="p-3 text-center font-semibold bg-white/10 min-w-[100px] border-l-2 border-white/30">
                      Total
                    </th>
                  </tr>

                  {/* Ligne 2 : Totaux mensuels */}
                  <tr className="bg-white/10 border-b-2 border-white/30">
                    <td className="p-2 text-sm font-medium text-slate-600 sticky left-0 bg-white/10 z-20 border-r-2 border-white/30">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-[#0B676E]" />
                        Totaux mensuels
                      </div>
                    </td>
                    {monthlyTotals.map((total, idx) => (
                      <td key={idx} className="p-2 text-center">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-center gap-2">
                            <span className="text-emerald-600">P {total.paid}</span>
                            <span className="text-red-600">R {total.overdue}</span>
                            <span className="text-amber-600">A {total.pending}</span>
                          </div>
                          {total.revenue > 0 && (
                            <div className="text-xs font-medium text-[#0B676E]">
                              {(total.revenue / 1000).toFixed(0)}k Ar
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold text-slate-800 bg-white/10">
                      {monthlyTotals.reduce((sum, t) => sum + t.revenue, 0) > 0 
                        ? `${(monthlyTotals.reduce((sum, t) => sum + t.revenue, 0) / 1000).toFixed(0)}k Ar`
                        : '-'}
                    </td>
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client: ClientRow) => (
                    <tr 
                      key={client.clientId} 
                      className={cn(
                        "border-b border-white/10 hover:bg-white/10 transition-colors duration-150",
                        client.stats.totalOverdue > 0 && "bg-red-50/10"
                      )}
                    >
                      {/* Colonne client (sticky) néomorphique */}
                      <td className="p-3 sticky left-0 bg-[#eef2f5] z-10 border-r-2 border-white/30 hover:bg-white/10 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]",
                              client.stats.paymentRate >= 80 ? "bg-emerald-500" :
                              client.stats.paymentRate >= 50 ? "bg-amber-500" : "bg-red-500"
                            )} />
                            <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                              {client.clientName}
                            </span>
                            
                            {client.stats.totalOverdue > 0 && (
                              <Badge className="bg-red-100 text-red-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs">
                                {client.stats.totalOverdue} retard
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {client.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{client.email}</span>
                              </span>
                            )}
                            {client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-[#eef2f5] text-slate-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs font-normal">
                              {client.planName}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {client.planPrice.toLocaleString()} Ar/mois
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cellules des mois */}
                      {client.months.map((monthData: MonthData, idx: number) => {
                        const config = getStatusConfig(monthData.status);
                        
                        if (!monthData.hasInvoice || monthData.status === 'not_subscribed' || monthData.status === 'no_invoice') {
                          return (
                            <td key={idx} className="p-2 text-center">
                              <div className="p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff] h-full min-h-[80px] flex items-center justify-center">
                                <span className="text-xs text-slate-400">-</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={idx} className="p-2 text-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div 
                                  className={cn(
                                    "p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                    "flex flex-col items-center gap-1 hover:shadow-md",
                                    config.bg,
                                    config.border,
                                    monthData.status === 'overdue' && "shadow-red-100 shadow-sm",
                                    idx === currentMonth && selectedYear === getYear(new Date()) && "ring-2 ring-[#0B676E] ring-offset-2 ring-offset-[#eef2f5]"
                                  )}
                                >
                                  {/* Montant */}
                                  <div className={cn("font-bold text-sm", config.text)}>
                                    {(monthData.amount || 0).toLocaleString()} Ar
                                  </div>
                                  
                                  {/* Statut */}
                                  <div className="flex items-center gap-1">
                                    {config.icon}
                                    <span className="text-xs font-medium">{config.label}</span>
                                  </div>
                                  
                                  {/* Date d'échéance */}
                                  {monthData.dueDate && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(monthData.dueDate), 'dd/MM')}
                                    </div>
                                  )}
                                  
                                  {/* Méthode de paiement si payé */}
                                  {monthData.status === 'paid' && monthData.paymentMethod && (
                                    <Badge className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                      {monthData.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money'}
                                    </Badge>
                                  )}
                                </div>
                              </PopoverTrigger>
                              
                              <PopoverContent className="w-64 p-3 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0" side="top">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm text-slate-900">
                                      {MONTHS[idx]} {selectedYear}
                                    </h4>
                                    <Badge className={cn(
                                      monthData.status === 'paid' && "bg-emerald-100 text-emerald-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                      monthData.status === 'overdue' && "bg-red-100 text-red-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                      monthData.status === 'pending' && "bg-amber-100 text-amber-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]"
                                    )}>
                                      {config.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-sm">
                                    <p className="font-semibold text-slate-800">Facture #{monthData.invoiceNumber}</p>
                                    <p className="text-slate-600">{(monthData.amount || 0).toLocaleString()} Ar</p>
                                  </div>
                                  
                                  {monthData.dueDate && (
                                    <div className="text-xs text-slate-500">
                                      <span className="font-medium">Échéance:</span> {format(new Date(monthData.dueDate), 'dd MMMM yyyy', { locale: fr })}
                                    </div>
                                  )}
                                  
                                  {monthData.paidDate && (
                                    <div className="text-xs text-emerald-600">
                                      <span className="font-medium">Payé le:</span> {format(new Date(monthData.paidDate), 'dd MMMM yyyy', { locale: fr })}
                                    </div>
                                  )}
                                  
                                  <div className="flex flex-col gap-1 pt-2 border-t border-white/40">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className={cn(NEO.button, "justify-start")}
                                      onClick={() => onViewInvoiceDetails?.(monthData.invoiceId!)}
                                    >
                                      <Eye className="h-3 w-3 mr-2" />
                                      Voir détails
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className={cn(NEO.button, "justify-start")}
                                      onClick={() => onDownloadInvoice(monthData.invoiceId!, monthData.invoiceNumber!)}
                                    >
                                      <Download className="h-3 w-3 mr-2" />
                                      Télécharger PDF
                                    </Button>
                                    
                                    {/* ==========================================================
                                        SECTION CORRIGÉE - Affichage des boutons de paiement
                                    ========================================================== */}
                                    {/* Afficher les boutons de paiement uniquement si la facture est en attente ou en retard */}
                                    {(monthData.status === 'pending' || monthData.status === 'overdue') && (
                                      <div className="flex flex-col gap-1 pt-1">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className={cn(NEO.button, "justify-start text-emerald-600 hover:text-emerald-700")}
                                          onClick={() => onMarkAsPaid?.(monthData.invoiceId!, 'cash')}
                                        >
                                          <Check className="h-3 w-3 mr-2" />
                                          Marquer payé (Espèces)
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className={cn(NEO.button, "justify-start text-blue-600 hover:text-blue-700")}
                                          onClick={() => onMarkAsPaid?.(monthData.invoiceId!, 'mobile_money')}
                                        >
                                          <Check className="h-3 w-3 mr-2" />
                                          Marquer payé (Mobile Money)
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        );
                      })}

                      {/* Colonne total client néomorphique */}
                      <td className="p-3 bg-white/10 border-l-2 border-white/30">
                        <div className="space-y-1 text-center">
                          <div className="text-sm font-bold text-slate-800">
                            {client.stats.totalAmount > 0 
                              ? `${(client.stats.totalAmount / 1000).toFixed(0)}k Ar`
                              : '-'}
                          </div>
                          <div className="flex justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-emerald-600 cursor-help">P {client.stats.totalPaid}</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">Payées</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-red-600 cursor-help">R {client.stats.totalOverdue}</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">En retard</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-amber-600 cursor-help">A {client.stats.totalPending}</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">En attente</TooltipContent>
                            </Tooltip>
                          </div>
                          
                          {/* Barre de progression néomorphique */}
                          <div className="mt-2">
                            <div className="w-full bg-[#eef2f5] rounded-full h-1.5 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${client.stats.paymentRate}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {client.stats.paymentRate}% payé
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Légende néomorphique */}
          <div className="flex flex-wrap gap-6 p-4 bg-white/10 border-t border-white/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-300 rounded shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"></div>
              <span className="text-sm text-slate-700">Payé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"></div>
              <span className="text-sm text-slate-700">En retard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border-2 border-amber-300 rounded shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"></div>
              <span className="text-sm text-slate-700">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-100 border-2 border-slate-200 rounded shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"></div>
              <span className="text-sm text-slate-700">Pas de facture</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500">
                P = Payé | R = Retard | A = En attente
              </span>
            </div>
          </div>
          
          {/* Résumé des totaux néomorphique */}
          <div className="flex flex-wrap justify-end gap-6 p-4 bg-white/5 border-t border-white/20 text-sm">
            <div>
              <span className="text-slate-500">Total général :</span>
              <span className="font-semibold text-slate-900 ml-2">
                {(globalStats.totalAmount / 1000).toFixed(0)}k Ar
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payé :</span>
              <span className="font-semibold text-emerald-600 ml-2">
                {(globalStats.paidAmount / 1000).toFixed(0)}k Ar
              </span>
            </div>
            <div>
              <span className="text-slate-500">Impayé :</span>
              <span className="font-semibold text-red-600 ml-2">
                {((globalStats.totalAmount - globalStats.paidAmount) / 1000).toFixed(0)}k Ar
              </span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}