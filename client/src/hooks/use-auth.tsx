// client/src/hooks/use-auth.tsx
import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: 'admin' | 'supervisor' | 'agent' | 'delivery' | 'client';
  isActive: boolean;
  createdAt: Date;
  preferredPickupDay?: string;
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string;
}

interface InsertUser {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: "admin" | "client" | "agent" | "delivery";
  isActive: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
      data: user,
      error,
      isLoading,
  } = useQuery<User | undefined, Error>({
      queryKey: ['auth', 'user'],
      queryFn: async () => {
          const res = await fetch("/api/user", { credentials: "include" });
          if (res.status === 401) return null;
          if (!res.ok) throw new Error("Erreur réseau lors de la vérification de l'utilisateur");
          return res.json();
      },
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("📤 [useAuth] Tentative de login pour:", credentials.username);
      // ✅ CORRECTION : fetch direct pour éviter l'interception de apiRequest
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      console.log("📥 [useAuth] Statut réponse:", res.status, res.statusText);
      
      // ✅ CORRECTION : Lire le body UNE SEULE FOIS
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      console.log("📥 [useAuth] Données utilisateur:", data);
      return data;
    },
    onSuccess: (userData) => {
      console.log("✅ [useAuth] Login réussi, utilisateur:", userData);
      queryClient.setQueryData(['auth', 'user'], userData);
      
      if (userData.role === "admin") {
        window.location.href = "/admin";
      } else if (userData.role === "supervisor") {
        window.location.href = "/supervisor";
      } else if (userData.role === "agent") {
        window.location.href = "/agent";
      } else {
        window.location.href = "/dashboard";
      }
    },
    onError: (error) => {
      console.error("❌ [useAuth] Erreur login:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['auth', 'user'], user);
      toast({
        title: "Inscription réussie",
        description: `Bienvenue ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Ce nom d'utilisateur existe déjà",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return {
    ...context,
    logout: () => context.logoutMutation.mutate(),
  };
}