// client/src/pages/admin/AgentsTab.tsx
// Interface Utilisateurs — flat + brand #0B676E.
// Actions en icônes, reste textuel, sans "Vide" ni "—".
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Pencil, Key, Power, PowerOff } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]",
  input: "h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/20",
  btn: "h-9 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50",
  btnPrimary: "h-9 rounded-xl bg-[#0B676E] font-medium text-white shadow-none transition-colors hover:bg-[#09565C]",
  dialog: "rounded-2xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-xl border border-slate-200 bg-slate-50/80",
};

type Tone = "brand" | "red" | "amber" | "blue" | "slate" | "purple";
const toneClass: Record<Tone, string> = {
  brand: "bg-[#0B676E]/10 text-[#0B676E]",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
};

const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[tone], className)}>{children}</span>
);

const Panel: React.FC<{
  title: string; subtitle?: string; action?: React.ReactNode;
  className?: string; bodyClass?: string; children: React.ReactNode;
}> = ({ title, subtitle, action, className, bodyClass, children }) => (
  <section className={cn(ui.card, className)}>
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
    <div className={cn("p-5", bodyClass)}>{children}</div>
  </section>
);

/* Empty — sans rond "Vide" */
const Empty: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({ title, hint, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-[13.5px] font-semibold text-slate-800">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const KPI: React.FC<{ title: string; value: string | number; subtitle?: string }> = ({ title, value, subtitle }) => (
  <div className={cn(ui.card, "p-5")}>
    <p className="text-[12px] font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
    {subtitle && <p className="mt-2 text-[11.5px] text-slate-500">{subtitle}</p>}
  </div>
);

/* Bouton icône pour actions */
const IconAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ icon, label, onClick, className, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={cn(
      "h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
  >
    {icon}
  </button>
);

/* ============================================================
   TYPES
============================================================ */
type StaffRole = "admin" | "supervisor" | "agent";

export interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: StaffRole | "delivery" | "client";
  isActive: boolean;
  status?: "pending" | "approved" | "refused";
  createdAt: string;
  updatedAt?: string;
}

interface AgentsTabProps {
  users: UserData[];
}

/* ============================================================
   SCHÉMAS ZOD
============================================================ */
const createUserSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["admin", "supervisor", "agent"]),
  isActive: z.boolean(),
});
type CreateUserValues = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().optional(),
  role: z.enum(["admin", "supervisor", "agent"]),
  isActive: z.boolean(),
});
type EditUserValues = z.infer<typeof editUserSchema>;

/* ============================================================
   HELPERS
============================================================ */
const getRoleConfig = (role: StaffRole) => {
  switch (role) {
    case "admin":
      return { label: "Administrateur", tone: "amber" as Tone, bg: "bg-amber-500" };
    case "supervisor":
      return { label: "Superviseur", tone: "purple" as Tone, bg: "bg-violet-600" };
    case "agent":
    default:
      return { label: "Agent", tone: "brand" as Tone, bg: "bg-[#0B676E]" };
  }
};

const isStaffRole = (r: unknown): r is StaffRole => r === "admin" || r === "supervisor" || r === "agent";

/* formatDate — vide si invalide (plus de tiret) */
const formatDate = (d?: string) => {
  if (!d || isNaN(new Date(d).getTime())) return "";
  return format(new Date(d), "dd MMM yyyy", { locale: fr });
};

/* formatRelative — vide si invalide */
const formatRelative = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  try { return formatDistanceToNow(date, { addSuffix: true, locale: fr }); }
  catch { return ""; }
};

const initialsOf = (name?: string) =>
  (name || "").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};
const strengthMeta = (score: number) => {
  if (score <= 1) return { label: "Faible", color: "bg-red-500", text: "text-red-600" };
  if (score === 2) return { label: "Moyen", color: "bg-amber-500", text: "text-amber-600" };
  if (score === 3) return { label: "Bon", color: "bg-blue-500", text: "text-blue-600" };
  return { label: "Fort", color: "bg-[#0B676E]", text: "text-[#0B676E]" };
};

