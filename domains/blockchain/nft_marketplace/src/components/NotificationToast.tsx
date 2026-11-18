import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Bell, Sparkles } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = useMarketplace();

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 border border-cyan-400 text-slate-100 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl font-mono text-xs max-w-md">
        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="leading-snug">{notification}</p>
      </div>
    </div>
  );
};
