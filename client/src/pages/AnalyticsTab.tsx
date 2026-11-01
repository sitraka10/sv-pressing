
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type GrowthItem = {
  month: string;
  new_clients: number | string;
};

type HistoryItem = {
  id: string | number;
  clientName?: string;
  action: string;
  details?: string;
  createdAt: string;
  adminName?: string;
};

const formatMonth = (month: string) => {
  try {
    const date = parseISO(`${month}-02`);
    return isValid(date)
      ? format(date, "MMM yy", { locale: fr })
      : month;
  } catch {
    return month;
  }
};

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);
  return isValid(date)
    ? format(date, "dd/MM/yyyy HH:mm", { locale: fr })
    : "—";
};

const actionLabel = (action: string) => {
  const labels: Record<string, string> = {
    activated: "Activation",
    suspended: "Suspension",
    plan_changed: "Modification du forfait",
  };

  return labels[action] || action.replace(/_/g, " ");
};

export function AnalyticsTab() {
  const growth = useQuery<GrowthItem[]>({
    queryKey: ["clientGrowth"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/analytics/client-growth"
      );
      return response.json();
    },
  });

  const history = useQuery<HistoryItem[]>({
    queryKey: ["actionsHistory"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/analytics/history"
      );
      return response.json();
    },
  });

  const chartData = (growth.data ?? [])
    .map((item) => ({
      month: item.month,
      label: formatMonth(item.month),
      clients: Math.max(0, Number(item.new_clients) || 0),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalClients = chartData.reduce(
    (sum, item) => sum + item.clients,
    0
  );

  const average = chartData.length
    ? Math.round((totalClients / chartData.length) * 10) / 10
    : 0;

  const actions = history.data ?? [];

  return (
    <main className="min-h-screen space-y-7 bg-white p-4 sm:p-6 lg:p-8">

      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">
            Administration
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Analyses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Croissance des clients et historique des opérations.
          </p>
        </div>

        <button
          onClick={() => {
            void growth.refetch();
            void history.refetch();
          }}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Actualiser
        </button>
      </header>

      {/* Indicateurs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Nouveaux clients
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {growth.isLoading ? "—" : totalClients.toLocaleString("fr-FR")}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Total sur la période disponible
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Moyenne mensuelle
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {growth.isLoading ? "—" : average.toLocaleString("fr-FR")}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Nouveaux clients par mois
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Actions récentes
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {history.isLoading ? "—" : actions.length}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Opérations enregistrées dans l'historique chargé
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Graphique */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">
            Croissance des clients
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Nombre de nouveaux clients enregistrés chaque mois.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {growth.isLoading ? (
            <p className="py-24 text-center text-sm text-slate-500">
              Chargement des données...
            </p>
          ) : growth.isError ? (
            <div className="py-20 text-center">
              <p className="text-sm text-red-600">
                Impossible de charger les données.
              </p>
              <button
                onClick={() => void growth.refetch()}
                className="mt-3 text-sm font-medium text-teal-700 underline"
              >
                Réessayer
              </button>
            </div>
          ) : chartData.length === 0 ? (
            <p className="py-24 text-center text-sm text-slate-500">
              Aucune donnée disponible pour le moment.
            </p>
          ) : (
            <div className="h-[280px] w-full sm:h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient
                      id="simpleGrowthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0F766E"
                        stopOpacity={0.16}
                      />
                      <stop
                        offset="100%"
                        stopColor="#0F766E"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#E5E7EB"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={15}
                  />

                  <YAxis
                    allowDecimals={false}
                    domain={[0, (max: number) => Math.max(max, 1)]}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                    width={38}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      boxShadow: "none",
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      Number(value ?? 0),
                      "Nouveaux clients",
                    ]}
                    labelStyle={{
                      color: "#334155",
                      marginBottom: 4,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="clients"
                    stroke="#0F766E"
                    strokeWidth={2}
                    fill="url(#simpleGrowthGradient)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Historique */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Historique des actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Liste des opérations effectuées sur les comptes clients.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {history.isLoading ? "Chargement..." : `${actions.length} actions`}
          </span>
        </div>

        {history.isLoading ? (
          <p className="py-16 text-center text-sm text-slate-500">
            Chargement de l'historique...
          </p>
        ) : history.isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">
              Impossible de charger l'historique.
            </p>
            <button
              onClick={() => void history.refetch()}
              className="mt-3 text-sm text-teal-700 underline"
            >
              Réessayer
            </button>
          </div>
        ) : actions.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            Aucune action enregistrée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Détails</th>
                  <th className="px-5 py-3">Administrateur</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {actions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {item.clientName || "Utilisateur inconnu"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {actionLabel(item.action)}
                    </td>
                    <td className="max-w-xs whitespace-normal px-5 py-4 text-slate-500">
                      {item.details || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.adminName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
