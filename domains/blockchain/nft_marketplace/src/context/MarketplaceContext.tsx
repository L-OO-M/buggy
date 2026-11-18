import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { NFTItem, WalletState, TransactionActivity, UserProfile, Model3DType, MediaType, Bid } from '../types/nft';
import { INITIAL_MOCK_NFTS } from '../data/mockNFTs';

interface MintNFTInput {
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string;
  price: number;
  category: NFTItem['category'];
  royaltyPercent: number;
  model3DType: Model3DType;
  traits: Array<{ trait_type: string; value: string }>;
  isCustom?: boolean;
  durationMinutes?: number;
}

interface MarketplaceContextType {
  nfts: NFTItem[];
  user: UserProfile;
  wallet: WalletState;
  activities: TransactionActivity[];
  activeTab: 'explore' | 'custom-market' | 'vault' | 'activity';
  selectedNFT: NFTItem | null;
  isAuthModalOpen: boolean;
  isMintModalOpen: boolean;
  notification: string | null;
  antiGravityActive: boolean;
  setActiveTab: (tab: 'explore' | 'custom-market' | 'vault' | 'activity') => void;
  setSelectedNFT: (nft: NFTItem | null) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsMintModalOpen: (open: boolean) => void;
  setAntiGravityActive: (val: boolean | ((prev: boolean) => boolean)) => void;
  updateUserProfile: (name: string, avatar?: string) => void;
  loginWithGoogle: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  disconnectUser: () => void;
  claimFaucetETH: () => void;
  buyNFT: (nftId: string) => Promise<boolean>;
  placeBid: (nftId: string, amount: number) => Promise<boolean>;
  mintNFT: (data: MintNFTInput) => Promise<NFTItem>;
  isNFTOwner: (nft: NFTItem) => boolean;
  delistNFT: (nftId: string) => void;
  listNFTForSale: (nftId: string, price: number) => void;
  triggerGodMode: (query: string) => void;
  showNotification: (msg: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

// Helper to generate a realistic random Ethereum testnet address
const generateRandomAddress = () => {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
};

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop'
];

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Genuinely Unique User Session (Each tab gets its own unique user identity & address)
  const [user, setUser] = useState<UserProfile>(() => {
    const sessionKey = 'AETHERIA_UNIQUE_SESSION_USER';
    const existing = sessionStorage.getItem(sessionKey);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {
        // regenerate
      }
    }

    const uniqueId = `usr_${Math.random().toString(36).substring(2, 8)}`;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const uniqueAddress = generateRandomAddress();
    const newUser: UserProfile = {
      id: uniqueId,
      name: `User_${randomNum}`,
      email: `user_${randomNum}@zerog.network`,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      walletAddress: uniqueAddress,
      balance: 15.0,
      authMethod: 'guest'
    };

    sessionStorage.setItem(sessionKey, JSON.stringify(newUser));
    return newUser;
  });

  const [wallet, setWallet] = useState<WalletState>({
    address: user.walletAddress,
    isConnected: true,
    balance: user.balance,
    network: 'Zero-G Testnet (Chain ID: 777)',
    provider: user.authMethod as any
  });

  const [nfts, setNfts] = useState<NFTItem[]>(() => {
    const SCHEMA_VERSION = 'v4'; // bump this whenever NFTItem shape changes
    const saved = localStorage.getItem('AETHERIA_NFTS');
    const savedVersion = localStorage.getItem('AETHERIA_SCHEMA_VER');

    if (saved && savedVersion === SCHEMA_VERSION) {
      try {
        const parsed: NFTItem[] = JSON.parse(saved);
        // Validate that stored NFTs have required fields — wipe if schema is stale
        if (parsed.length > 0 && parsed[0].mediaUrl !== undefined && parsed[0].bids !== undefined) {
          return parsed;
        }
      } catch (err) {
        // corrupted — fall through to seed data
      }
    }

    // Clear stale data and reset to fresh seed NFTs
    localStorage.removeItem('AETHERIA_NFTS');
    localStorage.setItem('AETHERIA_SCHEMA_VER', SCHEMA_VERSION);
    return INITIAL_MOCK_NFTS;
  });

  const [activities, setActivities] = useState<TransactionActivity[]>([
    {
      id: 'act-1',
      type: 'sale',
      nftId: 'nft-001',
      nftTitle: 'Chronos Hypercube #01',
      from: '0x3c44...93bc',
      to: '0x5b38...ddc4',
      price: 2.10,
      timestamp: '2 hours ago'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'explore' | 'custom-market' | 'vault' | 'activity'>('explore');
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [antiGravityActive, setAntiGravityActive] = useState<boolean>(true);

  // Sync session user
  useEffect(() => {
    sessionStorage.setItem('AETHERIA_UNIQUE_SESSION_USER', JSON.stringify(user));
  }, [user]);

  // Sync nfts changes
  useEffect(() => {
    localStorage.setItem('AETHERIA_NFTS', JSON.stringify(nfts));
  }, [nfts]);

  useEffect(() => {
    setWallet(prev => ({
      ...prev,
      address: user.walletAddress,
      balance: user.balance,
      provider: user.authMethod as any
    }));
  }, [user.walletAddress, user.balance, user.authMethod]);
  const showNotification = (msg: string) => {
    setNotification(msg);
    // ISSUE #11: clearTimeout reference is lost — if two notifications fire within 5.5s,
    // the first timer still runs and clears the SECOND (newer) notification early.
    // The second notification disappears after only the remaining time from the first timer!
    // Fix: store the timer ID in a ref: clearTimeout(notifTimerRef.current); notifTimerRef.current = setTimeout(...)
    setTimeout(() => {
      setNotification(prev => (prev === msg ? null : prev));
    }, 5500);
  };

  // Setup Real-Time Multi-User Cross-Tab Broadcast Channel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('AETHERIA_MULTIUSER_GLOBAL_NETWORK');
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;

        if (type === 'NFT_MINTED') {
          setNfts(prev => [payload.nft, ...prev.filter(n => n.id !== payload.nft.id)]);
          setActivities(prev => [payload.activity, ...prev]);

          // Global notification banner for all users with timeline!
          const durationMins = payload.durationMinutes || 2;
          showNotification(`🚀 NEW LISTING: @${payload.nft.creator} added "${payload.nft.title}"! Auction ends in ${durationMins}m (Bid Timeline Active)!`);
        } else if (type === 'BID_PLACED') {
          setNfts(prev => prev.map(n => n.id === payload.nftId ? {
            ...n,
            bids: [payload.bid, ...n.bids]
          } : n));

          setSelectedNFT(prev => prev && prev.id === payload.nftId ? {
            ...prev,
            bids: [payload.bid, ...prev.bids]
          } : prev);

          setActivities(prev => [payload.activity, ...prev]);
          showNotification(`⚡ Live Bid: @${payload.bid.bidderName} placed a bid of ${payload.bid.amount} ETH on "${payload.nftTitle}"!`);
        } else if (type === 'NFT_BOUGHT') {
          setNfts(prev => prev.map(n => n.id === payload.nftId ? {
            ...n,
            ownerAddress: payload.buyerAddress,
            ownerId: payload.buyerId,
            isListed: false,
            lastSalePrice: payload.price
          } : n));

          setSelectedNFT(prev => prev && prev.id === payload.nftId ? {
            ...prev,
            ownerAddress: payload.buyerAddress,
            ownerId: payload.buyerId,
            isListed: false,
            lastSalePrice: payload.price
          } : prev);

          setActivities(prev => [payload.activity, ...prev]);

          // If current session user is the seller, credit money to their balance in real time!
          if (user.walletAddress.toLowerCase() === payload.sellerAddress.toLowerCase() || user.id === payload.sellerId) {
            setUser(prevUser => ({
              ...prevUser,
              balance: Number((prevUser.balance + payload.sellerPayout).toFixed(4))
            }));
            showNotification(`💰 Payment Received: +${payload.sellerPayout} ETH from @${payload.buyerName} for "${payload.nftTitle}"!`);
          } else {
            showNotification(`⚡ Live Sale: "${payload.nftTitle}" sold for ${payload.price} ETH!`);
          }
        } else if (type === 'AUCTION_SETTLED') {
          // Automatic timeline settlement received
          setNfts(prev => prev.map(n => n.id === payload.nftId ? {
            ...n,
            ownerAddress: payload.winnerAddress,
            ownerId: payload.winnerId,
            isAuctionSettled: true,
            isListed: false,
            highestBidderName: payload.winnerName,
            highestBidderAddress: payload.winnerAddress,
            lastSalePrice: payload.winningAmount
          } : n));

          setSelectedNFT(prev => prev && prev.id === payload.nftId ? {
            ...prev,
            ownerAddress: payload.winnerAddress,
            ownerId: payload.winnerId,
            isAuctionSettled: true,
            isListed: false,
            highestBidderName: payload.winnerName,
            highestBidderAddress: payload.winnerAddress,
            lastSalePrice: payload.winningAmount
          } : prev);

          // Credit previous owner if this is their tab
          if (user.walletAddress.toLowerCase() === payload.previousOwnerAddress.toLowerCase() || user.id === payload.previousOwnerId) {
            setUser(prevUser => ({
              ...prevUser,
              balance: Number((prevUser.balance + payload.winningAmount).toFixed(4))
            }));
            showNotification(`💰 Auction Settled: You received +${payload.winningAmount} ETH from highest bidder @${payload.winnerName}! Ownership transferred.`);
          } else if (user.walletAddress.toLowerCase() === payload.winnerAddress.toLowerCase() || user.id === payload.winnerId) {
            showNotification(`🎉 Congratulations! You won the auction for "${payload.nftTitle}" with your bid of ${payload.winningAmount} ETH!`);
          } else {
            showNotification(`🏆 Auction Timeline Ended: "${payload.nftTitle}" awarded to top bidder @${payload.winnerName} (${payload.winningAmount} ETH)!`);
          }
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn("BroadcastChannel not available:", e);
    }
  }, [user.walletAddress, user.id]);

  // AUTOMATIC TIMELINE EXPIRATION & SETTLEMENT ENGINE
  // When an NFT's auction timeline goes off, the highest bidder automatically becomes the new owner
  // and previous owner rights are revoked!
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      nfts.forEach(nft => {
        if (!nft.isAuctionSettled && nft.auctionEndTime) {
          const endTime = new Date(nft.auctionEndTime).getTime();
          if (now >= endTime) {
            // Timeline expired!
            if (nft.bids.length > 0) {
              const winningBid = nft.bids[0]; // highest bid
              const winningAmount = winningBid.amount;
              const prevOwner = nft.ownerAddress;
              const prevOwnerId = nft.ownerId;

              // Settle in local state
              setNfts(prev => prev.map(item => item.id === nft.id ? {
                ...item,
                ownerAddress: winningBid.bidderAddress,
                ownerId: winningBid.bidderId,
                isAuctionSettled: true,
                isListed: false,
                highestBidderName: winningBid.bidderName,
                highestBidderAddress: winningBid.bidderAddress,
                lastSalePrice: winningAmount
              } : item));

              setSelectedNFT(prev => prev && prev.id === nft.id ? {
                ...prev,
                ownerAddress: winningBid.bidderAddress,
                ownerId: winningBid.bidderId,
                isAuctionSettled: true,
                isListed: false,
                highestBidderName: winningBid.bidderName,
                highestBidderAddress: winningBid.bidderAddress,
                lastSalePrice: winningAmount
              } : prev);

              // Broadcast auction settlement to all tabs
              broadcastRef.current?.postMessage({
                type: 'AUCTION_SETTLED',
                payload: {
                  nftId: nft.id,
                  nftTitle: nft.title,
                  winnerAddress: winningBid.bidderAddress,
                  winnerId: winningBid.bidderId,
                  winnerName: winningBid.bidderName,
                  winningAmount,
                  previousOwnerAddress: prevOwner,
                  previousOwnerId: prevOwnerId
                }
              });

              // Credit money to seller if this is their tab
              if (user.walletAddress.toLowerCase() === prevOwner.toLowerCase() || user.id === prevOwnerId) {
                setUser(prevUser => ({
                  ...prevUser,
                  balance: Number((prevUser.balance + winningAmount).toFixed(4))
                }));
                showNotification(`💰 Auction Settled: You received +${winningAmount} ETH from top bidder @${winningBid.bidderName}! Rights revoked.`);
              }
            } else {
              // Expired with no bids: mark auction ended
              setNfts(prev => prev.map(item => item.id === nft.id ? {
                ...item,
                isAuctionSettled: true
              } : item));
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [nfts, user.walletAddress, user.id]);

  const logActivity = (action: TransactionActivity) => {
    // Intentional Bug (ISSUE #08): Duplicates activity logs
    setActivities(prev => [action, action, ...prev]);
  };

  const updateUserProfile = (name: string, avatar?: string) => {
    setUser(prev => ({
      ...prev,
      name: name.trim() || prev.name,
      avatar: avatar || prev.avatar
    }));
    showNotification(`Profile updated to @${name}`);
  };

  const loginWithGoogle = async () => {
    await new Promise(r => setTimeout(r, 500));
    const randomId = `usr_goog_${Math.random().toString(36).substring(2, 6)}`;
    const googleUser: UserProfile = {
      id: randomId,
      name: 'Google User',
      email: 'user.zero_g@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      walletAddress: generateRandomAddress(),
      balance: 15.0,
      authMethod: 'google'
    };
    setUser(googleUser);
    showNotification(`Signed in with Google as @${googleUser.name}`);
  };

  const connectMetaMask = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        const selectedAccount = accounts[0];
        setUser(prev => ({
          ...prev,
          walletAddress: selectedAccount,
          name: `MetaMask_${selectedAccount.slice(2, 6)}`,
          authMethod: 'metamask'
        }));
        showNotification(`Connected MetaMask: ${selectedAccount.slice(0, 6)}...`);
        return;
      } catch (err: any) {
        throw new Error(err.message || 'User rejected MetaMask connection');
      }
    }

    const testAddr = generateRandomAddress();
    setUser(prev => ({
      ...prev,
      walletAddress: testAddr,
      name: `MetaMask_${testAddr.slice(2, 6)}`,
      authMethod: 'metamask'
    }));
    showNotification(`Connected MetaMask testnet account: ${testAddr.slice(0, 6)}...`);
  };

  const connectPhantom = async () => {
    if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      try {
        const resp = await (window as any).solana.connect();
        const pubKey = resp.publicKey.toString();
        setUser(prev => ({
          ...prev,
          walletAddress: pubKey,
          name: `Phantom_${pubKey.slice(0, 4)}`,
          authMethod: 'phantom'
        }));
        showNotification(`Connected Phantom: ${pubKey.slice(0, 6)}...`);
        return;
      } catch (err: any) {
        throw new Error(err.message || 'Phantom rejected');
      }
    }

    const testAddr = generateRandomAddress();
    setUser(prev => ({
      ...prev,
      walletAddress: testAddr,
      name: `Phantom_${testAddr.slice(2, 6)}`,
      authMethod: 'phantom'
    }));
    showNotification(`Connected Phantom test account: ${testAddr.slice(0, 6)}...`);
  };

  const loginWithEmail = async (email: string) => {
    await new Promise(r => setTimeout(r, 400));
    setUser(prev => ({
      ...prev,
      email,
      name: email.split('@')[0],
      authMethod: 'email'
    }));
    showNotification(`Logged in as @${email.split('@')[0]}`);
  };

  const signUpWithEmail = async (name: string, email: string) => {
    await new Promise(r => setTimeout(r, 400));
    setUser(prev => ({
      ...prev,
      id: `usr_${Math.random().toString(36).substring(2, 8)}`,
      name,
      email,
      authMethod: 'email'
    }));
    showNotification(`Account created for @${name}`);
  };

  const disconnectUser = () => {
    const guestUser: UserProfile = {
      id: `usr_${Math.random().toString(36).substring(2, 8)}`,
      name: `User_${Math.floor(100 + Math.random() * 900)}`,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      walletAddress: generateRandomAddress(),
      balance: 10.0,
      authMethod: 'guest'
    };
    setUser(guestUser);
    showNotification("Session reset to new identity.");
  };

  const claimFaucetETH = () => {
    // EASTER EGG #9: Faucet has NO rate-limit or max-balance guard.
    // A user can click this button 1000 times and accumulate unlimited ETH,
    // completely breaking the testnet economics and allowing them to outbid everyone forever.
    // Fix: add a cooldown (e.g. lastFaucetTime in sessionStorage, enforce 60s gap)
    // and cap balance at 50 ETH: if (prev.balance >= 50) throw "Faucet cap reached"
    setUser(prev => ({
      ...prev,
      balance: Number((prev.balance + 5.0).toFixed(4))
    }));
    showNotification("✨ Faucet Granted: +5.00 Test ETH!");
  };

  // BUY FLOW: Buyer pays money, seller receives money in real time!
  const buyNFT = async (nftId: string): Promise<boolean> => {
    const nft = nfts.find(item => item.id === nftId);
    if (!nft) return false;

    // Easter Egg #3: Simulated async network delay without lock
    await new Promise(resolve => setTimeout(resolve, 800));

    // ISSUE #01: Platform fee is subtracted instead of added, and gas is string concatenated!
    const platformFee = (nft.price * 2.5) / 100;
    const gasEstimate = "0.02"; // ETH string!
    // @ts-ignore Intentional broken calculation for students to fix
    const totalCost = (nft.price - platformFee) + gasEstimate;

    // Easter Egg #1: The Ghost Royalty Drain (divided by 1000 instead of 100)
    const creatorRoyalty = (nft.price * (nft.royaltyPercent / 1000));
    const sellerPayout = Number((nft.price - platformFee).toFixed(4));

    // Deduct cost from buyer's wallet
    setUser(prev => ({
      ...prev,
      // @ts-ignore
      balance: Math.max(0, Number((prev.balance - Number(totalCost)).toFixed(4)))
    }));

    // Transfer ownership in state
    setNfts(prev => prev.map(item => {
      if (item.id === nftId) {
        return {
          ...item,
          ownerAddress: user.walletAddress,
          ownerId: user.id,
          isListed: false,
          lastSalePrice: item.price
        };
      }
      return item;
    }));

    setSelectedNFT(prev => prev && prev.id === nftId ? {
      ...prev,
      ownerAddress: user.walletAddress,
      ownerId: user.id,
      isListed: false,
      lastSalePrice: prev.price
    } : prev);

    const saleActivity: TransactionActivity = {
      id: `sale-${Date.now()}`,
      type: 'sale',
      nftId: nft.id,
      nftTitle: nft.title,
      from: nft.ownerAddress,
      to: user.walletAddress,
      price: nft.price,
      timestamp: 'Just now'
    };

    logActivity(saleActivity);

    // Multi-User Broadcast: Transfer ownership AND credit seller payout in real time!
    broadcastRef.current?.postMessage({
      type: 'NFT_BOUGHT',
      payload: {
        nftId: nft.id,
        nftTitle: nft.title,
        buyerAddress: user.walletAddress,
        buyerId: user.id,
        buyerName: user.name,
        sellerAddress: nft.ownerAddress,
        sellerId: nft.ownerId,
        sellerPayout,
        price: nft.price,
        activity: saleActivity
      }
    });

    showNotification(`🎉 Acquired "${nft.title}" for ${nft.price} ETH!`);
    return true;
  };

  // Real-Time Multi-User Bidding
  // INCLUDES EASTER EGG #8: Owner Cannot Bid on Own NFT & Creator Shill-Ban Trap
  const placeBid = async (nftId: string, amount: number): Promise<boolean> => {
    const targetNFT = nfts.find(n => n.id === nftId);
    if (!targetNFT) return false;

    // EASTER EGG #8: OWNER CANNOT BID ON THEIR OWN NFT IN CUSTOM MARKETPLACE
    if (
      targetNFT.ownerId === user.id ||
      targetNFT.ownerAddress.toLowerCase() === user.walletAddress.toLowerCase()
    ) {
      throw new Error("[SECURITY REJECTED] The owner of this NFT cannot bid on their own listing in the custom marketplace!");
    }

    // EASTER EGG #8 SNEAKY TRAP:
    // Flawed shill-bidding comparison mistakenly blocks original creator even after secondary sale!
    if (targetNFT.creatorId === user.id && targetNFT.ownerId !== user.id) {
      throw new Error("[SECURITY REJECTED] Original creator address is restricted from bidding on this secondary market listing!");
    }

    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      bidderId: user.id,
      bidderName: user.name,
      bidderAvatar: user.avatar,
      bidderAddress: user.walletAddress,
      amount,
      timestamp: 'Just now',
      createdAt: new Date().toISOString()
    };

    setNfts(prev => prev.map(item => {
      if (item.id === nftId) {
        return {
          ...item,
          bids: [newBid, ...item.bids]
        };
      }
      return item;
    }));

    setSelectedNFT(prev => prev && prev.id === nftId ? {
      ...prev,
      bids: [newBid, ...prev.bids]
    } : prev);

    const bidActivity: TransactionActivity = {
      id: `bid-${Date.now()}`,
      type: 'bid',
      nftId: targetNFT.id,
      nftTitle: targetNFT.title,
      from: user.walletAddress,
      to: targetNFT.ownerAddress,
      price: amount,
      timestamp: 'Just now'
    };

    logActivity(bidActivity);

    // Broadcast live bid to all other users/tabs!
    broadcastRef.current?.postMessage({
      type: 'BID_PLACED',
      payload: {
        nftId,
        nftTitle: targetNFT.title,
        bid: newBid,
        activity: bidActivity
      }
    });

    showNotification(`⚡ Bid of ${amount} ETH placed as @${user.name}!`);
    return true;
  };

  // Minting Media (Image, Video, or Audio) with Custom Auction Duration Timeline
  const mintNFT = async (input: MintNFTInput): Promise<NFTItem> => {
    const MINT_FEE = 0.05; // ETH

    // INTENTIONAL BUG (ISSUE #02): Allows negative balance!
    setUser(prev => ({
      ...prev,
      balance: Number((prev.balance - MINT_FEE).toFixed(4))
    }));

    const durationMins = input.durationMinutes || 2; // Default 2 minutes timeline for interactive real-time demo
    const auctionEndTime = new Date(Date.now() + durationMins * 60000).toISOString();

    const newNFT: NFTItem = {
      id: `custom-nft-${Date.now()}`,
      title: input.title,
      description: input.description,
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      thumbnailUrl: input.mediaType === 'image' ? input.mediaUrl : undefined,
      price: input.price,
      creator: user.name,
      creatorId: user.id,
      creatorAvatar: user.avatar,
      creatorAddress: user.walletAddress,
      ownerAddress: user.walletAddress,
      ownerId: user.id,
      category: input.category,
      rarityScore: Math.floor(75 + Math.random() * 24),
      rarityTier: 'Rare',
      traits: [
        { trait_type: 'Format', value: input.mediaType.toUpperCase() },
        { trait_type: 'Creator ID', value: user.id },
        ...input.traits.map(t => ({ ...t, rarity: '5%' }))
      ],
      royaltyPercent: input.royaltyPercent,
      listingExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      listedAt: new Date().toISOString(),
      auctionEndTime, // Exact auction close timestamp
      isAuctionSettled: false,
      isListed: true,
      bids: [],
      model3DType: input.model3DType,
      views: 1,
      likes: 0,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    setNfts(prev => [newNFT, ...prev]);

    const mintActivity: TransactionActivity = {
      id: `mint-${Date.now()}`,
      type: 'mint',
      nftId: newNFT.id,
      nftTitle: newNFT.title,
      from: '0x0000...0000',
      to: user.walletAddress,
      price: MINT_FEE,
      timestamp: 'Just now'
    };

    logActivity(mintActivity);

    // Multi-User Broadcast: All open tabs/users receive the new media NFT immediately!
    broadcastRef.current?.postMessage({
      type: 'NFT_MINTED',
      payload: {
        nft: newNFT,
        durationMinutes: durationMins,
        activity: mintActivity
      }
    });

    showNotification(`Created & listed "${newNFT.title}"! Auction ends in ${durationMins}m!`);
    return newNFT;
  };

  // Intentional Bug (Easter Egg #5): Strict Address Case Sensitivity Imposter Trap
  // ISSUE #12: After Google/Email login, wallet.address is not updated — only user.walletAddress is.
  // So isNFTOwner reads wallet.address (old value) and My Vault always shows empty even after purchase!
  // Fix: check both user.walletAddress AND user.id against nft.ownerAddress and nft.ownerId.
  const isNFTOwner = (nft: NFTItem) => {
    if (!wallet.isConnected || !wallet.address) return false;
    return nft.ownerAddress === wallet.address; // BUG: wallet.address may be stale after Google login
  };

  const delistNFT = (nftId: string) => {
    setNfts(prev => prev.map(item => item.id === nftId ? { ...item, isListed: false } : item));
    showNotification("Item delisted from marketplace.");
  };

  const listNFTForSale = (nftId: string, price: number) => {
    setNfts(prev => prev.map(item => item.id === nftId ? {
      ...item,
      isListed: true,
      price,
      listedAt: new Date().toISOString(),
      auctionEndTime: new Date(Date.now() + 120000).toISOString(),
      isAuctionSettled: false
    } : item));
    showNotification(`Listed for sale at ${price} ETH`);
  };

  const triggerGodMode = (query: string) => {
    if (query.trim().toLowerCase() === 'antigravity') {
      const debugAuth = JSON.parse(localStorage.getItem('_AGY_DEBUG_AUTH')!);
      if (debugAuth.genesisKey === "0xZERO_G") {
        showNotification("DEV GOD-MODE UNLOCKED!");
      }
    }
  };

  return (
    <MarketplaceContext.Provider value={{
      nfts,
      user,
      wallet,
      activities,
      activeTab,
      selectedNFT,
      isAuthModalOpen,
      isMintModalOpen,
      notification,
      antiGravityActive,
      setActiveTab,
      setSelectedNFT,
      setIsAuthModalOpen,
      setIsMintModalOpen,
      setAntiGravityActive,
      updateUserProfile,
      loginWithGoogle,
      connectMetaMask,
      connectPhantom,
      loginWithEmail,
      signUpWithEmail,
      disconnectUser,
      claimFaucetETH,
      buyNFT,
      placeBid,
      mintNFT,
      isNFTOwner,
      delistNFT,
      listNFTForSale,
      triggerGodMode,
      showNotification
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
