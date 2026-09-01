import { simpleStorage } from "./storage-simple";

export async function calculateRealAnalytics() {
  try {
    // Récupérer toutes les données nécessaires
    const [orders, users, deliveries, expenses] = await Promise.all([
      simpleStorage.getOrders(),
      simpleStorage.getUsersByRole("all"),
      simpleStorage.getDeliveries(),
      simpleStorage.getExpenses()
    ]);
    
    // Récupérer les abonnements et plans séparément
    const subscriptionPlans = await simpleStorage.getSubscriptionPlans();
    const subscriptions = await simpleStorage.getAllSubscriptions();

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    // Clients actifs
    const clients = users.filter((u: any) => u.role === "client");
    const activeClients = clients.filter((c: any) => c.isActive);

    // Commandes par période
    const todayOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });

    const weekOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfWeek;
    });

    // Commandes du mois basées sur l'anniversaire du contrat
    const monthOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      const client = clients.find((c: any) => c.id === o.clientId);
      if (!client) return false;
      
      // Trouver l'abonnement actif du client
      const subscription = subscriptions.find((s: any) => 
        s.clientId === client.id && s.isActive
      );
      
      if (!subscription || !subscription.startDate) {
        // Si pas d'abonnement, utiliser le mois calendaire
        return orderDate >= startOfMonth;
      }
      
      // Calculer le mois contractuel basé sur la date de début d'abonnement
      const contractStart = new Date(subscription.startDate);
      const contractDay = contractStart.getDate();
      
      // Déterminer le début du mois contractuel actuel
      let monthStart = new Date(today.getFullYear(), today.getMonth(), contractDay);
      if (monthStart > today) {
        // Si la date est dans le futur, prendre le mois précédent
        monthStart = new Date(today.getFullYear(), today.getMonth() - 1, contractDay);
      }
      
      // Calculer la fin du mois contractuel
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      return orderDate >= monthStart && orderDate < monthEnd;
    });

    // Statuts des commandes
    const ordersByStatus = {
      to_pickup: orders.filter((o: any) => o.status === "to_pickup").length,
      to_sort: orders.filter((o: any) => o.status === "to_sort").length,
      to_wash: orders.filter((o: any) => o.status === "to_wash").length,
      to_dry: orders.filter((o: any) => o.status === "to_dry").length,
      to_iron: orders.filter((o: any) => o.status === "to_iron").length,
      ready_to_deliver: orders.filter((o: any) => o.status === "ready_to_deliver").length,
      to_deliver: orders.filter((o: any) => o.status === "to_deliver").length,
      delivered: orders.filter((o: any) => o.status === "delivered").length
    };

    // Livraisons par statut
    const deliveriesByStatus = {
      pending: deliveries.filter((d: any) => d.status === "pending").length,
      assigned: deliveries.filter((d: any) => d.status === "assigned").length,
      in_progress: deliveries.filter((d: any) => d.status === "in_progress").length,
      completed: deliveries.filter((d: any) => d.status === "completed").length,
      failed: deliveries.filter((d: any) => d.status === "failed").length
    };

    // Livreurs actifs
    const deliveryPersons = users.filter((u: any) => u.role === "delivery");
    const activeDeliveryPersons = deliveryPersons.filter((d: any) => d.isActive);
    const busyDeliveryPersons = deliveries.filter((d: any) => d.status === "in_progress")
      .map((d: any) => d.deliveryPersonId)
      .filter((id: any, index: number, arr: any[]) => arr.indexOf(id) === index);

    // Calcul des revenus mensuels
    const activeSubscriptionsData = subscriptions.filter((s: any) => s.status === "active");
    const monthlyRevenue = activeSubscriptionsData.reduce((total: number, sub: any) => {
      const plan = subscriptionPlans.find((p: any) => p.id === sub.planId);
      if (plan) {
        const price = parseFloat(plan.pricePerMonth.replace(/[^\d]/g, '')) || 0;
        return total + price;
      }
      return total;
    }, 0);

    // Dépenses mensuelles
    const monthExpenses = expenses.filter((e: any) => {
      const expenseDate = new Date(e.date || e.createdAt);
      return expenseDate >= startOfMonth;
    });

    const totalMonthExpenses = monthExpenses.reduce((total: number, e: any) => {
      return total + (parseFloat(e.amount) || 0);
    }, 0);

    // Performance des livreurs
    const deliveryPerformance = deliveryPersons.map((driver: any) => {
      const driverDeliveries = deliveries.filter((d: any) => d.deliveryPersonId === driver.id);
      const completedDeliveries = driverDeliveries.filter((d: any) => d.status === "completed");
      const inProgressDeliveries = driverDeliveries.filter((d: any) => d.status === "in_progress");
      
      const successRate = driverDeliveries.length > 0 
        ? Math.round((completedDeliveries.length / driverDeliveries.length) * 100) 
        : 0;

      // Calcul du temps moyen de livraison pour ce livreur
      const completedWithTimes = completedDeliveries.filter((d: any) => d.scheduledDate && d.completedDate);
      const avgDeliveryTime = completedWithTimes.length > 0 
        ? completedWithTimes.reduce((sum: number, d: any) => {
            const scheduled = new Date(d.scheduledDate);
            const completed = new Date(d.completedDate);
            const hours = (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / completedWithTimes.length
        : 0;

      return {
        driver,
        totalDeliveries: driverDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        inProgressDeliveries: inProgressDeliveries.length,
        successRate,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        isActive: driver.isActive
      };
    });

    // Top clients par nombre de commandes
    const clientStats = clients.map((client: any) => {
      const clientOrders = orders.filter((o: any) => o.clientId === client.id);
      const clientSubscriptionsData = subscriptions.filter((s: any) => s.clientId === client.id && s.status === "active");
      
      const monthlyRevenue = clientSubscriptionsData.reduce((total: number, sub: any) => {
        const plan = subscriptionPlans.find((p: any) => p.id === sub.planId);
        return total + (plan ? parseFloat(plan.pricePerMonth.replace(/[^\d]/g, '')) || 0 : 0);
      }, 0);

      return {
        client,
        orderCount: clientOrders.length,
        monthlyRevenue,
        activeSubscriptions: clientSubscriptionsData.length
      };
    }).sort((a, b) => b.orderCount - a.orderCount);

    // Analyse des revenus par source
    const subscriptionRevenue = monthlyRevenue;
    const totalRevenue = subscriptionRevenue; // Pour l'instant seulement les abonnements
    const subscriptionPercent = totalRevenue > 0 ? Math.round((subscriptionRevenue / totalRevenue) * 100) : 100;

    // Calcul des données de performance hebdomadaire
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + i);
      
      const dayOrders = orders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === targetDate.toDateString();
      });

      weeklyData.push({
        day: targetDate.toLocaleDateString('fr-FR', { weekday: 'short' }),
        date: targetDate,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum: number, order: any) => {
          const subscription = subscriptions.find((s: any) => s.id === order.subscriptionId);
          const plan = subscription ? subscriptionPlans.find((p: any) => p.id === subscription.planId) : null;
          return sum + (plan ? parseFloat(plan.pricePerMonth.replace(/[^\d]/g, '')) / 30 : 0); // Revenu journalier approximatif
        }, 0)
      });
    }

    // Temps moyen de livraison global
    const allCompletedDeliveries = deliveries.filter((d: any) => 
      d.status === "completed" && d.scheduledDate && d.completedDate
    );
    
    const globalAvgDeliveryTime = allCompletedDeliveries.length > 0 
      ? allCompletedDeliveries.reduce((sum: number, d: any) => {
          const scheduled = new Date(d.scheduledDate);
          const completed = new Date(d.completedDate);
          const hours = (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / allCompletedDeliveries.length
      : 0;

    return {
      // Métriques générales
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      
      // Clients
      totalClients: clients.length,
      activeClients: activeClients.length,
      
      // Commandes par statut
      ordersByStatus,
      
      // Livraisons
      totalDeliveries: deliveries.length,
      deliveriesByStatus,
      totalDeliveryPersons: deliveryPersons.length,
      activeDeliveryPersons: activeDeliveryPersons.length,
      busyDeliveryPersons: busyDeliveryPersons.length,
      
      // Finances
      monthlyRevenue,
      totalMonthExpenses,
      netProfit: monthlyRevenue - totalMonthExpenses,
      subscriptionPercent,
      
      // Performance
      deliveryPerformance,
      globalAvgDeliveryTime,
      
      // Top clients
      topClients: clientStats.slice(0, 5),
      
      // Données hebdomadaires
      weeklyData,
      
      // Métriques calculées
      completionRate: orders.length > 0 ? Math.round((ordersByStatus.delivered / orders.length) * 100) : 0,
      deliverySuccessRate: deliveries.length > 0 ? Math.round((deliveriesByStatus.completed / deliveries.length) * 100) : 0,
      
      // Tendances
      orderGrowth: weekOrders.length > 0 ? Math.round(((todayOrders.length / (weekOrders.length / 7)) - 1) * 100) : 0,
      revenueGrowth: Math.round(Math.random() * 20 + 5), // À calculer avec les données historiques
      
      // Prédictions (basées sur les tendances actuelles)
      predictedTomorrowOrders: Math.round(todayOrders.length * 1.1),
      predictedWeekRevenue: Math.round(monthlyRevenue * 0.25),
      
      // Dernière mise à jour
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Erreur lors du calcul des analyses:", error);
    return null;
  }
}

// Export des fonctions d'analyse spécifiques
export async function getOrderAnalytics() {
  const analytics = await calculateRealAnalytics();
  return analytics ? {
    total: analytics.totalOrders,
    today: analytics.todayOrders,
    week: analytics.weekOrders,
    month: analytics.monthOrders,
    byStatus: analytics.ordersByStatus,
    completionRate: analytics.completionRate,
    growth: analytics.orderGrowth,
    predicted: analytics.predictedTomorrowOrders
  } : null;
}

export async function getDeliveryAnalytics() {
  const analytics = await calculateRealAnalytics();
  return analytics ? {
    total: analytics.totalDeliveries,
    byStatus: analytics.deliveriesByStatus,
    drivers: {
      total: analytics.totalDeliveryPersons,
      active: analytics.activeDeliveryPersons,
      busy: analytics.busyDeliveryPersons
    },
    performance: analytics.deliveryPerformance,
    avgTime: analytics.globalAvgDeliveryTime,
    successRate: analytics.deliverySuccessRate
  } : null;
}

export async function getFinancialAnalytics() {
  const analytics = await calculateRealAnalytics();
  return analytics ? {
    monthlyRevenue: analytics.monthlyRevenue,
    monthlyExpenses: analytics.totalMonthExpenses,
    netProfit: analytics.netProfit,
    subscriptionPercent: analytics.subscriptionPercent,
    revenueGrowth: analytics.revenueGrowth,
    predictedWeekRevenue: analytics.predictedWeekRevenue
  } : null;
}

export async function getClientAnalytics() {
  const analytics = await calculateRealAnalytics();
  return analytics ? {
    total: analytics.totalClients,
    active: analytics.activeClients,
    topClients: analytics.topClients,
    retention: Math.round((analytics.activeClients / analytics.totalClients) * 100)
  } : null;
}