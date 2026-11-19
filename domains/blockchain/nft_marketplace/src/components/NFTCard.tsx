import React, { useState, useRef, useEffect } from 'react';
import { NFTItem } from '../types/nft';
import { useMarketplace } from '../context/MarketplaceContext';
import { Zap, Heart, Flame, ShieldCheck, Clock, Video, Music, Image as ImageIcon, Award, Hourglass } from 'lucide-react';

interface NFTCardProps {
  nft: NFTItem;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const { setSelectedNFT, buyNFT, isNFTOwner } = useMarketplace();
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt & Glare States
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(nft.likes);

  // Live Auction Countdown
  const [countdown, setCountdown] = useState<{ text: string; isEndingSoon: boolean; isSettled: boolean }>({
    text: '',
    isEndingSoon: false,
    isSettled: false
  });

  useEffect(() => {
    const updateCountdown = () => {
      // If NFT was bought outright (not through auction), hide the timeline badge
      if (!nft.isListed && !nft.isAuctionSettled) {
        setCountdown({ text: 'Sold', isEndingSoon: false, isSettled: true });
        return;
      }

      if (nft.isAuctionSettled) {
        setCountdown({
          text: nft.highestBidderName ? `Won by @${nft.highestBidderName}` : 'Auction Ended',
          isEndingSoon: false,
          isSettled: true
        });
        return;
      }

      // No auctionEndTime means it's a standard listing with no active countdown
      if (!nft.auctionEndTime) {
        setCountdown({ text: '', isEndingSoon: false, isSettled: false });
        return;
      }

      const diff = new Date(nft.auctionEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ text: 'Settling Ownership...', isEndingSoon: false, isSettled: true });
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown({
          text: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
          isEndingSoon: diff < 30000,
          isSettled: false
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nft.auctionEndTime, nft.isAuctionSettled, nft.highestBidderName, nft.isListed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.12
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // EASTER EGG #12: Double-inversion bug — isLiked is read from closure BEFORE setIsLiked fires.
    // The count check uses the stale `isLiked` value. Result: on first click, the heart turns red
    // AND the count increments correctly, but on the second click (unlike), because the closure
    // still sees isLiked=false when count recalculates, it increments again instead of decrementing.
    // Likes count only ever goes UP, it never decreases when you unlike!
    // Fix: use functional update with a ref, e.g. setIsLiked(prev => { setLikesCount(c => prev ? c-1 : c+1); return !prev; })
    setIsLiked(prev => !prev);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1)); // BUG: reads stale isLiked
  };

  const handleQuickBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await buyNFT(nft.id);
  };

  const isOwner = isNFTOwner(nft);

  const getRarityBadge = () => {
    switch (nft.rarityTier) {
      case 'Mythic':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'Legendary':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rare':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Listed recently';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Listed just now';
      if (diffMins < 60) return `Listed ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Listed ${diffHours}h ago`;
      return `Listed ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    } catch {
      return 'Listed recently';
    }
  };

  const topBid = nft.bids.length > 0 ? nft.bids[0] : null;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setSelectedNFT(nft)}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
        transition: 'transform 0.15s ease-out'
      }}
      className="relative group rounded-2xl bg-[#0d0e15] border border-white/10 hover:border-cyan-500/40 p-4 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-2xl z-20"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`,
          opacity: glarePos.opacity
        }}
      />

      {/* Top Media: Image, Video, or Audio */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black/50 mb-4 flex items-center justify-center">
        {nft.mediaType === 'video' ? (
          <video
            src={nft.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
          />
        ) : nft.mediaType === 'audio' ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 via-black to-slate-950 p-4 text-center">
            {nft.thumbnailUrl ? (
              <img src={nft.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" />
            ) : null}
            <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 z-10">
              <Music className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 z-10 h-6">
              {[40, 75, 50, 90, 60, 80, 45, 95, 70, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <img
            src={nft.mediaUrl || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop'}
            alt={nft.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop';
            }}
          />
        )}

        {/* Media Format & Rarity Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-md ${getRarityBadge()}`}>
              {nft.rarityTier}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-black/70 text-slate-200 border border-white/10 backdrop-blur-md flex items-center gap-1">
              {nft.mediaType === 'video' && <Video className="w-3 h-3 text-pink-400" />}
              {nft.mediaType === 'audio' && <Music className="w-3 h-3 text-purple-400" />}
              {nft.mediaType === 'image' && <ImageIcon className="w-3 h-3 text-cyan-400" />}
              <span className="uppercase text-[9px]">{nft.mediaType}</span>
            </span>
          </div>

          {/* Live Auction Timeline Countdown Badge — only shown when there's an active countdown or settled state */}
          {countdown.text && (
            <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono border backdrop-blur-md flex items-center gap-1 shadow-sm ${
              countdown.isSettled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : countdown.isEndingSoon
                ? 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse'
                : 'bg-black/70 text-cyan-300 border-cyan-500/30'
            }`}>
              {countdown.isSettled ? (
                <Award className="w-3 h-3 text-emerald-400" />
              ) : (
                <Hourglass className="w-3 h-3 text-cyan-400 animate-spin" />
              )}
              <span>{countdown.isSettled ? countdown.text : `⏳ ${countdown.text}`}</span>
            </div>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={toggleLike}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 transition-colors z-10"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-slate-300'}`} />
        </button>

        {/* Listing Time Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{formatTime(nft.listedAt)}</span>
        </div>

        {/* Top Bid Badge */}
        {topBid && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Top: {topBid.amount} ETH</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-3">
        {/* Creator Identity with Unique User ID */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <img
              src={nft.creatorAvatar}
              alt={nft.creator}
              className="w-5 h-5 rounded-full object-cover border border-white/20"
            />
            <div className="flex items-center gap-1">
              <span className="text-slate-300 hover:text-white font-medium truncate max-w-[110px]">
                @{nft.creator}
              </span>
              {nft.creatorId && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-slate-500">
                  {nft.creatorId}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-500">{nft.bids.length} bids</span>
        </div>

        {/* Unique Title */}
        <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors truncate">
          {nft.title}
        </h3>

        {/* Pricing / Buy / Bid Footer */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between font-mono">
          <div>
            <div className="text-[10px] text-slate-500">SELLING PRICE</div>
            <div className="text-base font-bold text-white">
              {nft.price} <span className="text-xs text-cyan-400 font-normal">ETH</span>
            </div>
          </div>

          {/* Quick Action Button */}
          {nft.isAuctionSettled ? (
            <span className="text-xs font-mono text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Settled
            </span>
          ) : isOwner ? (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Your Item
            </span>
          ) : nft.isListed ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNFT(nft);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors border border-white/5"
              >
                Bid
              </button>
              <button
                onClick={handleQuickBuy}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                Buy
              </button>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 px-2 py-1 bg-white/5 rounded">
              Unlisted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
