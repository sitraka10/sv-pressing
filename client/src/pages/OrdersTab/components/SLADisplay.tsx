// src/pages/OrdersTab/components/SLADisplay.tsx
import React from 'react';
import { Order } from '../types';
import { getOrderCountdown } from '../utils/sla';
import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLADisplayProps {
  order: Order;
  now: Date;
}

export const SLADisplay: React.FC<SLADisplayProps> = ({ order, now }) => {
  const countdown = getOrderCountdown(order, now);
  if (!countdown) return null;

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-2xl",
      "bg-[#eef2f5]",
      "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1 rounded-xl",
          "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
          countdown.isLate ? "bg-red-100" : "bg-teal-100"
        )}>
          <Hourglass className={cn("h-3 w-3", countdown.isLate ? "text-red-600" : "text-[#0B676E]")} />
        </div>
        <span className="text-xs text-gray-600">Délai restant</span>
      </div>
      <span className={cn(
        "text-xs sm:text-sm font-semibold",
        countdown.isLate ? "text-red-600" : "text-[#0B676E]"
      )}>
        {countdown.displayTime}
      </span>
    </div>
  );
};