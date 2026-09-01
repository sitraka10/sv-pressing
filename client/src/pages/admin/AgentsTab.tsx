import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Edit, Eye, EyeOff, Loader2, Users, UserCheck, Shield, UserPlus,
  Phone, Mail, Search, ChevronLeft, ChevronRight, XSquare, CheckSquare,
  Key, Calendar, X, Check, Crown, Headphones, Settings
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
};

// ============================================================
// SCHÉMAS DE VALIDATION
// ============================================================
const createUserSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["admin", "supervisor", "agent"]),
  isActive: z.boolean().default(true),
});

const editUserSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().optional(),
  role: z.enum(["admin", "supervisor", "agent"]),
  isActive: z.boolean().default(true),
});

// ============================================================
// INTERFACES
// ============================================================
interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: 'admin' | 'supervisor' | 'agent' | 'delivery' | 'client';
  isActive: boolean;
  status?: 'pending' | 'approved' | 'refused';
  createdAt: string;
  updatedAt?: string;
}

interface AgentsTabProps {
  users: UserData[];
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export function AgentsTab({ users }: AgentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- États locaux ---
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dialogs states
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editData, setEditData] = useState<UserData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- Filtre des users (uniquement admin/supervisor/agent) ---
  const staffUsers = useMemo(() => {
    return (users || []).filter(u =>
      u.role === 'admin' || u.role === 'supervisor' || u.role === 'agent'
    );
  }, [users]);

  // --- Statistiques ---
  const stats = useMemo(() => {
    const admins = staffUsers.filter(u => u.role === 'admin');
    const supervisors = staffUsers.filter(u => u.role === 'supervisor');
    const agents = staffUsers.filter(u => u.role === 'agent');
    const active = staffUsers.filter(u => u.isActive);
    return {
      total: staffUsers.length,
      admins: admins.length,
      supervisors: supervisors.length,
      agents: agents.length,
      active: active.length,
      suspended: staffUsers.length - active.length,
    };
  }, [staffUsers]);

