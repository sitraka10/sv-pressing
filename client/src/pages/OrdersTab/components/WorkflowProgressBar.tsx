// src/pages/OrdersTab/components/WorkflowProgressBar.tsx
import React from 'react';
import { WORKFLOW_STEPS } from '../constants';
import { cn } from '@/lib/utils';

interface WorkflowProgressBarProps {
  status: string;
  onClick?: (status: string) => void;
}

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({ status, onClick }) => {
  const currentStep = WORKFLOW_STEPS.findIndex(s => s.status === status);
  const progress = ((currentStep + 1) / WORKFLOW_STEPS.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Progression</span>
        <span className="font-semibold text-slate-700">{Math.round(progress)}%</span>
      </div>
      <div className="flex justify-between gap-0.5 sm:gap-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={step.status}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-all flex-1",
                isCompleted ? "opacity-100" : "opacity-50"
              )}
              onClick={() => onClick?.(step.status)}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold border transition-all",
                  isCompleted
                    ? "bg-slate-700 text-white border-slate-700"
                    : "bg-white text-slate-400 border-slate-200",
                  isCurrent && "ring-2 ring-slate-400 ring-offset-1"
                )}
              >
                {idx + 1}
              </div>
              <span className="text-[8px] sm:text-[10px] mt-1 hidden sm:block truncate max-w-[48px] text-center text-slate-500">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};