// src/pages/OrdersTab/components/MetricCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType; // Mijanona ao fa tsy ampiasaina intsony
  trend?: number;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
}) => {
  const up = (trend ?? 0) >= 0;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px]">
        {trend !== undefined && trend !== 0 && (
          <span className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
            up ? "bg-[#0B676E]/10 text-[#0B676E]" : "bg-red-50 text-red-700"
          )}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
        {subtitle && <span className="truncate text-slate-500">{subtitle}</span>}
      </div>
    </div>
  );
};