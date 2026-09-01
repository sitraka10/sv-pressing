// ExpensesTab.tsx - Version complète avec catégories en français
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Composants UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icônes depuis lucide-react
import {
  Plus,
  Search,
  RotateCcw,
  DollarSign,
  BarChart3,
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  TrendingUp,
  ChevronDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  LineChart,
  Bell,
  Target,
  Truck,
  WashingMachine,
  Flame,
  Box,
  Fuel,
  Building,
  Megaphone,
  Lightbulb,
  Wrench,
  Car,
  Users,
  FileText,
  CreditCard,
  Landmark,
  Receipt,
  Printer,
  Scissors,
  Shirt,
  Sparkles,
  Store,
  Gift,
  Briefcase,
  Coffee,
  Phone,
  Zap,
  Droplet,
  Wind,
  Thermometer,
  Layers,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Wifi,
  X,
  ListChecks,
  TrendingDown as TrendingDownIcon,
  Sun,
} from "lucide-react";

// Composants
import ExpensesLineChart from "@/components/charts/ExpensesLineChart";

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
  table: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
};

// ==================== COMPOSANTS ICÔNES ====================

const TrendingDown: React.FC<{ className?: string }> = ({ className }) => (
  <TrendingDownIcon className={className} />
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="16" y2="18"></line>
    <line x1="8" y1="14" x2="8" y2="18"></line>
    <line x1="12" y1="14" x2="12" y2="18"></line>
    <line x1="10" y1="10" x2="14" y2="10"></line>
  </svg>
);

const School: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const Heart: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const Cake: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 14v4" />
    <path d="M20 14v4" />
    <path d="M8 12V9" />
    <path d="M16 12V9" />
    <path d="M12 12V6" />
    <path d="M12 4v2" />
  </svg>
);

const Bike: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12 10v4l-3 3" />
    <path d="m12 10 4-2 2 6-4 2" />
    <path d="M9 17.5V12l3-3 2 3" />
  </svg>
);

// ==================== CONSTANTES ====================

const COLORS = [
  "#0B676E",
  "#20B2AA",
  "#0D9488",
  "#0891B2",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#DB2777",
  "#D97706",
  "#DC2626",
];

