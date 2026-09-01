import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Settings,
  Clock,
  Calendar,
} from "lucide-react";

// ============================================================
// INTERFACES
// ============================================================

interface SubscriptionPlan {
  name: string;
  pricePerMonth: string | number;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features?: string[];
}

interface SubscriptionDisplay {
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string;

  // Compatibilité anciennes données
  preferredPickupDay?: string;
  preferredPickupTime?: string;

  plan?: SubscriptionPlan | null;
}

interface SubscriptionViewProps {
  subscription?: SubscriptionDisplay | null;
  onUpgrade: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function SubscriptionView({
  subscription,
  onUpgrade,
}: SubscriptionViewProps) {
  // ============================================================
  // CAS 1 : PAS D'ABONNEMENT
  // ============================================================

  if (!subscription) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-transparent shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Aucun Abonnement Actif
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-slate-500 mb-4">
                Vous n'êtes actuellement abonné à aucun plan.
              </p>

              <Button onClick={onUpgrade} size="lg">
                Voir les plans disponibles
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================
  // CAS 2 : ABONNEMENT EXISTANT MAIS PLAN MANQUANT
  // ============================================================

  if (!subscription.plan) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-transparent shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Plan indisponible
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-slate-500 mb-4">
                Votre abonnement existe, mais le plan associé
                n'est actuellement pas disponible.
              </p>

              <Button onClick={onUpgrade} size="lg">
                Choisir un nouveau plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================
  // PLAN DISPONIBLE
  // ============================================================

  const plan = subscription.plan;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-transparent shadow-none border-none">

          {/* ======================================================
              HEADER
          ====================================================== */}

          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-3xl font-bold">
              Détails de l'Abonnement
            </CardTitle>

            <Button
              onClick={onUpgrade}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Modifier mon abonnement
            </Button>
          </CardHeader>

          <CardContent className="mt-2 space-y-8">

            {/* ====================================================
                INFORMATIONS DU PLAN
            ==================================================== */}

            <div className="grid md:grid-cols-2 gap-8">

              <div>
                <h3 className="text-2xl font-bold text-cyan-600">
                  {plan.name || "Plan sans nom"}
                </h3>

                <p className="text-slate-500 text-lg">
                  {plan.pricePerMonth ?? 0} Ar/mois
                </p>

                <Badge className="mt-2 bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>

              {/* ==================================================
                  AVANTAGES
              ================================================== */}

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">
                  Vos avantages :
                </h4>

                <ul className="space-y-2">

                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-[var(--secondary)]" />
                    {plan.itemsIncluded ?? 0} pièces incluses par mois
                  </li>

                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-[var(--secondary)]" />
                    {plan.pickupsPerWeek ?? 0} ramassage(s) par semaine
                  </li>

                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-[var(--secondary)]" />
                    Livraison express en {plan.deliveryTimeHours ?? 0}h
                  </li>

                  {Array.isArray(plan.features) &&
                    plan.features.map((feature, index) => (
                      <li
                        key={`${feature}-${index}`}
                        className="flex items-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-2 text-[var(--secondary)]" />
                        {feature}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* ====================================================
                PREFERENCES DE RAMASSAGE
            ==================================================== */}

            <div className="pt-6 border-t">

              <h4 className="font-semibold text-lg mb-4">
                Vos Préférences de Ramassage
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                {/* ==================================================
                    JOURS
                ================================================== */}

                <div className="flex items-start gap-3">

                  <Calendar className="h-5 w-5 text-[var(--accent)] mt-1" />

                  <div>

                    <p className="font-medium text-slate-600">
                      Jours de ramassage
                    </p>

                    {Array.isArray(subscription.preferredPickupDays) &&
                    subscription.preferredPickupDays.length > 0 ? (

                      <div className="flex flex-wrap gap-2 mt-2">
                        {subscription.preferredPickupDays.map(
                          (day, index) => (
                            <Badge
                              key={`${day}-${index}`}
                              variant="secondary"
                              className="capitalize"
                            >
                              {day}
                            </Badge>
                          )
                        )}
                      </div>

                    ) : subscription.preferredPickupDay ? (

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="capitalize"
                        >
                          {subscription.preferredPickupDay}
                        </Badge>
                      </div>

                    ) : (

                      <p className="text-slate-500">
                        Aucun jour défini.
                      </p>

                    )}

                  </div>
                </div>

                {/* ==================================================
                    HEURE
                ================================================== */}

                <div className="flex items-start gap-3">

                  <Clock className="h-5 w-5 text-[var(--accent)] mt-1" />

                  <div>

                    <p className="font-medium text-slate-600">
                      Heure préférée
                    </p>

                    {subscription.preferredTimeWindowStart &&
                    subscription.preferredTimeWindowEnd ? (

                      <p className="font-semibold text-slate-800">
                        {subscription.preferredTimeWindowStart}
                        {" - "}
                        {subscription.preferredTimeWindowEnd}
                      </p>

                    ) : subscription.preferredPickupTime ? (

                      <p className="font-semibold text-slate-800">
                        {subscription.preferredPickupTime}
                      </p>

                    ) : (

                      <p className="text-slate-500">
                        Aucune heure définie.
                      </p>

                    )}

                  </div>
                </div>

              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}