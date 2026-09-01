// FICHIER : components/NotificationBell.tsx (Version Corrigée et Intelligente)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, BellRing, Check, CheckCheck, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationBell() {
    const queryClient = useQueryClient();

    // 1. On récupère les données de manière plus robuste
    const { data, isLoading, isError } = useQuery({
        queryKey: ['my-notifications'],
        queryFn: () => apiRequest('GET', '/api/notifications/my'),
        refetchInterval: 60000,
    });
    
    // ✅ CORRECTION CRITIQUE : Garantit que 'notifications' est TOUJOURS un tableau
    const notifications = Array.isArray(data) ? data : [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    // 2. ✨ AMÉLIORATION : Mutation optimiste pour marquer une notification comme lue
    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: number) => apiRequest('PATCH', `/api/notifications/${notificationId}/read`),
        onMutate: async (notificationId: number) => {
            await queryClient.cancelQueries({ queryKey: ['my-notifications'] });
            const previousNotifications = queryClient.getQueryData(['my-notifications']);
            queryClient.setQueryData(['my-notifications'], (old: any[] | undefined) =>
                old?.map(n => n.id === notificationId ? { ...n, isRead: true } : n) || []
            );
            return { previousNotifications };
        },
        onError: (err, variables, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['my-notifications'], context.previousNotifications);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
        },
    });

    // 3. ✨ NOUVEAU : Mutation optimiste pour "Tout marquer comme lu"
    const markAllAsReadMutation = useMutation({
        mutationFn: () => apiRequest('PATCH', '/api/notifications/read-all'),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['my-notifications'] });
            const previousNotifications = queryClient.getQueryData(['my-notifications']);
            queryClient.setQueryData(['my-notifications'], (old: any[] | undefined) =>
                old?.map(n => ({ ...n, isRead: true })) || []
            );
            return { previousNotifications };
        },
        onError: (err, variables, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['my-notifications'], context.previousNotifications);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
        },
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 p-0 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white"
                >
                    {unreadCount > 0 ? (
                        <BellRing className="h-5 w-5 text-white animate-pulse" />
                    ) : (
                        <Bell className="h-5 w-5 text-white" />
                    )}
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">{unreadCount}</Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex justify-between items-center pr-2">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    {/* NOUVEAU : Bouton "Tout marquer comme lu" */}
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <CheckCheck className="h-4 w-4 mr-1"/>
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {/* ✨ AMÉLIORATION : Gestion des états de chargement, d'erreur et de vide */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-4 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/> Chargement...
                    </div>
                ) : isError ? (
                     <div className="flex items-center justify-center p-4 text-sm text-red-500">
                        <XCircle className="h-4 w-4 mr-2"/> Impossible de charger.
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-sm text-gray-500">
                        <Check className="h-8 w-8 text-green-400 mb-2"/>
                        <p className="font-medium">Vous êtes à jour !</p>
                        <p className="text-xs">Aucune nouvelle notification.</p>
                    </div>
                ) : (
                    notifications.map((n: any) => (
                        <DropdownMenuItem key={n.id} onSelect={() => !n.isRead && markAsReadMutation.mutate(n.id)} className={`flex flex-col items-start gap-1 p-2 cursor-pointer ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <div className="flex justify-between w-full">
                                <p className={`font-semibold text-sm`}>{n.title}</p>
                                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 w-full">{n.message}</p>
                            <p className="text-xs text-gray-400 w-full text-right mt-1">
                                {formatDistanceToNow(new Date(n.createdAt), { locale: fr, addSuffix: true })}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}