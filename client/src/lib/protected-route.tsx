// lib/protected-route.tsx
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";

export function ProtectedRoute(props: RouteProps) {
  const { user, isLoading } = useAuth();
  const { path } = props;

  console.log("🔐 [ProtectedRoute] Path:", path);
  console.log("🔐 [ProtectedRoute] User:", user);
  console.log("🔐 [ProtectedRoute] isLoading:", isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    console.log("🚫 Pas d'utilisateur → /auth");
    return <Redirect to="/auth" />;
  }

  // RÈGLES DE REDIRECTION SIMPLIFIÉES
  console.log("✅ Utilisateur connecté avec rôle:", user.role);

  // Route admin
  if (path === "/admin" && user.role !== "admin") {
    console.log("🚫 Accès admin refusé");
    return <Redirect to="/" />;
  }

  // Route superviseur - ACCÈS AUTORISÉ POUR ADMIN AUSSI (pour tests)
  if (path === "/supervisor" && !["admin", "supervisor"].includes(user.role)) {
    console.log("🚫 Accès superviseur refusé");
    return <Redirect to="/" />;
  }

  // Route agent
  if (path === "/agent" && !["admin", "supervisor", "agent"].includes(user.role)) {
    console.log("🚫 Accès agent refusé");
    return <Redirect to="/" />;
  }

  // Route delivery
  if (path === "/delivery" && !["admin", "delivery"].includes(user.role)) {
    console.log("🚫 Accès delivery refusé");
    return <Redirect to="/" />;
  }

  // Route dashboard - UNIQUEMENT POUR LES CLIENTS
  if (path === "/dashboard" && user.role !== "client") {
    console.log("🚫 Accès dashboard refusé pour rôle:", user.role);
    // Rediriger vers la page appropriée selon le rôle
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "supervisor") return <Redirect to="/supervisor" />;
    if (user.role === "agent") return <Redirect to="/agent" />;
    if (user.role === "delivery") return <Redirect to="/delivery" />;
    return <Redirect to="/" />;
  }

  console.log("✅ Accès autorisé à:", path);
  return <Route {...props} />;
}