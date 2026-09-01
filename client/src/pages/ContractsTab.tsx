// client/src/components/tabs/ContractsTab.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  FileText, Plus, AlertTriangle, CheckCircle, Filter, Download,
  FilePlus, X, Edit, Loader2, CalendarIcon, Search, ChevronsUpDown,
  Users, Eye, Trash2, ExternalLink, RefreshCw, ChevronLeft, ChevronRight,
  FileSignature, Upload, History, Clock, TrendingUp, Building2, User,
  Mail, Phone, DollarSign, Ban, Check, PenTool, Receipt,
  Shield, FileCheck, MoreVertical, Printer, Copy, Send
} from "lucide-react";

import { format, isBefore, parseISO, addDays, differenceInDays, isAfter, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

// ==================== INTERFACES ====================

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  pricePerMonth: string;
  description?: string;
}

interface Subscription {
  id: number;
  clientId: number;
  planId: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface Contract {
  id: number;
  contractNumber: string;
  clientId: number;
  subscriptionId?: number;
  templateId?: number;
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  signedDate?: string;
  cancelledDate?: string;
  status: "draft" | "pending_signature" | "signed" | "active" | "expired" | "cancelled" | "terminated";
  isAutoRenew: boolean;
  clientSignature?: string;
  companySignature?: string;
  signatureType?: string;
  signedDocumentUrl?: string;
  originalDocumentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  planName?: string;
  planPrice?: string;
  versions?: ContractVersion[];
}

interface ContractVersion {
  id: number;
  contractId: number;
  version: number;
  content: string;
  changes: string;
  modifiedAt: string;
}

interface ContractTemplate {
  id: number;
  name: string;
  description?: string;
  content: string;
  version: number;
  isActive: boolean;
}

interface NewContractData {
  clientId: number;
  subscriptionId?: number;
  templateId?: number;
  title: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  isAutoRenew: boolean;
  notes?: string;
}

// ==================== COMPOSANTS HELPERS ====================

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace("MGA", "Ar");
};

const formatDate = (date: string | Date) => {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd MMMM yyyy", { locale: fr });
};

