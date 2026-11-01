// src/pages/OrdersTab/constants.ts
// 100% textuel — plus aucune icône importée.

export const WORKFLOW_STEPS = [
  { status: 'to_pickup', label: 'À ramasser', color: 'orange', order: 1, sla: 8, capacity: 15, description: 'En attente de ramassage client' },
  { status: 'to_sort', label: 'À trier', color: 'yellow', order: 2, sla: 4, capacity: 30, description: 'Tri et inventaire des articles' },
  { status: 'to_wash', label: 'En lavage', color: 'blue', order: 3, sla: 6, capacity: 20, description: 'Cycle de lavage en cours' },
  { status: 'to_dry', label: 'En séchage', color: 'cyan', order: 4, sla: 4, capacity: 25, description: 'Séchage en machine ou à l\'air' },
  { status: 'to_iron', label: 'En repassage', color: 'purple', order: 5, sla: 5, capacity: 15, description: 'Repassage et finition' },
  { status: 'ready_to_deliver', label: 'Prêt à livrer', color: 'indigo', order: 6, sla: 2, capacity: 40, description: 'Emballé et prêt pour livraison' },
  { status: 'to_deliver', label: 'En livraison', color: 'blue', order: 7, sla: 8, capacity: 12, description: 'En cours de livraison' },
  { status: 'delivered', label: 'Livré', color: 'green', order: 8, sla: 0, capacity: 999, description: 'Commande livrée au client' }
];

export const STATUS_BADGE_STYLES = {
  to_pickup: "bg-amber-50 text-amber-700 border-amber-200",
  to_sort: "bg-yellow-50 text-yellow-700 border-yellow-200",
  to_wash: "bg-sky-50 text-sky-700 border-sky-200",
  to_dry: "bg-cyan-50 text-cyan-700 border-cyan-200",
  to_iron: "bg-purple-50 text-purple-700 border-purple-200",
  ready_to_deliver: "bg-indigo-50 text-indigo-700 border-indigo-200",
  to_deliver: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export const STAT_CARD_COLORS = {
  orange: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', active: 'ring-2 ring-amber-500 ring-offset-2' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', active: 'ring-2 ring-yellow-500 ring-offset-2' },
  blue: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', active: 'ring-2 ring-sky-500 ring-offset-2' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', active: 'ring-2 ring-cyan-500 ring-offset-2' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', active: 'ring-2 ring-purple-500 ring-offset-2' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', active: 'ring-2 ring-indigo-500 ring-offset-2' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', active: 'ring-2 ring-emerald-500 ring-offset-2' }
};