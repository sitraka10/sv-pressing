// src/pages/OrdersTab/components/NoteItem.tsx
import React from 'react';
import { OrderNote } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';
import { cn } from '@/lib/utils';

interface NoteItemProps {
  note: OrderNote;
  onMarkAsRead?: () => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onMarkAsRead }) => (
  <div className={cn(
    "flex gap-3 p-3 rounded-2xl transition-all",
    "bg-[#eef2f5]",
    "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
    !note.isRead && "ring-2 ring-[#0B676E] ring-offset-2 ring-offset-[#eef2f5]"
  )}>
    <div className={cn(
      "p-1.5 rounded-xl flex-shrink-0",
      "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
      !note.isRead ? "bg-[#0B676E] text-white" : "bg-[#eef2f5] text-gray-500"
    )}>
      <MessageSquare className={cn("h-3 w-3", !note.isRead && "text-white")} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">{note.author?.fullName || note.createdBy || "Système"}</span>
          {!note.isRead && (
            <Badge className="bg-[#0B676E] text-white border-0 text-[10px] px-1.5 py-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
              Nouveau
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatRelativeTime(note.createdAt)}</span>
      </div>
      <p className="text-sm text-gray-600 break-words">{note.content}</p>
    </div>
    {!note.isRead && onMarkAsRead && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onMarkAsRead}
        className={cn(
          "h-7 w-7 p-0 rounded-xl border-0",
          "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
          "text-[#0B676E] hover:bg-[#0B676E]/10"
        )}
      >
        <CheckCheck className="h-3.5 w-3.5" />
      </Button>
    )}
  </div>
);