// ============================================================
// CATÉGORIES DE DÉPENSES EN FRANÇAIS
// ============================================================
const EXPENSE_CATEGORIES = [
  // ===== NETTOYAGE =====
  { value: "Détergent en poudre", label: "Détergent en poudre", icon: Droplet, group: "Nettoyage" },
  { value: "Détergent liquide", label: "Détergent liquide", icon: Droplet, group: "Nettoyage" },
  { value: "Assouplissant", label: "Assouplissant", icon: Sparkles, group: "Nettoyage" },
  { value: "Eau de Javel", label: "Eau de Javel", icon: Droplet, group: "Nettoyage" },
  { value: "Détachant", label: "Détachant", icon: Scissors, group: "Nettoyage" },
  { value: "Dégraissant professionnel", label: "Dégraissant professionnel", icon: Flame, group: "Nettoyage" },
  { value: "Désinfectant", label: "Désinfectant", icon: Shield, group: "Nettoyage" },
  
  // ===== ÉQUIPEMENTS =====
  { value: "Machine à laver", label: "Machine à laver", icon: WashingMachine, group: "Équipements" },
  { value: "Sèche-linge", label: "Sèche-linge", icon: Thermometer, group: "Équipements" },
  { value: "Fer à repasser", label: "Fer à repasser", icon: Thermometer, group: "Équipements" },
  { value: "Table à repasser", label: "Table à repasser", icon: Grid, group: "Équipements" },
  { value: "Défroisseur vapeur", label: "Défroisseur vapeur", icon: Wind, group: "Équipements" },
  { value: "Chaudière", label: "Chaudière", icon: Flame, group: "Équipements" },
  { value: "Extracteur", label: "Extracteur", icon: Wrench, group: "Équipements" },
  { value: "Plieuse", label: "Plieuse", icon: Layers, group: "Équipements" },
  
  // ===== EMBALLAGES =====
  { value: "Sachet plastique", label: "Sachet plastique", icon: Package, group: "Emballages" },
  { value: "Carton", label: "Carton", icon: Box, group: "Emballages" },
  { value: "Cintre", label: "Cintre", icon: Layers, group: "Emballages" },
  { value: "Housse de protection", label: "Housse de protection", icon: Shirt, group: "Emballages" },
  { value: "Étiquette autocollante", label: "Étiquette autocollante", icon: FileText, group: "Emballages" },
  
  // ===== BUREAU =====
  { value: "Papier ticket", label: "Papier ticket", icon: Receipt, group: "Bureau" },
  { value: "Cartouche encre", label: "Cartouche encre", icon: Printer, group: "Bureau" },
  { value: "Fournitures bureau", label: "Fournitures bureau", icon: Briefcase, group: "Bureau" },
  { value: "Équipement informatique", label: "Équipement informatique", icon: Briefcase, group: "Bureau" },
  { value: "Logiciel comptable", label: "Logiciel comptable", icon: FileText, group: "Bureau" },
  
  // ===== ÉNERGIE =====
  { value: "Carburant groupe électrogène", label: "Carburant groupe électrogène", icon: Fuel, group: "Énergie" },
  { value: "Carburant véhicule", label: "Carburant véhicule", icon: Car, group: "Énergie" },
  { value: "Électricité JIRAMA", label: "Électricité JIRAMA", icon: Zap, group: "Énergie" },
  { value: "Eau JIRAMA", label: "Eau JIRAMA", icon: Droplet, group: "Énergie" },
  { value: "Internet", label: "Internet", icon: Wifi, group: "Énergie" },
  { value: "Téléphone", label: "Téléphone", icon: Phone, group: "Énergie" },
  { value: "Maintenance solaire", label: "Maintenance solaire", icon: Sun, group: "Énergie" },
  { value: "Maintenance groupe électrogène", label: "Maintenance groupe électrogène", icon: Wrench, group: "Énergie" },
  
  // ===== LOCAUX =====
  { value: "Loyer local", label: "Loyer local", icon: Building, group: "Locaux" },
  { value: "Taxe foncière", label: "Taxe foncière", icon: Landmark, group: "Locaux" },
  { value: "Rénovation", label: "Rénovation", icon: Building, group: "Locaux" },
  { value: "Sécurité", label: "Sécurité", icon: Shield, group: "Locaux" },
  { value: "Service de nettoyage", label: "Service de nettoyage", icon: Sparkles, group: "Locaux" },
  
  // ===== PERSONNEL =====
  { value: "Salaire employé", label: "Salaire employé", icon: Users, group: "Personnel" },
  { value: "Heures supplémentaires", label: "Heures supplémentaires", icon: Clock, group: "Personnel" },
  { value: "Prime", label: "Prime", icon: Gift, group: "Personnel" },
  { value: "Charges sociales", label: "Charges sociales", icon: Landmark, group: "Personnel" },
  { value: "Formation", label: "Formation", icon: School, group: "Personnel" },
  { value: "Assurance santé", label: "Assurance santé", icon: Heart, group: "Personnel" },
  { value: "Uniforme", label: "Uniforme", icon: Shirt, group: "Personnel" },
  { value: "Indemnité transport", label: "Indemnité transport", icon: Car, group: "Personnel" },
  
  // ===== LIVRAISON =====
  { value: "Livraison moto", label: "Livraison moto", icon: Bike, group: "Livraison" },
  { value: "Livraison voiture", label: "Livraison voiture", icon: Car, group: "Livraison" },
  { value: "Livreur", label: "Livreur", icon: Users, group: "Livraison" },
  { value: "Carburant livraison", label: "Carburant livraison", icon: Fuel, group: "Livraison" },
  { value: "Entretien véhicule", label: "Entretien véhicule", icon: Wrench, group: "Livraison" },
  { value: "Assurance véhicule", label: "Assurance véhicule", icon: Shield, group: "Livraison" },
  
  // ===== MARKETING =====
  { value: "Flyer publicitaire", label: "Flyer publicitaire", icon: Megaphone, group: "Marketing" },
  { value: "Réseaux sociaux", label: "Réseaux sociaux", icon: Megaphone, group: "Marketing" },
  { value: "Promotion", label: "Promotion", icon: Gift, group: "Marketing" },
  { value: "Enseigne", label: "Enseigne", icon: Store, group: "Marketing" },
  { value: "Publicité radio/TV", label: "Publicité radio/TV", icon: Megaphone, group: "Marketing" },
  { value: "Site web", label: "Site web", icon: Wifi, group: "Marketing" },
  
  // ===== SERVICES =====
  { value: "Honoraire comptable", label: "Honoraire comptable", icon: CalculatorIcon, group: "Services" },
  { value: "Frais juridiques", label: "Frais juridiques", icon: FileText, group: "Services" },
  { value: "Consulting", label: "Consulting", icon: Briefcase, group: "Services" },
  
  // ===== TAXES =====
  { value: "IRSA", label: "IRSA", icon: Landmark, group: "Taxes" },
  { value: "TVA", label: "TVA", icon: Landmark, group: "Taxes" },
  { value: "IB", label: "IB", icon: Landmark, group: "Taxes" },
  { value: "Taxe municipale", label: "Taxe municipale", icon: Landmark, group: "Taxes" },
  { value: "Patente", label: "Patente", icon: FileText, group: "Taxes" },
  
  // ===== FINANCES =====
  { value: "Frais bancaires", label: "Frais bancaires", icon: CreditCard, group: "Finances" },
  { value: "Transfert d'argent", label: "Transfert d'argent", icon: CreditCard, group: "Finances" },
  { value: "Intérêts emprunt", label: "Intérêts emprunt", icon: Landmark, group: "Finances" },
  { value: "Prime d'assurance", label: "Prime d'assurance", icon: Shield, group: "Finances" },
  
  // ===== DIVERS =====
  { value: "Repas personnel", label: "Repas personnel", icon: Coffee, group: "Divers" },
  { value: "Eau en bouteille", label: "Eau en bouteille", icon: Droplet, group: "Divers" },
  { value: "Café/Thé", label: "Café/Thé", icon: Coffee, group: "Divers" },
  { value: "Pharmacie", label: "Pharmacie", icon: Heart, group: "Divers" },
  { value: "Événement social", label: "Événement social", icon: Cake, group: "Divers" },
  { value: "Imprévu", label: "Imprévu", icon: AlertTriangle, group: "Divers" },
  { value: "Vol/perte", label: "Vol/perte", icon: AlertTriangle, group: "Divers" },
  { value: "Autres", label: "Autres", icon: FileText, group: "Divers" },
];

