// src/pages/OrdersTab/components/MetricCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react'; // ← Changé ici

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "teal"
}) => {
  const colorMap: Record<string, string> = {
    teal: "text-[#0B676E]",
    green: "text-emerald-600",
    red: "text-red-600",
    purple: "text-purple-600",
    blue: "text-blue-600"
  };

  const bgMap: Record<string, string> = {
    teal: "bg-teal-50",
    green: "bg-emerald-50",
    red: "bg-red-50",
    purple: "bg-purple-50",
    blue: "bg-blue-50"
  };

  return (
    <div className={cn(
      "bg-[#eef2f5] rounded-3xl p-3 sm:p-4 transition-all duration-300",
      "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]",
      "hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5"
    )}>
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-2xl", bgMap[color] || "bg-gray-100", "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]")}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", colorMap[color] || "text-gray-600")} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-xl",
            "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
            trend >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );
};