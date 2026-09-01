// src/pages/OrdersTab/components/SLAProgressBar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SLAProgressBarProps {
  progress: number;
  isLate: boolean;
}

export const SLAProgressBar: React.FC<SLAProgressBarProps> = ({ progress, isLate }) => (
  <div className={cn(
    "w-full h-1.5 rounded-full overflow-hidden",
    "bg-[#eef2f5]",
    "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
  )}>
    <motion.div
      className={cn(
        "h-full rounded-full",
        isLate ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-[#0B676E] to-teal-400"
      )}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, progress)}%` }}
      transition={{ duration: 0.5 }}
    />
  </div>
);