  // --- Filtrage ---
  const filteredUsers = useMemo(() => {
    let filtered = staffUsers;
    if (activeTab === "admins") filtered = filtered.filter(u => u.role === 'admin');
    else if (activeTab === "supervisors") filtered = filtered.filter(u => u.role === 'supervisor');
    else if (activeTab === "agents") filtered = filtered.filter(u => u.role === 'agent');
    else if (activeTab === "active") filtered = filtered.filter(u => u.isActive);
    else if (activeTab === "suspended") filtered = filtered.filter(u => !u.isActive);

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.username?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [staffUsers, activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Formulaires ---
  const newUserForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", username: "", password: "",
      role: "agent", isActive: true,
    },
  });

  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (editData) {
      editForm.reset({
        fullName: editData.fullName || "",
        email: editData.email || "",
        phone: editData.phone || "",
        username: editData.username || "",
        password: "",
        role: editData.role as "admin" | "supervisor" | "agent",
        isActive: editData.isActive ?? true,
      });
    }
  }, [editData, editForm]);

  // --- Mutations ---
  const createUserMutation = useMutation({
    mutationFn: (data: Partial<UserData> & { password: string }) =>
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewOpen(false);
      newUserForm.reset();
      toast({ title: "✅ Utilisateur créé", description: "Le compte a été créé avec succès."});
    },
    onError: (error: any) => {
      toast({ title: "❌ Échec de la création", description: error.message, variant: "destructive" });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<UserData> }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, data.data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Échec de la modification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditOpen(false);
      setEditData(null);
      toast({ title: "✅ Utilisateur mis à jour"});
    },
    onError: (error: any) => {
      toast({ title: "❌ Échec", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/password`, { newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Échec du changement de mot de passe");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✅ Mot de passe modifié"});
      setIsPasswordOpen(false);
      setPasswordTarget(null);
      setNewPassword("");
      setShowNewPassword(false);
    },
    onError: (error: any) => {
      toast({ title: "❌ Échec", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("PATCH", `/api/users/${userId}/toggle-status`, {}),
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const prev = queryClient.getQueryData<UserData[]>(["/api/users"]);
      queryClient.setQueryData<UserData[]>(["/api/users"], (old = []) =>
        old.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/users"], ctx.prev);
      toast({ title: "❌ Échec", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  // --- Helpers ---
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrateur',
          icon: <Crown className="h-4 w-4" />,
          gradient: 'from-amber-500 to-orange-500',
          bg: 'bg-amber-100',
          text: 'text-amber-700',
        };
      case 'supervisor':
        return {
          label: 'Superviseur',
          icon: <Settings className="h-4 w-4" />,
          gradient: 'from-purple-500 to-indigo-500',
          bg: 'bg-purple-100',
          text: 'text-purple-700',
        };
      case 'agent':
        return {
          label: 'Agent',
          icon: <Headphones className="h-4 w-4" />,
          gradient: 'from-[#0B676E] to-teal-500',
          bg: 'bg-teal-100',
          text: 'text-teal-700',
        };
      default:
        return { label: role, icon: <Users className="h-4 w-4" />, gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-700' };
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d || isNaN(new Date(d).getTime())) return 'Non défini';
    return format(new Date(d), "dd MMM yyyy", { locale: fr });
  };

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ============ EN-TÊTE ============ */}
      <div className={NEO.card}>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Gestion des utilisateurs</h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Admins, superviseurs et agents de la plateforme
              </p>
            </div>
            <Button
              onClick={() => setIsNewOpen(true)}
              className={cn(NEO.buttonPrimary, "gap-2 shadow-lg")}
            >
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>
      </div>

      {/* ============ STATS ============ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Users className="h-5 w-5 text-[#0B676E]" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Admins</p>
                <p className="text-2xl font-bold text-amber-600">{stats.admins}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100/40 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Superviseurs</p>
                <p className="text-2xl font-bold text-purple-600">{stats.supervisors}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100/40 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Agents</p>
                <p className="text-2xl font-bold text-teal-600">{stats.agents}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-100/40 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Headphones className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ TABS ============ */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 p-1 rounded-2xl")}>
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <Users className="h-4 w-4 mr-2 hidden sm:inline" /> Tous ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="admins" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <Crown className="h-4 w-4 mr-2 hidden sm:inline" /> Admins ({stats.admins})
          </TabsTrigger>
          <TabsTrigger value="supervisors" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <Settings className="h-4 w-4 mr-2 hidden sm:inline" /> Superviseurs ({stats.supervisors})
          </TabsTrigger>
          <TabsTrigger value="agents" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <Headphones className="h-4 w-4 mr-2 hidden sm:inline" /> Agents ({stats.agents})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <UserCheck className="h-4 w-4 mr-2 hidden sm:inline" /> Actifs ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="suspended" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <XSquare className="h-4 w-4 mr-2 hidden sm:inline" /> Suspendus ({stats.suspended})
          </TabsTrigger>
        </TabsList>

        {["all", "admins", "supervisors", "agents", "active", "suspended"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className={NEO.card}>
              {/* Filtre recherche */}
              <div className="p-3 sm:p-4 border-b border-white/40">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par nom, email, username, téléphone..."
                    className={cn(NEO.input, "pl-10 h-10")}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
              </div>

              {/* Liste */}
              <div className="p-3 sm:p-4 space-y-4">
                {currentUsers.length > 0 ? currentUsers.map(user => {
                  const cfg = getRoleConfig(user.role);
                  return (
                    <div key={user.id} className={cn(NEO.card, "hover:-translate-y-0.5 transition-all duration-300")}>
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Header card */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold text-lg",
                              cfg.gradient,
                              "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)]"
                            )}>
                              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-xl text-slate-900">{user.fullName}</h4>
                                <Badge className={cn("gap-1 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]", cfg.bg, cfg.text)}>
                                  {cfg.icon} {cfg.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn(
                            "px-3 py-1.5 text-sm font-semibold border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                            user.isActive
                              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                              : "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                          )}>
                            {user.isActive ? '✓ Actif' : '⏸ Suspendu'}
                          </Badge>
                        </div>

                        {/* Infos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-t border-white/40 pt-4">
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Shield className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Username</p>
                              <p className="text-slate-800 font-medium">{user.username}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Calendar className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Inscrit le</p>
                              <p className="text-slate-800">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <UserCheck className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Dernière activité</p>
                              <p className="text-slate-800">
                                {user.updatedAt
                                  ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true, locale: fr })
                                  : 'Jamais'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/40 pt-4">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}
                            className={cn(NEO.button, "text-[#0B676E] hover:text-[#0B676E]")}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Détails
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setEditData(user); setIsEditOpen(true); }}
                            className={cn(NEO.button, "text-purple-600 hover:text-purple-700")}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Modifier
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setPasswordTarget(user); setNewPassword(""); setShowNewPassword(false); setIsPasswordOpen(true); }}
                            className={cn(NEO.button, "text-amber-600 hover:text-amber-700")}
                          >
                            <Key className="h-4 w-4 mr-1" /> Mot de passe
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className={cn(
                              NEO.button,
                              user.isActive ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"
                            )}
                            onClick={() => toggleStatusMutation.mutate(user.id)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {toggleStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : user.isActive ? (
                              <XSquare className="h-4 w-4 mr-1" />
                            ) : (
                              <CheckSquare className="h-4 w-4 mr-1" />
                            )}
                            {user.isActive ? "Suspendre" : "Activer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-slate-500 bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-700 mb-2">Aucun utilisateur trouvé</p>
                    <p className="text-slate-500">Ajustez vos critères ou créez un nouvel utilisateur.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/40 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-sm text-slate-500">
                    Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-sm text-slate-700">Afficher:</Label>
                    <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className={cn(NEO.input, "w-[80px] h-9")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#eef2f5] rounded-2xl border-0">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className={NEO.button}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 w-8 p-0", currentPage === pageNum ? NEO.buttonPrimary : NEO.button)}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className={NEO.button}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* ============ DIALOG NOUVEAU ============ */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="pb-4 border-b border-white/40">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-[#0B676E]" />
              Créer un nouvel utilisateur
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Créez un compte admin, superviseur ou agent
            </DialogDescription>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit((data) => createUserMutation.mutate(data as any))} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={newUserForm.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Nom complet *</FormLabel>
                    <FormControl><Input placeholder="Jean Rakoto" className={NEO.input} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newUserForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="jean@svpressing.mg" className={NEO.input} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newUserForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Téléphone *</FormLabel>
                    <FormControl><Input placeholder="+261 34 00 000 00" className={NEO.input} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newUserForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Nom d'utilisateur *</FormLabel>
                    <FormControl><Input placeholder="jean.rakoto" className={NEO.input} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newUserForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Mot de passe *</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className={NEO.input} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newUserForm.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Rôle *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={NEO.input}>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#eef2f5] rounded-2xl border-0">
                        <SelectItem value="admin">👑 Administrateur</SelectItem>
                        <SelectItem value="supervisor">⚙️ Superviseur</SelectItem>
                        <SelectItem value="agent">🎧 Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="pt-4 border-t border-white/40">
                <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)} className={NEO.button}>Annuler</Button>
                <Button type="submit" disabled={createUserMutation.isPending} className={NEO.buttonPrimary}>
                  {createUserMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>) : (<><UserPlus className="h-4 w-4 mr-2" />Créer le compte</>)}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG MODIFIER ============ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="pb-4 border-b border-white/40">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="h-6 w-6 text-purple-600" />
              Modifier #{editData?.id}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Modifiez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          {editData && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => {
                const apiData: any = {
                  fullName: data.fullName,
                  email: data.email,
                  phone: data.phone,
                  username: data.username,
                  role: data.role,
                  isActive: data.isActive,
                };
                if (data.password && data.password.trim()) apiData.password = data.password;
                editUserMutation.mutate({ id: editData.id, data: apiData });
              })} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Nom complet *</FormLabel>
                      <FormControl><Input className={NEO.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Email *</FormLabel>
                      <FormControl><Input type="email" className={NEO.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Téléphone *</FormLabel>
                      <FormControl><Input className={NEO.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Username *</FormLabel>
                      <FormControl><Input className={NEO.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Nouveau mot de passe (vide = inchangé)</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" className={NEO.input} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Rôle *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={NEO.input}><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#eef2f5] rounded-2xl border-0">
                          <SelectItem value="admin">👑 Administrateur</SelectItem>
                          <SelectItem value="supervisor">⚙️ Superviseur</SelectItem>
                          <SelectItem value="agent">🎧 Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={editForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-white/40 p-4 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-[#0B676E]" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-slate-700">Compte actif</FormLabel>
                      <p className="text-sm text-slate-500">L'utilisateur peut se connecter à la plateforme</p>
                    </div>
                  </FormItem>
                )} />
                <DialogFooter className="pt-4 border-t border-white/40">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className={NEO.button}>Annuler</Button>
                  <Button type="submit" disabled={editUserMutation.isPending} className={NEO.buttonPrimary}>
                    {editUserMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sauvegarde...</>) : (<><Check className="h-4 w-4 mr-2" />Enregistrer</>)}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG DÉTAILS ============ */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          {selectedUser && (() => {
            const cfg = getRoleConfig(selectedUser.role);
            return (
              <>
                <DialogHeader className="pb-4 border-b border-white/40">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-14 w-14 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold text-xl",
                      cfg.gradient,
                      "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)]"
                    )}>
                      {selectedUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-slate-900">{selectedUser.fullName}</DialogTitle>
                      <DialogDescription className="text-slate-500 mt-1 flex items-center gap-2">
                        <Badge className={cn("gap-1 border-0", cfg.bg, cfg.text)}>{cfg.icon} {cfg.label}</Badge>
                        <Badge className={selectedUser.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-rose-100 text-rose-700 border-0"}>
                          {selectedUser.isActive ? '✓ Actif' : '⏸ Suspendu'}
                        </Badge>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-slate-900 font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">Téléphone</p>
                      <p className="text-slate-900 font-medium">{selectedUser.phone}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">Username</p>
                      <p className="text-slate-900 font-medium">{selectedUser.username}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">ID</p>
                      <p className="text-slate-900 font-medium">#{selectedUser.id}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">Créé le</p>
                      <p className="text-slate-900 font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-slate-500">Mis à jour</p>
                      <p className="text-slate-900 font-medium">{formatDate(selectedUser.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className={NEO.button}>Fermer</Button>
                  <Button onClick={() => { setIsDetailsOpen(false); setEditData(selectedUser); setIsEditOpen(true); }} className={NEO.buttonPrimary}>
                    <Edit className="h-4 w-4 mr-2" /> Modifier
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG MOT DE PASSE ============ */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[450px] p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="pb-4 border-b border-white/40">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              Changer le mot de passe
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Pour : <span className="font-semibold text-slate-700">{passwordTarget?.fullName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700">Nouveau mot de passe *</Label>
              <div className="relative mt-2">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  className={cn(NEO.input, "pr-11")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)} className={NEO.button}>Annuler</Button>
            <Button
              onClick={() => passwordTarget && changePasswordMutation.mutate({ userId: passwordTarget.id, newPassword })}
              disabled={!newPassword || newPassword.length < 6 || changePasswordMutation.isPending}
              className={NEO.buttonPrimary}
            >
              {changePasswordMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Modification...</>) : (<><Key className="h-4 w-4 mr-2" />Modifier</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}