// client/src/pages/ExpensesTab.tsx
// Interface Dépenses — flat, pro & équilibrée.
// 100% textuel — aucune icône.
import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

import ExpensesLineChart from "@/components/charts/ExpensesLineChart";

/* ============================================================
   TYPES
============================================================ */
export interface Category {
  value: string;
  label: string;
  group: string;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  expenseDate?: string;
  date: string;
  reference?: string;
  notes?: string;
}

interface CashTransaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
}

interface Budget {
  id: number;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  alertThreshold?: number;
}

/* ============================================================
   HELPERS
============================================================ */
const safeFormat = (date: string | Date | null | undefined, fmt: string, opts?: any): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  try { return format(d, fmt, opts); } catch { return "—"; }
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "MGA",
  minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "0 Ar";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "0 Ar";
  return CURRENCY_FORMATTER.format(n).replace("MGA", "Ar");
};

/* ============================================================
   SCHÉMAS ZOD
============================================================ */
const cashFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Montant requis"),
  category: z.string().min(1, "Catégorie requise"),
  description: z.string().min(1, "Description requise"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
type CashFormValues = z.infer<typeof cashFormSchema>;

const budgetFormSchema = z.object({
  category: z.string().min(1, "Catégorie requise"),
  budgetAmount: z.coerce.number().min(0, "Montant requis"),
  alertThreshold: z.coerce.number().min(0).max(100).optional(),
});
type BudgetFormValues = z.infer<typeof budgetFormSchema>;

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-lg border border-slate-200 shadow-sm",
  cardHeader: "px-4 py-3 border-b border-slate-100",
  input: "h-9 rounded-md border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600/20",
  btn: "h-9 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-md bg-teal-700 text-sm font-medium text-white hover:bg-teal-800",
  dialog: "rounded-lg border-slate-200 bg-white shadow-xl",
  well: "rounded-md border border-slate-200 bg-slate-50/50",
  h1: "text-base font-semibold text-slate-900",
  h2: "text-sm font-semibold text-slate-900",
  label: "text-[11px] font-medium text-slate-500 uppercase tracking-wide",
  value: "text-2xl font-bold text-slate-900 tabular-nums",
  textSm: "text-xs text-slate-500",
};

/* ============================================================
   TONE / PILL
============================================================ */
type Tone = "brand" | "red" | "amber" | "slate" | "violet" | "blue";
const toneClass: Record<Tone, string> = {
  brand: "bg-teal-50 text-teal-700 ring-1 ring-teal-600/10",
  red: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/10",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-slate-600/10",
};

const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", toneClass[tone], className)}>
    {children}
  </span>
);

/* ============================================================
   CONSTANTES
============================================================ */
const COLORS = ["#0D9488", "#14B8A6", "#0891B2", "#2563EB", "#4F46E5", "#7C3AED", "#DB2777", "#D97706", "#DC2626", "#64748B"];

