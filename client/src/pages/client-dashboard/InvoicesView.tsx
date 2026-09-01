import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, RefreshCw, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// --- Interfaces ---
interface Invoice {
  id: number;
  invoiceNumber?: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'; // Le champ correct à utiliser
  isPaid: boolean; // Gardé pour la compatibilité, mais non utilisé pour l'affichage du statut
  createdAt: Date;
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
}

interface InvoicesViewProps {
    invoices: Invoice[];
}

// --- Interface ajoutée uniquement pour corriger les erreurs TypeScript ---
interface InvoiceDetailsDialogProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: () => void;
}

const formatDate = (date: any, formatStr = "dd MMMM yyyy") => {
    try { return format(new Date(date), formatStr, { locale: fr }); } catch { return "Date invalide"; }
};

// --- Composant pour les détails d'une facture ---
const InvoiceDetailsDialog = ({
    invoice,
    open,
    onOpenChange
}: InvoiceDetailsDialogProps) => {
    if (!invoice) return null;
    const statusStr = (invoice.status || '').toString().toLowerCase();
    const isPaid = statusStr === 'paid' || invoice.isPaid;
    const isOverdue = statusStr === 'overdue' || (!isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date());
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Détails de la Facture #{invoice.invoiceNumber || invoice.id}</DialogTitle>
                    <DialogDescription>
                        Émise le {formatDate(invoice.createdAt)}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-slate-500">Montant Total</p>
                            <p className="text-2xl font-bold">{parseFloat(invoice.amount).toLocaleString('fr-FR')} Ar</p>
                        </div>
                        <Badge
                          className={isPaid || isOverdue ? 'border-transparent' : 'bg-slate-200 text-slate-800'}
                          style={
                            isPaid
                              ? { backgroundColor: 'var(--accent)', color: 'white' }
                              : isOverdue
                              ? { backgroundColor: 'var(--secondary)', color: 'white' }
                              : undefined
                          }
                        >
                            { isPaid ? "Payée" : isOverdue ? "En retard" : "En attente" }
                        </Badge>
                    </div>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Date d'échéance:</span><span className="font-medium">{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</span></div>
                        {invoice.status === 'paid' && (
                            <>
                                <div className="flex justify-between"><span className="text-slate-500">Date de paiement:</span><span className="font-medium">{invoice.paidDate ? formatDate(invoice.paidDate) : 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Méthode:</span><span className="font-medium capitalize">{invoice.paymentMethod || 'N/A'}</span></div>
                            </>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onOpenChange}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Composant Principal de la Vue "Factures" ---
export function InvoicesView({ invoices }: InvoicesViewProps) {
    const { toast } = useToast();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const downloadInvoiceMutation = useMutation({
        mutationFn: async (invoiceId: number) => {
            const res = await apiRequest("GET", `/api/invoices/${invoiceId}/download-pdf`);
            if (!res.ok) throw new Error("Le téléchargement a échoué.");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `facture-${invoiceId}.pdf`;
            document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
        },
        onSuccess: () => toast({ title: "Téléchargement lancé" }),
        onError: (error: Error) => toast({ title: "Erreur de téléchargement", description: error.message, variant: "destructive" }),
    });

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
            <div className="max-w-none mx-auto px-6 sm:px-8 lg:px-12 py-8">
            <Card className="bg-transparent shadow-none border-none">
                <CardHeader className="flex flex-col gap-1">
                    <CardTitle className="text-2xl font-bold flex items-center"><FileText className="mr-3 h-6 w-6 text-cyan-600"/>Mes Factures</CardTitle>
                    <CardDescription>Consultez l'historique de vos paiements et téléchargez vos factures.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-slate-100">
                        {invoices && invoices.length > 0 ? invoices.map(invoice => {
                          const statusStr = (invoice.status || '').toString().toLowerCase();
                          const isPaid = statusStr === 'paid' || invoice.isPaid;
                          const isOverdue = statusStr === 'overdue' || (!isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date());
                          return (
                            <div key={invoice.id} className="py-4 gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800">Facture #{invoice.invoiceNumber || invoice.id}</p>
                                    <p className="text-sm text-slate-500">Émise le {formatDate(invoice.createdAt)}</p>
                                </div>
                                <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 flex-wrap">
                                    <p className="font-bold text-lg text-slate-900 order-1 sm:order-none">{parseFloat(invoice.amount).toLocaleString('fr-FR')} Ar</p>

                                    <Badge
                                      className={isPaid || isOverdue ? 'border-transparent' : 'bg-slate-200 text-slate-800'}
                                      style={
                                        isPaid
                                          ? { backgroundColor: 'var(--accent)', color: 'white' }
                                          : isOverdue
                                          ? { backgroundColor: 'var(--secondary)', color: 'white' }
                                          : undefined
                                      }
                                    >
                                        { isPaid ? "Payée" : isOverdue ? "En retard" : "En attente" }
                                    </Badge>

                                    <Button onClick={() => setSelectedInvoice(invoice)} variant="ghost" size="sm" className="text-slate-600 px-3">
                                        <Eye className="h-4 w-4 mr-1 sm:mr-2"/>Détails
                                    </Button>
                                </div>
                            </div>
                        )}) : (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300"/>
                                <p>Aucune facture pour le moment.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <InvoiceDetailsDialog invoice={selectedInvoice} open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)} />
            </div>
        </div>
    );
}