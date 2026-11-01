// client/src/pages/delivery-management.tsx
// 100% textuel, sans icônes. Logique métier 100 % conservée.
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Schemas de validation
const deliveryPersonSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  phone: z.string().min(10, "Numéro de téléphone valide requis"),
  email: z.string().email("Email valide requis"),
  address: z.string().min(5, "Adresse complète requise"),
  vehicleType: z.string().min(1, "Type de véhicule requis"),
  licensePlate: z.string().optional(),
  maxCapacity: z.number().min(1, "Capacité minimale de 1"),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }),
  isActive: z.boolean().default(true),
});

const deliveryScheduleSchema = z.object({
  deliveryPersonId: z.number(),
  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  maxOrders: z.number().min(1, "Au moins 1 commande"),
  notes: z.string().optional(),
});

const assignDeliverySchema = z.object({
  orderId: z.number(),
  deliveryPersonId: z.number(),
  scheduledDate: z.date(),
  estimatedTime: z.string(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  notes: z.string().optional(),
});

export default function DeliveryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États des dialogues
  const [isNewDeliveryPersonOpen, setIsNewDeliveryPersonOpen] = useState(false);
  const [isEditDeliveryPersonOpen, setIsEditDeliveryPersonOpen] = useState(false);
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [isAssignDeliveryOpen, setIsAssignDeliveryOpen] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Planning tab calendar states
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarPersonId, setSelectedCalendarPersonId] = useState<number | "all">("all");

  // Filtres
  const [statusFilter, setStatusFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");

  // Requêtes de données
  const { data: deliveryPersons = [], isLoading: personsLoading } = useQuery<any[]>({
    queryKey: ["/api/delivery-persons"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ["/api/delivery-schedules"],
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  // Formulaires
  const deliveryPersonForm = useForm<z.infer<typeof deliveryPersonSchema>>({
    resolver: zodResolver(deliveryPersonSchema),
    defaultValues: {
      isActive: true,
      maxCapacity: 10,
      workingHours: {
        start: "08:00",
        end: "18:00",
      },
    },
  });

  const scheduleForm = useForm<z.infer<typeof deliveryScheduleSchema>>({
    resolver: zodResolver(deliveryScheduleSchema),
    defaultValues: {
      date: new Date(),
      startTime: "08:00",
      endTime: "18:00",
      maxOrders: 10,
    },
  });

  const assignDeliveryForm = useForm<z.infer<typeof assignDeliverySchema>>({
    resolver: zodResolver(assignDeliverySchema),
    defaultValues: {
      scheduledDate: new Date(),
      priority: "normal",
    },
  });

  // Mutations
  const createDeliveryPersonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliveryPersonSchema>) => {
      const userData = {
        ...data,
        username: data.email,
        password: "defaultPassword123",
        role: "delivery",
      };
      const res = await apiRequest("POST", "/api/delivery-persons", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-persons"] });
      setIsNewDeliveryPersonOpen(false);
      deliveryPersonForm.reset();
      toast({ title: "Livreur ajouté", description: "Le nouveau livreur a été créé avec succès" });
    },
  });

  const updateDeliveryPersonMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<z.infer<typeof deliveryPersonSchema>> }) => {
      // ✅ Ampiasaina ny data.updates fa tsy data
      const res = await apiRequest("PATCH", `/api/delivery-persons/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-persons"] });
      setIsEditDeliveryPersonOpen(false);
      setSelectedDeliveryPerson(null);
      deliveryPersonForm.reset();
      toast({ title: "Livreur mis à jour", description: "Les informations du livreur ont été modifiées" });
    },
    onError: (e: any) => toast({ title: "❌ Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteDeliveryPersonMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/delivery-persons/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-persons"] });
      toast({ title: "Livreur supprimé", description: "Le livreur a été retiré du système" });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliveryScheduleSchema>) => {
      const res = await apiRequest("POST", "/api/delivery-schedules", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-schedules"] });
      setIsNewScheduleOpen(false);
      scheduleForm.reset();
      toast({ title: "Planning créé", description: "Le planning de livraison a été ajouté" });
    },
  });

  const assignDeliveryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignDeliverySchema>) => {
      const res = await apiRequest("POST", "/api/deliveries", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsAssignDeliveryOpen(false);
      assignDeliveryForm.reset();
      toast({ title: "Livraison assignée", description: "La commande a été assignée au livreur" });
    },
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/deliveries/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ title: "Statut mis à jour", description: "Le statut de la livraison a été modifié" });
    },
  });

  // Données calculées
  const activeDeliveryPersons = deliveryPersons.filter((person: any) => person.isActive);
  const pendingOrders = orders.filter((order: any) => ["ready_to_deliver", "to_deliver"].includes(order.status));
  
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    if (statusFilter !== "all" && delivery.status !== statusFilter) return false;
    if (personFilter !== "all" && delivery.deliveryPersonId !== parseInt(personFilter)) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
      pending: { label: "En attente", variant: "secondary" },
      assigned: { label: "Assignée", variant: "default" },
      in_progress: { label: "En cours", variant: "default" },
      completed: { label: "Terminée", variant: "default" },
      failed: { label: "Échouée", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
      low: { label: "Faible", variant: "outline" },
      normal: { label: "Normal", variant: "secondary" },
      high: { label: "Élevée", variant: "default" },
      urgent: { label: "Urgent", variant: "destructive" },
    };
    const config = priorityMap[priority] || { label: priority, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Auto-assignment algorithm
  const autoAssignDeliveries = async () => {
    for (const order of pendingOrders) {
      const availablePerson = activeDeliveryPersons.find((person: any) => {
        const personDeliveries = deliveries.filter(
          (d: any) => d.deliveryPersonId === person.id && d.status === "assigned" && new Date(d.scheduledDate).toDateString() === new Date().toDateString()
        );
        return personDeliveries.length < person.maxCapacity;
      });

      if (availablePerson) {
        await assignDeliveryMutation.mutateAsync({
          orderId: order.id,
          deliveryPersonId: availablePerson.id,
          scheduledDate: new Date(),
          estimatedTime: "30",
          priority: "normal",
          notes: "Assignation automatique",
        });
      }
    }
  };

  if (user?.role !== "admin") {
    return <div className="p-6">Accès non autorisé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Livraisons</h1>
            <p className="text-gray-600">Planning et affectation des livreurs</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={autoAssignDeliveries} variant="outline">Assignation automatique</Button>
            <Dialog open={isNewDeliveryPersonOpen} onOpenChange={setIsNewDeliveryPersonOpen}>
              <DialogTrigger asChild>
                <Button>Nouveau livreur</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau livreur</DialogTitle>
                  <DialogDescription>Créer un compte livreur avec ses informations complètes</DialogDescription>
                </DialogHeader>
                <Form {...deliveryPersonForm}>
                  <form onSubmit={deliveryPersonForm.handleSubmit((data) => createDeliveryPersonMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={deliveryPersonForm.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input placeholder="Jean Rakoto" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={deliveryPersonForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+261 34 12 345 67" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={deliveryPersonForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="jean@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={deliveryPersonForm.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Adresse</FormLabel><FormControl><Textarea placeholder="Adresse complète du livreur..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={deliveryPersonForm.control} name="vehicleType" render={({ field }) => (
                        <FormItem><FormLabel>Type de véhicule</FormLabel>
                          <Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Véhicule" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="moto">Moto</SelectItem><SelectItem value="voiture">Voiture</SelectItem><SelectItem value="camionnette">Camionnette</SelectItem><SelectItem value="velo">Vélo</SelectItem></SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={deliveryPersonForm.control} name="licensePlate" render={({ field }) => (
                        <FormItem><FormLabel>Plaque (optionnel)</FormLabel><FormControl><Input placeholder="1234 ABC" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={deliveryPersonForm.control} name="maxCapacity" render={({ field }) => (
                        <FormItem><FormLabel>Capacité max</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={deliveryPersonForm.control} name="workingHours.start" render={({ field }) => (
                        <FormItem><FormLabel>Heure début</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={deliveryPersonForm.control} name="workingHours.end" render={({ field }) => (
                        <FormItem><FormLabel>Heure fin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createDeliveryPersonMutation.isPending}>{createDeliveryPersonMutation.isPending ? "Création..." : "Créer le livreur"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Livreurs actifs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeDeliveryPersons.length}</div><p className="text-xs text-muted-foreground">{deliveryPersons.length - activeDeliveryPersons.length} inactifs</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Livraisons en cours</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{deliveries.filter((d: any) => d.status === "in_progress").length}</div><p className="text-xs text-muted-foreground">{deliveries.filter((d: any) => d.status === "assigned").length} assignées</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">En attente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pendingOrders.length}</div><p className="text-xs text-muted-foreground">Commandes à livrer</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taux de réussite</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">96%</div><p className="text-xs text-muted-foreground">Livraisons réussies</p></CardContent></Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="deliveries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deliveries">Livraisons</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="drivers">Livreurs</TabsTrigger>
            <TabsTrigger value="assignment">Assignation</TabsTrigger>
          </TabsList>

          {/* Onglet Livraisons */}
          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div><CardTitle>Suivi des livraisons</CardTitle><CardDescription>Statut en temps réel de toutes les livraisons</CardDescription></div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="assigned">Assignées</SelectItem><SelectItem value="in_progress">En cours</SelectItem><SelectItem value="completed">Terminées</SelectItem><SelectItem value="failed">Échouées</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={personFilter} onValueChange={setPersonFilter}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous livreurs</SelectItem>
                        {activeDeliveryPersons.map((person: any) => <SelectItem key={person.id} value={person.id.toString()}>{person.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDeliveries.map((delivery: any) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">Livraison #{delivery.id}</p>
                        <p className="text-sm text-gray-500">Commande #{delivery.orderId} • Livreur: {activeDeliveryPersons.find((p: any) => p.id === delivery.deliveryPersonId)?.fullName || "Non assigné"}</p>
                        <p className="text-xs text-gray-400">Prévue: {format(new Date(delivery.scheduledDate), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(delivery.status)}
                        <Select value={delivery.status} onValueChange={(status) => updateDeliveryStatusMutation.mutate({ id: delivery.id, status })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem><SelectItem value="assigned">Assignée</SelectItem><SelectItem value="in_progress">En cours</SelectItem><SelectItem value="completed">Terminée</SelectItem><SelectItem value="failed">Échouée</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">Voir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Livreurs */}
          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Gestion des livreurs</CardTitle><CardDescription>CRUD complet des livreurs et leurs informations</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryPersons.map((person: any) => (
                    <div key={person.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{person.fullName}</p>
                        <p className="text-sm text-gray-500">{person.phone} • {person.vehicleType}</p>
                        <p className="text-xs text-gray-400">Capacité: {person.maxCapacity} commandes • {person.workingHours?.start}-{person.workingHours?.end}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={person.isActive ? "default" : "secondary"}>{person.isActive ? "Actif" : "Inactif"}</Badge>
                        {/* ✅ Bouton Modifier - efa tsy misy icon */}
                        <Button variant="outline" size="sm"
                          onClick={() => {
                            setSelectedDeliveryPerson(person);
                            deliveryPersonForm.reset({
                              fullName: person.fullName,
                              phone: person.phone,
                              email: person.email || "",
                              address: person.address || "",
                              vehicleType: person.vehicleType || "moto",
                              licensePlate: person.licensePlate || "",
                              maxCapacity: person.maxCapacity || 10,
                              workingHours: person.workingHours || { start: "08:00", end: "18:00" },
                              isActive: person.isActive ?? true,
                            });
                            setIsEditDeliveryPersonOpen(true);
                          }}>
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteDeliveryPersonMutation.mutate(person.id)}>Suppr.</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Assignation */}
          <TabsContent value="assignment" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div><CardTitle>Assignation des livraisons</CardTitle><CardDescription>Affecter manuellement les commandes aux livreurs</CardDescription></div>
                  <Dialog open={isAssignDeliveryOpen} onOpenChange={setIsAssignDeliveryOpen}>
                    <DialogTrigger asChild><Button>Assigner livraison</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Assigner une livraison</DialogTitle><DialogDescription>Affecter une commande à un livreur disponible</DialogDescription></DialogHeader>
                      <Form {...assignDeliveryForm}>
                        <form onSubmit={assignDeliveryForm.handleSubmit((data) => assignDeliveryMutation.mutate(data))} className="space-y-4">
                          <FormField control={assignDeliveryForm.control} name="orderId" render={({ field }) => (
                            <FormItem><FormLabel>Commande</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une commande" /></SelectTrigger></FormControl>
                                <SelectContent>{pendingOrders.map((order: any) => <SelectItem key={order.id} value={order.id.toString()}>Commande #{order.id} - {order.itemCount} pièces</SelectItem>)}</SelectContent>
                              </Select><FormMessage /></FormItem>
                          )} />
                          <FormField control={assignDeliveryForm.control} name="deliveryPersonId" render={({ field }) => (
                            <FormItem><FormLabel>Livreur</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un livreur" /></SelectTrigger></FormControl>
                                <SelectContent>{activeDeliveryPersons.map((person: any) => <SelectItem key={person.id} value={person.id.toString()}>{person.fullName} ({person.vehicleType})</SelectItem>)}</SelectContent>
                              </Select><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={assignDeliveryForm.control} name="estimatedTime" render={({ field }) => (
                              <FormItem><FormLabel>Temps estimé (min)</FormLabel><FormControl><Input placeholder="30" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={assignDeliveryForm.control} name="priority" render={({ field }) => (
                              <FormItem><FormLabel>Priorité</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue="normal"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectItem value="low">Faible</SelectItem><SelectItem value="normal">Normale</SelectItem><SelectItem value="high">Élevée</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={assignDeliveryForm.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Instructions particulières..." {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <DialogFooter><Button type="submit" disabled={assignDeliveryMutation.isPending}>{assignDeliveryMutation.isPending ? "Assignation..." : "Assigner"}</Button></DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">{pendingOrders.length} commandes en attente d'assignation</div>
                  {pendingOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">Commande #{order.id}</p>
                        <p className="text-sm text-gray-500">{order.itemCount} pièces • Client: {order.clientId}</p>
                        <p className="text-xs text-gray-400">Prête depuis: {format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">En attente</Badge>
                        <Button variant="outline" size="sm" onClick={() => { assignDeliveryForm.setValue("orderId", order.id); setIsAssignDeliveryOpen(true); }}>Assigner</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Planning */}
          <TabsContent value="planning" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div><CardTitle>Planning des livraisons</CardTitle><CardDescription>Planification automatique et manuelle par livreur</CardDescription></div>
                  <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
                    <DialogTrigger asChild><Button>Nouveau planning</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Créer un planning</DialogTitle><DialogDescription>Définir les créneaux de livraison pour un livreur</DialogDescription></DialogHeader>
                      <Form {...scheduleForm}>
                        <form onSubmit={scheduleForm.handleSubmit((data) => createScheduleMutation.mutate(data))} className="space-y-4">
                          <FormField control={scheduleForm.control} name="deliveryPersonId" render={({ field }) => (
                            <FormItem><FormLabel>Livreur</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un livreur" /></SelectTrigger></FormControl>
                                <SelectContent>{activeDeliveryPersons.map((person: any) => <SelectItem key={person.id} value={person.id.toString()}>{person.fullName}</SelectItem>)}</SelectContent>
                              </Select><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-3 gap-4">
                            <FormField control={scheduleForm.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Heure début</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={scheduleForm.control} name="endTime" render={({ field }) => (<FormItem><FormLabel>Heure fin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={scheduleForm.control} name="maxOrders" render={({ field }) => (<FormItem><FormLabel>Max commandes</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          <DialogFooter><Button type="submit" disabled={createScheduleMutation.isPending}>{createScheduleMutation.isPending ? "Création..." : "Créer le planning"}</Button></DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-3">
                    <Label>Livreur affiché</Label>
                    <Select value={String(selectedCalendarPersonId)} onValueChange={(val) => setSelectedCalendarPersonId(val === "all" ? "all" : parseInt(val))}>
                      <SelectTrigger><SelectValue placeholder="Tous livreurs" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Tous livreurs</SelectItem>{activeDeliveryPersons.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.fullName}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="rounded-md border p-2">
                      <Calendar mode="single" selected={selectedCalendarDate} onSelect={(d) => d && setSelectedCalendarDate(d)} className="rounded-md" />
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <div><h3 className="text-lg font-semibold">Détails du {format(selectedCalendarDate, "dd/MM/yyyy", { locale: fr })}</h3><p className="text-sm text-muted-foreground">{selectedCalendarPersonId === "all" ? "Toutes les livraisons" : `Livreur: ${activeDeliveryPersons.find((p:any)=>p.id===selectedCalendarPersonId)?.fullName || "-"}`}</p></div>
                    <div className="space-y-3">
                      {(() => {
                        const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
                        const dayDeliveries = deliveries.filter((d:any) => isSameDay(new Date(d.scheduledDate), selectedCalendarDate) && (selectedCalendarPersonId === "all" || d.deliveryPersonId === selectedCalendarPersonId));
                        if (dayDeliveries.length === 0) return <div className="text-sm text-muted-foreground">Aucune livraison planifiée pour cette date.</div>;
                        return dayDeliveries.map((d:any) => (
                          <div key={d.id} className="p-3 border rounded-md flex items-center justify-between">
                            <div>
                              <div className="font-medium">Livraison #{d.id} • Commande #{d.orderId}</div>
                              <div className="text-sm text-gray-500">Livreur: {activeDeliveryPersons.find((p:any)=>p.id===d.deliveryPersonId)?.fullName || "Non assigné"}</div>
                              <div className="text-xs text-gray-400">Heure estimée: {d.estimatedTime ? `${d.estimatedTime} min` : "-"}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(d.status)}
                              <Button size="sm" variant="outline" onClick={() => updateDeliveryStatusMutation.mutate({ id: d.id, status: d.status })}>Voir</Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {schedules.map((schedule: any) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{activeDeliveryPersons.find((p: any) => p.id === schedule.deliveryPersonId)?.fullName || "Livreur inconnu"}</p>
                        <p className="text-sm text-gray-500">{format(new Date(schedule.date), "dd/MM/yyyy", { locale: fr })} • {schedule.startTime} - {schedule.endTime}</p>
                        <p className="text-xs text-gray-400">Capacité: {schedule.maxOrders} commandes</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{schedule.status || "Actif"}</Badge>
                        <Button variant="outline" size="sm">Modifier</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogue d'édition de livreur */}
        <Dialog open={isEditDeliveryPersonOpen} onOpenChange={setIsEditDeliveryPersonOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le livreur</DialogTitle>
              <DialogDescription>Mettre à jour les informations du livreur</DialogDescription>
            </DialogHeader>
            {selectedDeliveryPerson && (
              <Form {...deliveryPersonForm}>
                <form onSubmit={deliveryPersonForm.handleSubmit((data) => updateDeliveryPersonMutation.mutate({ id: selectedDeliveryPerson.id, updates: data }))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={deliveryPersonForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={deliveryPersonForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={deliveryPersonForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={deliveryPersonForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={deliveryPersonForm.control} name="vehicleType" render={({ field }) => (
                      <FormItem><FormLabel>Type de véhicule</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="moto">Moto</SelectItem><SelectItem value="voiture">Voiture</SelectItem><SelectItem value="camionnette">Camionnette</SelectItem><SelectItem value="velo">Vélo</SelectItem></SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={deliveryPersonForm.control} name="licensePlate" render={({ field }) => (
                      <FormItem><FormLabel>Plaque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={deliveryPersonForm.control} name="maxCapacity" render={({ field }) => (
                      <FormItem><FormLabel>Capacité max</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={deliveryPersonForm.control} name="workingHours.start" render={({ field }) => (
                      <FormItem><FormLabel>Heure début</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={deliveryPersonForm.control} name="workingHours.end" render={({ field }) => (
                      <FormItem><FormLabel>Heure fin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={deliveryPersonForm.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} /></FormControl>
                      <FormLabel>Livreur actif</FormLabel><FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDeliveryPersonOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={updateDeliveryPersonMutation.isPending}>
                      {updateDeliveryPersonMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}