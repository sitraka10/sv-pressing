import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Components & UI
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Loader2, User, Shield, Eye, EyeOff } from "lucide-react";

// Hooks & Utils
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// --- Schéma de validation pour le profil ---
const profileSettingsSchema = z.object({
    fullName: z.string().min(2, "Le nom complet est requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(10, "Numéro de téléphone invalide"),
    address: z.string().min(5, "Adresse invalide"),
});

// --- Schéma de validation pour le changement de mot de passe ---
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z.string().min(6, "Le nouveau mot de passe doit faire au moins 6 caractères."),
    confirmPassword: z.string().min(6, "La confirmation doit faire au moins 6 caractères."),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "La confirmation ne correspond pas au nouveau mot de passe.",
    path: ["confirmPassword"]
});


export function ProfileView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // États pour les fenêtres de dialogue
    const [isProfileSettingsOpen, setProfileSettingsOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Indicateur simple de robustesse
    const passwordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 2) return { label: 'Faible', color: 'bg-red-400' };
        if (score === 3) return { label: 'Moyen', color: 'bg-amber-400' };
        return { label: 'Fort', color: 'bg-emerald-500' };
    };

    // --- Logique pour la modification du profil ---
    const profileSettingsForm = useForm<z.infer<typeof profileSettingsSchema>>({
        resolver: zodResolver(profileSettingsSchema)
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: z.infer<typeof profileSettingsSchema>) => apiRequest("PATCH", "/api/user/profile", data),
        onSuccess: () => {
            toast({ title: "Profil Mis à Jour", description: "Vos informations ont été sauvegardées." });
            setProfileSettingsOpen(false);
            queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        },
        onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
    });

    // --- Logique pour le changement de mot de passe ---
    const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: z.infer<typeof changePasswordSchema>) =>
            apiRequest("PATCH", `/api/users/${user!.id}/password`, data),
        onSuccess: () => {
            toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
            setIsChangePasswordOpen(false);
            changePasswordForm.reset(); // Vider le formulaire après succès
        },
        onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
    });

    // Pré-remplir le formulaire de profil quand les données de l'utilisateur sont disponibles
    useEffect(() => {
        if (user) {
            profileSettingsForm.reset({
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
            });
        }
    }, [user, isProfileSettingsOpen, profileSettingsForm]);

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mon profil</h1>
                            <p className="mt-1 text-sm text-slate-600">Gérez vos informations personnelles et la sécurité de votre compte.</p>
                        </div>
                        <Button onClick={() => setProfileSettingsOpen(true)} className="self-start sm:self-auto bg-[var(--accent)] text-white">
                            <Settings className="mr-2 h-4 w-4" /> Modifier mes informations
                        </Button>
                    </div>

                    <Card className="bg-white/90 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60">
                            <CardTitle className="text-xl font-semibold flex items-center text-[var(--secondary)]">
                                <User className="mr-3 h-6 w-6 text-[var(--secondary)]" />
                                Détails du profil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <dl className="divide-y divide-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4">
                                    <dt className="text-sm font-medium text-slate-600">Nom complet</dt>
                                    <dd className="text-sm text-slate-900 sm:col-span-2 break-words [overflow-wrap:anywhere]">{user?.fullName || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4">
                                    <dt className="text-sm font-medium text-slate-600">Email</dt>
                                    <dd className="text-sm text-slate-900 sm:col-span-2 break-words [overflow-wrap:anywhere]">{user?.email || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4">
                                    <dt className="text-sm font-medium text-slate-600">Téléphone</dt>
                                    <dd className="text-sm text-slate-900 sm:col-span-2 break-words [overflow-wrap:anywhere]">{user?.phone || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4">
                                    <dt className="text-sm font-medium text-slate-600">Adresse</dt>
                                    <dd className="text-sm text-slate-900 sm:col-span-2 break-words [overflow-wrap:anywhere]">{user?.address || '—'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                        <CardFooter className="border-t border-slate-200/60 pt-6 justify-end">
                            <Button onClick={() => setIsChangePasswordOpen(true)} variant="destructive" className='bg-[var(--secondary)]'>
                                <Shield className="mr-2 h-4 w-4" /> Changer le mot de passe
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* --- Fenêtre de Dialogue pour Modifier le Profil --- */}
                    <Dialog open={isProfileSettingsOpen} onOpenChange={setProfileSettingsOpen}>
                        <DialogContent
                            className="sm:max-w-[520px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
                        >
                            <DialogHeader>
                                <DialogTitle>Modifier mon profil</DialogTitle>
                                <DialogDescription>Mettez à jour vos informations personnelles.</DialogDescription>
                            </DialogHeader>
                            <Form {...profileSettingsForm}>
                                <form onSubmit={profileSettingsForm.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-4 pt-4">
                                    <FormField control={profileSettingsForm.control} name="fullName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom complet</FormLabel>
                                            <FormControl><Input placeholder="Ex. Jean Dupont" autoComplete="name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileSettingsForm.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" placeholder="nom@exemple.com" autoComplete="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileSettingsForm.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Téléphone</FormLabel>
                                            <FormControl><Input placeholder="06 12 34 56 78" autoComplete="tel" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileSettingsForm.control} name="address" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adresse</FormLabel>
                                            <FormControl><Textarea placeholder="Rue, Ville, Code postal" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" variant="default" className="w-full !bg-[var(--accent)] !text-white hover:!bg-[var(--accent)] focus-visible:ring-[var(--ring)]" disabled={updateProfileMutation.isPending} aria-label="Sauvegarder les informations du profil">
                                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin " />}
                                        Sauvegarder
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {/* --- Fenêtre de Dialogue pour Changer le Mot de Passe --- */}
                    <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                        <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                                <DialogTitle>Sécurité du compte — Modification du mot de passe</DialogTitle>
                                <DialogDescription>Pour votre sécurité, veuillez fournir votre mot de passe actuel.</DialogDescription>
                            </DialogHeader>
                            <Form {...changePasswordForm}>
                                <form onSubmit={changePasswordForm.handleSubmit(data => changePasswordMutation.mutate(data))} className="space-y-4 pt-4">
                                    <FormField
                                        control={changePasswordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mot de passe actuel</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showCurrent ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" {...field} />
                                                        <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" aria-label="Afficher/masquer le mot de passe actuel">
                                                            {showCurrent ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={changePasswordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nouveau mot de passe</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showNew ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" {...field} />
                                                        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" aria-label="Afficher/masquer le nouveau mot de passe">
                                                            {showNew ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={changePasswordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" {...field} />
                                                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" aria-label="Afficher/masquer la confirmation">
                                                            {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                <div className="mt-2 flex items-center gap-2">
                                                    {(() => { const s = passwordStrength(changePasswordForm.watch('newPassword') || ''); return (
                                                        <>
                                                            <div className="h-1.5 w-24 bg-slate-200 rounded">
                                                                <div className={`h-1.5 rounded ${s.color}`} style={{ width: changePasswordForm.watch('newPassword')?.length ? '100%' : '0%' }} />
                                                            </div>
                                                            <span className="text-xs text-slate-600">Robustesse: {s.label}</span>
                                                        </>
                                                    ); })()}
                                                </div>
                                                <ul className="mt-1 text-xs text-slate-500 list-disc pl-5 space-y-0.5">
                                                    <li>Minimum 6 caractères (8+ recommandé)</li>
                                                    <li>Combiner majuscules, minuscules et chiffres</li>
                                                    <li>Éviter la réutilisation d’un mot de passe</li>
                                                </ul>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" variant="default" className="w-full !bg-[var(--accent)] !text-white hover:!bg-[var(--accent)] focus-visible:ring-[var(--ring)]" disabled={changePasswordMutation.isPending} aria-label="Confirmer le changement de mot de passe">
                                        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmer le changement
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}