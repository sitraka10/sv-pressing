# SV Pressing - Service de Pressing Intelligent par Abonnement

## Description du Projet

SV Pressing est une application fullstack moderne de gestion de pressing intelligent par abonnement pour Madagascar. L'application propose un workflow complet de traitement du linge, des interfaces client/admin distinctes et la génération automatique de documents.

## Fonctionnalités Principales

### 🏠 Page d'Accueil Vitrine
- Section héro avec présentation de l'entreprise
- Section "Pourquoi SV Pressing" avec avantages clés
- Plans d'abonnement (Essentiel, Famille, Premium)
- Formulaire de devis personnalisé
- Processus en 8 étapes stylisé
- Accès sécurisé pour le personnel et clients

### 👤 Authentification et Gestion des Utilisateurs
- Système d'authentification complet avec sessions
- Rôles utilisateurs : Admin, Agent, Livreur, Client
- Accès protégé selon les permissions
- Gestion des profils utilisateurs

### 📊 Dashboard Admin Complet
- Gestion des commandes avec suivi en temps réel
- Workflow en 8 étapes : Ramassage → Tri → Lavage → Séchage → Repassage → Contrôle qualité → Livraison → Satisfaction
- Gestion des utilisateurs et assignation de rôles
- Système de notifications intelligent
- Analytics et statistiques avancées
- Gestion des devis personnalisés
- Suivi des sélections de plans

### 🛡️ Dashboard Client Moderne
- Suivi en temps réel du linge
- Historique des commandes
- Gestion de l'abonnement
- Interface de contact et support

### 🚚 Gestion des Livraisons
- Planification des tournées de livraison
- Assignation des livreurs
- Suivi GPS et optimisation des routes
- Gestion des créneaux de livraison

### 💰 Système de Facturation et Contrats
- Génération automatique de factures
- Gestion des contrats d'abonnement
- Suivi des paiements
- Modèles de contrats personnalisables

### 📈 Gestion des Dépenses
- Suivi des coûts opérationnels
- Catégorisation des dépenses
- Reporting financier
- Analytics de rentabilité

## Architecture Technique

### Stack Technologique
- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL avec Drizzle ORM
- **UI Components** : shadcn/ui + Radix UI
- **Authentification** : Passport.js avec sessions
- **Build Tool** : Vite
- **Styling** : Tailwind CSS + shadcn/ui

### Structure du Projet
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants UI réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks React personnalisés
│   │   └── lib/           # Utilitaires et configuration
├── server/                 # Backend Express
│   ├── auth.ts            # Configuration authentification
│   ├── routes.ts          # Routes API
│   ├── storage.ts         # Interface de stockage
│   ├── database-storage.ts # Implémentation PostgreSQL
│   └── db.ts              # Configuration base de données
├── shared/                 # Code partagé
│   └── schema.ts          # Schémas Drizzle et types
└── README.md
```

Structure plate mais monorepo



## Base de Données

### Tables Principales
- **users** : Utilisateurs avec rôles (admin, agent, delivery, client)
- **subscription_plans** : Plans d'abonnement disponibles
- **subscriptions** : Abonnements actifs des clients
- **orders** : Commandes avec workflow complet
- **order_status_history** : Historique des étapes
- **deliveries** : Gestion des livraisons
- **invoices** : Facturation automatisée
- **contracts** : Contrats d'abonnement
- **custom_quotes** : Devis personnalisés
- **plan_selections** : Sélections de plans
- **expenses** : Gestion des dépenses
- **delivery_schedules** : Planification des tournées
- **notifications** : Système de notifications

### Workflow de Traitement (8 étapes)
1. **to_pickup** - À ramasser
2. **to_sort** - À trier
3. **to_wash** - À laver
4. **to_dry** - À sécher
5. **to_iron** - À repasser
6. **ready_to_deliver** - Prêt à livrer
7. **to_deliver** - En livraison
8. **delivered** - Livré

## Installation et Configuration

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Variables d'Environnement
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sv_pressing
SESSION_SECRET=your_session_secret_key
PGHOST=localhost
PGPORT=5432
PGDATABASE=sv_pressing
PGUSER=your_username
PGPASSWORD=your_password
```

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd sv-pressing

