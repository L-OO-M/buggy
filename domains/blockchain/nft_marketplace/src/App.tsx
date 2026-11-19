import React, { useState, useMemo } from 'react';
import { useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { NFTCard } from './components/NFTCard';
import { NFTDetailModal } from './components/NFTDetailModal';
import { MintModal } from './components/MintModal';
import { AuthModal } from './components/AuthModal';
import { CustomMarketPage } from './components/CustomMarketPage';
import { ActivityFeed } from './components/ActivityFeed';
import { NotificationToast } from './components/NotificationToast';
import { Filter, SlidersHorizontal, ShieldCheck, ShoppingBag, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const { nfts, activeTab, setActiveTab, wallet, isNFTOwner } = useMarketplace();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rarity' | 'newest'>('newest');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50);

  // Categories list
  // INTENTIONAL BUG (ISSUE #03):
  // Filter buttons pass lowercase values ('cyberpunk', 'quantum relics', etc.)
  // while item.category is capitalized ('Cyberpunk', 'Quantum Relics').
  const categories = [
    { label: 'All Items', value: 'All' },
    { label: 'Cyberpunk', value: 'cyberpunk' }, // lowercase triggers Issue #03
    { label: 'Quantum Relics', value: 'quantum relics' },
    { label: 'Zero-G Debris', value: 'zero-g debris' },
    { label: 'Generative Shards', value: 'generative shards' }
  ];

  // Filtering Logic
  const filteredNFTs = useMemo(() => {
    return nfts.filter(item => {
      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      // INTENTIONAL BUG (ISSUE #03): Case Sensitivity Filter Bug
      if (selectedCategory !== 'All') {
        if (item.category !== selectedCategory) {
          return false;
        }
      }

      // Price Range Filter
      if (item.price < minPrice || item.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // INTENTIONAL BUG (ISSUE #04): String Alphabetical Sort Bug
      switch (sortBy) {
        case 'price-asc':
          return String(a.price).localeCompare(String(b.price));
        case 'price-desc':
          return String(b.price).localeCompare(String(a.price));
        case 'rarity':
          return String(a.rarityScore).localeCompare(String(b.rarityScore));
        case 'newest':
        default:
          return b.id.localeCompare(a.id);
      }
    });
  }, [nfts, searchQuery, selectedCategory, sortBy, minPrice, maxPrice]);

  // Owned items in vault (Easter Egg #5 affects this)
  const ownedNFTs = useMemo(() => {
    return nfts.filter(item => isNFTOwner(item));
  }, [nfts, isNFTOwner]);

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col font-['Space_Grotesk'] selection:bg-cyan-500 selection:text-black">
      {/* Sleek, Realistic Web3 Navbar */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* Explore Marketplace Tab */}
        {activeTab === 'explore' && (
          <>
            {/* 3D Antigravity Canvas Hero */}
            <ThreeCanvas />

            {/* Filter & Sorting Controls */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 font-mono text-xs">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
                        selectedCategory === cat.value
                          ? 'bg-white/10 border-white/20 text-white font-semibold'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="newest" className="bg-[#0e1017]">Recently Added</option>
                      <option value="price-asc" className="bg-[#0e1017]">Price: Low to High</option>
                      <option value="price-desc" className="bg-[#0e1017]">Price: High to Low</option>
                      <option value="rarity" className="bg-[#0e1017]">Rarity Score</option>
                    </select>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    {filteredNFTs.length} {filteredNFTs.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Price Filter Slider Bar */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-slate-400">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span>Max Price:</span>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={maxPrice}
                  onChange={e => setMaxPrice(parseFloat(e.target.value))}
                  className="w-44 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <span className="text-white font-semibold">{maxPrice} ETH</span>
              </div>
            </div>

            {/* NFT Cards Grid */}
            {filteredNFTs.length === 0 ? (
              <div className="p-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                  🔍
                </div>
                <h3 className="text-base font-bold text-white">No Relics Found</h3>
                <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                  No items matched your current filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNFTs.map(nft => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Custom NFT Market Page Tab */}
        {activeTab === 'custom-market' && <CustomMarketPage />}

        {/* My Vault Tab */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-[#0d0e14] border border-white/10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-400 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                USER VAULT
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                My Collected Relics
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Items currently registered to address <code className="text-slate-200">{wallet.address || 'Not connected'}</code>
              </p>
            </div>

            {ownedNFTs.length === 0 ? (
              <div className="p-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-4">
                <div className="text-3xl">🔐</div>
                <h3 className="text-base font-bold text-white">Your Vault is Empty</h3>
                <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                  You haven't purchased or minted any relics under this active wallet address.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedNFTs.map(nft => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && <ActivityFeed />}
      </main>

      {/* Global Modals */}
      <NFTDetailModal />
      <MintModal />
      <AuthModal />
      <NotificationToast />

      {/* Clean Dark Production Footer */}
      <footer className="mt-20 border-t border-white/[0.08] bg-[#050609] py-10 px-4 md:px-8 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">AETHERIA</span>
            <span className="text-[11px] text-slate-600">Zero-G 3D Spatial Marketplace</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('explore')} className="hover:text-white transition-colors">Explore</button>
            <button onClick={() => setActiveTab('custom-market')} className="hover:text-cyan-400 text-cyan-400 transition-colors">Custom Market</button>
            <button onClick={() => setActiveTab('vault')} className="hover:text-white transition-colors">My Vault</button>
            <button onClick={() => setActiveTab('activity')} className="hover:text-white transition-colors">Activity</button>
          </div>

          <div className="text-slate-600 text-[11px]">
            Decentralized Zero-G Protocol © 2026. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