export const EXPENSE_CATEGORIES: Category[] = [
  { value: "Détergent en poudre", label: "Détergent en poudre", group: "Nettoyage" },
  { value: "Détergent liquide", label: "Détergent liquide", group: "Nettoyage" },
  { value: "Assouplissant", label: "Assouplissant", group: "Nettoyage" },
  { value: "Eau de Javel", label: "Eau de Javel", group: "Nettoyage" },
  { value: "Détachant", label: "Détachant", group: "Nettoyage" },
  { value: "Dégraissant professionnel", label: "Dégraissant professionnel", group: "Nettoyage" },
  { value: "Désinfectant", label: "Désinfectant", group: "Nettoyage" },
  { value: "Machine à laver", label: "Machine à laver", group: "Équipements" },
  { value: "Sèche-linge", label: "Sèche-linge", group: "Équipements" },
  { value: "Fer à repasser", label: "Fer à repasser", group: "Équipements" },
  { value: "Table à repasser", label: "Table à repasser", group: "Équipements" },
  { value: "Défroisseur vapeur", label: "Défroisseur vapeur", group: "Équipements" },
  { value: "Chaudière", label: "Chaudière", group: "Équipements" },
  { value: "Extracteur", label: "Extracteur", group: "Équipements" },
  { value: "Plieuse", label: "Plieuse", group: "Équipements" },
  { value: "Sachet plastique", label: "Sachet plastique", group: "Emballages" },
  { value: "Carton", label: "Carton", group: "Emballages" },
  { value: "Cintre", label: "Cintre", group: "Emballages" },
  { value: "Housse de protection", label: "Housse de protection", group: "Emballages" },
  { value: "Étiquette autocollante", label: "Étiquette autocollante", group: "Emballages" },
  { value: "Papier ticket", label: "Papier ticket", group: "Bureau" },
  { value: "Cartouche encre", label: "Cartouche encre", group: "Bureau" },
  { value: "Fournitures bureau", label: "Fournitures bureau", group: "Bureau" },
  { value: "Équipement informatique", label: "Équipement informatique", group: "Bureau" },
  { value: "Logiciel comptable", label: "Logiciel comptable", group: "Bureau" },
  { value: "Carburant groupe électrogène", label: "Carburant groupe électrogène", group: "Énergie" },
  { value: "Carburant véhicule", label: "Carburant véhicule", group: "Énergie" },
  { value: "Électricité JIRAMA", label: "Électricité JIRAMA", group: "Énergie" },
  { value: "Eau JIRAMA", label: "Eau JIRAMA", group: "Énergie" },
  { value: "Internet", label: "Internet", group: "Énergie" },
  { value: "Téléphone", label: "Téléphone", group: "Énergie" },
  { value: "Maintenance solaire", label: "Maintenance solaire", group: "Énergie" },
  { value: "Maintenance groupe électrogène", label: "Maintenance groupe électrogène", group: "Énergie" },
  { value: "Loyer local", label: "Loyer local", group: "Locaux" },
  { value: "Taxe foncière", label: "Taxe foncière", group: "Locaux" },
  { value: "Rénovation", label: "Rénovation", group: "Locaux" },
  { value: "Sécurité", label: "Sécurité", group: "Locaux" },
  { value: "Service de nettoyage", label: "Service de nettoyage", group: "Locaux" },
  { value: "Salaire employé", label: "Salaire employé", group: "Personnel" },
  { value: "Heures supplémentaires", label: "Heures supplémentaires", group: "Personnel" },
  { value: "Prime", label: "Prime", group: "Personnel" },
  { value: "Charges sociales", label: "Charges sociales", group: "Personnel" },
  { value: "Formation", label: "Formation", group: "Personnel" },
  { value: "Assurance santé", label: "Assurance santé", group: "Personnel" },
  { value: "Uniforme", label: "Uniforme", group: "Personnel" },
  { value: "Indemnité transport", label: "Indemnité transport", group: "Personnel" },
  { value: "Livraison moto", label: "Livraison moto", group: "Livraison" },
  { value: "Livraison voiture", label: "Livraison voiture", group: "Livraison" },
  { value: "Livreur", label: "Livreur", group: "Livraison" },
  { value: "Carburant livraison", label: "Carburant livraison", group: "Livraison" },
  { value: "Entretien véhicule", label: "Entretien véhicule", group: "Livraison" },
  { value: "Assurance véhicule", label: "Assurance véhicule", group: "Livraison" },
  { value: "Flyer publicitaire", label: "Flyer publicitaire", group: "Marketing" },
  { value: "Réseaux sociaux", label: "Réseaux sociaux", group: "Marketing" },
  { value: "Promotion", label: "Promotion", group: "Marketing" },
  { value: "Enseigne", label: "Enseigne", group: "Marketing" },
  { value: "Publicité radio/TV", label: "Publicité radio/TV", group: "Marketing" },
  { value: "Site web", label: "Site web", group: "Marketing" },
  { value: "Honoraire comptable", label: "Honoraire comptable", group: "Services" },
  { value: "Frais juridiques", label: "Frais juridiques", group: "Services" },
  { value: "Consulting", label: "Consulting", group: "Services" },
  { value: "IRSA", label: "IRSA", group: "Taxes" },
  { value: "TVA", label: "TVA", group: "Taxes" },
  { value: "IB", label: "IB", group: "Taxes" },
  { value: "Taxe municipale", label: "Taxe municipale", group: "Taxes" },
  { value: "Patente", label: "Patente", group: "Taxes" },
  { value: "Frais bancaires", label: "Frais bancaires", group: "Finances" },
  { value: "Transfert d'argent", label: "Transfert d'argent", group: "Finances" },
  { value: "Intérêts emprunt", label: "Intérêts emprunt", group: "Finances" },
  { value: "Prime d'assurance", label: "Prime d'assurance", group: "Finances" },
  { value: "Repas personnel", label: "Repas personnel", group: "Divers" },
  { value: "Eau en bouteille", label: "Eau en bouteille", group: "Divers" },
  { value: "Café/Thé", label: "Café/Thé", group: "Divers" },
  { value: "Pharmacie", label: "Pharmacie", group: "Divers" },
  { value: "Événement social", label: "Événement social", group: "Divers" },
  { value: "Imprévu", label: "Imprévu", group: "Divers" },
  { value: "Vol/perte", label: "Vol/perte", group: "Divers" },
  { value: "Autres", label: "Autres", group: "Divers" },
];

export const INCOME_CATEGORIES: Category[] = [
  { value: "client_payment", label: "Paiement client", group: "Clients" },
  { value: "client_express", label: "Service express", group: "Clients" },
  { value: "client_delivery", label: "Frais de livraison", group: "Clients" },
  { value: "client_industrial", label: "Client industriel", group: "Clients" },
  { value: "cash_drawer", label: "Fond de caisse", group: "Caisse" },
  { value: "refund", label: "Remboursement", group: "Divers" },
  { value: "loan", label: "Prêt reçu", group: "Financement" },
  { value: "grant", label: "Subvention", group: "Financement" },
  { value: "investment", label: "Apport en capital", group: "Financement" },
  { value: "other_income", label: "Autre entrée", group: "Divers" },
];

/* Lookup O(1) */
const EXPENSE_MAP = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c]));
const INCOME_MAP = new Map(INCOME_CATEGORIES.map((c) => [c.value, c]));
const getExpenseCategory = (value: string): Category =>
  EXPENSE_MAP.get(value) ?? { label: value || "Autre", group: "Autre", value };
const getIncomeCategory = (value: string): Category =>
  INCOME_MAP.get(value) ?? { label: value || "Autre", group: "Autre", value };

/* ============================================================
   CATEGORY SEARCH
============================================================ */
interface CategorySearchProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
}

