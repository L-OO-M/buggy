import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Search, Plus, Compass, ShoppingBag, User, Activity, Wallet } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery, setSearchQuery }) => {
  const {
    user,
    wallet,
    setIsAuthModalOpen,
    setIsMintModalOpen,
    activeTab,
    setActiveTab,
    triggerGodMode
  } = useMarketplace();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().toLowerCase() === 'antigravity') {
      triggerGodMode(val);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#090a0f]/95 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white group-hover:border-cyan-500/50 transition-colors">
            <span className="font-mono font-bold text-xs text-cyan-400">0G</span>
          </div>

          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AETHERIA <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10 font-mono">TESTNET</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono tracking-wider">
              3D MULTI-USER MARKETPLACE
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search relics, audio, video, creators..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Nav Links */}
        <div className="hidden lg:flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'explore'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>

          <button
            onClick={() => setActiveTab('custom-market')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'custom-market'
                ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Market</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </div>

        {/* Actions: Mint & Unique User Identity Profile */}
        <div className="flex items-center gap-2.5">
          {/* Create / Mint NFT */}
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Mint NFT</span>
          </button>

          {/* User Identity Pill (Each user gets their unique ID and wallet) */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors font-mono text-xs"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover border border-white/20"
            />
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-white font-medium text-[11px] truncate max-w-[90px]">
                @{user.name}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono">
                {user.id}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] border border-cyan-500/20 font-bold">
              {/* EASTER EGG #13: Navbar shows wallet.balance (the WalletState copy) but
                  claimFaucetETH and buyNFT update user.balance (the UserProfile).
                  The two values drift apart whenever faucet is claimed or a purchase is made.
                  Navbar balance badge stays frozen at the old value while AuthModal shows the real one!
                  Fix: replace wallet.balance with user.balance here */}
              {wallet.balance} ETH
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex lg:hidden items-center justify-between gap-1 pt-2 border-t border-white/5 mt-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-1 text-center rounded ${activeTab === 'explore' ? 'bg-white/10 text-white font-medium' : 'text-slate-400'}`}
        >
          Explore
        </button>
        <button
          onClick={() => setActiveTab('custom-market')}
          className={`flex-1 py-1 text-center rounded ${activeTab === 'custom-market' ? 'bg-cyan-500/10 text-cyan-300 font-medium' : 'text-slate-400'}`}
        >
          Custom
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 py-1 text-center rounded ${activeTab === 'vault' ? 'bg-white/10 text-white font-medium' : 'text-slate-400'}`}
        >
          Vault
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-1 text-center rounded ${activeTab === 'activity' ? 'bg-white/10 text-white font-medium' : 'text-slate-400'}`}
        >
          Activity
        </button>
      </div>
    </nav>
  );
};
