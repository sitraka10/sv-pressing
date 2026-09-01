import React, { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdsTab() {
    const { toast } = useToast();
    const [form, setForm] = useState({ content: "", imageUrl: "", isActive: false });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { data: ads = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/ads"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/ads");
            if (!res.ok) throw new Error("Failed to fetch ads");
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await apiRequest("POST", "/api/ads", payload);
            if (!res.ok) throw new Error("Failed to create ad");
            return res.json();
        },
        onSuccess: () => {
            setForm({ content: "", imageUrl: "", isActive: false });
            queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
            toast({ title: "Annonce créée" });
        },
        onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            const res = await apiRequest("PATCH", `/api/ads/${id}`, updates);
            if (!res.ok) throw new Error("Failed to update ad");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
            toast({ title: "Annonce mise à jour" });
        },
        onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/ads/${id}`);
            if (!res.ok) throw new Error("Failed to delete ad");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
            toast({ title: "Annonce supprimée" });
        },
        onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });

    const activateMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("POST", `/api/ads/${id}/activate`);
            if (!res.ok) throw new Error("Failed to activate ad");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
            toast({ title: "Annonce activée (unique)" });
        },
        onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Créer une annonce</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Textarea
                        placeholder="Contenu (texte)"
                        value={form.content}
                        onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                    />
                    <div className="grid gap-2">
                        <Input
                            placeholder="URL de l'image"
                            value={form.imageUrl}
                            onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        const dataUrl = reader.result as string;
                                        setForm((s) => ({ ...s, imageUrl: dataUrl }));
                                        toast({ title: "Image importée", description: "Le champ URL a été rempli automatiquement." });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Importer une image
                            </Button>
                            {form.imageUrl && (
                                <span className="text-xs text-muted-foreground truncate">Prévisualisation prête</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Annonces</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Contenu</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ads.map((ad: any) => (
                                <TableRow key={ad.id}>
                                    <TableCell>{ad.id}</TableCell>
                                    <TableCell>
                                        <img src={ad.imageUrl} alt="ad" className="h-12 w-12 object-cover rounded" />
                                    </TableCell>
                                    <TableCell className="max-w-[400px] truncate">{ad.content}</TableCell>
                                    <TableCell>
                                        {ad.isActive ? (
                                            <Badge className="bg-emerald-500">Active</Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        {!ad.isActive && (
                                            <Button variant="outline" size="sm" onClick={() => activateMutation.mutate(ad.id)}>Activer</Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: ad.id, updates: { content: ad.content } })}>Mettre à jour</Button>
                                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(ad.id)}>Supprimer</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
