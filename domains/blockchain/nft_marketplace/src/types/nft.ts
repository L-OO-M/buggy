export type MediaType = 'image' | 'video' | 'audio';
export type Model3DType = 'torus-knot' | 'hypercube' | 'prism' | 'singularity' | 'crystal' | 'dodecahedron';

export interface Trait {
  trait_type: string;
  value: string | number;
  rarity?: string;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar: string;
  bidderAddress: string;
  amount: number;
  timestamp: string;
  createdAt: string;
}

export interface NFTItem {
  id: string;
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string; // Base64 data URL or external URL (Image, Video, or Audio)
  thumbnailUrl?: string;
  price: number; // in ETH
  lastSalePrice?: number;
  creator: string;
  creatorId: string; // Unique User ID
  creatorAvatar: string;
  creatorAddress: string;
  ownerAddress: string;
  ownerId: string;
  category: 'Cyberpunk' | 'Quantum Relics' | 'Zero-G Debris' | 'Generative Shards';
  rarityScore: number;
  rarityTier: 'Legendary' | 'Mythic' | 'Rare' | 'Uncommon';
  traits: Trait[];
  royaltyPercent: number;
  listingExpiresAt: string;
  listedAt: string; // ISO date string of time of listing
  auctionEndTime: string; // ISO date string of when bidding timeline closes
  isAuctionSettled?: boolean; // True when timeline expired and highest bidder was awarded ownership
  highestBidderName?: string;
  highestBidderAddress?: string;
  isListed: boolean;
  bids: Bid[];
  model3DType: Model3DType;
  views: number;
  likes: number;
  isCustom?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string; // Unique User ID (e.g. "usr_a8f9c1")
  name: string;
  email?: string;
  avatar: string;
  walletAddress: string;
  balance: number;
  authMethod: 'google' | 'metamask' | 'phantom' | 'email' | 'guest';
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: number; // in ETH
  network: string;
  provider: 'metamask' | 'phantom' | 'google' | 'guest' | null;
}

export interface TransactionActivity {
  id: string;
  type: 'mint' | 'sale' | 'bid' | 'transfer' | 'list';
  nftId: string;
  nftTitle: string;
  from: string;
  to: string;
  price: number;
  timestamp: string;
}
