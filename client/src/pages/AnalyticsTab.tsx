import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, TrendingUp, Activity, ServerCrash, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

// Fonction pour formater les données du graphique
const formatChartData = (data: any[] | undefined) => {
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map(item => ({
        ...item,
        // Formate "2024-07" en "Juillet 2024"
        month: item.month ? format(new Date(`${item.month}-02`), 'MMMM yyyy', { locale: fr }) : 'Date inconnue',
    }));
};

// Fonction pour choisir la couleur du badge en fonction de l'action
const getActionBadgeVariant = (action: string) => {
    switch (action) {
        case 'activated': return 'default';
        case 'suspended': return 'destructive';
        case 'plan_changed': return 'secondary';
        default: return 'outline';
    }
};

export function AnalyticsTab() {
    // 1. Récupérer les données de croissance des clients
    const { data: rawGrowthData, isLoading: isLoadingGrowth, isError: isErrorGrowth } = useQuery<any[]>({
        queryKey: ['clientGrowth'],
        // apiRequest returns a Response; we need to parse JSON here
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/analytics/client-growth');
            return await res.json();
        },
    });
    const growthData = useMemo(() => formatChartData(rawGrowthData), [rawGrowthData]);

    // KPIs for the summary over the chart
    const totalNewClients = useMemo(() => (Array.isArray(rawGrowthData) ? rawGrowthData.reduce((acc, d) => acc + (Number(d?.new_clients) || 0), 0) : 0), [rawGrowthData]);
    const avgPerMonth = useMemo(() => {
        if (!Array.isArray(rawGrowthData) || rawGrowthData.length === 0) return 0;
        return Math.round((totalNewClients / rawGrowthData.length) * 10) / 10;
    }, [rawGrowthData, totalNewClients]);

    // 2. Récupérer les données de l'historique des actions
    const { data: historyData, isLoading: isLoadingHistory, isError: isErrorHistory } = useQuery<any[]>({
        queryKey: ['actionsHistory'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/analytics/history');
            return await res.json();
        },
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Évolution des Nouveaux Clients (12 derniers mois)
                    </CardTitle>
                    <CardDescription>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                                Total: {totalNewClients}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                                Moyenne/mois: {avgPerMonth}
                            </span>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80 pr-6">
                    {isLoadingGrowth && <div className="flex items-center justify-center h-full text-gray-500"><Clock className="h-5 w-5 mr-2 animate-spin" />Chargement des données...</div>}
                    {isErrorGrowth && <div className="flex flex-col items-center justify-center h-full text-red-600"><ServerCrash className="h-10 w-10 mb-2" /><p>Erreur lors du chargement des données.</p></div>}
                    {!isLoadingGrowth && !isErrorGrowth && (
                        growthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={growthData} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-md border border-gray-200 bg-white p-2 shadow-sm text-sm">
                                                    <div className="font-medium text-gray-800">{label}</div>
                                                    <div className="text-emerald-700">Nouveaux clients: <span className="font-semibold">{payload[0].value}</span></div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Legend />
                                    <ReferenceLine y={avgPerMonth} stroke="#6366F1" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: `Moyenne: ${avgPerMonth}`, position: 'right', fill: '#6366F1', fontSize: 11 }} />
                                    <Area type="monotone" dataKey="new_clients" name="Nouveaux Clients" stroke="#16a34a" fillOpacity={1} fill="url(#colorClients)" />
                                    <Line type="monotone" dataKey="new_clients" name="Nouveaux Clients" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <BarChart2 className="h-10 w-10 mb-2" />
                                <p className="font-medium">Pas encore de données sur la croissance des clients.</p>
                                <p className="text-sm text-gray-400">Approuvez de nouveaux clients pour voir cette courbe évoluer.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Historique des Actions Récentes
                    </CardTitle>
                    <CardDescription>Les 100 dernières actions effectuées sur les comptes clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingHistory && <div className="flex items-center justify-center h-full text-gray-500 py-10"><Clock className="h-5 w-5 mr-2 animate-spin" />Chargement de l'historique...</div>}
                    {isErrorHistory && <div className="flex flex-col items-center justify-center h-full text-red-600 py-10"><ServerCrash className="h-10 w-10 mb-2" /><p>Erreur lors du chargement de l'historique.</p></div>}
                    {!isLoadingHistory && !isErrorHistory && (
                        (historyData && historyData.length > 0) ? (
                            <ul className="space-y-4">
                                {historyData.map((item: any) => (
                                    <li key={item.id} className="flex items-start gap-4 border-b pb-3 last:border-b-0">
                                        <div className="bg-gray-100 p-2 rounded-full mt-1">
                                            <Clock className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">{item.clientName || 'Utilisateur inconnu'}</p>
                                                <Badge variant={getActionBadgeVariant(item.action)}>{item.action.replace(/_/g, ' ')}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">{item.details}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {format(new Date(item.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                {item.adminName && ` par ${item.adminName}`}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                                <Activity className="h-10 w-10 mb-2" />
                                <p>Aucune action récente n'a été enregistrée.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
