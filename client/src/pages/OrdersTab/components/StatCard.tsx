// src/pages/OrdersTab/components/StatCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { STAT_CARD_COLORS } from '../constants';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  isActive
}) => {
  // Utiliser 'indigo' comme fallback si la couleur n'existe pas
  const colors = STAT_CARD_COLORS[color as keyof typeof STAT_CARD_COLORS] || STAT_CARD_COLORS.indigo;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#eef2f5] rounded-2xl p-3 cursor-pointer transition-all duration-300",
        "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]",
        "hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5",
        "active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5",
        isActive && colors.active
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-1.5 rounded-xl", colors.bg, "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]")}>
          <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", colors.text)} />
        </div>
        <span className="text-xs sm:text-sm font-bold text-gray-700">{value}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-2 truncate">{title}</p>
    </div>
  );
};