/* ============================================================
   PAGINATION
============================================================ */
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onItemsPerPageChange: (v: number) => void;
}> = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-[11.5px] text-slate-500">
        {start}–{end} sur <span className="font-medium text-slate-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Select value={String(itemsPerPage)} onValueChange={(v) => onItemsPerPageChange(parseInt(v))}>
          <SelectTrigger className={cn(ui.input, "h-8 w-[84px] text-[11.5px]")}><SelectValue /></SelectTrigger>
          <SelectContent>{[5, 10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>
          Préc.
        </Button>
        <span className="min-w-[64px] text-center text-[11.5px] text-slate-600">{currentPage} / {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>
          Suiv.
        </Button>
      </div>
    </div>
  );
};

/* ============================================================
   AVATAR
============================================================ */
const Avatar: React.FC<{ fullName: string; role: StaffRole; size?: "sm" | "lg" }> = ({ fullName, role, size = "sm" }) => {
  const cfg = getRoleConfig(role);
  const dim = size === "lg" ? "h-12 w-12 text-base" : "h-11 w-11 text-sm";
  return (
    <div className={cn("shrink-0 rounded-xl flex items-center justify-center font-semibold text-white", dim, cfg.bg)}>
      {initialsOf(fullName)}
    </div>
  );
};

/* ============================================================
   FORCE DU MOT DE PASSE
============================================================ */
const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const score = passwordStrength(password);
  const meta = strengthMeta(score);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < score ? meta.color : "bg-slate-200")} />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", meta.text)}>Force du mot de passe : {meta.label}</p>
    </div>
  );
};

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export function AgentsTab({ users }: AgentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editData, setEditData] = useState<UserData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const staffUsers = useMemo(
    () => safeUsers.filter((u) => isStaffRole(u.role)),
    [safeUsers]
  );

  const stats = useMemo(() => {
    const admins = staffUsers.filter((u) => u.role === "admin").length;
    const supervisors = staffUsers.filter((u) => u.role === "supervisor").length;
    const agents = staffUsers.filter((u) => u.role === "agent").length;
    const active = staffUsers.filter((u) => u.isActive).length;
    return { total: staffUsers.length, admins, supervisors, agents, active, suspended: staffUsers.length - active };
  }, [staffUsers]);

  const filteredUsers = useMemo(() => {
    let filtered = staffUsers;
    if (activeTab === "admins") filtered = filtered.filter((u) => u.role === "admin");
    else if (activeTab === "supervisors") filtered = filtered.filter((u) => u.role === "supervisor");
    else if (activeTab === "agents") filtered = filtered.filter((u) => u.role === "agent");
    else if (activeTab === "active") filtered = filtered.filter((u) => u.isActive);
    else if (activeTab === "suspended") filtered = filtered.filter((u) => !u.isActive);

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.username?.toLowerCase().includes(s) ||
          u.phone?.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [staffUsers, activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentUsers = useMemo(
    () => filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredUsers, currentPage, itemsPerPage]
  );

  const newUserForm = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", phone: "", username: "", password: "", role: "agent", isActive: true },
  });

  const editForm = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { fullName: "", email: "", phone: "", username: "", password: "", role: "agent", isActive: true },
  });

  const newFullName = useWatch({ control: newUserForm.control, name: "fullName" });
  const newRole = useWatch({ control: newUserForm.control, name: "role" });
  const newPasswordValue = useWatch({ control: newUserForm.control, name: "password" });
  const editPasswordValue = useWatch({ control: editForm.control, name: "password" });

  useEffect(() => {
    if (editData) {
      editForm.reset({
        fullName: editData.fullName || "",
        email: editData.email || "",
        phone: editData.phone || "",
        username: editData.username || "",
        password: "",
        role: isStaffRole(editData.role) ? editData.role : "agent",
        isActive: editData.isActive ?? true,
      });
    }
  }, [editData, editForm]);

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserValues) => (await apiRequest("POST", "/api/users", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewOpen(false);
      newUserForm.reset();
      toast({ title: "Utilisateur créé" });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error?.message, variant: "destructive" }),
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserData> & { password?: string } }) =>
      (await apiRequest("PATCH", `/api/users/${id}`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditOpen(false);
      setEditData(null);
      toast({ title: "Utilisateur mis à jour" });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error?.message, variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) =>
      (await apiRequest("PATCH", `/api/users/${userId}/password`, { newPassword })).json(),
    onSuccess: () => {
      toast({ title: "Mot de passe modifié" });
      setIsPasswordOpen(false);
      setPasswordTarget(null);
      setNewPassword("");
      setShowNewPassword(false);
    },
    onError: (error: any) => toast({ title: "Erreur", description: error?.message, variant: "destructive" }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: number) => (await apiRequest("PATCH", `/api/users/${userId}/toggle-status`, {})).json(),
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const prev = queryClient.getQueryData<UserData[]>(["/api/users"]);
      queryClient.setQueryData<UserData[]>(["/api/users"], (old = []) =>
        old.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/users"], ctx.prev);
      toast({ title: "Erreur", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
  });

  const openNew = useCallback(() => {
    newUserForm.reset({ fullName: "", email: "", phone: "", username: "", password: "", role: "agent", isActive: true });
    setShowCreatePassword(false);
    setIsNewOpen(true);
  }, [newUserForm]);

  const openEdit = useCallback((user: UserData) => { setEditData(user); setShowEditPassword(false); setIsEditOpen(true); }, []);
  const openPassword = useCallback((user: UserData) => { setPasswordTarget(user); setNewPassword(""); setShowNewPassword(false); setIsPasswordOpen(true); }, []);
  const openDetails = useCallback((user: UserData) => { setSelectedUser(user); setIsDetailsOpen(true); }, []);

  const handleEditSubmit = editForm.handleSubmit((data) => {
    if (!editData) return;
    const payload: Partial<UserData> & { password?: string } = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      username: data.username,
      role: data.role,
      isActive: data.isActive,
    };
    if (data.password && data.password.trim()) payload.password = data.password;
    editUserMutation.mutate({ id: editData.id, data: payload });
  });

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5")}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Gestion des utilisateurs</h2>
          <p className="text-xs text-slate-500 mt-1">Admins, superviseurs et agents de la plateforme</p>
        </div>
        <Button onClick={openNew} className={cn(ui.btnPrimary)}>
          Nouvel utilisateur
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI title="Total" value={stats.total} />
        <KPI title="Admins" value={stats.admins} />
        <KPI title="Superviseurs" value={stats.supervisors} />
        <KPI title="Agents" value={stats.agents} />
      </div>

      {/* TABS + LISTE */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className="h-10 inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { v: "all", l: `Tous (${stats.total})` },
            { v: "admins", l: `Admins (${stats.admins})` },
            { v: "supervisors", l: `Superviseurs (${stats.supervisors})` },
            { v: "agents", l: `Agents (${stats.agents})` },
            { v: "active", l: `Actifs (${stats.active})` },
            { v: "suspended", l: `Suspendus (${stats.suspended})` },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="h-8 rounded-lg px-3 text-xs font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <Panel
          title="Liste des utilisateurs"
          subtitle={`${filteredUsers.length} résultat(s)`}
          className="mt-3"
          bodyClass="p-0"
          action={
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Rechercher par nom, email, username, téléphone…"
                className={cn(ui.input, "h-9 text-[12.5px]")}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          }
        >
          {currentUsers.length === 0 ? (
            <div className="p-5">
              <Empty
                title={searchTerm ? "Aucun résultat" : "Aucun utilisateur"}
                hint={searchTerm ? "Essayez un autre terme de recherche" : "Créez votre premier utilisateur pour commencer."}
                action={
                  !searchTerm && (
                    <Button size="sm" className={cn(ui.btnPrimary)} onClick={openNew}>
                      Nouvel utilisateur
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {currentUsers.map((user) => {
                  const cfg = getRoleConfig(isStaffRole(user.role) ? user.role : "agent");
                  return (
                    <li key={user.id} className="p-4 transition-colors hover:bg-slate-50/60">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Avatar fullName={user.fullName} role={isStaffRole(user.role) ? user.role : "agent"} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-[13.5px] text-slate-900 truncate">{user.fullName}</h4>
                              <Pill tone={cfg.tone}>{cfg.label}</Pill>
                              <Pill tone={user.isActive ? "brand" : "red"}>
                                {user.isActive ? "Actif" : "Suspendu"}
                              </Pill>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                              <span className="truncate">{user.email}</span>
                              {user.phone && <span>{user.phone}</span>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                              <span>{user.username}</span>
                              {formatDate(user.createdAt) && <span>Créé le {formatDate(user.createdAt)}</span>}
                              {formatRelative(user.updatedAt) && <span>Mis à jour {formatRelative(user.updatedAt)}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions icônes */}
                        <div className="flex items-center gap-1 shrink-0 lg:justify-end">
                          <IconAction
                            icon={<Eye className="h-3.5 w-3.5" />}
                            label="Détails"
                            onClick={() => openDetails(user)}
                            className="text-slate-700"
                          />
                          <IconAction
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Modifier"
                            onClick={() => openEdit(user)}
                            className="text-violet-600 border-violet-200"
                          />
                          <IconAction
                            icon={<Key className="h-3.5 w-3.5" />}
                            label="Changer le mot de passe"
                            onClick={() => openPassword(user)}
                            className="text-amber-600 border-amber-200"
                          />
                          <IconAction
                            icon={user.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                            label={user.isActive ? "Suspendre" : "Activer"}
                            onClick={() => toggleStatusMutation.mutate(user.id)}
                            disabled={toggleStatusMutation.isPending}
                            className={user.isActive ? "text-red-600 border-red-200" : "text-[#0B676E] border-[#0B676E]/30"}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {filteredUsers.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
                  />
                </div>
              )}
            </>
          )}
        </Panel>
      </Tabs>

      {/* ============ DIALOG NOUVEAU ============ */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className={cn(ui.dialog, "sm:max-w-[640px] max-h-[92vh] overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription className="text-xs">Remplissez les informations ci-dessous pour créer un compte staff.</DialogDescription>
          </DialogHeader>

          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-5">
              {/* Aperçu avatar */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <Avatar fullName={newFullName || ""} role={newRole as StaffRole} size="lg" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{newFullName || "Nom complet"}</p>
                  <div className="mt-0.5">
                    <Pill tone={getRoleConfig(newRole as StaffRole).tone}>{getRoleConfig(newRole as StaffRole).label}</Pill>
                  </div>
                </div>
              </div>

              {/* Identité */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Identité</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={newUserForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nom complet *</FormLabel>
                      <FormControl><Input placeholder="Jean Rakoto" className={ui.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={newUserForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Rôle *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={ui.input}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="supervisor">Superviseur</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={newUserForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="jean@svpressing.mg" className={ui.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={newUserForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Téléphone *</FormLabel>
                      <FormControl><Input placeholder="+261 34 00 000 00" className={ui.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sécurité */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sécurité</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={newUserForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nom d'utilisateur *</FormLabel>
                      <FormControl><Input placeholder="jean.rakoto" className={ui.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={newUserForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mot de passe *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showCreatePassword ? "text" : "password"} placeholder="••••••••" className={cn(ui.input, "pr-11")} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowCreatePassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-500 hover:text-slate-800"
                          >
                            {showCreatePassword ? "Cacher" : "Voir"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {newPasswordValue && newPasswordValue.length > 0 && <PasswordStrengthBar password={newPasswordValue} />}
              </div>

              {/* Statut */}
              <div className="pt-2 border-t border-slate-100">
                <FormField control={newUserForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 accent-[#0B676E] mt-0.5" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-medium text-slate-800">Compte actif dès la création</FormLabel>
                      <p className="text-[11px] text-slate-500">L'utilisateur pourra se connecter immédiatement.</p>
                    </div>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsNewOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createUserMutation.isPending} className={cn(ui.btnPrimary)}>
                  {createUserMutation.isPending ? "Création…" : "Créer le compte"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG MODIFIER ============ */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setEditData(null); }}>
        <DialogContent className={cn(ui.dialog, "sm:max-w-[640px] max-h-[92vh] overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Modifier #{editData?.id}</DialogTitle>
            <DialogDescription className="text-xs">Modifiez les informations de l'utilisateur.</DialogDescription>
          </DialogHeader>
          {editData && (
            <Form {...editForm}>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <Avatar fullName={editData.fullName} role={isStaffRole(editData.role) ? editData.role : "agent"} size="lg" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{editData.fullName}</p>
                    <div className="mt-0.5">
                      <Pill tone={getRoleConfig(isStaffRole(editData.role) ? editData.role : "agent").tone}>
                        {getRoleConfig(isStaffRole(editData.role) ? editData.role : "agent").label}
                      </Pill>
                    </div>
                  </div>
                </div>

                {/* Identité */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Identité</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Nom complet *</FormLabel><FormControl><Input className={ui.input} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Rôle *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className={ui.input}><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="supervisor">Superviseur</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Email *</FormLabel><FormControl><Input type="email" className={ui.input} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Téléphone *</FormLabel><FormControl><Input className={ui.input} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                {/* Sécurité */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sécurité</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="username" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Username *</FormLabel><FormControl><Input className={ui.input} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Nouveau mot de passe <span className="text-[10px] font-normal text-slate-400">(vide = inchangé)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showEditPassword ? "text" : "password"} placeholder="••••••••" className={cn(ui.input, "pr-11")} {...field} />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-500 hover:text-slate-800"
                            >
                              {showEditPassword ? "Cacher" : "Voir"}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {editPasswordValue && editPasswordValue.length > 0 && <PasswordStrengthBar password={editPasswordValue} />}
                </div>

                {/* Statut */}
                <div className="pt-2 border-t border-slate-100">
                  <FormField control={editForm.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 accent-[#0B676E] mt-0.5" />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-medium text-slate-800">Compte actif</FormLabel>
                        <p className="text-[11px] text-slate-500">L'utilisateur peut se connecter à la plateforme.</p>
                      </div>
                    </FormItem>
                  )} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsEditOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={editUserMutation.isPending} className={cn(ui.btnPrimary)}>
                    {editUserMutation.isPending ? "Sauvegarde…" : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG DÉTAILS ============ */}
      <Dialog open={isDetailsOpen} onOpenChange={(o) => { setIsDetailsOpen(o); if (!o) setSelectedUser(null); }}>
        <DialogContent className={cn(ui.dialog, "sm:max-w-[600px]")}>
          {selectedUser && (() => {
            const cfg = getRoleConfig(isStaffRole(selectedUser.role) ? selectedUser.role : "agent");
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Avatar fullName={selectedUser.fullName} role={isStaffRole(selectedUser.role) ? selectedUser.role : "agent"} size="lg" />
                    <div className="min-w-0">
                      <DialogTitle className="text-base font-semibold truncate">{selectedUser.fullName}</DialogTitle>
                      <DialogDescription className="text-xs mt-1 flex flex-wrap items-center gap-2">
                        <Pill tone={cfg.tone}>{cfg.label}</Pill>
                        <Pill tone={selectedUser.isActive ? "brand" : "red"}>{selectedUser.isActive ? "Actif" : "Suspendu"}</Pill>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                  {[
                    ["Email", selectedUser.email],
                    ["Téléphone", selectedUser.phone],
                    ["Username", selectedUser.username],
                    ["ID", `#${selectedUser.id}`],
                    ["Créé le", formatDate(selectedUser.createdAt)],
                    ["Mis à jour", formatDate(selectedUser.updatedAt)],
                  ].map(([k, v]) => (
                    <div key={k as string} className={cn(ui.well, "p-3")}>
                      <p className="text-[10.5px] uppercase tracking-wide text-slate-500">{k}</p>
                      <p className="text-[13px] font-medium text-slate-900 mt-0.5 break-all">{v || ""}</p>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" className={ui.btn} onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
                  <Button className={cn(ui.btnPrimary)} onClick={() => { setIsDetailsOpen(false); setEditData(selectedUser); setIsEditOpen(true); }}>
                    Modifier
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG MOT DE PASSE ============ */}
      <Dialog open={isPasswordOpen} onOpenChange={(o) => { setIsPasswordOpen(o); if (!o) { setPasswordTarget(null); setNewPassword(""); setShowNewPassword(false); } }}>
        <DialogContent className={cn(ui.dialog, "sm:max-w-[460px]")}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Changer le mot de passe</DialogTitle>
            <DialogDescription className="text-xs">
              Pour : <span className="font-semibold text-slate-700">{passwordTarget?.fullName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs">Nouveau mot de passe *</Label>
              <div className="relative mt-2">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  className={cn(ui.input, "pr-11")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-500 hover:text-slate-800"
                >
                  {showNewPassword ? "Cacher" : "Voir"}
                </button>
              </div>
            </div>
            {newPassword.length > 0 && <PasswordStrengthBar password={newPassword} />}
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[11px] text-red-600">Minimum 6 caractères requis</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className={ui.btn} onClick={() => setIsPasswordOpen(false)}>Annuler</Button>
            <Button
              onClick={() => passwordTarget && changePasswordMutation.mutate({ userId: passwordTarget.id, newPassword })}
              disabled={!newPassword || newPassword.length < 6 || changePasswordMutation.isPending}
              className={cn(ui.btnPrimary)}
            >
              {changePasswordMutation.isPending ? "Modification…" : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}