const StatusBadge = ({ status }: { status: Contract["status"] }) => {
  const statusConfig = {
    draft: { label: "Brouillon", className: "bg-gray-50 text-gray-700 border-gray-200", icon: <PenTool className="h-3 w-3 mr-1" /> },
    pending_signature: { label: "Signature en attente", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="h-3 w-3 mr-1" /> },
    signed: { label: "Signé", className: "bg-green-50 text-green-700 border-green-200", icon: <Check className="h-3 w-3 mr-1" /> },
    active: { label: "Actif", className: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    expired: { label: "Expiré", className: "bg-gray-50 text-gray-700 border-gray-200", icon: <Clock className="h-3 w-3 mr-1" /> },
    cancelled: { label: "Annulé", className: "bg-red-50 text-red-700 border-red-200", icon: <X className="h-3 w-3 mr-1" /> },
    terminated: { label: "Résilié", className: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", config.className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

const EmptyState = ({ icon, title, description, action }: { 
  icon?: React.ReactElement; 
  title: string; 
  description: string; 
  action?: React.ReactNode;
}) => {
  return (
    <div className="text-center py-12">
      {icon && React.cloneElement(icon, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" })}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  );
};

const DashboardCard = ({ title, value, description, icon, variant = "default", loading = false }: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactElement;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  loading?: boolean;
}) => {
  const variantStyles = {
    default: { border: "border-gray-200", value: "text-gray-900", bg: "bg-white", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
    success: { border: "border-green-100", value: "text-green-600", bg: "bg-gradient-to-br from-green-50 to-white", iconBg: "bg-green-100", iconColor: "text-green-600" },
    destructive: { border: "border-red-100", value: "text-red-600", bg: "bg-gradient-to-br from-red-50 to-white", iconBg: "bg-red-100", iconColor: "text-red-600" },
    warning: { border: "border-yellow-100", value: "text-yellow-600", bg: "bg-gradient-to-br from-yellow-50 to-white", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
    info: { border: "border-blue-100", value: "text-blue-600", bg: "bg-gradient-to-br from-blue-50 to-white", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn("hover:shadow-md transition-all duration-300 border", styles.border, styles.bg)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", styles.iconBg)}>
          {React.cloneElement(icon, { className: cn("h-4 w-4", styles.iconColor) })}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="text-gray-500">Chargement...</span>
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold mb-1", styles.value)}>{value}</div>
            <p className="text-xs text-gray-500">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const SignaturePad = ({ onSign, onCancel, loading = false }: { 
  onSign: (signatureData: string) => void; 
  onCancel: () => void;
  loading?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const signatureData = canvas.toDataURL("image/png");
      onSign(signatureData);
    }
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-40 border rounded cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={clearSignature} disabled={loading}>
          Effacer
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button size="sm" onClick={saveSignature} disabled={!hasSignature || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Signer
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

export function ContractsTab({ users, subscriptions, subscriptionPlans }: {
  users: User[];
  subscriptions: Subscription[];
  subscriptionPlans: SubscriptionPlan[];
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient_ = queryClient;

  // États
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [isContractDetailsOpen, setIsContractDetailsOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteContractId, setDeleteContractId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage, setContractsPerPage] = useState(10);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});
  
  // États pour création
  const [newContractData, setNewContractData] = useState<NewContractData>({
    clientId: 0,
    title: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 365),
    status: "draft",
    isAutoRenew: true,
  });
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [subscriptionSearchOpen, setSubscriptionSearchOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  
  // Requêtes
  const { data: contracts = [], isLoading: isLoadingContracts, refetch: refetchContracts } = useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  
  const { data: templates = [], refetch: refetchTemplates } = useQuery<ContractTemplate[]>({
    queryKey: ["contractTemplates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts/templates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["contractStats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts/stats/summary");
      return await res.json();
    },
    enabled: user?.role === "admin",
  });

  // Mutations
  const createContractMutation = useMutation({
    mutationFn: async (data: NewContractData) => {
      const res = await apiRequest("POST", "/api/contracts", {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur création");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      queryClient_.invalidateQueries({ queryKey: ["contractStats"] });
      toast({ title: "✅ Contrat créé", description: "Le contrat a été créé avec succès" });
      setIsNewContractOpen(false);
      setNewContractData({
        clientId: 0,
        title: "",
        startDate: new Date(),
        endDate: addDays(new Date(), 365),
        status: "draft",
        isAutoRenew: true,
      });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Contract> }) => {
      const res = await apiRequest("PATCH", `/api/contracts/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      queryClient_.invalidateQueries({ queryKey: ["contractStats"] });
      toast({ title: "✅ Contrat modifié", description: "Le contrat a été mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async ({ id, signatureData }: { id: number; signatureData: string }) => {
      const res = await apiRequest("POST", `/api/contracts/${id}/sign`, {
        signatureData,
        signatureType: "electronic",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur signature");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      queryClient_.invalidateQueries({ queryKey: ["contractStats"] });
      toast({ title: "✅ Contrat signé", description: "La signature a été enregistrée" });
      setIsSignatureDialogOpen(false);
      setSelectedContract(null);
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/contracts/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur suppression");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      queryClient_.invalidateQueries({ queryKey: ["contractStats"] });
      toast({ title: "🗑️ Supprimé", description: "Le contrat a été supprimé" });
      setDeleteContractId(null);
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const generateFromSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest("POST", `/api/contracts/generate-from-subscription/${subscriptionId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur génération");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "✅ Contrat généré", description: "Le contrat a été généré depuis l'abonnement" });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleDownloadContractPdf = async (contractId: number, contractNumber: string) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [contractId]: 0 }));
      
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          const current = prev[contractId] ?? 0;
          if (current >= 99) return prev;
          return { ...prev, [contractId]: Math.min(99, current + 10) };
        });
      }, 100);
      
      const res = await fetch(`/api/contracts/${contractId}/download-pdf`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/pdf" },
      });
      
      if (!res.ok) throw new Error("Téléchargement échoué");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat_${contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      clearInterval(interval);
      toast({ title: "✅ Téléchargé", description: `Contrat ${contractNumber}` });
    } catch (error: any) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    } finally {
      setDownloadProgress(prev => {
        const { [contractId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSignContract = async (contractId: number, signatureData: string) => {
    setIsSigning(true);
    await signContractMutation.mutateAsync({ id: contractId, signatureData });
    setIsSigning(false);
  };

  const handleUpdateContractStatus = async (contractId: number, status: Contract["status"]) => {
    await updateContractMutation.mutateAsync({ id: contractId, data: { status } });
  };

  // Filtres et pagination
  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.contractNumber.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.clientName?.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts, statusFilter, searchQuery]);

  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  // Calculs pour expirations
  const expiringContracts = useMemo(() => {
    return contracts.filter(c => {
      if (c.status !== "active") return false;
      if (!c.endDate) return false;
      const daysUntil = differenceInDays(parseISO(c.endDate), new Date());
      return daysUntil <= 30 && daysUntil > 0;
    });
  }, [contracts]);

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Gestion des Contrats
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">
              Créez, gérez et signez électroniquement les contrats d'abonnement
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchContracts()} 
              className="h-8 md:h-9"
            >
              <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Actualiser
            </Button>
            
            <Dialog open={isNewContractOpen} onOpenChange={setIsNewContractOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 md:h-9 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Nouveau Contrat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Créer un Contrat
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un nouveau contrat
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Client *</Label>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9">
                          {(() => {
                            const client = users.find(u => u.id === newContractData.clientId);
                            return client ? `${client.fullName} (${client.email})` : "Sélectionner un client";
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] md:w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Rechercher un client..." />
                          <CommandList>
                            <CommandEmpty>Aucun client trouvé</CommandEmpty>
                            <CommandGroup>
                              {users.filter(u => u.role === "client").map(client => (
                                <CommandItem
                                  key={client.id}
                                  onSelect={() => {
                                    setNewContractData({ ...newContractData, clientId: client.id });
                                    setClientSearchOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{client.fullName}</span>
                                    <span className="text-xs text-gray-500">{client.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Titre du contrat *</Label>
                    <Input
                      placeholder="Ex: Contrat d'abonnement - 2024"
                      value={newContractData.title}
                      onChange={(e) => setNewContractData({ ...newContractData, title: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Date de début *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start h-9">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(newContractData.startDate)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newContractData.startDate}
                            onSelect={(date) => date && setNewContractData({ ...newContractData, startDate: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start h-9">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newContractData.endDate ? formatDate(newContractData.endDate) : "Sans date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newContractData.endDate}
                            onSelect={(date) => setNewContractData({ ...newContractData, endDate: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Abonnement associé</Label>
                      <Popover open={subscriptionSearchOpen} onOpenChange={setSubscriptionSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-9">
                            {(() => {
                              const sub = subscriptions.find(s => s.id === newContractData.subscriptionId);
                              const client = sub ? users.find(u => u.id === sub.clientId) : null;
                              const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
                              return sub ? `${client?.fullName} - ${plan?.name}` : "Aucun (optionnel)";
                            })()}
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] md:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher un abonnement..." />
                            <CommandList>
                              <CommandEmpty>Aucun abonnement trouvé</CommandEmpty>
                              <CommandGroup>
                                <CommandItem onSelect={() => {
                                  setNewContractData({ ...newContractData, subscriptionId: undefined });
                                  setSubscriptionSearchOpen(false);
                                }}>
                                  <span className="text-gray-500">Aucun abonnement</span>
                                </CommandItem>
                                {subscriptions.filter(s => s.isActive).map(sub => {
                                  const client = users.find(u => u.id === sub.clientId);
                                  const plan = subscriptionPlans.find(p => p.id === sub.planId);
                                  return (
                                    <CommandItem
                                      key={sub.id}
                                      onSelect={() => {
                                        setNewContractData({ ...newContractData, subscriptionId: sub.id });
                                        setSubscriptionSearchOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{client?.fullName}</span>
                                        <span className="text-xs text-gray-500">{plan?.name} - {plan?.pricePerMonth} Ar/mois</span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Renouvellement automatique</Label>
                      <Select 
                        value={newContractData.isAutoRenew ? "true" : "false"} 
                        onValueChange={(v) => setNewContractData({ ...newContractData, isAutoRenew: v === "true" })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Oui</SelectItem>
                          <SelectItem value="false">Non</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Notes</Label>
                    <Textarea
                      placeholder="Notes internes..."
                      value={newContractData.notes || ""}
                      onChange={(e) => setNewContractData({ ...newContractData, notes: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsNewContractOpen(false)} className="w-full sm:w-auto">
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => createContractMutation.mutate(newContractData)} 
                    disabled={!newContractData.clientId || !newContractData.title || createContractMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createContractMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer le contrat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alertes contrats expirants */}
        {expiringContracts.length > 0 && (
          <AlertDialog open={true}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Contrats bientôt expirés
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {expiringContracts.length} contrat(s) arrivent à expiration dans moins de 30 jours.
                  Pensez à contacter les clients pour le renouvellement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {expiringContracts.map(contract => (
                    <div key={contract.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{contract.clientName}</p>
                        <p className="text-sm text-gray-500">{contract.contractNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-600">
                          Expire le {formatDate(contract.endDate!)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {differenceInDays(parseISO(contract.endDate!), new Date())} jours restants
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => {}}>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* KPIs */}
        {user?.role === "admin" && stats && (
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Contrats"
              value={stats.total}
              description="Tous contrats confondus"
              icon={<FileText className="h-4 w-4" />}
              variant="default"
              loading={isLoadingContracts}
            />
            <DashboardCard
              title="Contrats Actifs"
              value={stats.active}
              description={`${stats.autoRenew} en renouvellement auto`}
              icon={<CheckCircle className="h-4 w-4" />}
              variant="success"
              loading={isLoadingContracts}
            />
            <DashboardCard
              title="En Attente Signature"
              value={stats.pending_signature || 0}
              description="Contrats à signer"
              icon={<FileSignature className="h-4 w-4" />}
              variant="warning"
              loading={isLoadingContracts}
            />
            <DashboardCard
              title="Expiration < 30j"
              value={stats.expiringSoon || 0}
              description="À renouveler"
              icon={<AlertTriangle className="h-4 w-4" />}
              variant="destructive"
              loading={isLoadingContracts}
            />
          </div>
        )}

        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Filter className="h-5 w-5 text-indigo-600" />
                Filtres
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setCurrentPage(1);
              }} className="h-8">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par n°, client ou titre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_signature">Signature en attente</SelectItem>
                  <SelectItem value="signed">Signé</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="terminated">Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des contrats */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">Liste des Contrats</CardTitle>
                <CardDescription>{filteredContracts.length} contrat(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="rounded-lg border overflow-x-auto">
              <div className="min-w-[800px] lg:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs md:text-sm">N° Contrat</TableHead>
                      <TableHead className="text-xs md:text-sm">Client</TableHead>
                      <TableHead className="text-xs md:text-sm hidden md:table-cell">Titre</TableHead>
                      <TableHead className="text-xs md:text-sm hidden lg:table-cell">Période</TableHead>
                      <TableHead className="text-xs md:text-sm">Statut</TableHead>
                      <TableHead className="text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingContracts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                          <p className="mt-2 text-gray-500">Chargement des contrats...</p>
                        </TableCell>
                      </TableRow>
                    ) : currentContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <EmptyState
                            icon={<FileText className="h-12 w-12" />}
                            title="Aucun contrat"
                            description="Créez votre premier contrat"
                            action={<Button onClick={() => setIsNewContractOpen(true)} className="mt-4">+ Nouveau Contrat</Button>}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentContracts.map((contract) => {
                        const client = users.find(u => u.id === contract.clientId);
                        const isExpiringSoon = contract.status === "active" && contract.endDate && 
                          differenceInDays(parseISO(contract.endDate), new Date()) <= 30;
                        
                        return (
                          <TableRow key={contract.id} className={cn(
                            isExpiringSoon ? "bg-yellow-50/50" : "",
                            "hover:bg-indigo-50/30 transition-colors"
                          )}>
                            <TableCell className="py-2 md:py-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs md:text-sm font-medium">{contract.contractNumber}</span>
                                </div>
                                <p className="text-xs text-gray-500">{formatDate(contract.createdAt)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-3">
                              <div className="space-y-0.5">
                                <p className="font-medium text-xs md:text-sm">{client?.fullName || "N/A"}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{client?.email || "N/A"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell py-2 md:py-3">
                              <p className="text-xs md:text-sm">{contract.title}</p>
                              {contract.planName && (
                                <p className="text-xs text-gray-500">{contract.planName} • {formatCurrency(parseFloat(contract.planPrice || "0"))}</p>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-2 md:py-3">
                              <div className="space-y-0.5">
                                <p className="text-xs">Début: {formatDate(contract.startDate)}</p>
                                {contract.endDate && (
                                  <p className={cn("text-xs", isExpiringSoon ? "text-yellow-600 font-medium" : "text-gray-500")}>
                                    Fin: {formatDate(contract.endDate)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-3">
                              <div className="space-y-1">
                                <StatusBadge status={contract.status} />
                                {contract.isAutoRenew && contract.status === "active" && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    Auto-renouvelable
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2 md:py-3">
                              <div className="flex items-center justify-end gap-0.5 md:gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedContract(contract);
                                        setIsContractDetailsOpen(true);
                                      }}
                                      className="h-7 w-7 md:h-8 md:w-8 p-0"
                                    >
                                      <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Détails</TooltipContent>
                                </Tooltip>
                                
                                {contract.status === "draft" && contract.clientId && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpdateContractStatus(contract.id, "pending_signature")}
                                        className="h-7 w-7 md:h-8 md:w-8 p-0 text-blue-600"
                                      >
                                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Envoyer pour signature</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                {(contract.status === "pending_signature" || contract.status === "draft") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedContract(contract);
                                          setIsSignatureDialogOpen(true);
                                        }}
                                        className="h-7 w-7 md:h-8 md:w-8 p-0 text-green-600"
                                      >
                                        <FileSignature className="h-3 w-3 md:h-4 md:w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Signer</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadContractPdf(contract.id, contract.contractNumber)}
                                      className="h-7 w-7 md:h-8 md:w-8 p-0"
                                      disabled={downloadProgress[contract.id] !== undefined}
                                    >
                                      {downloadProgress[contract.id] !== undefined ? (
                                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                      ) : (
                                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Télécharger PDF</TooltipContent>
                                </Tooltip>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0">
                                      <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(`/api/contracts/${contract.id}/preview`, "_blank")}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Prévisualiser
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadContractPdf(contract.id, contract.contractNumber)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Télécharger PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateContractStatus(contract.id, "active")} className="text-green-600">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateContractStatus(contract.id, "terminated")} className="text-orange-600">
                                      <Ban className="h-4 w-4 mr-2" />
                                      Résilier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteContractId(contract.id)} className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {indexOfFirstContract + 1} - {Math.min(indexOfLastContract, filteredContracts.length)} sur {filteredContracts.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">Page {currentPage} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={contractsPerPage.toString()} onValueChange={(v) => {
                  setContractsPerPage(parseInt(v));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 par page</SelectItem>
                    <SelectItem value="25">25 par page</SelectItem>
                    <SelectItem value="50">50 par page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Détails Contrat */}
        <Dialog open={isContractDetailsOpen} onOpenChange={setIsContractDetailsOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-hidden p-0">
            {selectedContract && (
              <>
                <DialogHeader className="p-4 md:p-6 pb-0">
                  <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    {selectedContract.title}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="p-4 md:p-6 pt-4 max-h-[calc(90vh-120px)]">
                  <div className="space-y-6">
                    {/* En-tête contrat */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 md:p-6 rounded-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                          <p className="text-sm text-indigo-600">N° Contrat</p>
                          <p className="text-xl font-bold">{selectedContract.contractNumber}</p>
                        </div>
                        <StatusBadge status={selectedContract.status} />
                      </div>
                    </div>
                    
                    {/* Informations client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Informations Client
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                          <p className="font-medium">{selectedContract.clientName}</p>
                          <p className="text-sm flex items-center gap-2"><Mail className="h-3 w-3" /> {selectedContract.clientEmail}</p>
                          <p className="text-sm flex items-center gap-2"><Phone className="h-3 w-3" /> {selectedContract.clientPhone}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Période du contrat
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                          <p className="text-sm">Début: {formatDate(selectedContract.startDate)}</p>
                          {selectedContract.endDate && (
                            <p className="text-sm">Fin: {formatDate(selectedContract.endDate)}</p>
                          )}
                          <p className="text-sm">Renouvellement auto: {selectedContract.isAutoRenew ? "Oui" : "Non"}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informations plan */}
                    {selectedContract.planName && (
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Abonnement
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{selectedContract.planName}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(parseFloat(selectedContract.planPrice || "0"))} / mois</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Signature */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        Signature
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {selectedContract.signedDate ? (
                          <div className="space-y-1">
                            <p className="text-sm text-green-600">✓ Signé le {formatDate(selectedContract.signedDate)}</p>
                            <p className="text-xs text-gray-500">Type: {selectedContract.signatureType === "electronic" ? "Signature électronique" : "Manuscrite"}</p>
                            {selectedContract.clientSignature && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Signature:</p>
                                <img src={selectedContract.clientSignature} alt="Signature" className="h-16 border rounded bg-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-yellow-600">En attente de signature</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Notes */}
                    {selectedContract.notes && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Notes</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm">{selectedContract.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Version history button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsVersionHistoryOpen(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Voir l'historique des versions 
                    </Button>
                  </div>
                </ScrollArea>
                
                <DialogFooter className="p-4 md:p-6 pt-0 flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsContractDetailsOpen(false)}>
                    Fermer
                  </Button>
                  <Button onClick={() => handleDownloadContractPdf(selectedContract.id, selectedContract.contractNumber)}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Signature */}
        <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-green-600" />
                Signature électronique
              </DialogTitle>
              <DialogDescription>
                Veuillez signer dans le cadre ci-dessous pour valider le contrat.
              </DialogDescription>
            </DialogHeader>
            
            {selectedContract && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedContract.contractNumber}</p>
                  <p className="text-sm text-gray-500">{selectedContract.title}</p>
                  <p className="text-sm">Client: {selectedContract.clientName}</p>
                </div>
                
                <SignaturePad
                  onSign={(signatureData) => handleSignContract(selectedContract.id, signatureData)}
                  onCancel={() => setIsSignatureDialogOpen(false)}
                  loading={signContractMutation.isPending}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Version History */}
        <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des versions
              </DialogTitle>
            </DialogHeader>
            
            {selectedContract && (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {selectedContract.versions && selectedContract.versions.length > 0 ? (
                    selectedContract.versions.map((version) => (
                      <div key={version.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Version {version.version}</p>
                            <p className="text-sm text-gray-500">{formatDate(version.modifiedAt)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/contracts/${selectedContract.id}/preview?version=${version.version}`, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm mt-2">{version.changes}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Aucune version"
                      description="Aucune version antérieure disponible"
                    />
                  )}
                </div>
              </ScrollArea>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVersionHistoryOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog Suppression */}
        <AlertDialog open={deleteContractId !== null} onOpenChange={(open) => !open && setDeleteContractId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression </AlertDialogTitle>
              <AlertDialogDescription>
                cette action est irréversible. Le contrat sera définitivement supprimé ainsi que son historique.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteContractId && deleteContractMutation.mutate(deleteContractId)} className="bg-red-600 w-full sm:w-auto">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}