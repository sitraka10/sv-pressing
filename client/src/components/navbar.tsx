import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Shirt, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <header className="bg-[color:var(--sidebar-background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--sidebar-background)]/80 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shirt className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SV Pressing</h1>
              <p className="text-xs text-[color:var(--muted-foreground)]">Service Intelligent</p>
            </div>
          </div>

          {/* Navigation */}
          {!user && (
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#accueil"
                className="text-[color:var(--muted-foreground)] hover:text-foreground font-medium transition-colors"
              >
                Accueil
              </a>
              <a
                href="#abonnements"
                className="text-[color:var(--muted-foreground)] hover:text-foreground font-medium transition-colors"
              >
                Abonnements
              </a>
              <a
                href="#services"
                className="text-[color:var(--muted-foreground)] hover:text-foreground font-medium transition-colors"
              >
                Services
              </a>
              <a
                href="#contact"
                className="text-[color:var(--muted-foreground)] hover:text-foreground font-medium transition-colors"
              >
                Contact
              </a>
            </nav>
          )}

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  Bonjour, {user.fullName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (user.role === "client") {
                      setLocation("/dashboard");
                    } else {
                      setLocation("/admin");
                    }
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Mon espace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => setLocation("/auth")}>
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
