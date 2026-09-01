// src/QuotesTab.tsx
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function QuotesTab() {
    const { toast } = useToast();

    const { data: customQuotes = [] } = useQuery<any[]>({
        queryKey: ["/api/custom-quotes"],
    });

    const updateQuoteStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/custom-quotes/${id}/status`, { status });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Échec de la mise à jour du devis #${id}`);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Devis & Inscriptions</h2>
            {customQuotes.length === 0 ? (
                <p>Aucun devis trouvé.</p>
            ) : (
                <ul className="space-y-2">
                    {customQuotes.map((quote) => (
                        <li key={quote.id} className="border p-3 rounded flex justify-between items-center">
                            <div>
                                <p className="font-medium">{quote.title || "Devis sans titre"}</p>
                                <Badge>{quote.status}</Badge>
                            </div>
                            <Button
                                size="sm"
                                onClick={() =>
                                    updateQuoteStatusMutation.mutate({ id: quote.id, status: "approved" })
                                }
                            >
                                Approuver
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
