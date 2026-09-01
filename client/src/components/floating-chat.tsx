import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FloatingChat() {
  const { toast } = useToast();

  const openMessenger = () => {
    toast({
      title: "Ouvrir le chat",
      description: "Redirection vers Facebook Messenger pour discuter avec SV Pressing...",
      duration: 2000,
    });
    window.open('https://m.me/sasavandapressing', '_blank');
    setTimeout(() => { window.open('https://www.facebook.com/sasavandapressing', '_blank'); }, 5000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <button
        type="button"
        aria-label="Ouvrir le chat sur Facebook Messenger"
        onClick={openMessenger}
        className="h-12 w-12 rounded-full bg-orange-600 text-white ring-1 ring-white/30 backdrop-blur-sm shadow-lg hover:scale-105 hover:bg-orange-700 transition-transform"
        title="Chat Messenger"
      >
        <MessageCircle className="h-6 w-6 mx-auto text-white" />
      </button>
    </div>
  );
}
