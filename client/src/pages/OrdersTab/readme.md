src/pages/OrdersTab/
├── index.tsx                     # Composant principal (OrdersTab) - Design Neomorphic + Teal
├── types.ts                      # Interfaces TypeScript (Order, User, metrics, etc.)
├── constants.ts                  # Étapes du workflow, styles, icônes
├── utils/
│   ├── format.tsx                # Formatage des dates et statuts (JSX)
│   ├── sla.ts                    # Calculs SLA et compte à rebours
│   └── bi.ts                     # Métriques BI (performance, alertes, recommandations)
├── hooks/
│   └── useResponsive.ts          # Détection des breakpoints responsives
└── components/
    ├── StatCard.tsx              # Carte de statistique colorée avec effet néomorphique
    ├── MetricCard.tsx            # Carte métrique avec indicateur de tendance
    ├── SLAProgressBar.tsx        # Barre de progression SLA
    ├── SLADisplay.tsx            # Compte à rebours pour une commande
    ├── WorkflowProgressBar.tsx   # Barre de progression étape par étape
    ├── NoteItem.tsx              # Note avec état lu/non lu
    ├── OrderCard.tsx             # Cartes commande (mobile et desktop) avec détails extensibles
    └── PlanningIntelligent.tsx   # Vue planning jour/semaine avec répartition par étape