const CategorySearch: React.FC<CategorySearchProps> = memo(({ value, onChange, categories, placeholder = "Rechercher une catégorie..." }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const s = search.toLowerCase();
    return categories.filter((cat) =>
      cat.label.toLowerCase().includes(s) ||
      cat.group.toLowerCase().includes(s) ||
      cat.value.toLowerCase().includes(s)
    );
  }, [search, categories]);

  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    filteredCategories.forEach((cat) => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [filteredCategories]);

  const selectedCategory = categories.find((c) => c.value === value);
  const handleOpenChange = (next: boolean) => { setOpen(next); if (!next) setSearch(""); };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn(ui.input, "w-full justify-between h-auto min-h-9 py-1.5 text-left")}>
          {selectedCategory ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate text-slate-700 text-sm">{selectedCategory.label}</span>
              <Pill tone="brand">{selectedCategory.group}</Pill>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
          <span className="ml-2 text-[10px] text-slate-400">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 rounded-md border-slate-200" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} className="text-sm" />
          <CommandList>
            <ScrollArea className="h-[300px]">
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-500">Aucune catégorie</p>
                </div>
              </CommandEmpty>
              {Object.entries(groupedCategories).map(([group, cats]) => (
                <CommandGroup key={group} heading={group}>
                  {cats.map((cat) => (
                    <CommandItem key={cat.value} value={cat.value} onSelect={() => { onChange(cat.value); setOpen(false); setSearch(""); }} className="text-sm">
                      <div className="flex items-center gap-2 flex-1">
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
});
CategorySearch.displayName = "CategorySearch";

/* ============================================================
   KPI
============================================================ */
const KPI: React.FC<{
  label: string;
  value: string;
  hint?: string;
  trend?: { dir: "up" | "down"; label: string } | null;
}> = ({ label, value, hint, trend }) => (
  <div className={cn(ui.card, "p-4")}>
    <div className="min-w-0">
      <p className={ui.label}>{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums truncate">{value}</p>
      {hint && <p className={cn(ui.textSm, "mt-0.5 truncate")}>{hint}</p>}
    </div>
    {trend && (
      <div className={cn(
        "mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        trend.dir === "up" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"
      )}>
        {trend.label}
      </div>
    )}
  </div>
);

/* ============================================================
   EXPENSE ROW
============================================================ */
const ExpenseRow: React.FC<{ expense: Expense; onEdit: () => void; onDelete: () => void }> = memo(({ expense, onEdit, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const cat = getExpenseCategory(expense.category);
  const dateValue = expense.expenseDate ?? expense.date ?? "";

  return (
    <>
      <TableRow className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <TableCell className="w-10">
          <div className="h-8 w-8 rounded-md bg-slate-50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-600">{cat.group.charAt(0)}</span>
          </div>
        </TableCell>
        <TableCell className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{expense.description}</p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{cat.label} • {cat.group}</p>
        </TableCell>
        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
          {safeFormat(dateValue, "dd MMM yyyy", { locale: fr })}
        </TableCell>
        <TableCell className="text-right text-sm font-semibold text-red-600 tabular-nums whitespace-nowrap">
          − {formatCurrency(expense.amount)}
        </TableCell>
        <TableCell className="w-20">
          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10.5px]" onClick={onEdit} aria-label="Modifier">
              Éditer
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10.5px] text-red-600 hover:bg-red-50" onClick={() => setIsDeleteModalOpen(true)} aria-label="Supprimer">
              Suppr.
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className={ui.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              La dépense "{expense.description}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={ui.btn}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
ExpenseRow.displayName = "ExpenseRow";

/* ============================================================
   PAGINATION
============================================================ */
const PaginationControls = ({
  currentPage, totalPages, onPageChange, totalItems, itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  if (totalPages <= 1) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-slate-100">
      <div className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{startItem}–{endItem}</span> sur{" "}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={cn(ui.btn, "h-7 px-2 text-[11px]")} aria-label="Page précédente">
          Préc.
        </Button>
        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className={cn("w-7 h-7 text-xs", currentPage === pageNum ? ui.btnPrimary : ui.btn)}
          >
            {pageNum}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className={cn(ui.btn, "h-7 px-2 text-[11px]")} aria-label="Page suivante">
          Suiv.
        </Button>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export function ExpensesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"expenses" | "cash" | "budgets" | "analytics">("expenses");
  const [expenseFilters, setExpenseFilters] = useState({
    timePeriod: "month", category: "all", search: "",
    sortBy: "expense_date", sortOrder: "desc", page: 1,
    startDate: "", endDate: "", limit: 10,
  });
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [cashTransactionType, setCashTransactionType] = useState<"income" | "expense">("expense");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [cashTransactionsPage, setCashTransactionsPage] = useState(1);
  const [cashTransactionsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);
  // ✅ NOUVEAU : date de la transaction (éditable)
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());

  /* ---- Queries ---- */
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", expenseFilters.timePeriod, expenseFilters.category, expenseFilters.search, expenseFilters.sortBy, expenseFilters.sortOrder, expenseFilters.page, expenseFilters.startDate, expenseFilters.endDate, expenseFilters.limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (expenseFilters.search?.trim()) params.append("search", expenseFilters.search.trim());
      if (expenseFilters.category !== "all") params.append("category", expenseFilters.category);
      if (expenseFilters.timePeriod !== "all") params.append("timePeriod", expenseFilters.timePeriod);
      if (expenseFilters.startDate) params.append("startDate", expenseFilters.startDate);
      if (expenseFilters.endDate) params.append("endDate", expenseFilters.endDate);
      if (expenseFilters.sortBy) params.append("sortBy", expenseFilters.sortBy);
      if (expenseFilters.sortOrder) params.append("sortOrder", expenseFilters.sortOrder);
      params.append("page", expenseFilters.page.toString());
      params.append("limit", expenseFilters.limit.toString());
      const res = await apiRequest("GET", `/api/expenses?${params.toString()}`);
      const json = await res.json();
      return json || { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
    },
  });

  const expenses: Expense[] = useMemo(() => {
    try {
      const raw: any[] = expensesData?.data ?? [];
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((e) => e?.date || e?.expenseDate)
        .map((e) => {
          const d: string = e.date ?? e.expenseDate;
          return { ...e, date: d, expenseDate: e.expenseDate ?? d };
        });
    } catch {
      return [];
    }
  }, [expensesData]);

  const pagination = expensesData?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };

  const { data: cashBalance } = useQuery({
    queryKey: ["cashBalance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cash/balance");
      const json = await res.json();
      return json || { balance: 0, lastUpdated: null };
    },
  });
  const { data: cashTransactions } = useQuery({
    queryKey: ["cashTransactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cash/transactions?limit=100");
      const json = await res.json();
      return json || { data: [] };
    },
  });
  const allCashTransactions: CashTransaction[] = useMemo(() => {
    const raw = cashTransactions?.data;
    return Array.isArray(raw) ? raw : [];
  }, [cashTransactions]);

  const paginatedCashTransactions = useMemo(() => {
    const start = (cashTransactionsPage - 1) * cashTransactionsPerPage;
    return allCashTransactions.slice(start, start + cashTransactionsPerPage);
  }, [allCashTransactions, cashTransactionsPage, cashTransactionsPerPage]);
  const cashTransactionsTotalPages = Math.max(1, Math.ceil(allCashTransactions.length / cashTransactionsPerPage));

  const { data: monthlyStats, refetch: refetchMonthlyStats } = useQuery({
    queryKey: ["expenseStats", "monthly", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/expenses/stats/monthly?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      return json || { count: 0, total: 0, average: 0, byCategory: [], comparison: { evolution: 0 } };
    },
  });

  const { data: budgets, refetch: refetchBudgets } = useQuery({
    queryKey: ["budgets", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  const { data: budgetAlerts, refetch: refetchBudgetAlerts } = useQuery({
    queryKey: ["budgetAlerts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/budgets/alerts");
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  /* ---- Auto-sync ---- */
  useEffect(() => {
    if (autoSynced) return;
    if (!expenses || expenses.length === 0) return;
    const hasStats = (monthlyStats?.count ?? 0) > 0;
    if (hasStats) { setAutoSynced(true); return; }
    const firstDateStr = expenses[0].expenseDate ?? expenses[0].date;
    if (!firstDateStr) return;
    const firstDate = new Date(firstDateStr);
    if (isNaN(firstDate.getTime())) return;
    const y = firstDate.getFullYear();
    const m = firstDate.getMonth() + 1;
    if (y !== selectedYear || m !== selectedMonth) {
      setSelectedYear(y);
      setSelectedMonth(m);
    }
    setAutoSynced(true);
  }, [expenses, monthlyStats, selectedMonth, selectedYear, autoSynced]);

  /* ---- Forms ---- */
  const cashForm = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: { amount: 0, category: "", description: "", reference: "", notes: "" },
  });

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { category: "", budgetAmount: 0, alertThreshold: 80 },
  });

  /* ---- Mutations ---- */
  const invalidateExpenseRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
    queryClient.invalidateQueries({ queryKey: ["cashBalance"] });
    queryClient.invalidateQueries({ queryKey: ["cashTransactions"] });
    refetchMonthlyStats();
  }, [queryClient, refetchMonthlyStats]);

  const upsertExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...payload } = data;
      const method = id ? "PATCH" : "POST";
      const endpoint = id ? `/api/expenses/${id}` : "/api/expenses";
      return (await apiRequest(method, endpoint, payload)).json();
    },
    onSuccess: () => {
      invalidateExpenseRelated();
      setIsCashDialogOpen(false);
      setCurrentExpense(null);
      cashForm.reset();
      setTransactionDate(new Date());
      toast({ title: "Dépense enregistrée" });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const cashTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.type === "income" ? "/api/cash/income" : "/api/cash/expense";
      return (await apiRequest("POST", endpoint, data)).json();
    },
    onSuccess: () => {
      invalidateExpenseRelated();
      setIsCashDialogOpen(false);
      cashForm.reset();
      setTransactionDate(new Date());
      toast({ title: "Transaction enregistrée" });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const budgetMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/budgets", data)).json(),
    onSuccess: () => {
      refetchBudgets();
      refetchBudgetAlerts();
      setIsBudgetDialogOpen(false);
      budgetForm.reset();
      toast({ title: "Budget enregistré" });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => (await apiRequest("DELETE", `/api/expenses/${id}`)).json(),
    onSuccess: () => {
      invalidateExpenseRelated();
      toast({ title: "Dépense supprimée" });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  /* ---- Handlers ---- */
  const handleWithdrawal = useCallback(() => {
    setCurrentExpense(null);
    setCashTransactionType("expense");
    cashForm.reset({ amount: 0, category: "", description: "", reference: "", notes: "" });
    setTransactionDate(new Date()); // ✅
    setIsCashDialogOpen(true);
  }, [cashForm]);

  const handleAddIncome = useCallback(() => {
    setCurrentExpense(null);
    setCashTransactionType("income");
    cashForm.reset({ amount: 0, category: "", description: "", reference: "", notes: "" });
    setTransactionDate(new Date()); // ✅
    setIsCashDialogOpen(true);
  }, [cashForm]);

  const handleAddBudget = useCallback(() => {
    budgetForm.reset({ category: "", budgetAmount: 0, alertThreshold: 80 });
    setIsBudgetDialogOpen(true);
  }, [budgetForm]);

  const resetFilters = useCallback(() => {
    setExpenseFilters({ timePeriod: "month", category: "all", search: "", sortBy: "expense_date", sortOrder: "desc", page: 1, startDate: "", endDate: "", limit: 10 });
    setCustomDateRange({ from: null, to: null });
  }, []);

  const applyDateRange = useCallback(() => {
    if (customDateRange.from && customDateRange.to) {
      setExpenseFilters((f) => ({
        ...f, timePeriod: "all",
        startDate: format(customDateRange.from!, "yyyy-MM-dd"),
        endDate: format(customDateRange.to!, "yyyy-MM-dd"),
        page: 1,
      }));
    }
  }, [customDateRange]);

  const handlePageChange = useCallback((newPage: number) => {
    setExpenseFilters((f) => ({ ...f, page: newPage }));
  }, []);

  /* ---- KPI fallback ---- */
  const fallbackTotals = useMemo(() => {
    const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;
    const max = expenses.reduce((m, e) => Math.max(m, e.amount ?? 0), 0);
    const min = count > 0 ? expenses.reduce((m, e) => Math.min(m, e.amount ?? 0), Infinity) : 0;
    const byCat = new Map<string, number>();
    expenses.forEach((e) => {
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + (e.amount ?? 0));
    });
    const byCategory = Array.from(byCat.entries())
      .map(([category, tot]) => ({ category, total: tot }))
      .sort((a, b) => b.total - a.total);
    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    return { total, count, average, max, min: isFinite(min) ? min : 0, byCategory, topExpenses };
  }, [expenses]);

  const statsCount = monthlyStats?.count ?? 0;
  const hasMonthlyStats = statsCount > 0 || (monthlyStats?.total ?? 0) > 0;

  const totalExpenses = hasMonthlyStats ? (monthlyStats?.total ?? 0) : fallbackTotals.total;
  const expenseCount = hasMonthlyStats ? statsCount : fallbackTotals.count;
  const averageExpense = hasMonthlyStats ? (monthlyStats?.average ?? 0) : fallbackTotals.average;
  const evolution = monthlyStats?.comparison?.evolution ?? 0;

  const mainCategoryObj = useMemo(() => {
    if (hasMonthlyStats && Array.isArray(monthlyStats?.byCategory) && monthlyStats.byCategory.length > 0) {
      return monthlyStats.byCategory[0];
    }
    return fallbackTotals.byCategory[0] ?? { category: "other", total: 0 };
  }, [hasMonthlyStats, monthlyStats, fallbackTotals]);

  const importantExpenses = useMemo(
    () => expenses.filter((e) => (e.amount ?? 0) > 200000).length,
    [expenses]
  );

  // ✅ filtre mensuel des transactions pour les KPI Trésorerie
  const totalIncome = useMemo(() =>
    allCashTransactions
      .filter((t) => t.type === "income")
      .filter((t) => {
        const d = new Date(t.transactionDate);
        return d.getMonth() === selectedMonth - 1 && d.getFullYear() === selectedYear;
      })
      .reduce((s, t) => s + t.amount, 0),
    [allCashTransactions, selectedMonth, selectedYear]
  );
  const totalExpenseCash = useMemo(() =>
    allCashTransactions
      .filter((t) => t.type === "expense")
      .filter((t) => {
        const d = new Date(t.transactionDate);
        return d.getMonth() === selectedMonth - 1 && d.getFullYear() === selectedYear;
      })
      .reduce((s, t) => s + t.amount, 0),
    [allCashTransactions, selectedMonth, selectedYear]
  );
  const netBalance = totalIncome - totalExpenseCash;

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (expenseFilters.category !== "all") n++;
    if (expenseFilters.timePeriod !== "month") n++;
    if (expenseFilters.startDate) n++;
    if (expenseFilters.endDate) n++;
    if (expenseFilters.search) n++;
    return n;
  }, [expenseFilters]);

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4")}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-teal-50 ring-1 ring-teal-600/10 flex items-center justify-center">
            <span className="text-teal-700 text-[13px] font-bold">Ar</span>
          </div>
          <div>
            <h1 className={ui.h1}>Gestion financière</h1>
            <p className={cn(ui.textSm, "mt-0.5")}>Dépenses, trésorerie et budgets</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className={cn(ui.input, "w-[130px]")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2024, m - 1, 1).toLocaleString("fr", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className={cn(ui.input, "w-[95px]")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddIncome} variant="outline" size="sm" className={cn(ui.btn)}>
            Entrée
          </Button>
          <Button onClick={handleWithdrawal} size="sm" className={cn(ui.btnPrimary)}>
            Nouvelle dépense
          </Button>
        </div>
      </div>

      {/* BALANCE + KPI */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <div className={cn(ui.card, "p-4 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-teal-50/60 to-white")}>
          <div>
            <p className={ui.label}>Solde de caisse</p>
            <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(cashBalance?.balance ?? 0)}</p>
            <p className={cn(ui.textSm, "mt-0.5")}>
              {cashBalance?.lastUpdated ? safeFormat(cashBalance.lastUpdated, "dd/MM/yyyy HH:mm") : "—"}
            </p>
          </div>
        </div>

        <KPI
          label="Dépenses du mois"
          value={formatCurrency(totalExpenses)}
          hint={`${new Date(selectedYear, selectedMonth - 1, 1).toLocaleString("fr", { month: "long", year: "numeric" })}`}
          trend={evolution !== 0 ? { dir: evolution <= 0 ? "up" : "down", label: `${Math.abs(evolution).toFixed(1)}%` } : null}
        />
        <KPI
          label="Dépense moyenne"
          value={formatCurrency(averageExpense)}
          hint={`${expenseCount} transaction${expenseCount > 1 ? "s" : ""}`}
        />
        <KPI
          label="Catégorie principale"
          value={getExpenseCategory(mainCategoryObj.category).label}
          hint={formatCurrency(mainCategoryObj.total)}
        />
        <KPI
          label="Dépenses élevées"
          value={importantExpenses.toString()}
          hint="> 200 000 Ar"
        />
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="h-9 inline-flex items-center rounded-md bg-slate-100 p-0.5">
          {[
            { v: "expenses", l: "Dépenses" },
            { v: "cash", l: "Trésorerie" },
            { v: "budgets", l: "Budgets" },
            { v: "analytics", l: "Analyses" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="h-8 px-3 text-xs font-medium text-slate-600 rounded data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* === EXPENSES TAB === */}
        <TabsContent value="expenses" className="space-y-3 mt-3">
          <div className={ui.card}>
            <div className="p-3 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Input
                  placeholder="Rechercher une dépense..."
                  className={cn(ui.input)}
                  value={expenseFilters.search}
                  onChange={(e) => setExpenseFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className={cn(ui.btn, "h-9", showFilters && "bg-slate-50")}
              >
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs text-slate-600">
                  Réinitialiser
                </Button>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                <Select value={expenseFilters.sortBy} onValueChange={(v) => setExpenseFilters((f) => ({ ...f, sortBy: v }))}>
                  <SelectTrigger className={cn(ui.input, "w-[140px] h-9")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense_date">Trier par date</SelectItem>
                    <SelectItem value="amount">Trier par montant</SelectItem>
                    <SelectItem value="description">Trier par description</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpenseFilters((f) => ({ ...f, sortOrder: f.sortOrder === "desc" ? "asc" : "desc" }))}
                  className={cn(ui.btn, "h-9 w-9 p-0 text-[10px]")}
                  aria-label="Inverser l'ordre"
                >
                  {expenseFilters.sortOrder === "asc" ? "▲" : "▼"}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="p-3 pt-0 border-t border-slate-100 mt-0">
                <div className="flex flex-wrap gap-2 items-center pt-3">
                  <Select value={expenseFilters.timePeriod} onValueChange={(v) => {
                    setExpenseFilters((f) => ({ ...f, timePeriod: v, startDate: "", endDate: "", page: 1 }));
                    setCustomDateRange({ from: null, to: null });
                  }}>
                    <SelectTrigger className={cn(ui.input, "w-[160px]")}>
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toute période</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(ui.input, "w-[220px] justify-start text-left font-normal")}>
                        <span className="truncate text-slate-700">
                          {customDateRange.from
                            ? (customDateRange.to
                              ? `${format(customDateRange.from, "dd/MM/yy")} - ${format(customDateRange.to, "dd/MM/yy")}`
                              : format(customDateRange.from, "dd/MM/yyyy"))
                            : "Période personnalisée"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-slate-200" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange.from ?? new Date()}
                        selected={{ from: customDateRange.from ?? undefined, to: customDateRange.to ?? undefined }}
                        onSelect={(range) => setCustomDateRange({ from: range?.from ?? null, to: range?.to ?? null })}
                        numberOfMonths={1}
                        locale={fr}
                      />
                      <div className="p-2 border-t border-slate-100 flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 text-[11px]")} onClick={() => setCustomDateRange({ from: null, to: null })}>
                          Effacer
                        </Button>
                        <Button size="sm" className={cn(ui.btnPrimary, "h-7 text-[11px]")} onClick={applyDateRange}>
                          Appliquer
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Select value={expenseFilters.limit.toString()} onValueChange={(v) => setExpenseFilters((f) => ({ ...f, limit: parseInt(v), page: 1 }))}>
                    <SelectTrigger className={cn(ui.input, "w-[120px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={resetFilters} className={cn(ui.btn, "h-9")}>
                    Réinitialiser
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className={ui.card}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h3 className={cn(ui.h2)}>Historique des dépenses</h3>
                <p className={cn(ui.textSm, "mt-0.5")}>{pagination.total} dépense(s) trouvée(s)</p>
              </div>
            </div>

            {expensesLoading ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-2 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className={ui.textSm}>Chargement des dépenses…</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-400 text-[16px] font-bold">—</span>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">Aucune dépense trouvée</p>
                <p className={cn(ui.textSm, "mb-4 max-w-sm mx-auto")}>
                  Ajustez vos filtres ou enregistrez votre première dépense
                </p>
                <Button onClick={handleWithdrawal} size="sm" className={cn(ui.btnPrimary)}>
                  Nouvelle dépense
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Description</TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wide text-slate-500 w-36">Date</TableHead>
                        <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-slate-500 w-32">Montant</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          onEdit={() => {
                            setCurrentExpense(expense);
                            setCashTransactionType("expense");
                            cashForm.reset({
                              amount: expense.amount,
                              category: expense.category,
                              description: expense.description,
                              reference: expense.reference ?? "",
                              notes: expense.notes ?? "",
                            });
                            // ✅ date pré-remplie
                            const d = new Date(expense.expenseDate ?? expense.date);
                            setTransactionDate(isNaN(d.getTime()) ? new Date() : d);
                            setIsCashDialogOpen(true);
                          }}
                          onDelete={() => deleteExpenseMutation.mutate(expense.id)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                  itemsPerPage={expenseFilters.limit}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* === CASH TAB === */}
        <TabsContent value="cash" className="space-y-3 mt-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className={ui.card}>
              <div className="p-4">
                <p className={ui.label}>Entrées (mois)</p>
                <p className="text-xl font-bold text-teal-700 mt-1 tabular-nums">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className={ui.card}>
              <div className="p-4">
                <p className={ui.label}>Sorties (mois)</p>
                <p className="text-xl font-bold text-red-600 mt-1 tabular-nums">{formatCurrency(totalExpenseCash)}</p>
              </div>
            </div>
            <div className={ui.card}>
              <div className="p-4">
                <p className={ui.label}>Solde net</p>
                <p className={cn("text-xl font-bold mt-1 tabular-nums", netBalance >= 0 ? "text-slate-900" : "text-red-600")}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className={ui.card}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className={cn(ui.h2)}>Historique des transactions</h3>
                <p className={cn(ui.textSm, "mt-0.5")}>Toutes les entrées et sorties</p>
              </div>
              <Button onClick={handleAddIncome} size="sm" className={cn(ui.btnPrimary)}>
                Entrée
              </Button>
            </div>
            {paginatedCashTransactions.length === 0 ? (
              // ✅ EmptyState
              <div className="text-center py-16">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-400 text-[16px] font-bold">—</span>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">Aucune transaction</p>
                <p className={cn(ui.textSm, "mb-4 max-w-sm mx-auto")}>
                  Enregistrez une entrée ou une dépense pour démarrer
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="text-[11px] font-medium uppercase tracking-wide text-slate-500 w-28">Date</TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wide text-slate-500 w-24">Type</TableHead>
                        <TableHead className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Catégorie</TableHead>
                        <TableHead className="hidden sm:table-cell text-[11px] font-medium uppercase tracking-wide text-slate-500 w-32">Groupe</TableHead>
                        <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-slate-500 w-32">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCashTransactions.map((transaction) => {
                        const isIncome = transaction.type === "income";
                        const cat = isIncome ? getIncomeCategory(transaction.category) : getExpenseCategory(transaction.category);
                        return (
                          <TableRow key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                            <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                              {safeFormat(transaction.transactionDate, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <Pill tone={isIncome ? "brand" : "red"}>
                                {isIncome ? "Entrée" : "Sortie"}
                              </Pill>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-700">{cat.label}</span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Pill tone="slate">{cat.group}</Pill>
                            </TableCell>
                            <TableCell className={cn("text-right text-sm font-semibold tabular-nums", isIncome ? "text-teal-700" : "text-red-600")}>
                              {isIncome ? "+" : "−"} {formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
              </>
            )}
          </div>
        </TabsContent>

        {/* === BUDGETS TAB === */}
        <TabsContent value="budgets" className="space-y-3 mt-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className={cn(ui.input, "w-[150px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1, 1).toLocaleString("fr", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className={cn(ui.input, "w-[100px]")}><SelectValue /></SelectTrigger>
                <SelectContent>{[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddBudget} size="sm" className={cn(ui.btnPrimary)}>
              Définir un budget
            </Button>
          </div>

          {budgetAlerts && budgetAlerts.length > 0 && (
            <div className={cn(ui.card, "border-amber-200 bg-amber-50/40")}>
              <div className="p-4">
                <div className="text-amber-800 font-semibold text-sm mb-2">
                  Alertes de dépassement ({budgetAlerts.length})
                </div>
                <div className="space-y-2">
                  {budgetAlerts.map((alert: any) => {
                    const cat = getExpenseCategory(alert.category);
                    return (
                      <div key={alert.id} className={cn(ui.well, "p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white/60")}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-slate-700">{cat.label}</span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {formatCurrency(alert.spentAmount)} / {formatCurrency(alert.budgetAmount)}
                          </span>
                        </div>
                        <Pill tone={alert.alertType === "critical" ? "red" : "amber"}>
                          {alert.percentageUsed.toFixed(0)}% utilisé
                        </Pill>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={ui.card}>
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className={cn(ui.h2)}>Budgétisation par catégorie</h3>
              <p className={cn(ui.textSm, "mt-0.5")}>
                {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString("fr", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {budgets?.map((budget: Budget) => {
                const percentage = budget.budgetAmount > 0 ? Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100) : 0;
                const isOverBudget = percentage >= 100;
                const isWarning = percentage >= (budget.alertThreshold ?? 80);
                const progressColor = isOverBudget ? "#ef4444" : isWarning ? "#f59e0b" : "#0d9488";
                const cat = getExpenseCategory(budget.category);
                return (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-slate-800">{cat.label}</span>
                        <Pill tone="slate">{cat.group}</Pill>
                      </div>
                      <div className="text-[11px] flex items-center gap-1.5">
                        <span className="text-slate-600 tabular-nums">{formatCurrency(budget.spentAmount)}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-medium text-slate-800 tabular-nums">{formatCurrency(budget.budgetAmount)}</span>
                        <Pill tone={isOverBudget ? "red" : isWarning ? "amber" : "brand"}>
                          {percentage.toFixed(0)}%
                        </Pill>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: progressColor }} />
                    </div>
                  </div>
                );
              })}
              {(!budgets || budgets.length === 0) && (
                <div className="text-center py-16">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-[16px] font-bold">—</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Aucun budget défini</p>
                  <p className={cn(ui.textSm, "mb-4 max-w-sm mx-auto")}>
                    Créez un budget pour suivre vos dépenses par catégorie
                  </p>
                  <Button onClick={handleAddBudget} size="sm" className={cn(ui.btnPrimary)}>
                    Créer un budget
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* === ANALYTICS TAB === */}
        <TabsContent value="analytics" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className={ui.card}>
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className={cn(ui.h2)}>Évolution des dépenses</h3>
                <p className={cn(ui.textSm, "mt-0.5")}>Courbe d'évolution</p>
              </div>
              <div className="p-4 h-64">
                <ExpensesLineChart expenses={expenses as any} />
              </div>
            </div>

            <div className={ui.card}>
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className={cn(ui.h2)}>Répartition par catégorie</h3>
              </div>
              <div className="p-4 space-y-2.5 max-h-[320px] overflow-y-auto">
                {(hasMonthlyStats && monthlyStats?.byCategory?.length > 0
                  ? monthlyStats.byCategory
                  : fallbackTotals.byCategory
                ).map((item: any, index: number) => {
                  const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
                  const cat = getExpenseCategory(item.category);
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-700">{cat.label}</span>
                        <span className="text-slate-600 font-medium tabular-nums">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right mt-0.5 tabular-nums">{formatCurrency(item.total)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={ui.card}>
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className={cn(ui.h2)}>Statistiques détaillées</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "Transactions", v: expenseCount },
                    { l: "Maximum", v: formatCurrency(hasMonthlyStats ? (monthlyStats?.max ?? 0) : fallbackTotals.max) },
                    { l: "Minimum", v: formatCurrency(hasMonthlyStats ? (monthlyStats?.min ?? 0) : fallbackTotals.min) },
                    { l: "Évolution", v: `${evolution >= 0 ? "+" : ""}${evolution.toFixed(1)}%` },
                  ].map((s, i) => (
                    <div key={i} className={cn(ui.well, "p-3")}>
                      <p className={ui.label}>{s.l}</p>
                      <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={ui.card}>
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className={cn(ui.h2)}>Top 5 des dépenses</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {(hasMonthlyStats && monthlyStats?.topExpenses?.length > 0
                  ? monthlyStats.topExpenses
                  : fallbackTotals.topExpenses
                ).slice(0, 5).map((expense: any, idx: number) => {
                  const cat = getExpenseCategory(expense.category);
                  return (
                    <div key={expense.id ?? idx} className={cn(ui.well, "p-2.5 flex items-center justify-between bg-white")}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-slate-800 truncate">{expense.description}</p>
                          <p className="text-[10px] text-slate-400 truncate">{cat.label}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-red-600 whitespace-nowrap text-xs tabular-nums ml-2">{formatCurrency(expense.amount)}</p>
                    </div>
                  );
                })}
                {(!(hasMonthlyStats && monthlyStats?.topExpenses?.length > 0) && fallbackTotals.topExpenses.length === 0) && (
                  <div className="text-center py-6">
                    <p className={ui.textSm}>Aucune dépense enregistrée</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG CASH — REFONTE ===== */}
      <Dialog
        open={isCashDialogOpen}
        onOpenChange={(open) => {
          setIsCashDialogOpen(open);
          if (!open) {
            setCurrentExpense(null);
            setTransactionDate(new Date());
          }
        }}
      >
        <DialogContent className="sm:max-w-[540px] max-w-[95vw] p-0 overflow-hidden rounded-xl border-slate-200 bg-white shadow-xl">
          {/* En-tête colorée selon le type */}
          <div
            className={cn(
              "px-5 py-4 border-b",
              cashTransactionType === "income"
                ? "bg-teal-50/60 border-teal-100"
                : "bg-red-50/50 border-red-100"
            )}
          >
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-[15px] font-semibold text-slate-900">
                {cashTransactionType === "income"
                  ? "Nouvelle entrée d'argent"
                  : currentExpense
                    ? "Modifier la dépense"
                    : "Nouvelle dépense"}
              </DialogTitle>
              <DialogDescription className="text-[11.5px] text-slate-600">
                {cashTransactionType === "income"
                  ? "Enregistrez un paiement client, un apport, etc."
                  : currentExpense
                    ? "Mettez à jour les informations de cette dépense."
                    : "Enregistrez une sortie de caisse (achat, salaire, charge…)."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...cashForm}>
            <form
              onSubmit={cashForm.handleSubmit((data) => {
                const payload = {
                  ...data,
                  transactionDate: transactionDate.toISOString(),
                  expenseDate: transactionDate.toISOString(),
                };
                if (currentExpense) upsertExpenseMutation.mutate({ ...payload, id: currentExpense.id });
                else cashTransactionMutation.mutate({ ...payload, type: cashTransactionType });
              })}
              className="px-5 py-4 space-y-4"
            >
              {/* Montant */}
              <FormField
                control={cashForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Montant (Ar) *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          className={cn(
                            "h-12 text-lg font-semibold tabular-nums pr-12",
                            cashTransactionType === "income"
                              ? "border-teal-200 focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
                              : "border-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/15"
                          )}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                          Ar
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Catégorie + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={cashForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        Catégorie *
                      </FormLabel>
                      <FormControl>
                        <CategorySearch
                          value={field.value}
                          onChange={field.onChange}
                          categories={
                            cashTransactionType === "income"
                              ? INCOME_CATEGORIES
                              : EXPENSE_CATEGORIES
                          }
                          placeholder="Choisir…"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Date *
                  </FormLabel>
                  <Input
                    type="date"
                    value={format(transactionDate, "yyyy-MM-dd")}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => {
                      const d = e.target.value ? new Date(e.target.value) : new Date();
                      if (!isNaN(d.getTime())) setTransactionDate(d);
                    }}
                    className="h-9"
                  />
                </FormItem>
              </div>

              {/* Description */}
              <FormField
                control={cashForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Description *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          cashTransactionType === "income"
                            ? "Ex : Paiement facture #INV-2024-001"
                            : "Ex : Achat détergent 5kg"
                        }
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Détails optionnels */}
              <details className="group">
                <summary className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-700 select-none">
                  Détails optionnels (référence, notes)
                </summary>
                <div className="mt-3 space-y-3">
                  <FormField
                    control={cashForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                          Référence
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="N° facture, reçu…"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={cashForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                          Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires…"
                            rows={2}
                            className="resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </details>

              {/* Aperçu solde */}
              {cashTransactionType === "expense" && !currentExpense && (
                <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Solde après dépense</span>
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold tabular-nums",
                      (cashBalance?.balance ?? 0) - (cashForm.watch("amount") || 0) < 0
                        ? "text-red-600"
                        : "text-slate-900"
                    )}
                  >
                    {formatCurrency((cashBalance?.balance ?? 0) - (cashForm.watch("amount") || 0))}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 flex-1 sm:flex-none"
                  onClick={() => {
                    setIsCashDialogOpen(false);
                    setCurrentExpense(null);
                    cashForm.reset();
                    setTransactionDate(new Date());
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    upsertExpenseMutation.isPending || cashTransactionMutation.isPending
                  }
                  className={cn(
                    "h-9 flex-1 sm:flex-none font-medium",
                    cashTransactionType === "income"
                      ? "bg-teal-700 hover:bg-teal-800 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  {upsertExpenseMutation.isPending || cashTransactionMutation.isPending
                    ? "Enregistrement…"
                    : currentExpense
                      ? "Mettre à jour"
                      : cashTransactionType === "income"
                        ? "Valider l'entrée"
                        : "Valider la dépense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG BUDGET ===== */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className={cn(ui.dialog, "sm:max-w-[440px] max-w-[95vw]")}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Définir un budget mensuel
            </DialogTitle>
            <DialogDescription className="text-xs">Fixez un budget pour la catégorie</DialogDescription>
          </DialogHeader>
          <Form {...budgetForm}>
            <form onSubmit={budgetForm.handleSubmit((data) => budgetMutation.mutate({ ...data, month: selectedMonth, year: selectedYear }))} className="space-y-3">
              <FormField control={budgetForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Catégorie *</FormLabel>
                  <FormControl>
                    <CategorySearch value={field.value} onChange={field.onChange} categories={EXPENSE_CATEGORIES} placeholder="Choisir une catégorie..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={budgetForm.control} name="budgetAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Montant (Ar) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500000"
                      className={ui.input}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={budgetForm.control} name="alertThreshold" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Seuil d'alerte (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="80"
                      className={ui.input}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsBudgetDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={budgetMutation.isPending} className={cn(ui.btnPrimary)}>
                  {budgetMutation.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}