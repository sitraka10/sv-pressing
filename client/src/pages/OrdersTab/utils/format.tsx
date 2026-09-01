// src/pages/OrdersTab/utils/format.ts
import { Badge } from "@/components/ui/badge";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import React from "react";
import { WORKFLOW_STEPS, STATUS_BADGE_STYLES } from "../constants";

export const formatDate = (date: string | undefined, formatStr: string): string => {
  if (!date || !isValid(new Date(date))) return 'Non défini';
  return format(new Date(date), formatStr, { locale: fr });
};

export const formatRelativeTime = (date: string): string => {
  if (!isValid(new Date(date))) return 'Date invalide';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
};

export const getStatusBadge = (status: string, isLate: boolean = false) => {
  const step = WORKFLOW_STEPS.find(s => s.status === status);
  if (!step) return <Badge variant="outline">{status}</Badge>;

  if (isLate) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
        <AlertTriangle className="h-3 w-3" />
        {step.label}
        <span className="text-[10px] font-normal bg-red-200/50 px-1 py-0.5 rounded-full ml-1">Retard</span>
      </Badge>
    );
  }

  const style = STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <Badge className={`${style} px-2 py-1 rounded-full font-medium text-xs shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]`}>
      {step.label}
    </Badge>
  );
};