// Catégories pour entrées d'argent
const INCOME_CATEGORIES = [
  { value: "client_payment", label: "Paiement client", icon: Users, group: "Clients" },
  { value: "client_express", label: "Service express", icon: Zap, group: "Clients" },
  { value: "client_delivery", label: "Frais de livraison", icon: Truck, group: "Clients" },
  { value: "client_industrial", label: "Client industriel", icon: Building, group: "Clients" },
  { value: "cash_drawer", label: "Fond de caisse", icon: Wallet, group: "Caisse" },
  { value: "refund", label: "Remboursement", icon: RotateCcw, group: "Divers" },
  { value: "loan", label: "Prêt reçu", icon: Landmark, group: "Financement" },
  { value: "grant", label: "Subvention", icon: Gift, group: "Financement" },
  { value: "investment", label: "Apport en capital", icon: TrendingUp, group: "Financement" },
  { value: "other_income", label: "Autre entrée", icon: DollarSign, group: "Divers" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("MGA", "Ar");
};

// ==================== COMPOSANT DE RECHERCHE DE CATÉGORIE NEOMORPHIQUE ====================

interface CategorySearchProps {
  value: string;
  onChange: (value: string) => void;
  categories: typeof EXPENSE_CATEGORIES;
  placeholder?: string;
}

const CategorySearch: React.FC<CategorySearchProps> = ({
  value,
  onChange,
  categories,
  placeholder = "Rechercher une catégorie...",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    
    const searchLower = search.toLowerCase();
    
    return categories.filter((cat) => {
      const labelLower = cat.label.toLowerCase();
      const groupLower = cat.group.toLowerCase();
      const valueLower = cat.value.toLowerCase();
      
      return labelLower.includes(searchLower) ||
             groupLower.includes(searchLower) ||
             valueLower.includes(searchLower);
    });
  }, [search, categories]);

  const groupedCategories = useMemo(() => {
    const groups: Record<string, typeof categories> = {};
    filteredCategories.forEach((cat) => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [filteredCategories]);

  const selectedCategory = categories.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(NEO.input, "w-full justify-between h-auto min-h-10 py-2")}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2 truncate">
              {selectedCategory.icon &&
                React.createElement(selectedCategory.icon, {
                  className: "h-4 w-4 shrink-0 text-[#0B676E]",
                })}
              <span className="truncate text-slate-700">{selectedCategory.label}</span>
              <Badge className={cn(NEO.badge, "ml-1 text-xs shrink-0 bg-[#0B676E]/10 text-[#0B676E]")}>
                {selectedCategory.group}
              </Badge>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0" align="start">
        <Command className="bg-[#eef2f5]">
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="h-9 bg-[#eef2f5] rounded-2xl"
          />
          <CommandList>
            <ScrollArea className="h-[300px]">
              <CommandEmpty>
                <div className="py-6 text-center">
                  <Search className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Aucune catégorie trouvée</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Essayez "repas", "salaire", "carburant"...
                  </p>
                </div>
              </CommandEmpty>
              {Object.entries(groupedCategories).map(([group, cats]) => (
                <CommandGroup key={group} heading={group}>
                  {cats.map((cat) => (
                    <CommandItem
                      key={cat.value}
                      value={cat.value}
                      onSelect={() => {
                        onChange(cat.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="cursor-pointer rounded-xl hover:bg-[#0B676E]/10"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {cat.icon &&
                          React.createElement(cat.icon, {
                            className: "h-4 w-4 shrink-0 text-[#0B676E]",
                          })}
                        <span className="flex-1 truncate text-slate-700">{cat.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ==================== COMPOSANT DE CARTE DE DÉPENSE NEOMORPHIQUE ====================

const ExpenseCard: React.FC<{
  expense: any;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ expense, onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getCategoryInfo = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.value === categoryValue);
    if (category) return category;
    return { label: categoryValue || "Autre", icon: FileText, group: "Autre" };
  };

  const categoryInfo = getCategoryInfo(expense.category);
  const IconComponent = categoryInfo.icon;

  const getAmountColor = (amount: number) => {
    if (amount > 500000) return "text-red-600";
    if (amount > 200000) return "text-orange-500";
    if (amount > 100000) return "text-amber-600";
    return "text-slate-900";
  };

  return (
    <TooltipProvider>
      <div className={cn(
        NEO.card,
        "group relative overflow-hidden hover:-translate-y-0.5"
      )}>
        <div className="p-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                "bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
              )}>
                {React.createElement(IconComponent, { className: "h-5 w-5 text-[#0B676E]" })}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">
                  {expense.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    <span>
                      {format(new Date(expense.expenseDate), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <Badge className={cn(NEO.badge, "text-xs font-normal bg-[#0B676E]/10 text-[#0B676E]")}>
                    {categoryInfo.label}
                  </Badge>
                  <span className="text-slate-300 hidden md:inline">•</span>
                  <span className="text-slate-400 hidden md:inline">{categoryInfo.group}</span>
                </div>
                {expense.notes && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{expense.notes}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="text-right mr-1">
                <p className={`font-bold text-lg whitespace-nowrap ${getAmountColor(expense.amount)}`}>
                  {formatCurrency(expense.amount)}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(NEO.button, "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity")}
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4 text-slate-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modifier</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(NEO.button, "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity")}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Cette action est irréversible. La dépense "{expense.description}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={NEO.button}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

// ==================== CARTE KPI NEOMORPHIQUE ====================

const KPICard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
}> = ({ title, value, icon, trend, subtitle, color }) => {
  const iconColors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-emerald-600 bg-emerald-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <div className={NEO.card}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
            {trend && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trend.value).toFixed(1)}% vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
            "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
            iconColors[color]
          )}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT DE PAGINATION NEOMORPHIQUE ====================

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-white/40">
      <div className="text-sm text-slate-500 order-2 sm:order-1">
        Affichage de <span className="font-medium text-slate-700">{startItem}</span> à{" "}
        <span className="font-medium text-slate-700">{endItem}</span> sur{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> dépense(s)
      </div>
      <div className="flex flex-wrap gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(NEO.button, "gap-1 h-9")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <div className="hidden md:flex gap-1">
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
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-9 h-9 p-0",
                  currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                )}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <div className="flex md:hidden items-center px-4 py-1.5 bg-[#eef2f5] rounded-2xl text-sm font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
          Page {currentPage} / {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(NEO.button, "gap-1 h-9")}
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL - EXPENSES TAB NEOMORPHIQUE ====================

export function ExpensesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"expenses" | "cash" | "budgets" | "analytics">("expenses");
  const [expenseFilters, setExpenseFilters] = useState({
    timePeriod: "month",
    category: "all",
    search: "",
    sortBy: "expense_date",
    sortOrder: "desc",
    page: 1,
    startDate: "",
    endDate: "",
    limit: 10,
  });
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<any>(null);
  const [cashTransactionType, setCashTransactionType] = useState<"income" | "expense">("expense");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [cashTransactionsPage, setCashTransactionsPage] = useState(1);
  const [cashTransactionsPerPage] = useState(10);

  // ==================== QUERIES ====================

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: [
      "expenses",
      expenseFilters.timePeriod,
      expenseFilters.category,
      expenseFilters.search,
      expenseFilters.sortBy,
      expenseFilters.sortOrder,
      expenseFilters.page,
      expenseFilters.startDate,
      expenseFilters.endDate,
      expenseFilters.limit,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Recherche simplifiée - envoie directement le terme en français
      if (expenseFilters.search && expenseFilters.search.trim() !== "") {
        params.append("search", expenseFilters.search.trim());
        console.log(`[FRONTEND] Recherche envoyée: "${expenseFilters.search.trim()}"`);
      }
      
      if (expenseFilters.category && expenseFilters.category !== "all") {
        params.append("category", expenseFilters.category);
      }
      if (expenseFilters.timePeriod && expenseFilters.timePeriod !== "all") {
        params.append("timePeriod", expenseFilters.timePeriod);
      }
      if (expenseFilters.startDate) params.append("startDate", expenseFilters.startDate);
      if (expenseFilters.endDate) params.append("endDate", expenseFilters.endDate);
      if (expenseFilters.sortBy) params.append("sortBy", expenseFilters.sortBy);
      if (expenseFilters.sortOrder) params.append("sortOrder", expenseFilters.sortOrder);
      
      params.append("page", expenseFilters.page.toString());
      params.append("limit", expenseFilters.limit.toString());
      
      console.log("[FRONTEND] URL complète:", `/api/expenses?${params.toString()}`);
      
      const res = await apiRequest("GET", `/api/expenses?${params.toString()}`);
      return res.json();
    },
  });

  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const { data: cashBalance } = useQuery({
    queryKey: ["cashBalance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cash/balance");
      return res.json();
    },
  });

  const { data: cashTransactions } = useQuery({
    queryKey: ["cashTransactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cash/transactions?limit=100");
      return res.json();
    },
  });

  const allCashTransactions = cashTransactions?.data || [];
  
  const paginatedCashTransactions = useMemo(() => {
    const start = (cashTransactionsPage - 1) * cashTransactionsPerPage;
    const end = start + cashTransactionsPerPage;
    return allCashTransactions.slice(start, end);
  }, [allCashTransactions, cashTransactionsPage, cashTransactionsPerPage]);
  
  const cashTransactionsTotalPages = Math.ceil(allCashTransactions.length / cashTransactionsPerPage);

  const { data: monthlyStats, refetch: refetchMonthlyStats } = useQuery({
    queryKey: ["expenseStats", "monthly", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/expenses/stats/monthly?month=${selectedMonth}&year=${selectedYear}`);
      return res.json();
    },
  });

  const { data: budgets, refetch: refetchBudgets } = useQuery({
    queryKey: ["budgets", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      return res.json();
    },
  });

  const { data: budgetAlerts, refetch: refetchBudgetAlerts } = useQuery({
    queryKey: ["budgetAlerts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/budgets/alerts");
      return res.json();
    },
  });

  // ==================== MUTATIONS ====================

  const cashForm = useForm({
    resolver: zodResolver(
      z.object({
        amount: z.coerce.number().min(0.01, "Montant requis"),
        category: z.string().min(1, "Catégorie requise"),
        description: z.string().min(1, "Description requise"),
        reference: z.string().optional(),
        notes: z.string().optional(),
      })
    ),
    defaultValues: {
      amount: undefined,
      category: "",
      description: "",
      reference: "",
      notes: "",
    },
  });

  const budgetForm = useForm({
    resolver: zodResolver(
      z.object({
        category: z.string().min(1),
        budgetAmount: z.coerce.number().min(0),
        alertThreshold: z.coerce.number().min(0).max(100).optional(),
      })
    ),
    defaultValues: {
      category: "",
      budgetAmount: undefined,
      alertThreshold: 80,
    },
  });

  const upsertExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...payload } = data;
      const method = id ? "PATCH" : "POST";
      const endpoint = id ? `/api/expenses/${id}` : "/api/expenses";
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
      queryClient.invalidateQueries({ queryKey: ["cashBalance"] });
      queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
      refetchMonthlyStats();
      setIsCashDialogOpen(false);
      setCurrentExpense(null);
      cashForm.reset();
      toast({ title: "Succès", description: "Dépense enregistrée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const cashTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.type === "income" ? "/api/cash/income" : "/api/cash/expense";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashBalance"] });
      queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
      refetchMonthlyStats();
      setIsCashDialogOpen(false);
      cashForm.reset();
      toast({ title: "Succès", description: "Transaction enregistrée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const budgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      refetchBudgets();
      refetchBudgetAlerts();
      setIsBudgetDialogOpen(false);
      budgetForm.reset();
      toast({ title: "Succès", description: "Budget enregistré avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/expenses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
      queryClient.invalidateQueries({ queryKey: ["cashBalance"] });
      queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
      refetchMonthlyStats();
      toast({ title: "Supprimée", description: "Dépense supprimée avec succès" });
    },
  });

  // Handlers
  const handleWithdrawal = () => {
    setCurrentExpense(null);
    setCashTransactionType("expense");
    cashForm.reset();
    setIsCashDialogOpen(true);
  };

  const handleAddIncome = () => {
    setCurrentExpense(null);
    setCashTransactionType("income");
    cashForm.reset();
    setIsCashDialogOpen(true);
  };

  const handleAddBudget = () => {
    budgetForm.reset();
    setIsBudgetDialogOpen(true);
  };

  const resetFilters = () => {
    setExpenseFilters({
      timePeriod: "month",
      category: "all",
      search: "",
      sortBy: "expense_date",
      sortOrder: "desc",
      page: 1,
      startDate: "",
      endDate: "",
      limit: 10,
    });
    setCustomDateRange({ from: null, to: null });
  };

  const applyDateRange = () => {
    if (customDateRange.from && customDateRange.to) {
      setExpenseFilters({
        ...expenseFilters,
        timePeriod: "all",
        startDate: format(customDateRange.from, "yyyy-MM-dd"),
        endDate: format(customDateRange.to, "yyyy-MM-dd"),
        page: 1,
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setExpenseFilters({ ...expenseFilters, page: newPage });
  };

  // Calculs pour les KPIs
  const totalExpenses = monthlyStats?.total || 0;
  const expenseCount = monthlyStats?.count || 0;
  const averageExpense = monthlyStats?.average || 0;
  const evolution = monthlyStats?.comparison?.evolution || 0;
  const mainCategoryObj = monthlyStats?.byCategory?.[0] || { category: "other", total: 0 };
  const importantExpenses = expenses.filter((e: any) => e.amount > 200000).length;

  const getCategoryLabel = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getCategoryIcon = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.value === categoryValue);
    if (category && category.icon) {
      return React.createElement(category.icon, { className: "h-4 w-4" });
    }
    return React.createElement(FileText, { className: "h-4 w-4" });
  };

  const getCategoryGroup = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.value === categoryValue);
    return category ? category.group : "Autre";
  };

  const getIncomeCategoryIcon = (categoryValue: string) => {
    const category = INCOME_CATEGORIES.find((c) => c.value === categoryValue);
    if (category && category.icon) {
      return React.createElement(category.icon, { className: "h-4 w-4" });
    }
    return React.createElement(DollarSign, { className: "h-4 w-4" });
  };

  const getIncomeCategoryLabel = (categoryValue: string) => {
    const category = INCOME_CATEGORIES.find((c) => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getIncomeCategoryGroup = (categoryValue: string) => {
    const category = INCOME_CATEGORIES.find((c) => c.value === categoryValue);
    return category ? category.group : "Autre";
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean, isWarning: boolean) => {
    if (isOverBudget) return "#ef4444";
    if (isWarning) return "#f97316";
    return "#22c55e";
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 bg-[#eef2f5] min-h-screen">
        {/* ==========================================================
            EN-TÊTE NEOMORPHIQUE
        ========================================================== */}
        <div className={NEO.card}>
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                Gestion Financière
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Gérez les dépenses, la trésorerie et les budgets de votre pressing
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button onClick={handleAddIncome} variant="outline" size="sm" className={NEO.button}>
                <ArrowUpCircle className="h-4 w-4 mr-1 sm:mr-2 text-emerald-600" />
                <span>Entrée</span>
              </Button>
              <Button onClick={handleWithdrawal} variant="outline" size="sm" className={NEO.button}>
                <ArrowDownCircle className="h-4 w-4 mr-1 sm:mr-2 text-red-600" />
                <span>Dépense</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ==========================================================
            SOLDE DE CAISSE NEOMORPHIQUE
        ========================================================== */}
        <div className={cn(NEO.card, "bg-gradient-to-r from-[#0B676E] to-[#085257] text-white")}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-xl flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                  <Wallet className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs sm:text-sm">Solde de caisse actuel</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    {formatCurrency(cashBalance?.balance || 0)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-white/70 text-xs sm:text-sm">
                  Dernière mise à jour:{" "}
                  {cashBalance?.lastUpdated ? format(new Date(cashBalance.lastUpdated), "dd/MM/yyyy HH:mm") : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================
            KPIS NEOMORPHIQUES
        ========================================================== */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Dépenses du mois"
            value={formatCurrency(totalExpenses)}
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: evolution, isPositive: evolution <= 0 }}
            color="blue"
          />
          <KPICard
            title="Dépense moyenne"
            value={formatCurrency(averageExpense)}
            icon={<BarChart3 className="h-4 w-4" />}
            subtitle={`${expenseCount} transaction${expenseCount > 1 ? "s" : ""}`}
            color="green"
          />
          <KPICard
            title="Principale catégorie"
            value={getCategoryLabel(mainCategoryObj.category)}
            icon={<Package className="h-4 w-4" />}
            subtitle={`${formatCurrency(mainCategoryObj.total)} (${((mainCategoryObj.total / totalExpenses) * 100).toFixed(0)}%)`}
            color="purple"
          />
          <KPICard
            title="Dépenses élevées"
            value={importantExpenses.toString()}
            icon={<AlertTriangle className="h-4 w-4" />}
            subtitle="> 200 000 Ar"
            color="orange"
          />
        </div>

        {/* ==========================================================
            ONGLETS NEOMORPHIQUES
        ========================================================== */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-4 p-1 rounded-2xl")}>
            <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 data-[state=active]:text-slate-900 transition-all">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Dépenses</span>
            </TabsTrigger>
            <TabsTrigger value="cash" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 data-[state=active]:text-slate-900 transition-all">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Trésorerie</span>
            </TabsTrigger>
            <TabsTrigger value="budgets" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 data-[state=active]:text-slate-900 transition-all">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Budgets</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 data-[state=active]:text-slate-900 transition-all">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Analyses</span>
            </TabsTrigger>
          </TabsList>

          {/* ==========================================================
              ONGLET DÉPENSES
          ========================================================== */}
          <TabsContent value="expenses" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className={NEO.card}>
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                  <Select value={expenseFilters.timePeriod} onValueChange={(v) => {
                    setExpenseFilters((f) => ({ ...f, timePeriod: v, startDate: "", endDate: "", page: 1 }));
                    setCustomDateRange({ from: null, to: null });
                  }}>
                    <SelectTrigger className={cn(NEO.input, "w-[120px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm")}>
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-[#0B676E]" />
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="all">Toute la période</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(NEO.input, "w-[180px] sm:w-[240px] justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm")}>
                        <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-[#0B676E]" />
                        <span className="truncate text-slate-700">
                          {customDateRange.from ? (
                            customDateRange.to ? (
                              `${format(customDateRange.from, "dd/MM/yy")} - ${format(customDateRange.to, "dd/MM/yy")}`
                            ) : (
                              format(customDateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            "Sélectionner une période"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange.from || new Date()}
                        selected={{
  from: customDateRange.from ?? undefined,
  to: customDateRange.to ?? undefined,
}}
                        onSelect={(range) => setCustomDateRange({ from: range?.from || null, to: range?.to || null })}
                        numberOfMonths={1}
                        locale={fr}
                        className="bg-[#eef2f5] rounded-2xl"
                      />
                      <div className="p-3 border-t border-white/40 flex justify-end gap-2">
                        <Button variant="outline" size="sm" className={NEO.button} onClick={() => setCustomDateRange({ from: null, to: null })}>Effacer</Button>
                        <Button size="sm" className={NEO.buttonPrimary} onClick={applyDateRange}>Appliquer</Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher..."
                      className={cn(NEO.input, "pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm")}
                      value={expenseFilters.search}
                      onChange={(e) => setExpenseFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                    />
                  </div>

                  <Select value={expenseFilters.limit.toString()} onValueChange={(v) => setExpenseFilters((f) => ({ ...f, limit: parseInt(v), page: 1 }))}>
                    <SelectTrigger className={cn(NEO.input, "w-[80px] h-9 sm:h-10 text-xs sm:text-sm")}>
                      <SelectValue placeholder="Lignes" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon" onClick={resetFilters} className={cn(NEO.button, "h-9 w-9 sm:h-10 sm:w-10 shrink-0")}>
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={NEO.card}>
              <div className="p-4 sm:p-6 border-b border-white/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-800">
                      <ListChecks className="h-5 w-5 text-[#0B676E]" />
                      Historique des dépenses
                    </div>
                    <p className="text-sm text-slate-500">{pagination.total} dépense(s) trouvée(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={expenseFilters.sortBy} onValueChange={(v) => setExpenseFilters((f) => ({ ...f, sortBy: v }))}>
                      <SelectTrigger className={cn(NEO.input, "w-[110px] sm:w-[130px] h-8 sm:h-9 text-xs")}>
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                        <SelectItem value="expense_date">Date</SelectItem>
                        <SelectItem value="amount">Montant</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExpenseFilters((f) => ({ ...f, sortOrder: f.sortOrder === "desc" ? "asc" : "desc" }))}
                      className={cn(NEO.button, "h-8 w-8 sm:h-9 sm:w-9 shrink-0")}
                    >
                      <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${expenseFilters.sortOrder === "asc" ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-6">
                {expensesLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto text-[#0B676E]" />
                    <p className="text-sm sm:text-base text-slate-500 mt-3">Chargement des dépenses...</p>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <DollarSign className="h-10 w-10 sm:h-14 sm:w-14 text-slate-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-slate-500">Aucune dépense trouvée</p>
                    <Button onClick={handleWithdrawal} variant="outline" className={cn(NEO.button, "mt-3 sm:mt-4")}>
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Ajouter une dépense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {expenses.map((expense: any) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onEdit={() => {
                          setCurrentExpense(expense);
                          setCashTransactionType("expense");
                          cashForm.reset({
                            amount: parseFloat(String(expense.amount)) as never,
                            category: expense.category,
                            description: expense.description,
                            reference: expense.reference || "",
                            notes: expense.notes || "",
                          });
                          setIsCashDialogOpen(true);
                        }}
                        onDelete={() => deleteExpenseMutation.mutate(expense.id)}
                      />
                    ))}
                  </div>
                )}

                <PaginationControls
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                  itemsPerPage={expenseFilters.limit}
                />
              </div>
            </div>
          </TabsContent>

          {/* ==========================================================
              ONGLET TRÉSORERIE
          ========================================================== */}
          <TabsContent value="cash" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className={cn(NEO.card, "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white")}>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs sm:text-sm text-emerald-700 font-medium">Entrées (mois)</p>
                      <p className="text-lg sm:text-2xl font-bold text-emerald-800">
                        {formatCurrency(allCashTransactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0) || 0)}
                      </p>
                    </div>
                    <ArrowUpCircle className="h-6 w-6 sm:h-10 sm:w-10 text-emerald-500 opacity-80" />
                  </div>
                </div>
              </div>
              <div className={cn(NEO.card, "border-red-200 bg-gradient-to-br from-red-50 to-white")}>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs sm:text-sm text-red-700 font-medium">Sorties (mois)</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-800">
                        {formatCurrency(allCashTransactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0) || 0)}
                      </p>
                    </div>
                    <ArrowDownCircle className="h-6 w-6 sm:h-10 sm:w-10 text-red-500 opacity-80" />
                  </div>
                </div>
              </div>
              <div className={cn(NEO.card, "border-slate-200 bg-gradient-to-br from-slate-50 to-white")}>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium">Solde net</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-800">
                        {formatCurrency(
                          (allCashTransactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0) || 0) -
                          (allCashTransactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0) || 0)
                        )}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-10 sm:w-10 text-slate-500 opacity-80" />
                  </div>
                </div>
              </div>
            </div>

            <div className={NEO.card}>
              <div className="p-4 sm:p-6 border-b border-white/40">
                <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-800">
                  <Wallet className="h-5 w-5 text-[#0B676E]" />
                  Historique des transactions
                </div>
                <p className="text-sm text-slate-500">Toutes les entrées et sorties d'argent</p>
              </div>
              <div className="p-0 sm:p-6 overflow-x-auto">
                <div className={NEO.table}>
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-white/20 backdrop-blur-sm border-b border-white/40">
                        <TableHead className="text-slate-600 font-semibold">Date</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Type</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Catégorie</TableHead>
                        <TableHead className="hidden sm:table-cell text-slate-600 font-semibold">Groupe</TableHead>
                        <TableHead className="text-right text-slate-600 font-semibold">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCashTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id} className="border-b border-white/20 hover:bg-white/10 transition-colors">
                          <TableCell className="text-slate-700">{format(new Date(transaction.transactionDate), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "income" ? "default" : "destructive"} className={cn(
                              "gap-1 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                              transaction.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}>
                              {transaction.type === "income" ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                              {transaction.type === "income" ? "Entrée" : "Sortie"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {transaction.type === "income" ? getIncomeCategoryIcon(transaction.category) : getCategoryIcon(transaction.category)}
                              <span className="text-slate-700">{transaction.type === "income" ? getIncomeCategoryLabel(transaction.category) : getCategoryLabel(transaction.category)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={cn(NEO.badge, "bg-[#eef2f5] text-slate-600")}>
                              {transaction.type === "income" ? getIncomeCategoryGroup(transaction.category) : getCategoryGroup(transaction.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            transaction.type === "income" ? "text-emerald-600" : "text-red-600"
                          )}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <PaginationControls
                  currentPage={cashTransactionsPage}
                  totalPages={cashTransactionsTotalPages}
                  onPageChange={setCashTransactionsPage}
                  totalItems={allCashTransactions.length}
                  itemsPerPage={cashTransactionsPerPage}
                />
              </div>
            </div>
          </TabsContent>

          {/* ==========================================================
              ONGLET BUDGETS
          ========================================================== */}
          <TabsContent value="budgets" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className={cn(NEO.input, "w-[120px] sm:w-[140px] h-9 sm:h-10")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2024, m - 1, 1).toLocaleString("fr", { month: "short" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className={cn(NEO.input, "w-[80px] sm:w-[100px] h-9 sm:h-10")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddBudget} size="sm" className={NEO.buttonPrimary}>
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Définir un budget
              </Button>
            </div>

            {budgetAlerts?.length > 0 && (
              <div className={cn(NEO.card, "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200")}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-orange-800 font-semibold">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    Alertes de dépassement
                  </div>
                  <div className="space-y-2 mt-3">
                    {budgetAlerts.map((alert: any) => (
                      <div key={alert.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-white rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(alert.category)}
                          <span className="font-medium text-slate-700">{getCategoryLabel(alert.category)}</span>
                          <span className="text-xs text-slate-500">
                            {formatCurrency(alert.spentAmount)} / {formatCurrency(alert.budgetAmount)}
                          </span>
                        </div>
                        <Badge variant={alert.alertType === "critical" ? "destructive" : "default"} className={cn(
                          "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                          alert.alertType === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {alert.percentageUsed.toFixed(0)}% utilisé
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={NEO.card}>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-800">
                  <Target className="h-5 w-5 text-[#0B676E]" />
                  Budgétisation par catégorie
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString("fr", { month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                {budgets?.map((budget: any) => {
                  const percentage = Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100);
                  const isOverBudget = percentage >= 100;
                  const isWarning = percentage >= (budget.alertThreshold || 80);
                  const progressColor = getProgressColor(percentage, isOverBudget, isWarning);

                  return (
                    <div key={budget.id} className="space-y-1 sm:space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(budget.category)}
                          <span className="font-medium text-slate-700">{getCategoryLabel(budget.category)}</span>
                          <Badge className={cn(NEO.badge, "text-xs ml-1 bg-[#eef2f5] text-slate-600")}>{getCategoryGroup(budget.category)}</Badge>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <span className="text-slate-600">{formatCurrency(budget.spentAmount)}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-medium text-slate-800">{formatCurrency(budget.budgetAmount)}</span>
                          <span className={cn(
                            "ml-1 sm:ml-2 text-[10px] sm:text-xs font-medium px-1 sm:px-2 py-0.5 rounded-full border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                            isOverBudget ? "bg-red-100 text-red-700" : 
                            isWarning ? "bg-orange-100 text-orange-700" : 
                            "bg-emerald-100 text-emerald-700"
                          )}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#eef2f5] rounded-full h-1.5 sm:h-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                        <div className="h-1.5 sm:h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: progressColor }} />
                      </div>
                    </div>
                  );
                })}
                {(!budgets || budgets.length === 0) && (
                  <div className="text-center py-8 sm:py-12">
                    <Target className="h-10 w-10 sm:h-14 sm:w-14 mx-auto mb-3 sm:mb-4 text-slate-300" />
                    <p className="text-sm sm:text-base text-slate-500">Aucun budget défini pour cette période</p>
                    <Button onClick={handleAddBudget} variant="outline" className={cn(NEO.button, "mt-3 sm:mt-4")}>
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Créer un budget
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ==========================================================
              ONGLET ANALYTICS
          ========================================================== */}
          <TabsContent value="analytics" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className={NEO.card}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                    Évolution des dépenses
                  </div>
                  <p className="text-sm text-slate-500">Courbe d'évolution sur la période</p>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 h-60 sm:h-80">
                  <ExpensesLineChart expenses={expenses} />
                </div>
              </div>

              <div className={NEO.card}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    Répartition par catégorie
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto">
                  {monthlyStats?.byCategory?.map((item: any, index: number) => {
                    const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
                    return (
                      <div key={item.category}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {getCategoryIcon(item.category)}
                            <span className="text-slate-700">{getCategoryLabel(item.category)}</span>
                          </div>
                          <span className="text-slate-600">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-[#eef2f5] rounded-full h-1 sm:h-1.5 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <div className="h-1 sm:h-1.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-400 text-right mt-0.5">{formatCurrency(item.total)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className={NEO.card}>
                <div className="p-4 sm:p-6">
                  <div className="text-lg font-semibold text-slate-800">Statistiques détaillées</div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold">Transactions</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-800">{monthlyStats?.count || 0}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold">Maximum</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-800">{formatCurrency(monthlyStats?.max || 0)}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold">Minimum</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-800">{formatCurrency(monthlyStats?.min || 0)}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold">Évolution</p>
                      <p className={`text-lg sm:text-2xl font-bold ${evolution >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {evolution >= 0 ? "+" : ""}{evolution.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={NEO.card}>
                <div className="p-4 sm:p-6">
                  <div className="text-lg font-semibold text-slate-800">Top 5 des dépenses</div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                  {monthlyStats?.topExpenses?.slice(0, 5).map((expense: any, idx: number) => (
                    <div key={expense.id} className="flex items-center justify-between p-2 sm:p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-base sm:text-lg font-bold text-slate-400 w-5 sm:w-6">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base text-slate-800 truncate">{expense.description}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {getCategoryIcon(expense.category)}
                            <p className="text-[10px] sm:text-xs text-slate-400 truncate">{getCategoryLabel(expense.category)}</p>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-red-600 whitespace-nowrap text-sm sm:text-base ml-2">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))}
                  {(!monthlyStats?.topExpenses || monthlyStats.topExpenses.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-slate-500">Aucune dépense enregistrée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ==========================================================
            DIALOGUES NEOMORPHIQUES
        ========================================================== */}
        <Dialog open={isCashDialogOpen} onOpenChange={(open) => { setIsCashDialogOpen(open); if (!open) setCurrentExpense(null); }}>
          <DialogContent className="sm:max-w-[550px] max-w-[95vw] bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                {cashTransactionType === "income" ? (
                  <><ArrowUpCircle className="h-5 w-5 text-emerald-600" /> Entrée d'argent</>
                ) : currentExpense ? (
                  <><Pencil className="h-5 w-5 text-slate-700" /> Modifier la dépense</>
                ) : (
                  <><ArrowDownCircle className="h-5 w-5 text-red-600" /> Dépense / Retrait</>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {cashTransactionType === "income" ? "Enregistrez une entrée d'argent" : currentExpense ? "Modifiez les détails de cette dépense" : "Enregistrez une dépense ou un retrait"}
              </DialogDescription>
            </DialogHeader>
            <Form {...cashForm}>
              <form onSubmit={cashForm.handleSubmit((data) => {
                if (currentExpense) upsertExpenseMutation.mutate({ ...data, id: currentExpense.id });
                else cashTransactionMutation.mutate({ ...data, type: cashTransactionType });
              })} className="space-y-4">
                <FormField control={cashForm.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Montant (Ar) *</FormLabel><FormControl><Input type="number" placeholder="100000" className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={cashForm.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Catégorie *</FormLabel><FormControl><CategorySearch value={field.value} onChange={field.onChange} categories={cashTransactionType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES} placeholder="Rechercher une catégorie..." /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={cashForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Description *</FormLabel><FormControl><Input placeholder="Ex: Achat détergent, Paiement client..." className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {cashTransactionType === "expense" && !currentExpense && (
                  <FormField control={cashForm.control} name="reference" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-700">Référence (optionnel)</FormLabel><FormControl><Input placeholder="Facture #, Reçu #..." className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
                <FormField control={cashForm.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Notes (optionnel)</FormLabel><FormControl><Textarea placeholder="Informations complémentaires..." rows={2} className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" className={NEO.button} onClick={() => { setIsCashDialogOpen(false); setCurrentExpense(null); cashForm.reset(); }}>Annuler</Button>
                  <Button type="submit" disabled={upsertExpenseMutation.isPending || cashTransactionMutation.isPending} className={cashTransactionType === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]" : "bg-red-600 hover:bg-red-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]"}>
                    {(upsertExpenseMutation.isPending || cashTransactionMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {currentExpense ? "Mettre à jour" : (cashTransactionType === "income" ? "Valider l'entrée" : "Valider la dépense")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogContent className="sm:max-w-[450px] max-w-[95vw] bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-800"><Target className="h-5 w-5 text-purple-600" /> Définir un budget mensuel</DialogTitle>
              <DialogDescription className="text-slate-500">Fixez un budget pour la catégorie sélectionnée</DialogDescription>
            </DialogHeader>
            <Form {...budgetForm}>
              <form onSubmit={budgetForm.handleSubmit((data) => budgetMutation.mutate({ ...data, month: selectedMonth, year: selectedYear }))} className="space-y-4">
                <FormField control={budgetForm.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Catégorie *</FormLabel><FormControl><CategorySearch value={field.value} onChange={field.onChange} categories={EXPENSE_CATEGORIES} placeholder="Choisir une catégorie..." /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={budgetForm.control} name="budgetAmount" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Montant du budget (Ar) *</FormLabel><FormControl><Input type="number" placeholder="500000" className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={budgetForm.control} name="alertThreshold" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700">Seuil d'alerte (%)</FormLabel><FormControl><Input type="number" placeholder="80" className={NEO.input} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" className={NEO.button} onClick={() => setIsBudgetDialogOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={budgetMutation.isPending} className={NEO.buttonPrimary}>
                    {budgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer le budget
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}