# Installer les dépendances
npm install

# Configurer la base de données
npm run db:push

# Lancer l'application
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

## Utilisation

### Accès Initial
- **URL** : http://localhost:5000
- **Admin par défaut** : 
  - Username: `admin`
  - Password: `admin123`

### Fonctionnalités par Rôle

#### Admin
- Gestion complète des commandes
- Attribution des tâches aux agents
- Planification des livraisons
- Analytics et reporting
- Gestion des utilisateurs

#### Agent
- Traitement des commandes assignées
- Mise à jour du statut des vêtements
- Gestion du workflow de production

#### Livreur
- Visualisation des tournées assignées
- Mise à jour des statuts de livraison
- Gestion des créneaux

#### Client
- Suivi en temps réel des commandes
- Gestion de l'abonnement
- Historique et facturation

## Développement

### Scripts Disponibles
```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run db:push      # Mise à jour de la base de données
npm run db:studio    # Interface d'administration DB
```

### Structure des API Routes
- `/api/auth/*` : Authentification
- `/api/users` : Gestion des utilisateurs
- `/api/orders` : Gestion des commandes
- `/api/subscription-plans` : Plans d'abonnement
- `/api/deliveries` : Livraisons
- `/api/invoices` : Facturation
- `/api/expenses` : Dépenses
- `/api/custom-quotes` : Devis personnalisés

## Sécurité

- Authentification par sessions sécurisées
- Hachage des mots de passe avec scrypt
- Protection CSRF intégrée
- Validation des données avec Zod
- Contrôle d'accès basé sur les rôles

## Performance

- Optimisation des requêtes avec Drizzle ORM
- Cache intelligent avec TanStack Query
- Lazy loading des composants
- Images optimisées et compression

## Déploiement

### Déploiement complet sur Render

Le fichier `render.yaml` configure un service web unique qui construit le frontend Vite et l'API Express, puis sert les deux sur le même domaine.

1. Créez une base PostgreSQL (Render ou un fournisseur compatible) et copiez son URL de connexion dans `DATABASE_URL`.
2. Dans Render, créez un Blueprint depuis le dépôt et renseignez `DATABASE_URL`, `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PHONE` et `INITIAL_ADMIN_PASSWORD` (12 caractères minimum).
3. Render génère `SESSION_SECRET`. Le démarrage applique les migrations puis crée le compte administrateur et les plans d'abonnement sur une base neuve.
4. Après le premier démarrage réussi, vous pouvez supprimer les variables `INITIAL_ADMIN_*` de Render. Les données de démonstration `admin/admin123` sont réservées au mode développement.

Le service utilise `/health` pour le contrôle de disponibilité. Le plan gratuit peut mettre le service en veille après une période sans requêtes.

L'application est configurée pour un déploiement simple sur Replit avec :
- Base de données PostgreSQL automatiquement provisionnée
- Variables d'environnement pré-configurées
- Workflow de déploiement automatisé

## Support et Maintenance

### Logs et Monitoring
- Logs détaillés des actions utilisateur
- Monitoring des performances API
- Alertes automatiques en cas d'erreur

### Backup et Récupération
- Sauvegarde automatique de la base de données
- Système de récupération en cas de panne
- Versioning des données critiques

## Roadmap

### Fonctionnalités Futures
- [ ] Application mobile React Native
- [ ] Système de notifications push
- [ ] Intégration paiement mobile Money
- [ ] IA pour optimisation des tournées
- [ ] Scanner QR codes pour traçabilité
- [ ] Système de fidélité clients

### Améliorations Techniques
- [ ] Tests automatisés (Jest + Cypress)
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring avancé avec Sentry
- [ ] Cache Redis pour performance
- [ ] API GraphQL pour mobile

## Licence

Propriétaire - SV Pressing Madagascar

## Contact

Pour toute question technique ou commerciale :
- Email : contact@svpressing.mg
- Téléphone : +261 34 XX XX XX XX
- Adresse : Antananarivo, Madagascar

---

*Documentation mise à jour le : $(date)*
*Version : 2.0.0*
*Environnement : Production Ready*
