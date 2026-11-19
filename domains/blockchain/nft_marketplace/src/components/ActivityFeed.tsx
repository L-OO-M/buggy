import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Activity, ArrowUpRight, Sparkles, Tag, Flame, ShieldAlert } from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const { activities, setSelectedNFT, nfts } = useMarketplace();

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return { label: 'SALE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'mint':
        return { label: 'MINT', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'bid':
        return { label: 'BID', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'LIST', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyber-border space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Activity className="w-3.5 h-3.5" />
          ZERO-G LEDGER FEED
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Real-Time Marketplace Activity
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Live stream of decentralized transfers, zero-g mints, and auction bids recorded across the network.
        </p>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-cyber-border bg-[#0d0f18] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Event</th>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">From</th>
                <th className="py-3.5 px-4">To</th>
                <th className="py-3.5 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No activity recorded yet on the Zero-G network.
                  </td>
                </tr>
              ) : (
                activities.map((act, idx) => {
                  const badge = getActionBadge(act.type);
                  const nft = nfts.find(n => n.id === act.nftId);

                  return (
                    <tr
                      key={`${act.id}-${idx}`}
                      onClick={() => nft && setSelectedNFT(nft)}
                      className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white group-hover:text-cyan-400 flex items-center gap-1.5">
                        <span className="truncate max-w-[180px]">{act.nftTitle}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>

                      <td className="py-3.5 px-4 text-cyan-300 font-bold">
                        {act.price} ETH
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono truncate max-w-[120px]">
                        {act.from}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono truncate max-w-[120px]">
                        {act.to}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                        {/* EASTER EGG #10: timestamp is always "Just now" because it was hardcoded
                            as the string 'Just now' at creation time and never updated.
                            Fix: store createdAt as ISO string and format it here with a live relative time fn. */}
                        {act.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
