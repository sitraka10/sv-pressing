import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Route,
  Truck,
  UserRound,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TEAL = "#0B676E";

type Mission = {
  id: number;
  orderId: number;
  deliveryPersonId: number | null;
  type: "pickup" | "delivery";
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
  scheduledDate: string | null;
  completedDate: string | null;
  notes?: string | null;
  order?: {
    id: number;
    status: string;
    itemCount?: number | null;
    specialInstructions?: string | null;
    deliveryTimeWindowStart?: string | null;
    deliveryTimeWindowEnd?: string | null;
    client?: {
      id: number;
      fullName?: string | null;
      phone?: string | null;
      address?: string | null;
      neighborhood?: string | null;
      addressDetails?: string | null;
    } | null;
  } | null;
};

type FilterType = "all" | "pickup" | "delivery";

function getAddress(mission: Mission) {
  const client = mission.order?.client;
  return [client?.address, client?.addressDetails, client?.neighborhood]
    .filter(Boolean)
    .join(", ");
}

function getStatus(status: Mission["status"]) {
  switch (status) {
    case "completed": return { label: "Terminée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "in_progress": return { label: "En cours", className: "bg-blue-50 text-blue-700 border-blue-200" };
    case "assigned": return { label: "Affectée", className: "bg-teal-50 text-teal-700 border-teal-200" };
    case "failed": return { label: "Échec", className: "bg-red-50 text-red-700 border-red-200" };
    default: return { label: "À faire", className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: missions = [], isLoading, isError, refetch, isFetching } = useQuery<Mission[]>({
    queryKey: ["/api/deliveries/my-today"],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const updateMission = useMutation({
    mutationFn: async ({ mission, status }: { mission: Mission; status: "in_progress" | "completed" }) => {
      const response = await apiRequest("PATCH", `/api/deliveries/${mission.id}`, {
        status,
        ...(status === "completed" ? { completedDate: new Date().toISOString() } : {}),
      });
      const updated = await response.json();

      // Synchroniser également l'état de la commande après la mission.
      if (status === "completed" && mission.orderId) {
        const nextOrderStatus = mission.type === "pickup" ? "to_sort" : "delivered";
        await apiRequest("PATCH", `/api/orders/${mission.orderId}`, { status: nextOrderStatus });
      }
      return updated;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/my-today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: variables.status === "completed" ? "Mission terminée" : "Mission démarrée",
        description: variables.status === "completed"
          ? "La mission et le statut de la commande ont été mis à jour."
          : "La mission est maintenant en cours.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" });
    },
  });

  const visibleMissions = useMemo(() => {
    return missions.filter((mission) => filter === "all" || mission.type === filter);
  }, [missions, filter]);

  const pickupCount = missions.filter((mission) => mission.type === "pickup").length;
  const deliveryCount = missions.filter((mission) => mission.type === "delivery").length;
  const completedCount = missions.filter((mission) => mission.status === "completed").length;
  const remainingCount = missions.length - completedCount;

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="min-h-screen bg-[#F5F7F8] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Espace professionnel</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ma tournée</h1>
            <p className="mt-1 text-sm text-slate-500">Bonjour {user?.fullName || "Livreur"}, voici vos missions du jour.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4" style={{ color: TEAL }} />
            <span className="capitalize">{todayLabel}</span>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Actualiser
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Total missions</span><Route className="h-4 w-4" /></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "—" : missions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Ramassages</span><Package className="h-4 w-4" /></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "—" : pickupCount}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Livraisons</span><Truck className="h-4 w-4" /></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "—" : deliveryCount}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>Restantes</span><Clock3 className="h-4 w-4" /></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "—" : remainingCount}</p>
              <p className="mt-1 text-xs text-emerald-700">{completedCount} terminée(s)</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Missions prévues aujourd'hui</h2>
              <p className="mt-1 text-sm text-slate-500">La liste se charge automatiquement et s'actualise toutes les 30 secondes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Toutes"], ["pickup", "Ramassages"], ["delivery", "Livraisons"],
              ] as [FilterType, string][]).map(([value, label]) => (
                <Button key={value} size="sm" variant={filter === value ? "default" : "outline"}
                  onClick={() => setFilter(value)}
                  className={filter === value ? "text-white hover:opacity-90" : "bg-white"}
                  style={filter === value ? { backgroundColor: TEAL } : undefined}>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {isLoading && (
            <Card className="border-slate-200"><CardContent className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Chargement de votre tournée...</CardContent></Card>
          )}

          {isError && !isLoading && (
            <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center gap-3 p-5 text-sm text-red-700"><AlertCircle className="h-5 w-5" /> Impossible de charger les missions. Vérifiez votre connexion puis actualisez.</CardContent></Card>
          )}

          {!isLoading && !isError && visibleMissions.length === 0 && (
            <Card className="border-dashed border-slate-300 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4"><Route className="h-7 w-7 text-slate-500" /></div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">Aucune mission affectée pour aujourd'hui</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Dès qu'un ramassage ou une livraison vous sera affecté avec la date d'aujourd'hui, il apparaîtra automatiquement ici. Vous n'avez rien à sélectionner.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && visibleMissions.length > 0 && (
            <div className="space-y-3">
              {visibleMissions.map((mission, index) => {
                const client = mission.order?.client;
                const address = getAddress(mission);
                const status = getStatus(mission.status);
                const isCompleted = mission.status === "completed";
                const isPending = mission.status === "pending" || mission.status === "assigned";
                const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

                return (
                  <Card key={mission.id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                        <div className="flex items-start gap-3 lg:w-16 lg:flex-col lg:items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">{index + 1}</div>
                          <span className="pt-2 text-xs font-medium text-slate-400 lg:pt-0">Étape</span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={mission.type === "pickup" ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50" : "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-50"}>
                              {mission.type === "pickup" ? "Ramassage" : "Livraison"}
                            </Badge>
                            <Badge variant="outline" className={status.className}>{status.label}</Badge>
                            <span className="text-xs text-slate-400">Commande #{mission.orderId}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{client?.fullName || `Client commande #${mission.orderId}`}</h3>
                          <div className="flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
                            {mission.scheduledDate && <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" />{format(new Date(mission.scheduledDate), "HH:mm")}</span>}
                            {client?.phone && <a className="inline-flex items-center gap-2 hover:text-teal-700" href={`tel:${client.phone}`}><Phone className="h-4 w-4 text-slate-400" />{client.phone}</a>}
                            {mission.order?.itemCount != null && <span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-slate-400" />{mission.order.itemCount} article(s)</span>}
                          </div>
                          {address && <p className="flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{address}</span></p>}
                          {mission.notes && <p className="text-sm text-slate-500">Note : {mission.notes}</p>}
                          {mission.order?.specialInstructions && <p className="text-sm text-slate-500">Consigne : {mission.order.specialInstructions}</p>}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:w-52 lg:flex-col">
                          {mapsUrl && <Button asChild variant="outline" className="w-full"><a href={mapsUrl} target="_blank" rel="noreferrer"><Navigation className="mr-2 h-4 w-4" />Voir l'itinéraire</a></Button>}
                          {!isCompleted && isPending && <Button className="w-full text-white" style={{ backgroundColor: TEAL }} disabled={updateMission.isPending} onClick={() => updateMission.mutate({ mission, status: "in_progress" })}><Truck className="mr-2 h-4 w-4" />Commencer</Button>}
                          {!isCompleted && mission.status === "in_progress" && <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={updateMission.isPending} onClick={() => updateMission.mutate({ mission, status: "completed" })}><Check className="mr-2 h-4 w-4" />Terminer la mission</Button>}
                          {isCompleted && <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Mission terminée</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-slate-400"><UserRound className="h-3.5 w-3.5" />Connecté en tant que {user?.fullName || "livreur"}</div>
      </main>
    </div>
  );
}
