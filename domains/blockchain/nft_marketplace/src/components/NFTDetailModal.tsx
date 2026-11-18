import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { NFT3DViewer } from './NFT3DViewer';
import { X, ShieldCheck, Clock, ExternalLink, Flame, Sparkles, Tag, ArrowUpRight, User, Video, Music, Image as ImageIcon, Volume2, Hourglass, Award } from 'lucide-react';

export const NFTDetailModal: React.FC = () => {
  const {
    selectedNFT,
    setSelectedNFT,
    buyNFT,
    placeBid,
    user,
    wallet,
    isNFTOwner,
    delistNFT,
    listNFTForSale
  } = useMarketplace();

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [resellPrice, setResellPrice] = useState('');
  const [mediaViewMode, setMediaViewMode] = useState<'media' | '3d'>('media');

  // Live Auction Countdown
  const [countdownText, setCountdownText] = useState('');
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    if (!selectedNFT) return;

    const updateTimer = () => {
      if (selectedNFT.isAuctionSettled) {
        setCountdownText(selectedNFT.highestBidderName ? `Auction Won by @${selectedNFT.highestBidderName}` : 'Auction Ended');
        setIsEndingSoon(false);
        return;
      }

      if (!selectedNFT.auctionEndTime) {
        setCountdownText('Bidding Open');
        return;
      }

      const diff = new Date(selectedNFT.auctionEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdownText('Settling Ownership...');
        setIsEndingSoon(false);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdownText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        setIsEndingSoon(diff < 30000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedNFT]);

  if (!selectedNFT) return null;

  const isOwner = isNFTOwner(selectedNFT);
  const highestBid = selectedNFT.bids.length > 0 ? selectedNFT.bids[0].amount : 0;

  // Format exact listing time
  const formatListingDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  // INTENTIONAL BUG (ISSUE #05) + EASTER EGG #8
  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      setBidError("Please enter a valid ETH amount.");
      return;
    }

    // ISSUE #05: Inverted logic bug (rejects bids >= highestBid)
    if (amount >= highestBid && highestBid > 0) {
      setBidError(`[PROTOCOL ERROR] Bid must be lower than current highest bid of ${highestBid} ETH!`);
      return;
    }

    // ISSUE #09: No minimum bid validation — negative & zero bids accepted
    // Missing check: if (amount <= 0) return error
    // Students must add: if (amount <= 0 || amount < 0.001) setBidError("Bid must be at least 0.001 ETH")

    try {
      // Calls placeBid which contains EASTER EGG #8 (blocks owner & creator shill bidding!)
      await placeBid(selectedNFT.id, amount);
      setBidAmount('');
    } catch (err: any) {
      setBidError(err.message || 'Bid rejected by protocol');
    }
  };

  const handleBuy = async () => {
    await buyNFT(selectedNFT.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Space_Grotesk']">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0d0f18] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-8 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={() => setSelectedNFT(null)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Media Player (Video/Audio/Image) or 3D Model Viewer */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {/* Media Mode Toggle Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setMediaViewMode('media')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  mediaViewMode === 'media' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                {selectedNFT.mediaType === 'video' && <Video className="w-3.5 h-3.5" />}
                {selectedNFT.mediaType === 'audio' && <Music className="w-3.5 h-3.5" />}
                {selectedNFT.mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                <span className="uppercase">{selectedNFT.mediaType} View</span>
              </button>
              <button
                onClick={() => setMediaViewMode('3d')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  mediaViewMode === '3d' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D Companion Mesh</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Multi-User Network
            </span>
          </div>

          {/* Media Viewport */}
          {mediaViewMode === '3d' ? (
            <NFT3DViewer
              modelType={selectedNFT.model3DType}
              primaryColor={selectedNFT.rarityTier === 'Mythic' ? 0xff007f : 0x00f0ff}
            />
          ) : (
            <div className="relative w-full h-[380px] bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
              {selectedNFT.mediaType === 'video' && (
                <video
                  src={selectedNFT.mediaUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain rounded-xl"
                />
              )}

              {selectedNFT.mediaType === 'audio' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/30 via-slate-950 to-black p-6 rounded-xl space-y-6">
                  {selectedNFT.thumbnailUrl && (
                    <img src={selectedNFT.thumbnailUrl} className="w-24 h-24 rounded-2xl object-cover shadow-2xl border border-white/10" />
                  )}
                  <div className="text-center space-y-1">
                    <div className="text-sm font-bold text-white font-mono">{selectedNFT.title}</div>
                    <div className="text-xs text-purple-400 font-mono flex items-center justify-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> High-Fidelity Spatial Audio
                    </div>
                  </div>
                  <audio src={selectedNFT.mediaUrl} controls className="w-full max-w-sm accent-purple-500" />
                </div>
              )}

              {selectedNFT.mediaType === 'image' && (
                <img
                  src={selectedNFT.mediaUrl}
                  alt={selectedNFT.title}
                  className="w-full h-full object-contain rounded-xl"
                />
              )}
            </div>
          )}

          {/* Traits Section */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              NFT ATTRIBUTES & PROVENANCE
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {selectedNFT.traits.map((t, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate">{t.trait_type}</span>
                  <span className="text-xs font-bold text-white font-mono truncate">{t.value}</span>
                  {t.rarity && (
                    <span className="text-[9px] font-mono text-cyan-400 mt-0.5">{t.rarity} rarity</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Title, Creator, Auction Timeline & Bids */}
        <div className="w-full md:w-1/2 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header: Format Badge & Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-white/5 text-slate-300 border border-white/10 uppercase">
                {selectedNFT.mediaType} NFT
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-white/5 text-slate-300 border border-white/10">
                {selectedNFT.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                {selectedNFT.rarityTier}
              </span>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {selectedNFT.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light">
              {selectedNFT.description}
            </p>

            {/* Auction Timeline & Settlement Banner */}
            <div className={`p-4 rounded-xl border font-mono text-xs space-y-1.5 ${
              selectedNFT.isAuctionSettled
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : isEndingSoon
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-cyan-500/10 border-cyan-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  {selectedNFT.isAuctionSettled ? (
                    <Award className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Hourglass className={`w-4 h-4 ${isEndingSoon ? 'text-red-400 animate-spin' : 'text-cyan-400'}`} />
                  )}
                  <span>AUCTION TIMELINE STATUS</span>
                </span>
                <span className={`text-sm font-bold ${
                  selectedNFT.isAuctionSettled
                    ? 'text-emerald-400'
                    : isEndingSoon
                    ? 'text-red-400 animate-pulse'
                    : 'text-cyan-300'
                }`}>
                  {countdownText}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {selectedNFT.isAuctionSettled
                  ? `Timeline ended! Ownership awarded to @${selectedNFT.highestBidderName || 'Highest Bidder'}. Previous owner rights revoked.`
                  : 'When this timeline reaches 00:00, the highest bidder automatically becomes the new owner, and previous owner rights are revoked!'}
              </p>
            </div>

            {/* Creator & Listing Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 block">CREATOR & ID</span>
                <div className="flex items-center gap-2">
                  <img src={selectedNFT.creatorAvatar} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                  <div className="min-w-0">
                    <span className="text-xs text-white font-medium block truncate">@{selectedNFT.creator}</span>
                    <span className="text-[9px] text-cyan-400 block truncate">
                      ID: {selectedNFT.creatorId || 'usr_genesis'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 block">LISTED AT</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-slate-300">
                    {formatListingDate(selectedNFT.listedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selling Price Box */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 font-mono">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400">INSTANT BUYOUT PRICE</span>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {selectedNFT.price} <span className="text-sm text-cyan-400 font-normal">ETH</span>
                  </div>
                </div>
                {selectedNFT.lastSalePrice && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">LAST SALE / WINNING BID</span>
                    <div className="text-sm text-slate-300">{selectedNFT.lastSalePrice} ETH</div>
                  </div>
                )}
              </div>

              {/* Action Buttons based on ownership */}
              {selectedNFT.isAuctionSettled ? (
                <div className="p-3 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  🏆 Auction closed and settled to @{selectedNFT.highestBidderName || 'Highest Bidder'}.
                </div>
              ) : isOwner ? (
                <div className="space-y-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    You are the registered owner of this relic.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => delistNFT(selectedNFT.id)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors border border-white/10"
                    >
                      Delist Item
                    </button>
                    <div className="flex flex-1 gap-1">
                      <input
                        type="number"
                        placeholder="New price"
                        value={resellPrice}
                        onChange={e => setResellPrice(e.target.value)}
                        className="w-24 px-2 py-1 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          if (resellPrice) listNFTForSale(selectedNFT.id, parseFloat(resellPrice));
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Set Price
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedNFT.isListed ? (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleBuy}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
                  >
                    <span>INSTANT BUY FOR {selectedNFT.price} ETH</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Purchase funds are automatically transferred to seller in real-time
                  </p>
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-white/5 border border-white/5 text-slate-500 text-xs">
                  This item is currently unlisted for sale.
                </div>
              )}
            </div>

            {/* Real-Time Live Bidding Section (Contains Easter Egg #8) */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  HIGHEST BID: <strong className="text-amber-300 font-bold">{highestBid} ETH</strong>
                </span>
                <span className="text-slate-500">{selectedNFT.bids.length} bids placed</span>
              </div>

              {!selectedNFT.isAuctionSettled && (
                <form onSubmit={handlePlaceBid} className="space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Bidding as: <strong className="text-white">@{user.name}</strong></span>
                    </div>
                    <span className="text-slate-500">[{user.id}]</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Enter bid in ETH`}
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-colors"
                    >
                      Place Real-Time Bid
                    </button>
                  </div>

                  {/* Warning / Error: displays Easter Egg #8 message when owner attempts to bid */}
                  {bidError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] leading-tight">
                      {bidError}
                    </div>
                  )}
                </form>
              )}

              {/* Real-time Bid Stream from consecutive users */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-500 block uppercase">Real-Time Multi-User Bid Stream</span>
                {selectedNFT.bids.length === 0 ? (
                  <div className="text-[11px] text-slate-500 py-3 text-center bg-white/[0.01] rounded-lg border border-white/5">
                    No bids submitted yet. Any user can place a bid!
                  </div>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1.5">
                    {selectedNFT.bids.map(bid => (
                      <div key={bid.id} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="flex items-center gap-2">
                          <img src={bid.bidderAvatar} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                          <div>
                            <span className="text-slate-300 font-medium">@{bid.bidderName}</span>
                            <span className="text-[9px] text-slate-500 ml-1">[{bid.bidderId}]</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-300 font-bold">{bid.amount} ETH</span>
                          <span className="text-slate-500 text-[10px]">{bid.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
