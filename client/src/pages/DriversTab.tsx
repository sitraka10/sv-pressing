import React, { useState, useEffect, useMemo } from "react";
import { useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeighborhoodCombobox } from './NeighborhoodCombobox';
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus, Edit, Eye, History, CheckCircle, X, Loader2, Truck, UserCheck, UserPlus, Phone, 
    MapPin, Brain, TrendingUp, Shield, Clock, Package, Star, Target, Navigation, Zap, Award, 
    Calendar, ShieldCheck, Sparkles, Users, Activity, BarChart3, MoreVertical, Mail, 
    Map, Check, XCircle, Filter, Sparkle, Rocket, Cpu, Bolt, TargetIcon, ZapIcon,
    TrendingUpIcon, ClockIcon, PackageIcon, ShieldIcon, Search, ChevronLeft, ChevronRight,
    RefreshCw, LayoutGrid, List, Bike, Car, Truck as TruckIcon, Bus
} from "lucide-react";
import { format, differenceInMinutes, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
};

interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    phone2?: string;
    address?: string;
    neighborhood?: string;
    addressDetails?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    capacityInItems?: number;
    vehicleType?: string;
    preferredZones?: string[];
    avatarColor?: string;
}

interface Delivery {
    id: number;
    orderId: number;
    deliveryPersonId: number;
    type: 'pickup' | 'delivery';
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
    scheduledDate?: string;
    completedDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    estimatedDuration?: number;
    actualDuration?: number;
    distance?: number;
}

interface Order {
    id: number;
    clientId: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
}

interface DriversTabProps {
    users: User[];
    deliveries: Delivery[];
    orders: Order[];
    queryClient: QueryClient;
    toast: ReturnType<typeof useToast>['toast'];
    toggleUserStatusMutation?: ReturnType<typeof useMutation>;
    createDriverMutation?: ReturnType<typeof useMutation>;
    editDriverMutation?: ReturnType<typeof useMutation>;
}

// Constantes pour les couleurs d'avatar
const AVATAR_COLORS = [
    "from-[#0B676E] to-teal-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-amber-500 to-orange-500",
    "from-red-500 to-rose-500",
    "from-indigo-500 to-blue-500",
    "from-teal-500 to-green-500",
    "from-yellow-500 to-amber-500"
];

// Types de véhicules avec leurs propriétés (sans émojis)
const VEHICLE_TYPES = {
    motorcycle: { label: "Moto", capacity: 150, speed: 40, icon: Bike },
    scooter: { label: "Scooter", capacity: 100, speed: 35, icon: Bike },
    car: { label: "Voiture", capacity: 300, speed: 50, icon: Car },
    van: { label: "Camionnette", capacity: 500, speed: 45, icon: Bus },
    bicycle: { label: "Vélo", capacity: 50, speed: 15, icon: Bike },
    truck: { label: "Camion", capacity: 1000, speed: 35, icon: TruckIcon }
} as const;

// Fonction utilitaire pour valider le type de véhicule
const validateVehicleType = (vehicleType: string | undefined): keyof typeof VEHICLE_TYPES => {
    if (!vehicleType) return "motorcycle";
    const validTypes = Object.keys(VEHICLE_TYPES) as Array<keyof typeof VEHICLE_TYPES>;
    return validTypes.includes(vehicleType as any) 
        ? vehicleType as keyof typeof VEHICLE_TYPES 
        : "motorcycle";
};

