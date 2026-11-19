import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Model3DType, MediaType, NFTItem } from '../types/nft';
import { X, Upload, Plus, Trash2, Zap, Sparkles, Link, Image as ImageIcon, Video, Music, Play, Volume2 } from 'lucide-react';

export const MintModal: React.FC = () => {
  const { isMintModalOpen, setIsMintModalOpen, mintNFT, setActiveTab, user, wallet } = useMarketplace();

  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [mediaSourceMode, setMediaSourceMode] = useState<'upload' | 'url'>('upload');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.75');
  const [category, setCategory] = useState<NFTItem['category']>('Quantum Relics');
  const [royaltyPercent, setRoyaltyPercent] = useState(5);
  const [model3DType, setModel3DType] = useState<Model3DType>('hypercube');
  const [traits, setTraits] = useState<Array<{ trait_type: string; value: string }>>([
    { trait_type: 'Format', value: 'Interactive' },
    { trait_type: 'Zero-G Flux', value: 'Level 4' }
  ]);
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isMintModalOpen) return null;

  // Handle local file upload (converts any image, video, or audio file to Base64 data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMediaPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (mediaUrlInput.trim()) {
      setMediaPreview(mediaUrlInput.trim());
    }
  };

  const handleAddTrait = () => {
    setTraits(prev => [...prev, { trait_type: '', value: '' }]);
  };

  const handleRemoveTrait = (idx: number) => {
    setTraits(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTraitChange = (idx: number, field: 'trait_type' | 'value', val: string) => {
    setTraits(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Fallbacks if no file chosen
    let fallback = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
    if (mediaType === 'video') {
      fallback = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4';
    } else if (mediaType === 'audio') {
      fallback = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }

    const finalMedia = mediaPreview || mediaUrlInput.trim() || fallback;

    setIsSubmitting(true);
    try {
      // INTENTIONAL BUG (ISSUE #02): Allows minting even if wallet balance < 0.05 ETH
      await mintNFT({
        title,
        description,
        mediaType,
        mediaUrl: finalMedia,
        price: parseFloat(price) || 0.1,
        category,
        royaltyPercent,
        model3DType,
        traits: traits.filter(t => t.trait_type && t.value),
        isCustom: true,
        durationMinutes
      });

      setIsMintModalOpen(false);
      setActiveTab('custom-market');
    } catch (err) {
      console.error("Mint error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0e15] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={() => setIsMintModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            MULTI-MEDIA CREATOR STUDIO
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Mint Image, Video, or Audio NFT</h2>
          <p className="text-xs text-slate-400 font-mono">
            Minting as <strong className="text-white">@{user.name}</strong> <span className="text-cyan-400">[{user.id}]</span> • Testnet Address: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Media Format Selector: Image / Video / Audio */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-300">NFT MEDIA FORMAT</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMediaType('image');
                  setMediaPreview(null);
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs transition-colors ${
                  mediaType === 'image'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Image NFT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType('video');
                  setMediaPreview(null);
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs transition-colors ${
                  mediaType === 'video'
                    ? 'bg-pink-500/15 border-pink-500 text-pink-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-pink-400" />
                <span>Video NFT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType('audio');
                  setMediaPreview(null);
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs transition-colors ${
                  mediaType === 'audio'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 text-purple-400" />
                <span>Audio NFT</span>
              </button>
            </div>
          </div>

          {/* Media Input: File Upload or Web URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300">
                UPLOAD {mediaType.toUpperCase()} FILE OR LINK
              </label>
              <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setMediaSourceMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mediaSourceMode === 'upload' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Local File
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSourceMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mediaSourceMode === 'url' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {mediaSourceMode === 'upload' ? (
              <div className="relative border border-dashed border-white/15 hover:border-cyan-500/50 rounded-xl p-4 text-center bg-white/[0.02] transition-colors">
                <input
                  type="file"
                  accept={
                    mediaType === 'image'
                      ? 'image/*'
                      : mediaType === 'video'
                      ? 'video/*'
                      : 'audio/*'
                  }
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {mediaPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    {mediaType === 'image' && (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded-lg border border-white/10 shadow-lg"
                      />
                    )}
                    {mediaType === 'video' && (
                      <video
                        src={mediaPreview}
                        controls
                        autoPlay
                        loop
                        muted
                        className="w-56 h-36 rounded-lg object-cover border border-white/10 shadow-lg"
                      />
                    )}
                    {mediaType === 'audio' && (
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col items-center gap-2 w-full max-w-sm">
                        <div className="flex items-center gap-1.5 text-purple-400 text-xs font-mono">
                          <Volume2 className="w-4 h-4 animate-bounce" />
                          <span>Spatial Audio Track Loaded</span>
                        </div>
                        <audio src={mediaPreview} controls className="w-full mt-1" />
                      </div>
                    )}
                    <span className="text-[11px] font-mono text-cyan-400 mt-1">Click or drag a new file to replace</span>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-mono text-slate-300 font-medium">
                      Select ANY {mediaType.toUpperCase()} file from your device
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {mediaType === 'image' && 'PNG, JPG, GIF, WebP, SVG'}
                      {mediaType === 'video' && 'MP4, WebM, MOV, OGV'}
                      {mediaType === 'audio' && 'MP3, WAV, OGG, AAC'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      placeholder={`Paste public ${mediaType.toUpperCase()} web URL...`}
                      value={mediaUrlInput}
                      onChange={e => {
                        setMediaUrlInput(e.target.value);
                        setMediaPreview(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs"
                  >
                    Load
                  </button>
                </div>
                {mediaPreview && (
                  <div className="flex justify-center p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    {mediaType === 'image' && (
                      <img src={mediaPreview} className="w-40 h-40 object-cover rounded-lg border border-white/10" />
                    )}
                    {mediaType === 'video' && (
                      <video src={mediaPreview} controls autoPlay loop muted className="w-56 h-36 rounded-lg object-cover" />
                    )}
                    {mediaType === 'audio' && (
                      <audio src={mediaPreview} controls className="w-full max-w-sm" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unique Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">UNIQUE NFT TITLE / NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Sonic Nebula Echo #042"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">DESCRIPTION</label>
              <textarea
                rows={2}
                placeholder="Describe your media creation, backstory, or traits..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Category & 3D Geometry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">DOMAIN CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as NFTItem['category'])}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="Cyberpunk" className="bg-[#0e1017]">Cyberpunk</option>
                <option value="Quantum Relics" className="bg-[#0e1017]">Quantum Relics</option>
                <option value="Zero-G Debris" className="bg-[#0e1017]">Zero-G Debris</option>
                <option value="Generative Shards" className="bg-[#0e1017]">Generative Shards</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">3D COMPANION MESH</label>
              <select
                value={model3DType}
                onChange={e => setModel3DType(e.target.value as Model3DType)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="hypercube" className="bg-[#0e1017]">4D Tesseract (Hypercube)</option>
                <option value="torus-knot" className="bg-[#0e1017]">Torus Knot Vortex</option>
                <option value="prism" className="bg-[#0e1017]">Octahedron Prism</option>
                <option value="singularity" className="bg-[#0e1017]">Singularity Horizon</option>
                <option value="crystal" className="bg-[#0e1017]">Icosahedral Crystal</option>
                <option value="dodecahedron" className="bg-[#0e1017]">Exo-Dodecahedron</option>
              </select>
            </div>
          </div>

          {/* Pricing & Royalties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">SELLING LIST PRICE (ETH)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                CREATOR ROYALTY: {royaltyPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="15"
                value={royaltyPercent}
                onChange={e => setRoyaltyPercent(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer mt-3"
              />
            </div>
          </div>

          {/* Auction Timeline Duration Selector */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-300">BIDDING TIMELINE DURATION</label>
              <span className="text-cyan-400 text-[11px]">When expired, top bidder wins ownership!</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDurationMinutes(2)}
                className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                  durationMinutes === 2
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400'
                }`}
              >
                2 Mins (Fast Testnet)
              </button>
              <button
                type="button"
                onClick={() => setDurationMinutes(5)}
                className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                  durationMinutes === 5
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400'
                }`}
              >
                5 Minutes
              </button>
              <button
                type="button"
                onClick={() => setDurationMinutes(15)}
                className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                  durationMinutes === 15
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-white/[0.02] border-white/10 text-slate-400'
                }`}
              >
                15 Minutes
              </button>
            </div>
          </div>

          {/* Custom Traits */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300">CUSTOM ATTRIBUTES & TRAITS</label>
              <button
                type="button"
                onClick={handleAddTrait}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add Trait
              </button>
            </div>
            {traits.map((t, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Trait Name"
                  value={t.trait_type}
                  onChange={e => handleTraitChange(idx, 'trait_type', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={e => handleTraitChange(idx, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(idx)}
                  className="p-1.5 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isSubmitting ? 'MINTING TO CUSTOM MARKETPLACE...' : `MINT & PUBLISH TO CUSTOM MARKETPLACE (0.05 ETH)`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
