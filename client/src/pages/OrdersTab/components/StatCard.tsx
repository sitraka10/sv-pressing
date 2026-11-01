// src/pages/OrdersTab/components/StatCard.tsx
// 100% textuel — aucune icône (triangle, voiture, etc. supprimés).
import React from 'react';
import { cn } from '@/lib/utils';
import { STAT_CARD_COLORS } from '../constants';

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color,
  onClick,
  isActive,
}) => {
  const colors = STAT_CARD_COLORS[color as keyof typeof STAT_CARD_COLORS] || STAT_CARD_COLORS.indigo;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-slate-200/70 p-3 cursor-pointer transition-all",
        "hover:border-slate-300 hover:shadow-sm",
        isActive && colors.active
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", colors.bg, colors.text)}>
          {title}
        </span>
        <span className="text-[18px] font-semibold text-slate-900 tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
};