export const DriversTab: React.FC<DriversTabProps> = ({
    users,
    deliveries,
    orders,
    queryClient,
    toast,
    toggleUserStatusMutation,
    createDriverMutation,
    editDriverMutation,
}) => {
    const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
    const [newDriverData, setNewDriverData] = useState<any>({});
    const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
    const [isDriverDetailsOpen, setIsDriverDetailsOpen] = useState(false);
    const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
    const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
    const [driverHistoryData, setDriverHistoryData] = useState<any>(null);
    const [editDriverData, setEditDriverData] = useState<any>({
        id: 0,
        username: "",
        fullName: "",
        email: "",
        phone: "",
        phone2: "",
        neighborhood: "",
        addressDetails: "",
        password: "",
        capacityInItems: 200,
        vehicleType: "motorcycle",
        preferredZones: []
    });
    
    // ✅ FANOVANA 1 : "active" no default (mampiseho ACTIVE ihany)
    const [filterActive, setFilterActive] = useState<string>("active");
    
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [driversPerPage, setDriversPerPage] = useState(6);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Création de mutations par défaut si elles ne sont pas fournies
    const defaultEditDriverMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest("PATCH", `/api/users/${data.id}`, data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });

    const defaultCreateDriverMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest("POST", "/api/users", data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });

    // Utiliser les mutations passées en props ou les mutations par défaut
    const effectiveEditDriverMutation = editDriverMutation || defaultEditDriverMutation;
    const effectiveCreateDriverMutation = createDriverMutation || defaultCreateDriverMutation;

    // Fonction pour calculer les statistiques d'un livreur spécifique
    const calculateDriverStats = (driver: User) => {
        const driverDeliveries = deliveries.filter((d: Delivery) => d.deliveryPersonId === driver.id);
        
        if (driverDeliveries.length === 0) {
            return {
                totalDeliveries: 0,
                completedDeliveries: 0,
                inProgressDeliveries: 0,
                pendingDeliveries: 0,
                failedDeliveries: 0,
                successRate: 0,
                performanceScore: 0,
                avgDeliveryTime: 0,
                satisfactionRate: 0,
                totalDistance: 0,
                avgSpeed: 0,
                monthlyDeliveries: 0,
                revenueGenerated: 0
            };
        }
        
        const completedDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "completed");
        const inProgressDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "in_progress");
        const pendingDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "pending" || d.status === "assigned");
        const failedDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "failed");
        
        const successRate = Math.round((completedDeliveries.length / driverDeliveries.length) * 100);
        const performanceScore = successRate >= 95 ? 5 :
                                successRate >= 90 ? 4.5 :
                                successRate >= 85 ? 4 :
                                successRate >= 80 ? 3.5 :
                                successRate >= 75 ? 3 :
                                successRate >= 70 ? 2.5 :
                                successRate >= 60 ? 2 : 1;
        
        let totalDeliveryTime = 0;
        let countWithTime = 0;
        
        completedDeliveries.forEach(delivery => {
            if (delivery.scheduledDate && delivery.completedDate) {
                const scheduled = parseISO(delivery.scheduledDate);
                const completed = parseISO(delivery.completedDate);
                const duration = differenceInMinutes(completed, scheduled);
                if (duration > 0) {
                    totalDeliveryTime += duration;
                    countWithTime++;
                }
            }
        });
        
        const avgDeliveryTime = countWithTime > 0 
            ? Math.round(totalDeliveryTime / countWithTime)
            : 45;
        
        const totalDistance = driverDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
        const totalHours = totalDeliveryTime / 60;
        const avgSpeed = totalHours > 0 ? Math.round(totalDistance / totalHours) : 25;
        
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        
        const monthlyDeliveries = driverDeliveries.filter(d => 
            d.completedDate && isWithinInterval(parseISO(d.completedDate), {
                start: startOfCurrentMonth,
                end: endOfCurrentMonth
            })
        ).length;
        
        let revenueGenerated = 0;
        completedDeliveries.forEach(delivery => {
            const order = orders.find(o => o.id === delivery.orderId);
            if (order) {
                revenueGenerated += order.totalAmount * 0.1;
            }
        });
        
        const satisfactionRate = Math.min(100, successRate + Math.floor(Math.random() * 15));

        return {
            totalDeliveries: driverDeliveries.length,
            completedDeliveries: completedDeliveries.length,
            inProgressDeliveries: inProgressDeliveries.length,
            pendingDeliveries: pendingDeliveries.length,
            failedDeliveries: failedDeliveries.length,
            successRate,
            performanceScore,
            avgDeliveryTime,
            satisfactionRate,
            totalDistance,
            avgSpeed,
            monthlyDeliveries,
            revenueGenerated
        };
    };

    // Filtrer et préparer les livreurs avec des données enrichies
    const deliveryPersons = useMemo(() => {
        return users
            .filter((user: User) => user.role === "delivery")
            .map((driver, index) => {
                const validVehicleType = validateVehicleType(driver.vehicleType);
                const vehicleInfo = VEHICLE_TYPES[validVehicleType];
                
                return {
                    ...driver,
                    vehicleType: validVehicleType,
                    vehicleLabel: vehicleInfo.label,
                    vehicleIcon: vehicleInfo.icon,
                    capacityInItems: driver.capacityInItems || vehicleInfo.capacity,
                    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length]
                };
            });
    }, [users]);

    // Calculer les statistiques GLOBALES
    const globalStats = useMemo(() => {
        const totalDrivers = deliveryPersons.length;
        const activeDrivers = deliveryPersons.filter(d => d.isActive).length;
        
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        
        const monthlyDeliveries = deliveries.filter(d => 
            d.completedDate && isWithinInterval(parseISO(d.completedDate), {
                start: startOfCurrentMonth,
                end: endOfCurrentMonth
            })
        );
        
        const completedDeliveries = deliveries.filter(d => d.status === "completed");
        const inProgressDeliveries = deliveries.filter(d => d.status === "in_progress");
        const pendingDeliveries = deliveries.filter(d => d.status === "pending" || d.status === "assigned");
        const failedDeliveries = deliveries.filter(d => d.status === "failed");
        
        const totalCompleted = completedDeliveries.length;
        const totalAttempted = deliveries.length;
        const successRate = totalAttempted > 0 
            ? Math.round((totalCompleted / totalAttempted) * 100)
            : 0;
        
        let totalDeliveryTime = 0;
        let countWithTime = 0;
        
        completedDeliveries.forEach(delivery => {
            if (delivery.scheduledDate && delivery.completedDate) {
                const scheduled = parseISO(delivery.scheduledDate);
                const completed = parseISO(delivery.completedDate);
                const duration = differenceInMinutes(completed, scheduled);
                if (duration > 0) {
                    totalDeliveryTime += duration;
                    countWithTime++;
                }
            }
        });
        
        const avgDeliveryTime = countWithTime > 0 
            ? Math.round(totalDeliveryTime / countWithTime)
            : 45;
        
        const vehicleDistribution = deliveryPersons.reduce((acc, driver) => {
            const vehicle = driver.vehicleType || "unknown";
            acc[vehicle] = (acc[vehicle] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        let bestDriver = null;
        let bestSuccessRate = 0;
        
        deliveryPersons.forEach(driver => {
            const stats = calculateDriverStats(driver);
            if (stats.successRate > bestSuccessRate && stats.totalDeliveries >= 5) {
                bestSuccessRate = stats.successRate;
                bestDriver = driver;
            }
        });
        
        return {
            totalDrivers,
            activeDrivers,
            totalDeliveries: deliveries.length,
            monthlyDeliveries: monthlyDeliveries.length,
            completedDeliveries: completedDeliveries.length,
            inProgressDeliveries: inProgressDeliveries.length,
            pendingDeliveries: pendingDeliveries.length,
            failedDeliveries: failedDeliveries.length,
            successRate,
            avgDeliveryTime,
            vehicleDistribution,
            bestDriver,
            bestSuccessRate,
            activeRate: totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0
        };
    }, [deliveryPersons, deliveries]);

    // ✅ FANOVANA 2 : Filtrer selon l'état - "Tous" = ACTIVE ihany
    const filteredDrivers = useMemo(() => {
        let filtered = deliveryPersons;
        
        // ✅ "all" dia midika hoe ACTIVE ihany
        if (filterActive === "all") {
            // "Tous les livreurs" → ACTIVE ihany
            filtered = deliveryPersons.filter(driver => driver.isActive === true);
        } else if (filterActive === "active") {
            // ACTIVE ihany
            filtered = deliveryPersons.filter(driver => driver.isActive === true);
        } else if (filterActive === "inactive") {
            // INACTIVE ihany
            filtered = deliveryPersons.filter(driver => driver.isActive === false);
        } else if (filterActive === "all_include_inactive") {
            // Rehetra (ACTIF + INACTIF) - raha tiana
            filtered = deliveryPersons;
        }
        
        // Recherche
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(driver =>
                driver.fullName.toLowerCase().includes(query) ||
                driver.email.toLowerCase().includes(query) ||
                driver.phone.toLowerCase().includes(query) ||
                (driver.neighborhood && driver.neighborhood.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }, [deliveryPersons, filterActive, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);
    const currentDrivers = filteredDrivers.slice(
        (currentPage - 1) * driversPerPage,
        currentPage * driversPerPage
    );

    // Réinitialiser la page quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [filterActive, searchQuery]);

    // Fonction pour mettre à jour les données localement
    const updateLocalDriverData = (driverId: number, updates: Partial<User>) => {
        queryClient.setQueryData(["users"], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((user: User) => 
                user.id === driverId ? { ...user, ...updates } : user
            );
        });
    };

    // Gestionnaire d'ajout de livreur
    const handleAddNewDriver = () => {
        setNewDriverData({
            capacityInItems: 200,
            preferredZones: [],
            vehicleType: "motorcycle",
            password: `driver${Date.now().toString().slice(-6)}`
        });
        setIsNewDriverOpen(true);
    };

    const handleSubmitNewDriver = () => {
        if (!newDriverData.fullName || !newDriverData.email || !newDriverData.phone) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir au moins le nom complet, l'email et le téléphone.",
                variant: "destructive"
            });
            return;
        }

        // ✅ FANOVANA 3 : Mampisy timestamp mba tsy hiverimberina ny username
        const baseUsername = newDriverData.username || newDriverData.email.split('@')[0];
        const uniqueUsername = `${baseUsername}_${Date.now().toString().slice(-6)}`;

        const validVehicleType = validateVehicleType(newDriverData.vehicleType);
        const vehicleInfo = VEHICLE_TYPES[validVehicleType];

        const driverDataToSend = {
            ...newDriverData,
            username: uniqueUsername, // ✅ Username unique
            role: "delivery",
            isActive: true,
            capacityInItems: newDriverData.capacityInItems || vehicleInfo.capacity,
            vehicleType: validVehicleType
        };

        console.log("Creating driver with data:", driverDataToSend);

        effectiveCreateDriverMutation.mutate(driverDataToSend, {
            onSuccess: (response: any) => {
                updateLocalDriverData(response.id, { ...driverDataToSend, id: response.id });
                setNewDriverData({});
                setIsNewDriverOpen(false);
                toast({
                    title: "✅ Livreur créé",
                    description: `${newDriverData.fullName} a été ajouté avec succès.`,
                });
            },
            onError: (error: any) => {
                console.error("Error creating driver:", error);
                toast({
                    title: "❌ Erreur de création",
                    description: error.message || "Échec de la création du livreur.",
                    variant: "destructive"
                });
            }
        });
    };

    // Gestionnaire d'édition
    const handleEditDriver = (driver: User) => {
        console.log("✏️ Editing driver:", {
            id: driver.id,
            name: driver.fullName,
            vehicleType: driver.vehicleType
        });
        
        const validVehicleType = validateVehicleType(driver.vehicleType);
        
        setEditDriverData({
            id: driver.id,
            username: driver.username,
            fullName: driver.fullName,
            email: driver.email,
            phone: driver.phone,
            phone2: driver.phone2 || "",
            neighborhood: driver.neighborhood || "",
            addressDetails: driver.addressDetails || "",
            capacityInItems: driver.capacityInItems || 200,
            vehicleType: validVehicleType,
            preferredZones: driver.preferredZones || [],
            password: "",
        });
        setIsEditDriverOpen(true);
    };

    const handleSubmitEditDriver = () => {
        if (!editDriverData.fullName || !editDriverData.email || !editDriverData.phone) {
            toast({
                title: "Champs requis",
                description: "Nom complet, email et téléphone sont obligatoires.",
                variant: "destructive"
            });
            return;
        }

        const validVehicleType = validateVehicleType(editDriverData.vehicleType);
        
        console.log("🚗 DEBUG vehicleType:", {
            raw: editDriverData.vehicleType,
            validated: validVehicleType
        });
        
        const updateData = {
            id: editDriverData.id,
            fullName: editDriverData.fullName,
            email: editDriverData.email,
            phone: editDriverData.phone,
            phone2: editDriverData.phone2 || null,
            neighborhood: editDriverData.neighborhood || null,
            addressDetails: editDriverData.addressDetails || null,
            capacityInItems: editDriverData.capacityInItems || 200,
            vehicleType: validVehicleType,
            preferredZones: editDriverData.preferredZones || [],
            ...(editDriverData.password && { password: editDriverData.password })
        };

        console.log("📤 Sending update data:", updateData);

        effectiveEditDriverMutation.mutate(updateData, {
            onSuccess: (response) => {
                console.log("✅ Driver updated successfully:", response);
                updateLocalDriverData(editDriverData.id, updateData);
                setIsEditDriverOpen(false);
                setEditDriverData({});
                toast({
                    title: "✅ Livreur modifié",
                    description: "Les informations ont été mises à jour.",
                });
            },
            onError: (error: any) => {
                console.error("❌ Error updating driver:", error);
                toast({
                    title: "❌ Erreur de modification",
                    description: error.message || "Échec de la mise à jour.",
                    variant: "destructive"
                });
            }
        });
    };

    // Gestionnaire de visualisation
    const handleViewDriverDetails = (driver: User) => {
        setSelectedDriver(driver);
        setIsDriverDetailsOpen(true);
    };

    const handleViewDriverHistory = (driver: User) => {
        const driverSpecificDeliveries = deliveries.filter(d => d.deliveryPersonId === driver.id);
        setDriverHistoryData({
            driver: driver,
            deliveries: driverSpecificDeliveries
        });
        setIsDriverHistoryOpen(true);
    };

    // Gestionnaire de changement de statut
    const handleToggleDriverStatus = (driver: User) => {
        const newStatus = !driver.isActive;
        
        updateLocalDriverData(driver.id, { isActive: newStatus });

        effectiveEditDriverMutation.mutate(
            { 
                id: driver.id, 
                isActive: newStatus 
            },
            {
                onSuccess: () => {
                    toast({
                        title: newStatus ? "✅ Livreur activé" : "✅ Livreur désactivé",
                        description: `${driver.fullName} a été ${newStatus ? 'activé' : 'désactivé'}.`,
                    });
                },
                onError: (error: any) => {
                    updateLocalDriverData(driver.id, { isActive: !newStatus });
                    toast({
                        title: "❌ Erreur",
                        description: error.message || "Impossible de modifier le statut.",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    // Obtenir les initiales
    const getInitials = (name: string) => {
        return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'NN';
    };

    // Composant de pagination
    const PaginationControls = () => {
        if (totalPages <= 1) return null;

        return (
            <div className={NEO.card}>
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-500 order-2 sm:order-1">
                        Affichage de {(currentPage - 1) * driversPerPage + 1} à{" "}
                        {Math.min(currentPage * driversPerPage, filteredDrivers.length)} sur{" "}
                        {filteredDrivers.length} livreur(s)
                    </div>
                    <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={NEO.button}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                        </Button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "w-9 h-9 p-0",
                                            currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                                        )}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className={NEO.button}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu d'une carte livreur en mode grille
    const DriverGridCard = ({ driver }: { driver: User }) => {
        const stats = calculateDriverStats(driver);
        const VehicleIcon = VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.icon || TruckIcon;

        return (
            <div 
                className={cn(
                    NEO.card,
                    "cursor-pointer hover:-translate-y-1 transition-all duration-300",
                    driver.isActive 
                        ? "border-l-4 border-l-[#0B676E]" 
                        : "border-l-4 border-l-slate-400 opacity-75"
                )}
                onClick={() => handleViewDriverDetails(driver)}
            >
                <div className="p-5">
                    {/* Header avec avatar et statut */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "relative w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.1)]",
                                driver.avatarColor
                            )}>
                                <span className="text-white font-bold text-lg">
                                    {getInitials(driver.fullName)}
                                </span>
                                {driver.isActive && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{driver.fullName}</h3>
                                <p className="text-sm text-slate-500 truncate max-w-[150px]">{driver.email}</p>
                            </div>
                        </div>
                        <Badge 
                            className={cn(
                                NEO.badge,
                                driver.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            )}
                        >
                            {driver.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                    </div>

                    {/* Informations rapides */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <Phone className="h-4 w-4 mr-2 text-[#0B676E] flex-shrink-0" />
                            <span className="truncate text-slate-700">{driver.phone}</span>
                        </div>
                        <div className="flex items-center text-sm p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <MapPin className="h-4 w-4 mr-2 text-[#0B676E] flex-shrink-0" />
                            <span className="truncate text-slate-700">{driver.neighborhood || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center text-sm p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <VehicleIcon className="h-4 w-4 mr-2 text-[#0B676E] flex-shrink-0" />
                            <span className="truncate text-slate-700">
                                {VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || 'Véhicule'} • {driver.capacityInItems} articles
                            </span>
                        </div>
                    </div>

                    {/* Statistiques miniatures */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-lg font-bold text-[#0B676E]">{stats.totalDeliveries}</p>
                            <p className="text-xs text-[#0B676E]">Missions</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-emerald-100/30 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-lg font-bold text-emerald-700">{stats.successRate}%</p>
                            <p className="text-xs text-emerald-600">Succès</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-purple-100/30 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-lg font-bold text-purple-700">{stats.monthlyDeliveries}</p>
                            <p className="text-xs text-purple-600">Mois</p>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Performance</span>
                            <span>{Math.round(stats.performanceScore * 2)}/10</span>
                        </div>
                        <div className="h-1.5 bg-[#eef2f5] rounded-full shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-[#0B676E] to-teal-400 transition-all duration-500"
                                style={{ width: `${Math.min(stats.performanceScore * 20, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className={cn(NEO.button, "flex-1")}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditDriver(driver);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            className={cn(NEO.button, "flex-1")}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (driver.phone) {
                                    window.open(`tel:${driver.phone}`, '_self');
                                }
                            }}
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className={NEO.button} onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                <DropdownMenuItem onClick={() => handleViewDriverDetails(driver)} className="rounded-xl focus:bg-[#0B676E]/10">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDriverHistory(driver)} className="rounded-xl focus:bg-[#0B676E]/10">
                                    <History className="h-4 w-4 mr-2" />
                                    Historique
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/40" />
                                <DropdownMenuItem 
                                    onClick={() => handleToggleDriverStatus(driver)}
                                    className={cn(
                                        "rounded-xl",
                                        driver.isActive ? "text-red-600 focus:bg-red-50" : "text-emerald-600 focus:bg-emerald-50"
                                    )}
                                >
                                    {driver.isActive ? (
                                        <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Désactiver
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Activer
                                        </>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu d'une carte livreur en mode liste
    const DriverListItem = ({ driver }: { driver: User }) => {
        const stats = calculateDriverStats(driver);
        const VehicleIcon = VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.icon || TruckIcon;

        return (
            <div 
                className={cn(
                    NEO.card,
                    "p-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-300",
                    driver.isActive 
                        ? "border-l-4 border-l-[#0B676E]" 
                        : "border-l-4 border-l-slate-400 opacity-75"
                )}
                onClick={() => handleViewDriverDetails(driver)}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                            "relative w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.1)]",
                            driver.avatarColor
                        )}>
                            <span className="text-white font-bold text-base">
                                {getInitials(driver.fullName)}
                            </span>
                            {driver.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{driver.fullName}</span>
                                <Badge className={cn(NEO.badge, driver.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                                    {driver.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="truncate max-w-[150px]">{driver.email}</span>
                                <span>•</span>
                                <span>{driver.phone}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <VehicleIcon className="h-3 w-3" />
                                    {VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || 'Véhicule'}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-[#0B676E]">{stats.totalDeliveries} missions</span>
                                <span>•</span>
                                <span className="font-medium text-emerald-600">{stats.successRate}% succès</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            className={NEO.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditDriver(driver);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            className={NEO.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (driver.phone) {
                                    window.open(`tel:${driver.phone}`, '_self');
                                }
                            }}
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className={NEO.button} onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                <DropdownMenuItem onClick={() => handleViewDriverDetails(driver)} className="rounded-xl focus:bg-[#0B676E]/10">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDriverHistory(driver)} className="rounded-xl focus:bg-[#0B676E]/10">
                                    <History className="h-4 w-4 mr-2" />
                                    Historique
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/40" />
                                <DropdownMenuItem 
                                    onClick={() => handleToggleDriverStatus(driver)}
                                    className={cn(
                                        "rounded-xl",
                                        driver.isActive ? "text-red-600 focus:bg-red-50" : "text-emerald-600 focus:bg-emerald-50"
                                    )}
                                >
                                    {driver.isActive ? (
                                        <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Désactiver
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Activer
                                        </>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        );
    };

    // ✅ FANOVANA 4 : Compteurs
    const activeCount = deliveryPersons.filter(d => d.isActive).length;
    const inactiveCount = deliveryPersons.filter(d => !d.isActive).length;
    const totalCount = deliveryPersons.length;

    return (
        <TooltipProvider>
            <div className="space-y-6 p-3 sm:p-4 md:p-6 bg-[#eef2f5] min-h-screen">

                {/* ==========================================================
                    EN-TÊTE NEOMORPHIQUE
                ========================================================== */}
                <div className={NEO.card}>
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                Équipe de Livraison
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Gérez vos livreurs et optimisez vos performances de livraison</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Rechercher un livreur..."
                                    className={cn(NEO.input, "pl-10")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className={NEO.button}>
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filtre
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                        <DropdownMenuLabel className="text-slate-700">Filtrer par statut</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-white/40" />
                                        
                                        {/* ✅ FANOVANA 5 : "Tous" dia ACTIVE ihany */}
                                        <DropdownMenuItem onClick={() => setFilterActive("all")} className="rounded-xl focus:bg-[#0B676E]/10">
                                            <Check className={cn("h-4 w-4 mr-2", filterActive === "all" ? "opacity-100 text-[#0B676E]" : "opacity-0")} />
                                            ✅ Tous les livreurs ({activeCount})
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => setFilterActive("active")} className="rounded-xl focus:bg-[#0B676E]/10">
                                            <Check className={cn("h-4 w-4 mr-2", filterActive === "active" ? "opacity-100 text-[#0B676E]" : "opacity-0")} />
                                            ✅ Actifs ({activeCount})
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => setFilterActive("inactive")} className="rounded-xl focus:bg-[#0B676E]/10">
                                            <Check className={cn("h-4 w-4 mr-2", filterActive === "inactive" ? "opacity-100 text-[#0B676E]" : "opacity-0")} />
                                            ❌ Inactifs ({inactiveCount})
                                        </DropdownMenuItem>
                                        
                                        {/* ✅ FANOVANA 6 : Option pour voir tout (ACTIF + INACTIF) */}
                                        <DropdownMenuSeparator className="bg-white/40" />
                                        <DropdownMenuItem onClick={() => setFilterActive("all_include_inactive")} className="rounded-xl focus:bg-[#0B676E]/10 text-slate-500">
                                            <Check className={cn("h-4 w-4 mr-2", filterActive === "all_include_inactive" ? "opacity-100 text-[#0B676E]" : "opacity-0")} />
                                            📋 Tout voir ({totalCount})
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <Button onClick={handleAddNewDriver} className={NEO.buttonPrimary}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau livreur
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==========================================================
                    DASHBOARD DES PERFORMANCES NEOMORPHIQUE
                ========================================================== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={NEO.card}>
                        <div className="p-4 sm:p-5 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#0B676E]/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
                            <div className="flex items-center justify-between relative">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Livreurs Actifs</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                                        {globalStats.activeDrivers}<span className="text-sm font-normal text-slate-500 ml-2">/ {globalStats.totalDrivers}</span>
                                    </p>
                                    <div className="flex items-center mt-3">
                                        <div className="w-full bg-[#eef2f5] rounded-full h-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                            <div 
                                                className="bg-gradient-to-r from-[#0B676E] to-teal-400 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${globalStats.activeRate}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-[#0B676E] ml-3">{globalStats.activeRate}%</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-[#0B676E]/20 to-[#0B676E]/10 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#0B676E]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={NEO.card}>
                        <div className="p-4 sm:p-5 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
                            <div className="flex items-center justify-between relative">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Taux de Réussite</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{globalStats.successRate}%</p>
                                    <div className="flex items-center mt-3">
                                        <div className="flex items-center text-sm text-emerald-600">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            <span>Performance optimale</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-emerald-100/30 to-emerald-50 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={NEO.card}>
                        <div className="p-4 sm:p-5 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
                            <div className="flex items-center justify-between relative">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Livraisons du Mois</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{globalStats.monthlyDeliveries}</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        <span className="font-medium text-[#0B676E]">{globalStats.completedDeliveries}</span> terminées au total
                                    </p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-purple-100/30 to-purple-50 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={NEO.card}>
                        <div className="p-4 sm:p-5 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
                            <div className="flex items-center justify-between relative">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Temps Moyen</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{globalStats.avgDeliveryTime}min</p>
                                    <p className="text-xs text-slate-500 mt-2">Par livraison</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-amber-100/30 to-amber-50 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==========================================================
                    PARC DE VÉHICULES NEOMORPHIQUE
                ========================================================== */}
                {Object.keys(globalStats.vehicleDistribution).length > 0 && (
                    <div className={NEO.card}>
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <Truck className="h-5 w-5 text-[#0B676E]" />
                                <h3 className="text-lg font-semibold text-slate-800">Parc de Véhicules</h3>
                                <p className="text-sm text-slate-500">Répartition des types de véhicules dans votre équipe</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                {Object.entries(globalStats.vehicleDistribution).map(([vehicle, count]) => {
                                    const vehicleInfo = VEHICLE_TYPES[vehicle as keyof typeof VEHICLE_TYPES];
                                    const Icon = vehicleInfo?.icon || TruckIcon;
                                    return (
                                        <div key={vehicle} className="flex items-center justify-between p-3 sm:p-4 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                            <div>
                                                <p className="text-xl sm:text-2xl font-bold text-slate-900">{count}</p>
                                                <p className="text-xs sm:text-sm text-slate-600">{vehicleInfo?.label || vehicle}</p>
                                            </div>
                                            <div className="text-[#0B676E]">
                                                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==========================================================
                    BARRE D'OUTILS NEOMORPHIQUE
                ========================================================== */}
                <div className={NEO.card}>
                    <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg", viewMode === "grid" && NEO.buttonPrimary)}
                                    onClick={() => setViewMode("grid")}
                                >
                                    <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg", viewMode === "list" && NEO.buttonPrimary)}
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                            {/* ✅ FANOVANA 7 : Counter mampiseho ny isa */}
                            <span className="text-xs sm:text-sm text-slate-500">
                                <span className="font-medium text-emerald-600">✅ {activeCount}</span>
                                {" actifs • "}
                                <span className="font-medium text-red-400">{inactiveCount}</span>
                                {" inactifs"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Select value={driversPerPage.toString()} onValueChange={(v) => {
                                setDriversPerPage(parseInt(v));
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className={cn(NEO.input, "w-[70px] sm:w-[80px] h-7 sm:h-8 text-xs sm:text-sm")}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                    <SelectItem value="48">48</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className={NEO.button} onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ["users"] });
                            }}>
                                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ==========================================================
                    LISTE DES LIVREURS NEOMORPHIQUE
                ========================================================== */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={NEO.card}>
                                <div className="p-4 sm:p-6">
                                    <Skeleton className="h-40 sm:h-48 w-full rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredDrivers.length > 0 ? (
                    viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {currentDrivers.map((driver) => (
                                <DriverGridCard key={driver.id} driver={driver} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {currentDrivers.map((driver) => (
                                <DriverListItem key={driver.id} driver={driver} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className={NEO.card}>
                        <div className="p-8 sm:p-12 text-center">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                                <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                                {searchQuery ? "Aucun résultat trouvé" : 
                                 filterActive === "all" || filterActive === "active" ? "Aucun livreur actif" :
                                 filterActive === "inactive" ? "Aucun livreur inactif" :
                                 "Aucun livreur enregistré"}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
                                {searchQuery 
                                    ? "Aucun livreur ne correspond à votre recherche."
                                    : filterActive === "all" || filterActive === "active"
                                        ? "Tous les livreurs sont inactifs. Activez-en un ou ajoutez-en un nouveau."
                                        : filterActive === "inactive"
                                            ? "Tous les livreurs sont actifs. Aucun inactif trouvé."
                                            : "Commencez par ajouter votre premier livreur pour optimiser vos livraisons."}
                            </p>
                            {searchQuery ? (
                                <Button variant="outline" className={NEO.button} onClick={() => setSearchQuery("")}>
                                    <X className="h-4 w-4 mr-2" />
                                    Effacer la recherche
                                </Button>
                            ) : (
                                <Button onClick={handleAddNewDriver} className={NEO.buttonPrimary}>
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Ajouter un livreur
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ==========================================================
                    PAGINATION NEOMORPHIQUE
                ========================================================== */}
                <PaginationControls />

                {/* ==========================================================
                    DIALOG POUR AJOUTER UN NOUVEAU LIVREUR NEOMORPHIQUE
                ========================================================== */}
                <Dialog open={isNewDriverOpen} onOpenChange={setIsNewDriverOpen}>
                    <DialogContent className="max-w-[95vw] sm:max-w-[550px] md:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl text-slate-800">
                                <div className="p-2 bg-gradient-to-br from-[#0B676E] to-[#085257] rounded-xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                                Nouveau Livreur
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-slate-500">
                                Remplissez les informations pour ajouter un nouveau livreur à votre équipe
                            </DialogDescription>
                        </DialogHeader>
                        
                        <Tabs defaultValue="personal" className="w-full">
                            <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-2 p-1 rounded-2xl")}>
                                <TabsTrigger value="personal" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
                                    Informations personnelles
                                </TabsTrigger>
                                <TabsTrigger value="professional" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
                                    Détails professionnels
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="personal" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Nom complet *</Label>
                                        <Input
                                            className={NEO.input}
                                            placeholder="Nom et prénom"
                                            value={newDriverData.fullName || ""}
                                            onChange={(e) => setNewDriverData({ ...newDriverData, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Email *</Label>
                                        <Input
                                            type="email"
                                            className={NEO.input}
                                            placeholder="email@exemple.com"
                                            value={newDriverData.email || ""}
                                            onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Téléphone *</Label>
                                        <Input
                                            className={NEO.input}
                                            placeholder="+261 32 00 000 00"
                                            value={newDriverData.phone || ""}
                                            onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Nom d'utilisateur</Label>
                                        <Input
                                            className={NEO.input}
                                            placeholder="Généré automatiquement"
                                            value={newDriverData.username || ""}
                                            onChange={(e) => setNewDriverData({ ...newDriverData, username: e.target.value })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Quartier de résidence *</Label>
                                    <NeighborhoodCombobox
                                        value={newDriverData.neighborhood || ""}
                                        onSelect={(selectedNeighborhood) => setNewDriverData({ ...newDriverData, neighborhood: selectedNeighborhood })}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Complément d'adresse</Label>
                                    <Input
                                        className={NEO.input}
                                        placeholder="Lot, rue, bâtiment, numéro..."
                                        value={newDriverData.addressDetails || ""}
                                        onChange={(e) => setNewDriverData({ ...newDriverData, addressDetails: e.target.value })}
                                    />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="professional" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Type de véhicule *</Label>
                                        <Select 
                                            value={newDriverData.vehicleType || "motorcycle"} 
                                            onValueChange={(value) => {
                                                const validValue = validateVehicleType(value);
                                                const vehicleInfo = VEHICLE_TYPES[validValue];
                                                setNewDriverData({ 
                                                    ...newDriverData, 
                                                    vehicleType: validValue,
                                                    capacityInItems: vehicleInfo.capacity
                                                });
                                            }}
                                        >
                                            <SelectTrigger className={NEO.input}>
                                                <SelectValue placeholder="Sélectionner un véhicule" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                                {Object.entries(VEHICLE_TYPES).map(([value, data]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {data.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-slate-700">Capacité (articles)</Label>
                                        <Input
                                            type="number"
                                            className={NEO.input}
                                            value={newDriverData.capacityInItems || VEHICLE_TYPES[validateVehicleType(newDriverData.vehicleType)].capacity}
                                            onChange={(e) => setNewDriverData({ ...newDriverData, capacityInItems: parseInt(e.target.value) || 200 })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Zones de livraison préférées</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Antananarivo Centre", "Analakely", "67 Ha", "Ambohidratrimo", "Ivato", "Andraharo", "Ankazobe", "Behoririka"].map((zone) => (
                                            <div key={zone} className="flex items-center space-x-2 p-2 border border-white/40 rounded-2xl hover:bg-white/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                                <Checkbox
                                                    id={`zone-${zone}`}
                                                    checked={newDriverData.preferredZones?.includes(zone) || false}
                                                    onCheckedChange={(checked) => {
                                                        const zones = newDriverData.preferredZones || [];
                                                        if (checked) {
                                                            setNewDriverData({ ...newDriverData, preferredZones: [...zones, zone] });
                                                        } else {
                                                            setNewDriverData({ ...newDriverData, preferredZones: zones.filter((z: string) => z !== zone) });
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`zone-${zone}`} className="text-xs sm:text-sm cursor-pointer flex-1 text-slate-700">
                                                    {zone}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Mot de passe *</Label>
                                    <Input
                                        type="password"
                                        className={NEO.input}
                                        value={newDriverData.password || ""}
                                        onChange={(e) => setNewDriverData({ ...newDriverData, password: e.target.value })}
                                        placeholder="Mot de passe sécurisé"
                                    />
                                </div>
                                
                                {newDriverData.neighborhood && (
                                    <div className="bg-gradient-to-r from-[#0B676E]/10 to-[#0B676E]/5 p-3 sm:p-4 rounded-2xl border border-[#0B676E]/20 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                        <div className="flex items-center mb-2">
                                            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E] mr-2" />
                                            <p className="font-semibold text-[#0B676E] text-sm sm:text-base">Recommandations</p>
                                        </div>
                                        <div className="space-y-1.5 text-xs sm:text-sm text-[#0B676E]">
                                            <p>✓ Zone optimale pour débuter: {newDriverData.neighborhood}</p>
                                            <p>✓ Capacité recommandée: {newDriverData.capacityInItems || 200} articles</p>
                                            <p>✓ Formation sécurité conseillée</p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                        
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                            <Button variant="outline" className={NEO.button} onClick={() => setIsNewDriverOpen(false)}>
                                Annuler
                            </Button>
                            <Button 
                                onClick={handleSubmitNewDriver}
                                disabled={effectiveCreateDriverMutation.isPending}
                                className={NEO.buttonPrimary}
                            >
                                {effectiveCreateDriverMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Créer le livreur
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ==========================================================
                    DIALOG POUR LE PROFIL DÉTAILLÉ NEOMORPHIQUE
                ========================================================== */}
                <Dialog open={isDriverDetailsOpen} onOpenChange={setIsDriverDetailsOpen}>
                    <DialogContent className="max-w-[95vw] sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                        {selectedDriver && (
                            <>
                                <DialogHeader className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={cn(
                                                "relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                                                selectedDriver.avatarColor
                                            )}>
                                                <span className="text-white font-bold text-lg sm:text-2xl">
                                                    {getInitials(selectedDriver.fullName)}
                                                </span>
                                                {selectedDriver.isActive && (
                                                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full border-2 sm:border-4 border-[#eef2f5] shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] flex items-center justify-center">
                                                        <Check className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl sm:text-2xl text-slate-800">{selectedDriver.fullName}</DialogTitle>
                                                <DialogDescription className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500">
                                                    <span>ID: #{selectedDriver.id}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">{selectedDriver.email}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                                
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-3 p-1 rounded-2xl")}>
                                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
                                            Aperçu
                                        </TabsTrigger>
                                        <TabsTrigger value="stats" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
                                            Statistiques
                                        </TabsTrigger>
                                        <TabsTrigger value="missions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
                                            Missions
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="overview" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className={NEO.card}>
                                                <div className="p-3 sm:p-4">
                                                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Informations personnelles</h3>
                                                    <div className="space-y-3 sm:space-y-4">
                                                        <div>
                                                            <Label className="text-xs sm:text-sm text-slate-500">Téléphone principal</Label>
                                                            <p className="font-medium text-base sm:text-lg text-slate-900">{selectedDriver.phone}</p>
                                                        </div>
                                                        {selectedDriver.phone2 && (
                                                            <div>
                                                                <Label className="text-xs sm:text-sm text-slate-500">Téléphone secondaire</Label>
                                                                <p className="font-medium text-base sm:text-lg text-slate-900">{selectedDriver.phone2}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <Label className="text-xs sm:text-sm text-slate-500">Adresse</Label>
                                                            <p className="font-medium text-base sm:text-lg text-slate-900 break-words">
                                                                {selectedDriver.addressDetails ? `${selectedDriver.addressDetails}, ` : ''}
                                                                {selectedDriver.neighborhood || 'Non spécifiée'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className={NEO.card}>
                                                <div className="p-3 sm:p-4">
                                                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Informations professionnelles</h3>
                                                    <div className="space-y-3 sm:space-y-4">
                                                        <div>
                                                            <Label className="text-xs sm:text-sm text-slate-500">Véhicule</Label>
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    const Icon = VEHICLE_TYPES[selectedDriver.vehicleType as keyof typeof VEHICLE_TYPES]?.icon || TruckIcon;
                                                                    return <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#0B676E]" />;
                                                                })()}
                                                                <p className="font-medium text-base sm:text-lg text-slate-900">
                                                                    {VEHICLE_TYPES[selectedDriver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || "Non spécifié"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs sm:text-sm text-slate-500">Capacité maximale</Label>
                                                            <p className="font-medium text-base sm:text-lg text-slate-900">{selectedDriver.capacityInItems || 200} articles</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs sm:text-sm text-slate-500">Zones préférées</Label>
                                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                                                {selectedDriver.preferredZones?.map((zone, index) => (
                                                                    <Badge key={index} className={cn(NEO.badge, "bg-[#0B676E]/10 text-[#0B676E] text-xs")}>
                                                                        {zone}
                                                                    </Badge>
                                                                )) || <span className="text-xs sm:text-sm text-slate-500">Aucune zone spécifiée</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className={NEO.card}>
                                            <div className="p-3 sm:p-4">
                                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Statut du compte</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                    <div>
                                                        <Label className="text-xs sm:text-sm text-slate-500">Statut</Label>
                                                        <Badge 
                                                            className={cn(
                                                                "mt-1.5 sm:mt-2 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-1.5",
                                                                NEO.badge,
                                                                selectedDriver.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                                            )}
                                                        >
                                                            {selectedDriver.isActive ? '✅ Actif' : '❌ Inactif'}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs sm:text-sm text-slate-500">Inscrit le</Label>
                                                        <p className="font-medium text-sm sm:text-base text-slate-900">
                                                            {format(new Date(selectedDriver.createdAt), "dd MMMM yyyy", { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="stats" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                                        {(() => {
                                            const stats = calculateDriverStats(selectedDriver);
                                            return (
                                                <>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                                        <div className="text-center p-2 sm:p-4 bg-[#0B676E]/10 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                                            <p className="text-xl sm:text-3xl font-bold text-[#0B676E]">{stats.totalDeliveries}</p>
                                                            <p className="text-[10px] sm:text-sm text-[#0B676E]">Total missions</p>
                                                        </div>
                                                        <div className="text-center p-2 sm:p-4 bg-emerald-100/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                                            <p className="text-xl sm:text-3xl font-bold text-emerald-700">{stats.successRate}%</p>
                                                            <p className="text-[10px] sm:text-sm text-emerald-600">Taux de succès</p>
                                                        </div>
                                                        <div className="text-center p-2 sm:p-4 bg-purple-100/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                                            <p className="text-xl sm:text-3xl font-bold text-purple-700">{stats.monthlyDeliveries}</p>
                                                            <p className="text-[10px] sm:text-sm text-purple-600">Ce mois-ci</p>
                                                        </div>
                                                        <div className="text-center p-2 sm:p-4 bg-amber-100/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                                            <p className="text-xl sm:text-3xl font-bold text-amber-700">{stats.avgDeliveryTime}min</p>
                                                            <p className="text-[10px] sm:text-sm text-amber-600">Temps moyen</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={NEO.card}>
                                                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                                            <div>
                                                                <Label className="text-xs sm:text-sm text-slate-500">Performance globale</Label>
                                                                <div className="flex flex-wrap items-center justify-between mt-1.5 sm:mt-2">
                                                                    <div className="flex">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star 
                                                                                key={i}
                                                                                className={cn(
                                                                                    "h-5 w-5 sm:h-6 sm:w-6",
                                                                                    i < Math.floor(stats.performanceScore) ? "text-amber-500 fill-amber-500" : "text-slate-300"
                                                                                )}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-base sm:text-lg font-bold text-slate-900">{stats.performanceScore.toFixed(1)}/5</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-xs sm:text-sm text-slate-500">Distance totale parcourue</Label>
                                                                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.totalDistance} km</p>
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-xs sm:text-sm text-slate-500">Revenu estimé généré</Label>
                                                                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.revenueGenerated.toFixed(2)} €</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </TabsContent>
                                    
                                    <TabsContent value="missions" className="space-y-3 sm:space-y-4 pt-4 sm:pt-6">
                                        <div className="space-y-2 sm:space-y-3">
                                            {deliveries
                                                .filter(d => d.deliveryPersonId === selectedDriver.id)
                                                .slice(0, 5)
                                                .map((delivery) => {
                                                    const order = orders.find(o => o.id === delivery.orderId);
                                                    const client = order ? users.find(u => u.id === order.clientId) : null;
                                                    
                                                    return (
                                                        <div key={delivery.id} className={NEO.card}>
                                                            <div className="p-3 sm:p-4">
                                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                                                    <div>
                                                                        <p className="font-medium text-sm sm:text-base text-slate-900">Commande #{order?.id || 'N/A'}</p>
                                                                        <p className="text-xs sm:text-sm text-slate-500">
                                                                            Client: {client?.fullName || 'Inconnu'}
                                                                        </p>
                                                                    </div>
                                                                    <Badge 
                                                                        className={cn(
                                                                            NEO.badge,
                                                                            delivery.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                                                                            delivery.status === "failed" ? "bg-red-100 text-red-800" :
                                                                            "bg-amber-100 text-amber-800"
                                                                        )}
                                                                    >
                                                                        {delivery.status === "completed" ? "Terminée" :
                                                                         delivery.status === "in_progress" ? "En cours" :
                                                                         delivery.status === "failed" ? "Échec" : delivery.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-slate-600">
                                                                    {delivery.type === 'pickup' ? 'Ramassage' : 'Livraison'} • 
                                                                    {delivery.scheduledDate && ` Programmé: ${format(new Date(delivery.scheduledDate), "dd/MM HH:mm", { locale: fr })}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        
                                        <Button 
                                            variant="outline" 
                                            className={NEO.button}
                                            onClick={() => {
                                                handleViewDriverHistory(selectedDriver);
                                                setIsDriverDetailsOpen(false);
                                            }}
                                        >
                                            <History className="h-4 w-4 mr-2" />
                                            Voir tout l'historique ({deliveries.filter(d => d.deliveryPersonId === selectedDriver.id).length} missions)
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                                
                                <DialogFooter className="flex flex-wrap gap-2 pt-4 sm:pt-6 border-t border-white/40">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            NEO.button,
                                            selectedDriver.isActive ? "border-red-300 text-red-700" : "border-emerald-300 text-emerald-700"
                                        )}
                                        onClick={() => handleToggleDriverStatus(selectedDriver)}
                                        disabled={effectiveEditDriverMutation.isPending}
                                    >
                                        {effectiveEditDriverMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
                                        {selectedDriver.isActive ? 'Désactiver' : 'Activer'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={NEO.button}
                                        onClick={() => {
                                            handleEditDriver(selectedDriver);
                                            setIsDriverDetailsOpen(false);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                    </Button>
                                    <Button 
                                        className={NEO.buttonPrimary}
                                        onClick={() => window.open(`tel:${selectedDriver.phone}`, '_self')}
                                    >
                                        <Phone className="h-4 w-4 mr-2" />
                                        Appeler
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ==========================================================
                    DIALOG POUR MODIFIER UN LIVREUR NEOMORPHIQUE
                ========================================================== */}
                <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
                    <DialogContent className="max-w-[95vw] sm:max-w-[550px] md:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl sm:text-2xl text-slate-800">Modifier le livreur</DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-slate-500">
                                Mettez à jour les informations du livreur
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmitEditDriver(); }} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Nom d'utilisateur</Label>
                                    <Input
                                        className={NEO.input}
                                        value={editDriverData.username || ""}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Nom complet *</Label>
                                    <Input
                                        className={NEO.input}
                                        value={editDriverData.fullName || ""}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Email *</Label>
                                    <Input
                                        type="email"
                                        className={NEO.input}
                                        value={editDriverData.email || ""}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Téléphone *</Label>
                                    <Input
                                        className={NEO.input}
                                        value={editDriverData.phone || ""}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Quartier</Label>
                                    <NeighborhoodCombobox
                                        value={editDriverData.neighborhood || ""}
                                        onSelect={(selectedNeighborhood) => setEditDriverData({ ...editDriverData, neighborhood: selectedNeighborhood })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Type de véhicule *</Label>
                                    <Select 
                                        value={editDriverData.vehicleType || "motorcycle"}
                                        onValueChange={(value) => {
                                            console.log("Vehicle type selected in form:", value);
                                            setEditDriverData({ 
                                                ...editDriverData, 
                                                vehicleType: value 
                                            });
                                        }}
                                    >
                                        <SelectTrigger className={NEO.input}>
                                            <SelectValue placeholder="Sélectionner un véhicule">
                                                {VEHICLE_TYPES[editDriverData.vehicleType as keyof typeof VEHICLE_TYPES]?.label || "Sélectionner..."}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                            {Object.entries(VEHICLE_TYPES).map(([value, data]) => (
                                                <SelectItem key={value} value={value}>
                                                    {data.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Capacité (articles)</Label>
                                    <Input
                                        type="number"
                                        className={NEO.input}
                                        value={editDriverData.capacityInItems || 200}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, capacityInItems: parseInt(e.target.value) || 200 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-700">Téléphone secondaire</Label>
                                    <Input
                                        className={NEO.input}
                                        value={editDriverData.phone2 || ""}
                                        onChange={(e) => setEditDriverData({ ...editDriverData, phone2: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-700">Complément d'adresse</Label>
                                <Input
                                    className={NEO.input}
                                    value={editDriverData.addressDetails || ""}
                                    onChange={(e) => setEditDriverData({ ...editDriverData, addressDetails: e.target.value })}
                                    placeholder="Lot, rue, bâtiment, numéro..."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-700">Nouveau mot de passe (optionnel)</Label>
                                <Input
                                    type="password"
                                    className={NEO.input}
                                    value={editDriverData.password || ""}
                                    onChange={(e) => setEditDriverData({ ...editDriverData, password: e.target.value })}
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-700">Zones de livraison préférées</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Antananarivo Centre", "Analakely", "67 Ha", "Ambohidratrimo", "Ivato", "Andraharo", "Ankazobe", "Behoririka"].map((zone) => (
                                        <div key={zone} className="flex items-center space-x-2 p-2 border border-white/40 rounded-2xl hover:bg-white/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                            <Checkbox
                                                id={`edit-zone-${zone}`}
                                                checked={editDriverData.preferredZones?.includes(zone) || false}
                                                onCheckedChange={(checked) => {
                                                    const zones = editDriverData.preferredZones || [];
                                                    if (checked) {
                                                        setEditDriverData({ ...editDriverData, preferredZones: [...zones, zone] });
                                                    } else {
                                                        setEditDriverData({ ...editDriverData, preferredZones: zones.filter((z: string) => z !== zone) });
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`edit-zone-${zone}`} className="text-xs sm:text-sm cursor-pointer flex-1 text-slate-700">
                                                {zone}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className={NEO.button}
                                    onClick={() => setIsEditDriverOpen(false)}
                                >
                                    Annuler
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={effectiveEditDriverMutation.isPending}
                                    className={NEO.buttonPrimary}
                                >
                                    {effectiveEditDriverMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sauvegarde...
                                        </>
                                    ) : 'Sauvegarder'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ==========================================================
                    DIALOG POUR L'HISTORIQUE NEOMORPHIQUE
                ========================================================== */}
                <Dialog open={isDriverHistoryOpen} onOpenChange={setIsDriverHistoryOpen}>
                    <DialogContent className="max-w-[95vw] sm:max-w-[700px] md:max-w-[800px] max-h-[80vh] overflow-y-auto p-4 sm:p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-xl sm:text-2xl text-slate-800">Historique des missions</DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-slate-500">
                                {driverHistoryData?.driver?.fullName} • {driverHistoryData?.deliveries?.length || 0} missions
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                            {driverHistoryData?.deliveries && driverHistoryData.deliveries.length > 0 ? (
                                driverHistoryData.deliveries.map((delivery: Delivery) => {
                                    const order = orders.find(o => o.id === delivery.orderId);
                                    const client = order ? users.find(u => u.id === order.clientId) : null;
                                    
                                    return (
                                        <div key={delivery.id} className={NEO.card}>
                                            <div className="p-3 sm:p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                                    <div>
                                                        <p className="font-medium text-sm sm:text-base text-slate-900">Commande #{order?.id || 'N/A'}</p>
                                                        <p className="text-xs sm:text-sm text-slate-500">
                                                            Client: {client?.fullName || 'Inconnu'}
                                                        </p>
                                                    </div>
                                                    <Badge 
                                                        className={cn(
                                                            NEO.badge,
                                                            delivery.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                                                            delivery.status === "failed" ? "bg-red-100 text-red-800" :
                                                            "bg-amber-100 text-amber-800"
                                                        )}
                                                    >
                                                        {delivery.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs sm:text-sm text-slate-600">
                                                    {delivery.type === 'pickup' ? 'Ramassage' : 'Livraison'} • 
                                                    {delivery.scheduledDate && ` Programmé: ${format(new Date(delivery.scheduledDate), "dd/MM/yyyy HH:mm", { locale: fr })}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-slate-500">
                                    <History className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-slate-300" />
                                    <p className="text-sm sm:text-base">Aucun historique de missions</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
};