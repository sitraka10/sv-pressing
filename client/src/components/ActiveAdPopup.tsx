import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { X as XIcon } from "lucide-react";

interface Ad {
  id: number;
  content: string;
  imageUrl: string;
  isActive: boolean;
}

export default function ActiveAdPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ad, setAd] = useState<Ad | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      if (hasRunRef.current) return; // prevent double fire in React StrictMode
      hasRunRef.current = true;
      try {
        const res = await apiRequest("GET", "/api/ads/active");
        if (!res.ok) return;
        const data: Ad | null = await res.json();
        if (!cancelled && data) {
          setAd(data);
          setOpen(true);
        }
      } catch (_) {
        // ignore
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!ad) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          <div
            className="h-40 w-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent), var(--secondary))'
            }}
          />
          <div className="-mt-16 px-6">
            <div className="rounded-xl border bg-white shadow-lg overflow-hidden flex flex-col">
              <img src={ad.imageUrl} alt="Annonce" className="w-full h-[32vh] md:h-[40vh] max-h-96 object-cover" />
              <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
                <h3 className="text-lg font-semibold">Offre promotionnelle</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ad.content}</p>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 sticky bottom-0 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/65 py-3">
                  <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
                  <Button onClick={() => setOpen(false)}>OK</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
