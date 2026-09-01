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
  Eye, BarChart3, Filter, X, ArrowUpDown, DollarSign, Loader2,
  ChevronUp, ChevronDown, Menu
} from 'lucide-react';
import { format, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

// Composant pour l'affichage mobile des mois
const MobileMonthView = ({ client, months, selectedYear, onViewDetails, onDownload, onMarkAsPaid }: { 
  client: ClientRow; 
  months: MonthData[];
  selectedYear: number;
  onViewDetails: (id: number) => void;
  onDownload: (id: number, num: string) => void;
  onMarkAsPaid: (id: number, method: 'cash' | 'mobile_money') => void;
}) => {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 border-green-400 text-green-700';
      case 'overdue': return 'bg-red-100 border-red-400 text-red-700';
      case 'pending': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      {months.map((monthData, idx) => {
        if (!monthData.hasInvoice) return null;
        
        const isExpanded = expandedMonth === idx;
        const config = {
          bg: getStatusColor(monthData.status),
          icon: getStatusIcon(monthData.status),
          label: monthData.status === 'paid' ? 'Payé' : monthData.status === 'overdue' ? 'En retard' : 'En attente'
        };

        return (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : idx)}
              className={cn(
                "w-full p-3 flex items-center justify-between transition-colors",
                config.bg
              )}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{MONTHS_SHORT[idx]} {selectedYear}</span>
                <div className="flex items-center gap-1 text-sm">
                  {config.icon}
                  <span>{config.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {(monthData.amount || 0).toLocaleString()} Ar
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            
            {isExpanded && monthData.hasInvoice && (
              <div className="p-3 bg-white border-t space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">N° Facture</p>
                    <p className="font-medium">{monthData.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Montant</p>
                    <p className="font-bold text-blue-600">{(monthData.amount || 0).toLocaleString()} Ar</p>
                  </div>
                  {monthData.dueDate && (
                    <div>
                      <p className="text-gray-500 text-xs">Date d'échéance</p>
                      <p className="text-sm">{format(new Date(monthData.dueDate), 'dd/MM/yyyy')}</p>
                    </div>
                  )}
                  {monthData.paymentMethod && monthData.status === 'paid' && (
                    <div>
                      <p className="text-gray-500 text-xs">Mode de paiement</p>
                      <Badge variant="outline" className="text-xs">
                        {monthData.paymentMethod === 'cash' ? '💵 Espèces' : '📱 Mobile'}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewDetails(monthData.invoiceId!)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Détails
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDownload(monthData.invoiceId!, monthData.invoiceNumber!)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                  {monthData.status !== 'paid' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-600 border-green-300"
                      onClick={() => onMarkAsPaid(monthData.invoiceId!, 'cash')}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Marquer payé
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Composant pour l'affichage desktop (tableau)
const DesktopTableView = ({ clients, months, selectedYear, currentMonth, onViewDetails, onDownload, onMarkAsPaid }: {
  clients: ClientRow[];
  months: string[];
  selectedYear: number;
  currentMonth: number;
  onViewDetails: (id: number) => void;
  onDownload: (id: number, num: string) => void;
  onMarkAsPaid: (id: number, method: 'cash' | 'mobile_money') => void;
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'bg-green-50 hover:bg-green-100', border: 'border-green-300', text: 'text-green-700', icon: <Check className="h-4 w-4 text-green-500" />, label: 'Payé' };
      case 'overdue':
        return { bg: 'bg-red-50 hover:bg-red-100 animate-pulse', border: 'border-red-400', text: 'text-red-700', icon: <AlertTriangle className="h-4 w-4 text-red-500" />, label: 'En retard' };
      case 'pending':
        return { bg: 'bg-yellow-50 hover:bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'En attente' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400', icon: <X className="h-4 w-4 text-gray-300" />, label: '-' };
    }
  };

  const sortedClients = useMemo(() => {
    if (!sortColumn) return clients;
    
    return [...clients].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortColumn === 'name') {
        aVal = a.clientName;
        bVal = b.clientName;
      } else if (sortColumn === 'plan') {
        aVal = a.planName;
        bVal = b.planName;
      } else if (sortColumn === 'totalAmount') {
        aVal = a.stats.totalAmount;
        bVal = b.stats.totalAmount;
      } else if (sortColumn === 'paymentRate') {
        aVal = a.stats.paymentRate;
        bVal = b.stats.paymentRate;
      } else {
        return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [clients, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
            <th className="p-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-20 min-w-[220px] border-r-2 border-gray-200">
              <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-blue-600">
                <User className="h-4 w-4" />
                Client
                <SortIcon column="name" />
              </button>
            </th>
            {months.map((month, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "p-3 text-center font-semibold min-w-[100px] border-x border-gray-100",
                  idx === currentMonth && selectedYear === getYear(new Date()) && "bg-blue-50"
                )}
              >
                <div className={cn(
                  "text-sm",
                  idx === currentMonth && selectedYear === getYear(new Date()) && "text-blue-700"
                )}>
                  {month}
                </div>
                <div className="text-xs text-gray-500">{selectedYear}</div>
              </th>
            ))}
            <th className="p-3 text-center font-semibold bg-gray-50 min-w-[120px] border-l-2 border-gray-200">
              <button onClick={() => handleSort('totalAmount')} className="flex items-center justify-center gap-1 hover:text-blue-600">
                Total
                <SortIcon column="totalAmount" />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedClients.map((client) => (
            <tr 
              key={client.clientId} 
              className={cn(
                "border-b hover:bg-blue-50/50 transition-colors duration-150",
                client.stats.totalOverdue > 0 && "bg-red-50/30"
              )}
            >
              <td className="p-3 sticky left-0 bg-white z-10 border-r-2 border-gray-200 hover:bg-blue-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      client.stats.paymentRate >= 80 ? "bg-green-500" :
                      client.stats.paymentRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className="font-semibold text-gray-900 truncate max-w-[150px]">
                      {client.clientName}
                    </span>
                    {client.stats.totalOverdue > 0 && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        {client.stats.totalOverdue} retard
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    {client.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-normal bg-blue-50">
                      {client.planName}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {client.planPrice.toLocaleString()} Ar/mois
                    </span>
                  </div>
                </div>
              </td>

              {client.months.map((monthData, idx) => {
                const config = getStatusConfig(monthData.status);
                
                if (!monthData.hasInvoice) {
                  return (
                    <td key={idx} className="p-2 text-center">
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 min-h-[80px] flex items-center justify-center">
                        <span className="text-xs text-gray-400">-</span>
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
                            "p-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
                            "flex flex-col items-center gap-1 hover:shadow-md",
                            config.bg, config.border,
                            monthData.status === 'overdue' && "shadow-red-200 shadow-sm",
                            idx === currentMonth && selectedYear === getYear(new Date()) && "ring-2 ring-blue-300"
                          )}
                        >
                          <div className={cn("font-bold text-sm", config.text)}>
                            {(monthData.amount || 0).toLocaleString()} Ar
                          </div>
                          <div className="flex items-center gap-1">
                            {config.icon}
                            <span className="text-xs font-medium">{config.label}</span>
                          </div>
                          {monthData.dueDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(monthData.dueDate), 'dd/MM')}
                            </div>
                          )}
                        </div>
                      </PopoverTrigger>
                      
                      <PopoverContent className="w-64 p-3" side="top">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">
                              {MONTHS[idx]} {selectedYear}
                            </h4>
                            <Badge className={cn(
                              monthData.status === 'paid' && "bg-green-100 text-green-700",
                              monthData.status === 'overdue' && "bg-red-100 text-red-700",
                              monthData.status === 'pending' && "bg-yellow-100 text-yellow-700"
                            )}>
                              {config.label}
                            </Badge>
                          </div>
                          
                          <div className="text-sm">
                            <p className="font-semibold">Facture #{monthData.invoiceNumber}</p>
                            <p className="text-gray-600">{(monthData.amount || 0).toLocaleString()} Ar</p>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-2 border-t">
                            <Button size="sm" variant="ghost" className="justify-start" onClick={() => onViewDetails(monthData.invoiceId!)}>
                              <Eye className="h-3 w-3 mr-2" /> Voir détails
                            </Button>
                            <Button size="sm" variant="ghost" className="justify-start" onClick={() => onDownload(monthData.invoiceId!, monthData.invoiceNumber!)}>
                              <Download className="h-3 w-3 mr-2" /> Télécharger PDF
                            </Button>
                            {monthData.status !== 'paid' && (
                              <Button size="sm" variant="ghost" className="justify-start text-green-600" onClick={() => onMarkAsPaid(monthData.invoiceId!, 'cash')}>
                                <Check className="h-3 w-3 mr-2" /> Marquer payé
                              </Button>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                );
              })}

              <td className="p-3 bg-gray-50 border-l-2 border-gray-200">
                <div className="space-y-1 text-center">
                  <div className="text-sm font-bold text-blue-700">
                    {client.stats.totalAmount > 0 
                      ? `${(client.stats.totalAmount / 1000).toFixed(0)}k Ar`
                      : '-'}
                  </div>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Tooltip><TooltipTrigger><span className="text-xs text-green-600 cursor-help">✓{client.stats.totalPaid}</span></TooltipTrigger><TooltipContent>Payées</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger><span className="text-xs text-red-600 cursor-help">⚠{client.stats.totalOverdue}</span></TooltipTrigger><TooltipContent>En retard</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger><span className="text-xs text-yellow-600 cursor-help">⏳{client.stats.totalPending}</span></TooltipTrigger><TooltipContent>En attente</TooltipContent></Tooltip>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function InvoiceMatrix({ onDownloadInvoice, onViewInvoiceDetails, onMarkAsPaid }: InvoiceMatrixProps) {
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_overdue' | 'has_pending' | 'all_paid'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(15);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Gérer le redimensionnement pour la vue mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['invoiceMatrix', selectedYear],
    queryFn: () => fetch(`/api/invoices/matrix/${selectedYear}`).then(r => r.json())
  });

  const filteredClients = useMemo(() => {
    if (!matrixData?.clients) return [];
    
    let filtered = matrixData.clients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((client: ClientRow) => 
        client.clientName.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.planName?.toLowerCase().includes(query)
      );
    }

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

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedYear]);

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

  const currentMonth = new Date().getMonth();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Chargement de la matrice...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6">
        {/* En-tête avec filtres - Responsive */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  <span className="hidden sm:inline">Tableau de Bord des Paiements</span>
                  <span className="sm:hidden">Paiements {selectedYear}</span>
                  <span className="hidden sm:inline"> {selectedYear}</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {filteredClients.length} client(s) • {matrixData?.globalStats?.totalInvoices || 0} factures
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedYear - 1}</span>
                </Button>
                <span className="text-lg font-bold min-w-[60px] text-center">{selectedYear}</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)} className="gap-1">
                  <span className="hidden sm:inline">{selectedYear + 1}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {/* Filtres rapides - Responsive */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  <SelectItem value="has_overdue">Avec retards</SelectItem>
                  <SelectItem value="has_pending">Avec en attente</SelectItem>
                  <SelectItem value="all_paid">Tout payé</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="text-red-500">
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Statistiques globales - Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {matrixData?.globalStats && (
                <>
                  <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">Clients actifs</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-800">{matrixData.globalStats.totalClients}</div>
                  </div>
                  <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">Payées</div>
                    <div className="text-xl md:text-2xl font-bold text-green-800">{matrixData.globalStats.totalPaid}</div>
                  </div>
                  <div className="p-2 md:p-3 bg-red-50 rounded-lg">
                    <div className="text-xs text-red-600 font-medium">En retard</div>
                    <div className="text-xl md:text-2xl font-bold text-red-800">{matrixData.globalStats.totalOverdue}</div>
                  </div>
                  <div className="p-2 md:p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 font-medium">Revenus</div>
                    <div className="text-base md:text-lg font-bold text-purple-800">
                      {(matrixData.globalStats.collectedRevenue / 1000).toFixed(0)}k Ar
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vue Matricielle */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isMobileView ? (
              // Vue mobile - liste déroulante par client
              <div className="divide-y">
                {currentClients.map((client: ClientRow) => (
                  <div key={client.clientId} className="p-4">
                    {/* En-tête client mobile */}
                    <div className="mb-3 pb-3 border-b">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              client.stats.paymentRate >= 80 ? "bg-green-500" :
                              client.stats.paymentRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                            )} />
                            <h3 className="font-bold text-base">{client.clientName}</h3>
                          </div>
                          <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                            {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                            {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-blue-50">{client.planName}</Badge>
                            <span className="text-xs text-gray-500">{client.planPrice.toLocaleString()} Ar/mois</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-700">
                            {client.stats.totalAmount > 0 ? `${(client.stats.totalAmount / 1000).toFixed(0)}k Ar` : '-'}
                          </div>
                          <div className="flex gap-2 justify-end text-xs mt-1">
                            <span className="text-green-600">✓{client.stats.totalPaid}</span>
                            <span className="text-red-600">⚠{client.stats.totalOverdue}</span>
                            <span className="text-yellow-600">⏳{client.stats.totalPending}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mois du client en mobile */}
                    <MobileMonthView
                      client={client}
                      months={client.months}
                      selectedYear={selectedYear}
                      onViewDetails={(id) => onViewInvoiceDetails?.(id)}
                      onDownload={onDownloadInvoice}
                      onMarkAsPaid={(id, method) => onMarkAsPaid?.(id, method)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Vue desktop - tableau
              <DesktopTableView
                clients={currentClients}
                months={MONTHS_SHORT}
                selectedYear={selectedYear}
                currentMonth={currentMonth}
                onViewDetails={(id) => onViewInvoiceDetails?.(id)}
                onDownload={onDownloadInvoice}
                onMarkAsPaid={(id, method) => onMarkAsPaid?.(id, method)}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-gray-50 border-t">
                <div className="text-sm text-gray-500 order-2 sm:order-1">
                  {indexOfFirstClient + 1} - {Math.min(indexOfLastClient, filteredClients.length)} sur {filteredClients.length} clients
                </div>
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>
                  
                  {/* Affichage des numéros de page - responsive */}
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="gap-1"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Légende - Responsive */}
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-xs sm:text-sm">Payé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded animate-pulse"></div>
            <span className="text-xs sm:text-sm">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
            <span className="text-xs sm:text-sm">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span className="text-xs sm:text-sm">Pas de facture</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">✓ Payé | ⚠ Retard | ⏳ En attente</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}