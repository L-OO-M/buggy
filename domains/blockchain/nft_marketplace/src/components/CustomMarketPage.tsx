import React, { useState, useMemo } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { NFTCard } from './NFTCard';
import { Plus, SlidersHorizontal, ShoppingBag, Video, Music, Image as ImageIcon, Layers } from 'lucide-react';
import { MediaType } from '../types/nft';

export const CustomMarketPage: React.FC = () => {
  const { nfts, setIsMintModalOpen } = useMarketplace();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  // ISSUE #10: media filter buttons below pass 'images','videos','audios' (plural) but
  // NFT mediaType is stored as 'image','video','audio' (singular) — filter always shows empty!

  // Filter custom minted NFTs
  const customNFTs = useMemo(() => {
    return nfts.filter(item => {
      // Must be marked as custom or user created
      if (!item.isCustom) return false;

      // Media type filter
      // ISSUE #10: Compares plural UI label against singular stored mediaType ('images' !== 'image')
      if (mediaFilter !== 'all' && item.mediaType !== mediaFilter + 's') {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCreator = item.creator.toLowerCase().includes(q);
        const matchesCreatorId = item.creatorId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCreator && !matchesCreatorId) return false;
      }

      // Category match (preserves intentional case-sensitivity test)
      if (categoryFilter !== 'All') {
        if (item.category !== categoryFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      return b.id.localeCompare(a.id);
    });
  }, [nfts, mediaFilter, categoryFilter, searchQuery, sortBy]);

  const totalCustom = nfts.filter(i => i.isCustom).length;
  const floorPrice = customNFTs.length > 0
    ? Math.min(...customNFTs.map(i => i.price)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0d0e14] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <ShoppingBag className="w-3.5 h-3.5" />
            COMMUNITY CUSTOM MARKETPLACE
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Custom Relics & Multi-Media Market
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-normal leading-relaxed">
            A live decentralized marketplace where any user can mint images, videos, and audio into NFTs. Other users can bid in real-time or purchase directly, with funds routed to the creator.
          </p>

          {/* Quick Metrics */}
          <div className="pt-2 flex flex-wrap items-center gap-6 font-mono text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">TOTAL CUSTOM ITEMS</div>
              <div className="text-white font-bold text-base">{totalCustom} Items</div>
            </div>
            <div className="w-[1px] h-7 bg-white/10" />
            <div>
              <div className="text-slate-400 text-[10px]">FLOOR PRICE</div>
              <div className="text-cyan-400 font-bold text-base">{floorPrice} ETH</div>
            </div>
            <div className="w-[1px] h-7 bg-white/10" />
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-User Testnet Active</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-cyan-950/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Mint Image / Video / Audio</span>
          </button>
        </div>
      </div>

      {/* Media Type & Category Filters */}
      <div className="space-y-4 font-mono text-xs">
        {/* Media Format Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mediaFilter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Media ({totalCustom})</span>
            </button>

            <button
              onClick={() => setMediaFilter('image' as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mediaFilter === 'image' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              {/* ISSUE #10: button label says "Images" but filter value must be singular 'image' */}
              <span>Images</span>
            </button>

            <button
              onClick={() => setMediaFilter('video' as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mediaFilter === 'video' ? 'bg-pink-500/20 text-pink-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-pink-400" />
              <span>Videos</span>
            </button>

            <button
              onClick={() => setMediaFilter('audio' as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mediaFilter === 'audio' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span>Audios</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[#0e1017]">Newest First</option>
                <option value="price-asc" className="bg-[#0e1017]">Price: Low to High</option>
                <option value="price-desc" className="bg-[#0e1017]">Price: High to Low</option>
              </select>
            </div>

            <span className="text-slate-500 whitespace-nowrap">
              {customNFTs.length} {customNFTs.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Cyberpunk', 'Quantum Relics', 'Zero-G Debris', 'Generative Shards'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-white/10 border-white/20 text-white font-semibold'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Custom NFTs Grid */}
      {customNFTs.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            🎨
          </div>
          <h3 className="text-base font-bold text-white">No Custom NFTs Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
            Be the first user to mint an image, video, or audio track onto this custom marketplace.
          </p>
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
          >
            Mint First Custom NFT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {customNFTs.map(nft => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
};
