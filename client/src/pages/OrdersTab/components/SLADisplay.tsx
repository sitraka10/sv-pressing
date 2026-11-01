// src/pages/OrdersTab/components/SLADisplay.tsx
// 100% neutre sauf le "Retard" en rouge.
import React from 'react';
import { Order } from '../types';
import { getOrderCountdown } from '../utils/sla';

interface SLADisplayProps {
  order: Order;
  now: Date;
}

export const SLADisplay: React.FC<SLADisplayProps> = ({ order, now }) => {
  const countdown = getOrderCountdown(order, now);
  if (!countdown) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
      <span className="text-[11px] font-medium text-slate-500">
        {countdown.isLate ? 'Délai dépassé' : 'Délai restant'}
      </span>
      <span
        className={
          countdown.isLate
            ? "text-[12px] font-semibold text-red-600 tabular-nums"
            : "text-[12px] font-semibold text-slate-700 tabular-nums"
        }
      >
        {countdown.displayTime}
      </span>
    </div>
  );
};