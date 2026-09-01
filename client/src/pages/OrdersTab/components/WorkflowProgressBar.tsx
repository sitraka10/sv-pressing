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
        <span className="text-gray-500">Progression</span>
        <span className="font-semibold text-[#0B676E]">{Math.round(progress)}%</span>
      </div>
      <div className="flex justify-between gap-0.5 sm:gap-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={step.status}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-all flex-1",
                isCompleted ? "opacity-100" : "opacity-40"
              )}
              onClick={() => onClick?.(step.status)}
            >
              <div className={cn(
                "p-1 sm:p-1.5 rounded-xl transition-all",
                "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
                isCompleted && "bg-[#0B676E] text-white shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                !isCompleted && "text-gray-400",
                isCurrent && "ring-2 ring-[#0B676E] ring-offset-2 ring-offset-[#eef2f5] scale-110"
              )}>
                <StepIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[8px] sm:text-[10px] mt-1 hidden sm:block truncate max-w-[40px]">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};