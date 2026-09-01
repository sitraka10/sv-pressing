# Architecture des routes SV Pressing

## Structure finale
server/
├── routes/
│   ├── index.ts                  # Point d'entrée : registerAllRoutes(app)
│   ├── orders.routes.ts          # GET/POST/PATCH /api/orders, /api/orders/late, /api/orders/check-late, /api/orders/:id/resolve-late
│   ├── invoices.routes.ts        # /api/invoices + PDF + generate-monthly
│   ├── users.routes.ts           # /api/users, /api/clients, /api/users/delivery-persons, /api/user/profile
│   ├── subscriptions.routes.ts   # /api/subscription-plans, /api/subscriptions, /api/plan-selection, /api/pending-subscriptions
│   ├── deliveries.routes.ts      # /api/deliveries, /api/pickups, /api/delivery-schedules
│   ├── routes.routes.ts          # /api/routes/distribute-tasks, /api/routes/generate-pickup-route
│   ├── analytics.routes.ts       # /api/dashboard/stats, /api/analytics/*, /api/sla/*, /api/supervisor/*
│   ├── expenses.routes.ts        # /api/expenses CRUD
│   ├── notifications.routes.ts   # /api/notifications, /api/devices/*
│   ├── notes.routes.ts           # /api/orders/:id/notes, /api/clients/:id/notes-history
│   ├── quotes.routes.ts          # /api/custom-quotes
│   └── seo.routes.ts             # Sitemaps, robots.txt, manifest, security.txt
│
├── services/
│   ├── sla.service.ts            # calculateSLALevel, formatTimeRemaining, WORKFLOW_STEPS
│   └── late-detection.service.ts # isOrderLate, getLateType, recordLateDetection, recordLateResolution
│
├── middleware/
│   └── auth.middleware.ts        # requireAuth, requireRole
│
