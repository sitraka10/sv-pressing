import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Shirt, Facebook, Linkedin, Instagram, Droplet, Truck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SiX } from "react-icons/si";

const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

const AuthPage = () => {
  const { user, loginMutation } = useAuth();
  // Variants for bottom-left info block (icon + text), will change with arrows
  const infoVariants = [
    { icon: Shirt, title: "SV Pressing", subtitle: "Pressing & Blanchisserie — Ramassage et livraison" },
    { icon: Droplet, title: "Lavage soigné", subtitle: "Traitement délicat de vos textiles" },
    { icon: Truck, title: "Livraison rapide", subtitle: "À domicile, selon vos horaires" },
  ] as const;
  const [infoIndex, setInfoIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  // Preserve original redirect logic
  if (user) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/dashboard" />;
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Global background image (from /public/assets/img). Falls back softly if missing. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/img/background_white.jpg')", opacity: 0.90 }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-16">
        {/* Single container holding both sides */}
        <div className="rounded-[36px] bg-[var(--accent)] ring-1 ring-black/5 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left visual (inside same container) */}
            <div className="relative hidden md:block">
              {/* Slanted wrapper with subtle border padding */}
              <div
                className="p-2 h-full rounded-[28px]"
                style={{
                  clipPath: "path('M0 0 H100% L94% 100% A 28 28 0 0 1 88% 100% H0 Z')"
                }}
              >
                <div
                  className="relative h-full min-h-[560px] rounded-[28px] overflow-hidden"
                  style={{ backgroundImage: "url('/assets/img/cuvette.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
                  {/* Top bar */}
                  <div className="relative z-10 flex items-center justify-between px-6 py-5">
                    <div className="text-white/90 font-semibold">Plans sélectionnés</div>
                    <div className="flex items-center gap-3">
                      <a href="/#plans"><button className="text-white/90 hover:text-white text-sm px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">Nos plans</button></a>
                      <a href="/#plans"><button className="text-white/90 hover:text-white text-sm px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">Rejoignez-nous</button></a>
                    </div>
                  </div>
                  {/* Bottom content */}
                  <div className="relative z-10 absolute inset-x-0 bottom-0 p-6 flex items-end justify-between sm:mt-20 md:mt-20 lg:mt-20">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={infoIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex items-center gap-3 mt-4 sm:mt-80 md:mt-80 lg:mt-80"
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/40 bg-white/10 grid place-items-center">
                          {(() => { const Icon = infoVariants[infoIndex].icon; return <Icon className="h-6 w-6 text-white" />; })()}
                        </div>
                        <div className="text-white">
                          <div className="font-semibold">{infoVariants[infoIndex].title}</div>
                          <div className="text-xs text-white/80">{infoVariants[infoIndex].subtitle}</div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInfoIndex((prev) => (prev - 1 + infoVariants.length) % infoVariants.length)}
                        className="h-9 w-9 grid place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-[2px] active:scale-95 transition"
                        aria-label="Précédent"
                      >◀</button>
                      <button
                        onClick={() => setInfoIndex((prev) => (prev + 1) % infoVariants.length)}
                        className="h-9 w-9 grid place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-[2px] active:scale-95 transition"
                        aria-label="Suivant"
                      >▶</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right form (inside same container) */}
            <div className="relative text-[var(--accent)] p-4 sm:p-6 lg:p-8 rounded-br-[36px] overflow-hidden bg-white">
              {/* Return to Home */}
              <div className="absolute left-4 top-4">
                <a
                  href="/"
                  aria-label="Retour à l’accueil"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:text-white shadow-sm ring-1 ring-slate-200 hover:bg-white transition transform hover:-translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <ArrowLeft className="h-5 w-5" />
                </a>
              </div>

              {/* Frosted card container */}
              {/* Heading */}
              <div className="text-center -space-y-5 mt-1">
                <img src="/assets/img/Pressing_Orange.png" alt="SV Pressing" className="mx-auto block object-contain w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px]" />
                <p className="text-slate-500 text-sm">Se connecter</p>
              </div>

              {/* Form */}
              <div className="mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="mx-auto w-full max-w-xs">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Nom d'utilisateur</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nom d'utilisateur"
                                autoComplete="username"
                                className="h-12 rounded-xl border border-slate-400 focus-visible:ring-slate-400"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="sr-only">Mot de passe</FormLabel>
                              {/* <a href="#" className="text-sm text-rose-500 hover:text-rose-600">Mot de passe oublié ?</a> */}
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Mot de passe"
                                  autoComplete="current-password"
                                  className="h-12 rounded-xl border border-slate-400 focus-visible:ring-slate-400 pr-12"
                                  {...field}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                                  aria-label={
                                    showPassword
                                      ? "Masquer le mot de passe"
                                      : "Afficher le mot de passe"
                                  }
                                  title={
                                    showPassword
                                      ? "Masquer le mot de passe"
                                      : "Afficher le mot de passe"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Divider */}
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-3 text-sm text-slate-500">ou</span>
                        </div>
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-[var(--accent)] text-white shadow-sm hover:shadow-md transition-colors transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-95 active:brightness-90"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

              <div className="mt-6 text-center text-sm text-slate-600">
                Vous n'avez pas de compte ? <a href="/#plans" className="text-cyan-500 hover:text-cyan-600">Découvrir Nos Plans</a>
              </div>

              <div className="mt-8 flex items-center justify-center gap-5 text-slate-700">
                <a href="https://www.facebook.com/svpressing" aria-label="Facebook" className="hover:text-slate-900"><Facebook className="h-5 w-5" /></a>
                <a href="#" aria-label="X" className="hover:text-slate-900"><SiX className="h-5 w-5" /></a>
                <a href="#" aria-label="LinkedIn" className="hover:text-slate-900"><Linkedin className="h-5 w-5" /></a>
                <a href="#" aria-label="Instagram" className="hover:text-slate-900"><Instagram className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;